# SPDX-License-Identifier: GPL-3.0-or-later
"""A bridge Hue Plus connects to itself: setting it up, pinning its certificate, and keeping or losing the registration."""

from __future__ import annotations

import asyncio
import datetime
import logging
import ssl
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
from aiohue import Unauthorized
from aiohue.discovery import DiscoveredHueBridge
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID
from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntryState
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hue_plus.bridge.api import BridgeError
from custom_components.hue_plus.bridge.connect import peer_fingerprint, pin
from custom_components.hue_plus.const import (
    CONF_APP_KEY,
    CONF_CERT_SHA256,
    CONF_HOST,
    CONF_MODULES,
    CONF_STREAM_APP_ID,
    CONF_STREAM_APP_KEY,
    CONF_STREAM_CLIENT_KEY,
    DEFAULT_MODULES,
    DOMAIN,
)
from custom_components.hue_plus.direct import DirectBridge, PinnedBridgeV2
from custom_components.hue_plus.streaming.register import LinkButtonNotPressed, Registration

from .fake_hue import APP_KEY, BRIDGE_ID, FakeHueApi
from .test_lights import build_bridge

FINGERPRINT = "ab" * 32
HOST = "192.0.2.7"


class FakeDirectBridge:
    """What ``DirectBridge`` is to the integration: an API client, and a connection that is opened and closed."""

    instances: list[FakeDirectBridge] = []

    def __init__(self, hass, entry) -> None:
        self.api = FakeHueApi()
        self.closed = False
        FakeDirectBridge.instances.append(self)

    async def async_initialize(self) -> None:
        return None

    async def async_close(self) -> None:
        self.closed = True


@pytest.fixture(autouse=True)
def _forget_instances():
    FakeDirectBridge.instances.clear()


def make_direct(hass, modules=("bridge",)) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=3,
        unique_id=BRIDGE_ID,
        title="Hue Bridge Plus",
        data={CONF_HOST: HOST, CONF_APP_KEY: APP_KEY, CONF_CERT_SHA256: FINGERPRINT},
        options={CONF_MODULES: list(modules)},
    )
    entry.add_to_hass(hass)
    return entry


async def test_a_direct_entry_loads_without_the_hue_integration_and_closes_its_connection(hass):
    entry = make_direct(hass)
    with patch("custom_components.hue_plus.DirectBridge", FakeDirectBridge):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        runtime = entry.runtime_data
        assert runtime.link.hue_entry is None and runtime.uid == BRIDGE_ID
        assert runtime.coordinator.data is not None  # the bridge module read the bridge over the direct connection
        assert hass.config_entries.async_entries("hue") == []
        await hass.config_entries.async_unload(entry.entry_id)
    assert FakeDirectBridge.instances[0].closed


@pytest.mark.parametrize(
    ("failure", "expected", "state"),
    [
        (Unauthorized(), ConfigEntryAuthFailed, ConfigEntryState.SETUP_ERROR),
        (aiohttp.ServerFingerprintMismatch(b"a", b"b", HOST, 443), ConfigEntryAuthFailed, ConfigEntryState.SETUP_ERROR),
        (TimeoutError(), ConfigEntryNotReady, ConfigEntryState.SETUP_RETRY),
    ],
)
async def test_a_connection_that_fails_asks_for_the_right_thing(hass, failure, expected, state):
    entry = make_direct(hass)
    with patch("custom_components.hue_plus.direct.PinnedBridgeV2") as client:
        client.return_value.initialize = AsyncMock(side_effect=failure)
        client.return_value.close = AsyncMock()
        bridge = DirectBridge(hass, entry)
        with pytest.raises(expected):
            await bridge.async_initialize()
        client.return_value.close.assert_awaited()


async def test_every_request_and_the_event_stream_carry_the_pin_and_the_key():
    client = PinnedBridgeV2(HOST, "the-key", FINGERPRINT)
    seen = {}
    response = MagicMock()
    context = MagicMock()
    context.__aenter__ = AsyncMock(return_value=response)
    context.__aexit__ = AsyncMock(return_value=None)

    def request(method, url, **kwargs):
        seen.update(method=method, url=url, **kwargs)
        return context

    session = MagicMock()
    session.request = request
    client._websession = session
    async with client.create_request("get", "clip/v2/resource/light", ssl=False, headers={"x": "y"}) as got:
        assert got is response
    assert seen["url"] == f"https://{HOST}/clip/v2/resource/light"
    assert seen["ssl"].fingerprint == bytes.fromhex(FINGERPRINT)  # whatever the caller passed, the pin is what is sent
    assert seen["headers"] == {"x": "y", "hue-application-key": "the-key"}


def _certificate(common_name: str) -> tuple[bytes, bytes, str]:
    key = ec.generate_private_key(ec.SECP256R1())
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, common_name)])
    now = datetime.datetime.now(datetime.UTC)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=1))
        .sign(key, hashes.SHA256())
    )
    pem = cert.public_bytes(serialization.Encoding.PEM)
    key_pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    return pem, key_pem, cert.fingerprint(hashes.SHA256()).hex()


async def _tls_server(tmp_path, common_name: str):
    pem, key_pem, fingerprint = _certificate(common_name)
    (tmp_path / "c.pem").write_bytes(pem)
    (tmp_path / "k.pem").write_bytes(key_pem)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(tmp_path / "c.pem", tmp_path / "k.pem")
    server = await asyncio.start_server(lambda r, w: w.close(), "127.0.0.1", 0, ssl=context)
    return server, server.sockets[0].getsockname()[1], fingerprint


async def test_the_certificate_a_server_shows_is_read_without_trusting_it(socket_enabled, tmp_path):
    server, port, fingerprint = await _tls_server(tmp_path, "bridge")
    async with server:
        assert (await peer_fingerprint("127.0.0.1", port)).hex() == fingerprint


async def test_nothing_listening_is_a_bridge_error(socket_enabled):
    with pytest.raises(BridgeError):
        await peer_fingerprint("127.0.0.1", 1)


async def test_a_different_certificate_is_refused_by_the_pin(socket_enabled, tmp_path):
    """The pin accepts the server it was made for and refuses another, end to end through aiohttp."""
    server, port, fingerprint = await _tls_server(tmp_path, "bridge")
    async with server, aiohttp.ClientSession() as session:
        # The server closes the connection without answering, so a request that got through the handshake ends in a plain
        # disconnect; what matters is that the right pin gets that far and the wrong one never does.
        with pytest.raises(aiohttp.ServerDisconnectedError):
            await session.get(f"https://127.0.0.1:{port}/", ssl=pin(fingerprint))
        with pytest.raises(aiohttp.ServerFingerprintMismatch):
            await session.get(f"https://127.0.0.1:{port}/", ssl=pin("cd" * 32))


# ---- setup flow ----

REGISTRATION = Registration("new-app-key", "new-client-key", "new-app-id")


def _found(supports_v2=True, bridge_id="C42996C4A182"):
    return DiscoveredHueBridge(HOST, bridge_id, supports_v2)


async def _start_direct(hass, host=HOST):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.MENU and "bridge_direct" in result["menu_options"]
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "bridge_direct"})
    return await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_HOST: host})


def _bridge_calls(found=None):
    return (
        patch("custom_components.hue_plus.config_flow.discover_bridge", AsyncMock(return_value=found or _found())),
        patch("custom_components.hue_plus.config_flow.peer_fingerprint", AsyncMock(return_value=bytes.fromhex(FINGERPRINT))),
    )


async def test_a_bridge_is_added_directly_after_the_link_button_and_pins_what_it_showed(hass):
    discover, fingerprint = _bridge_calls()
    with discover, fingerprint, patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        result = await _start_direct(hass)
        assert result["type"] is FlowResultType.FORM and result["step_id"] == "bridge_link"
        with patch("custom_components.hue_plus.config_flow.register", AsyncMock(return_value=REGISTRATION)) as register:
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
            assert register.await_args.args[2].fingerprint == bytes.fromhex(
                FINGERPRINT
            )  # the registration itself is made against the pinned certificate
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == {
        CONF_HOST: HOST,
        CONF_APP_KEY: "new-app-key",
        CONF_CERT_SHA256: FINGERPRINT,
        CONF_STREAM_APP_KEY: "new-app-key",
        CONF_STREAM_CLIENT_KEY: "new-client-key",
        CONF_STREAM_APP_ID: "new-app-id",
    }
    assert result["options"][CONF_MODULES] == list(DEFAULT_MODULES)
    assert result["result"].unique_id == "c42996c4a182"


async def test_the_link_button_not_pressed_asks_again_without_losing_the_pin(hass):
    discover, fingerprint = _bridge_calls()
    with discover, fingerprint, patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        result = await _start_direct(hass)
        with patch("custom_components.hue_plus.config_flow.register", AsyncMock(side_effect=LinkButtonNotPressed("press"))):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
        assert result["type"] is FlowResultType.FORM and result["errors"] == {"base": "link_button_not_pressed"}
        with patch("custom_components.hue_plus.config_flow.register", AsyncMock(return_value=REGISTRATION)):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY and result["data"][CONF_CERT_SHA256] == FINGERPRINT


@pytest.mark.parametrize(
    ("found", "error"),
    [(_found(supports_v2=False), "not_v2"), (None, "cannot_connect")],
)
async def test_an_address_that_is_not_a_usable_bridge_is_not_accepted(hass, found, error):
    discover, fingerprint = _bridge_calls(found)
    if found is None:
        discover = patch("custom_components.hue_plus.config_flow.discover_bridge", AsyncMock(side_effect=aiohttp.ClientError()))
    with discover, fingerprint:
        result = await _start_direct(hass)
    assert result["type"] is FlowResultType.FORM and result["errors"] == {"base": error}


async def test_a_bridge_the_hue_integration_has_is_not_added_a_second_way(hass, hue_entry):
    discover, fingerprint = _bridge_calls()
    with discover, fingerprint:
        result = await _start_direct(hass)
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "use_hue_integration"


async def test_the_same_bridge_is_not_added_twice_and_its_address_is_updated(hass):
    entry = make_direct(hass)
    entry.mock_state(hass, ConfigEntryState.NOT_LOADED)
    discover, fingerprint = _bridge_calls()
    with discover, fingerprint, patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        result = await _start_direct(hass, host="192.0.2.99")
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "already_configured"
    assert entry.data[CONF_HOST] == "192.0.2.99"


# ---- reconfigure, re-authentication, removal ----


async def _reconfigure(hass, entry, host, found, fingerprint):
    with (
        patch("custom_components.hue_plus.config_flow.discover_bridge", AsyncMock(return_value=found)),
        patch("custom_components.hue_plus.config_flow.peer_fingerprint", AsyncMock(return_value=fingerprint)),
        patch("custom_components.hue_plus.async_setup_entry", return_value=True),
    ):
        result = await entry.start_reconfigure_flow(hass)
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "bridge_address"})
        return await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_HOST: host})


async def test_a_moved_bridge_is_found_again_only_if_it_is_the_same_bridge_with_the_same_certificate(hass):
    entry = make_direct(hass)
    result = await _reconfigure(hass, entry, "192.0.2.50", _found(bridge_id="aaaaaaaaaaaa"), bytes.fromhex(FINGERPRINT))
    assert result["errors"] == {"base": "wrong_bridge"}
    result = await _reconfigure(hass, entry, "192.0.2.50", _found(), bytes.fromhex("cd" * 32))
    assert result["errors"] == {"base": "certificate_changed"}
    assert entry.data[CONF_HOST] == HOST
    result = await _reconfigure(hass, entry, "192.0.2.50", _found(), bytes.fromhex(FINGERPRINT))
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "reconfigure_successful"
    assert entry.data[CONF_HOST] == "192.0.2.50"


async def test_a_bridge_that_refuses_hue_plus_asks_for_the_link_button_and_learns_the_certificate_again(hass):
    entry = make_direct(hass)
    new_fingerprint = bytes.fromhex("cd" * 32)
    with (
        patch("custom_components.hue_plus.config_flow.discover_bridge", AsyncMock(return_value=_found())),
        patch("custom_components.hue_plus.config_flow.peer_fingerprint", AsyncMock(return_value=new_fingerprint)),
        patch("custom_components.hue_plus.config_flow.register", AsyncMock(return_value=REGISTRATION)),
        patch("custom_components.hue_plus.async_setup_entry", return_value=True),
    ):
        result = await entry.start_reauth_flow(hass)
        assert result["type"] is FlowResultType.FORM and result["step_id"] == "bridge_reauth"
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "reauth_successful"
    assert entry.data[CONF_APP_KEY] == "new-app-key" and entry.data[CONF_CERT_SHA256] == new_fingerprint.hex()


async def test_the_spotify_sync_token_is_still_asked_for_on_a_direct_entry(hass):
    entry = make_direct(hass)
    with patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        result = await entry.start_reauth_flow(hass, context={"reauth_for": "sync"})
    assert result["type"] is FlowResultType.FORM and result["step_id"] == "reauth_credentials"


async def test_removing_a_direct_entry_tells_the_bridge_to_forget_it_over_the_pinned_connection(hass):
    entry = make_direct(hass)
    session = MagicMock()
    answer = MagicMock()
    answer.__aenter__ = AsyncMock(return_value=MagicMock())
    answer.__aexit__ = AsyncMock(return_value=None)
    session.delete = MagicMock(return_value=answer)
    with patch("custom_components.hue_plus.async_get_clientsession", return_value=session):
        await hass.config_entries.async_remove(entry.entry_id)
    url = session.delete.call_args.args[0]
    assert url == f"https://{HOST}/api/{APP_KEY}/config/whitelist/{APP_KEY}"
    assert session.delete.call_args.kwargs["ssl"].fingerprint == bytes.fromhex(FINGERPRINT)


async def test_a_bridge_that_cannot_be_reached_while_removing_does_not_block_the_removal(hass):
    entry = make_direct(hass)
    session = MagicMock()
    session.delete = MagicMock(side_effect=aiohttp.ClientError())
    with patch("custom_components.hue_plus.async_get_clientsession", return_value=session):
        assert await hass.config_entries.async_remove(entry.entry_id)


# ---- lights and devices over the direct connection (the Hue integration's own platforms, on Hue Plus's devices) ----


class RealDirectBridge:
    """``DirectBridge`` over a real aiohue client filled with sanitized data (as the lights tests do); writes are recorded."""

    writes: list[tuple[str, str, object]] = []

    def __init__(self, hass, entry) -> None:
        self.hass = hass
        self.config_entry = entry
        self.api_version = 2
        self.logger = logging.getLogger("test.direct")
        self.api = None
        self.scene_activity_tracker = None

    async def async_initialize(self) -> None:
        core = await build_bridge(self.config_entry)
        self.api, self.scene_activity_tracker = core.api, core.scene_activity_tracker
        RealDirectBridge.writes = core.writes

    async def async_request_call(self, task, *args, **kwargs):
        return await task(*args, **kwargs)

    async def async_close(self) -> None:
        return None


async def test_lights_and_devices_work_over_a_direct_connection_with_their_own_names_and_no_hue_integration(hass):
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=3,
        unique_id="0000000000000000",
        title="Hue Bridge Plus",
        data={CONF_HOST: HOST, CONF_APP_KEY: "k", CONF_CERT_SHA256: FINGERPRINT},
        options={CONF_MODULES: ["lights", "devices"]},
    )
    entry.add_to_hass(hass)
    with patch("custom_components.hue_plus.DirectBridge", RealDirectBridge):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        registry = er.async_get(hass)
        lights = [e for e in registry.entities.values() if e.platform == DOMAIN and e.domain == "light"]
        assert len(lights) == 6
        assert not any(e.entity_id.endswith(("_plus", "_hue")) for e in lights)  # nothing to tell apart from
        assert all(e.config_entry_id == entry.entry_id for e in lights)
        devices = dr.async_get(hass)
        assert all(
            devices.async_get(e.device_id).config_entry_id == entry.entry_id
            for e in registry.entities.values()
            if e.platform == DOMAIN and e.device_id
        )
        light = next(x for x in entry.runtime_data.link.api.lights if x.supports_dimming)
        entity = registry.async_get_entity_id("light", DOMAIN, light.id)
        await hass.services.async_call("light", "turn_on", {"entity_id": entity, "brightness": 128}, blocking=True)
        assert any(light.id in path for _method, path, _body in RealDirectBridge.writes)
        assert await hass.config_entries.async_unload(entry.entry_id)


# --- an entry that used the Hue integration's connection gets its own ------------------------------------------------------
def make_riding(hass, hue_entry) -> MockConfigEntry:
    from custom_components.hue_plus.const import CONF_HUE_ENTRY, CONF_TAKEOVER, TAKEOVER_REPLACE

    entry = MockConfigEntry(
        domain=DOMAIN,
        version=3,
        unique_id=BRIDGE_ID,
        title="Hue Bridge Plus",
        data={CONF_HUE_ENTRY: hue_entry.entry_id, CONF_TAKEOVER: TAKEOVER_REPLACE},
        options={CONF_MODULES: ["bridge"]},
    )
    entry.add_to_hass(hass)
    return entry


async def _own_connection(hass, entry, host=HOST):
    result = await entry.start_reconfigure_flow(hass)
    assert result["type"] is FlowResultType.MENU and "own_connection" in result["menu_options"]
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "own_connection"})
    return await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_HOST: host})


async def test_an_entry_on_the_hue_integration_gets_its_own_connection_and_keeps_everything_else(hass, hue_entry):
    from custom_components.hue_plus.const import CONF_HUE_ENTRY, CONF_TAKEOVER

    entry = make_riding(hass, hue_entry)
    discover, fingerprint = _bridge_calls()
    with discover, fingerprint, patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        result = await _own_connection(hass, entry)
        assert result["type"] is FlowResultType.FORM and result["step_id"] == "own_connection_link"
        with patch("custom_components.hue_plus.config_flow.register", AsyncMock(return_value=REGISTRATION)):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "own_connection_successful"
    assert CONF_HUE_ENTRY not in entry.data and CONF_TAKEOVER not in entry.data
    assert entry.data[CONF_HOST] == HOST and entry.data[CONF_APP_KEY] == "new-app-key" and entry.data[CONF_CERT_SHA256] == FINGERPRINT
    assert entry.unique_id == BRIDGE_ID and entry.options[CONF_MODULES] == ["bridge"], "the entry, so its entities and devices, stays"


async def test_another_bridge_is_not_accepted_for_an_entry_that_is_changing_connection(hass, hue_entry):
    entry = make_riding(hass, hue_entry)
    discover, fingerprint = _bridge_calls(_found(bridge_id="AABBCCDDEEFF"))
    with discover, fingerprint:
        result = await _own_connection(hass, entry)
    assert result["type"] is FlowResultType.FORM and result["errors"] == {"base": "wrong_bridge"}


async def test_without_the_link_button_the_entry_keeps_riding_on_the_hue_integration(hass, hue_entry):
    from custom_components.hue_plus.const import CONF_HUE_ENTRY

    entry = make_riding(hass, hue_entry)
    discover, fingerprint = _bridge_calls()
    with discover, fingerprint:
        result = await _own_connection(hass, entry)
        with patch("custom_components.hue_plus.config_flow.register", AsyncMock(side_effect=LinkButtonNotPressed("press"))):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.FORM and result["errors"] == {"base": "link_button_not_pressed"}
    assert CONF_HUE_ENTRY in entry.data


async def test_an_entry_that_already_has_its_own_connection_is_not_offered_the_change(hass):
    entry = make_direct(hass)
    result = await entry.start_reconfigure_flow(hass)
    assert "own_connection" not in result["menu_options"]
