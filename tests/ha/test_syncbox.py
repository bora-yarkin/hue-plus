# SPDX-License-Identifier: GPL-3.0-or-later
"""The Hue Play HDMI Sync Box as a second kind of entry: setting it up, its entities, and losing its registration.

The box's own protocol is tested in tests/syncbox against a fake HTTP server; here the client is replaced by a stand-in so the
entities and the flows can be tested without a network.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest
from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntryState
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hue_plus.const import CONF_SYNCBOX_HOST, CONF_SYNCBOX_REGISTRATION, CONF_SYNCBOX_TOKEN, DOMAIN
from custom_components.hue_plus.syncbox.client import MODES, SyncBoxError, SyncBoxRegistrationPending

BOX_ID = "box-unique-id"
DATA = {CONF_SYNCBOX_HOST: "box.local", CONF_SYNCBOX_TOKEN: "token-value", CONF_SYNCBOX_REGISTRATION: "reg-1"}


class FakeSyncBox:
    """Stands in for ``SyncBox``: the same methods, a state that commands change, and a record of what was asked."""

    def __init__(self) -> None:
        self.reachable = True
        self.rejects_token = False
        self.holding_button = True
        self.unregistered: list[str] = []
        self.sent: list[tuple] = []
        self.current = {
            "device": {"name": "Living room box", "uniqueId": BOX_ID, "firmwareVersion": "1.2.3"},
            "execution": {
                "mode": "video",
                "syncActive": False,
                "hdmiActive": True,
                "hdmiSource": "input2",
                "brightness": 100,
                "video": {"intensity": "high"},
            },
            "hdmi": {
                "input1": {"name": "Console"},
                "input2": {"name": "TV box"},
                "input3": {"name": "TV box"},
                "input4": {"name": "input4"},
            },
        }

    def __call__(self, session, host, token=None):
        return self

    async def device(self):
        if not self.reachable:
            raise SyncBoxError("down")
        return self.current["device"]

    async def register(self, app, instance):
        if not self.holding_button:
            raise SyncBoxRegistrationPending("hold the button", 400)
        return "reg-1", "token-value"

    async def unregister(self, registration_id):
        self.unregistered.append(registration_id)

    async def state(self):
        if self.rejects_token:
            raise SyncBoxError("no", 401)
        if not self.reachable:
            raise SyncBoxError("down")
        return self.current

    async def execute(self, **changes):
        if (mode := changes.get("mode")) is not None and mode not in MODES:
            raise ValueError("bad mode")
        self.sent.append(("execute", changes))
        self.current["execution"].update(changes)

    async def set_intensity(self, mode, intensity):
        self.sent.append(("intensity", mode, intensity))
        self.current["execution"][mode] = {"intensity": intensity}

    async def set_hdmi_source(self, source):
        self.sent.append(("source", source))
        self.current["execution"]["hdmiSource"] = source


@pytest.fixture
def box():
    fake = FakeSyncBox()
    with (
        patch("custom_components.hue_plus.SyncBox", fake),
        patch("custom_components.hue_plus.config_flow.SyncBox", fake),
    ):
        yield fake


async def load(hass) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, version=3, unique_id=BOX_ID, title="Living room box", data=dict(DATA))
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def entity(hass, domain: str, key: str) -> str:
    entity_id = er.async_get(hass).async_get_entity_id(domain, DOMAIN, f"{BOX_ID}_syncbox_{key}")
    assert entity_id is not None, key
    return entity_id


# ---- setting it up ----


async def start(hass):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    return await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "syncbox"})


async def test_a_box_is_added_after_its_button_was_held_and_only_once(hass, box):
    form = await start(hass)
    bad = await hass.config_entries.flow.async_configure(form["flow_id"], {CONF_SYNCBOX_HOST: "http://evil/x"})
    assert bad["errors"] == {"base": "invalid_host"}
    box.reachable = False
    down = await hass.config_entries.flow.async_configure(form["flow_id"], {CONF_SYNCBOX_HOST: "box.local"})
    assert down["errors"] == {"base": "cannot_connect"}
    box.reachable = True
    register = await hass.config_entries.flow.async_configure(form["flow_id"], {CONF_SYNCBOX_HOST: "box.local"})
    assert register["step_id"] == "syncbox_register"
    box.holding_button = False
    pending = await hass.config_entries.flow.async_configure(register["flow_id"], {})
    assert pending["errors"] == {"base": "registration_pending"}
    box.holding_button = True
    with patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        done = await hass.config_entries.flow.async_configure(register["flow_id"], {})
        assert done["type"] is FlowResultType.CREATE_ENTRY and done["title"] == "Living room box"
        assert done["data"] == DATA and done["result"].unique_id == BOX_ID
        again = await start(hass)
        again = await hass.config_entries.flow.async_configure(again["flow_id"], {CONF_SYNCBOX_HOST: "box.local"})
    assert again["type"] is FlowResultType.ABORT and again["reason"] == "already_configured"


# ---- the entities ----


async def test_the_box_shows_what_it_reports(hass, box):
    await load(hass)
    assert hass.states.get(entity(hass, "switch", "sync")).state == "off"
    assert hass.states.get(entity(hass, "select", "mode")).state == "video"
    assert hass.states.get(entity(hass, "number", "brightness")).state == "100"
    assert hass.states.get(entity(hass, "binary_sensor", "hdmi_signal")).state == "on"
    source = hass.states.get(entity(hass, "select", "source"))
    assert source.state == "TV box (input2)"
    assert source.attributes["options"] == ["Console", "TV box (input2)", "TV box (input3)", "input4"]
    assert hass.states.get(entity(hass, "select", "intensity")).state == "high"


async def test_commands_reach_the_box_and_the_new_state_is_read_back(hass, box):
    await load(hass)
    await hass.services.async_call("switch", "turn_on", {"entity_id": entity(hass, "switch", "sync")}, blocking=True)
    await hass.services.async_call(
        "select", "select_option", {"entity_id": entity(hass, "select", "mode"), "option": "music"}, blocking=True
    )
    await hass.services.async_call(
        "select", "select_option", {"entity_id": entity(hass, "select", "source"), "option": "Console"}, blocking=True
    )
    await hass.services.async_call("number", "set_value", {"entity_id": entity(hass, "number", "brightness"), "value": 150}, blocking=True)
    assert box.sent == [
        ("execute", {"syncActive": True}),
        ("execute", {"mode": "music"}),
        ("source", "input1"),
        ("execute", {"brightness": 150}),
    ]
    assert hass.states.get(entity(hass, "switch", "sync")).state == "on"
    assert hass.states.get(entity(hass, "select", "mode")).state == "music"
    assert hass.states.get(entity(hass, "select", "source")).state == "Console"


async def test_intensity_belongs_to_the_running_mode_and_is_unavailable_without_one(hass, box):
    await load(hass)
    intensity = entity(hass, "select", "intensity")
    await hass.services.async_call("select", "select_option", {"entity_id": intensity, "option": "subtle"}, blocking=True)
    assert box.sent[-1] == ("intensity", "video", "subtle")
    await hass.services.async_call(
        "select", "select_option", {"entity_id": entity(hass, "select", "mode"), "option": "passthrough"}, blocking=True
    )
    await hass.async_block_till_done()
    assert hass.states.get(intensity).state == "unavailable"


async def test_the_boxs_refusal_is_shown_and_the_state_stays(hass, box):
    await load(hass)
    box.holding_button = False

    async def refuse(**changes):
        raise SyncBoxError("The box says no")

    box.execute = refuse
    with pytest.raises(HomeAssistantError, match="The box says no"):
        await hass.services.async_call("switch", "turn_on", {"entity_id": entity(hass, "switch", "sync")}, blocking=True)
    assert hass.states.get(entity(hass, "switch", "sync")).state == "off"


async def test_the_bridge_modules_are_not_set_up_for_a_box(hass, box):
    entry = await load(hass)
    assert entry.state is ConfigEntryState.LOADED and entry.runtime_data.modules == {"syncbox"}
    domains = {e.domain for e in er.async_entries_for_config_entry(er.async_get(hass), entry.entry_id)}
    assert domains == {"switch", "select", "number", "binary_sensor"}


# ---- losing the connection or the registration ----


async def test_a_box_that_is_down_is_retried_and_one_that_forgot_us_asks_for_a_new_registration(hass, box):
    box.reachable = False
    entry = MockConfigEntry(domain=DOMAIN, version=3, unique_id=BOX_ID, data=dict(DATA))
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state is ConfigEntryState.SETUP_RETRY
    box.reachable, box.rejects_token = True, True
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.SETUP_ERROR
    flows = hass.config_entries.flow.async_progress_by_handler(DOMAIN)
    assert [f["context"]["source"] for f in flows] == ["reauth"]
    box.rejects_token = False
    done = await hass.config_entries.flow.async_configure(flows[0]["flow_id"], {})
    assert done["type"] is FlowResultType.ABORT and done["reason"] == "reauth_successful"


async def test_removing_the_entry_makes_the_box_forget_the_registration(hass, box):
    entry = await load(hass)
    await hass.config_entries.async_remove(entry.entry_id)
    assert box.unregistered == ["reg-1"]


async def test_the_capabilities_call_lists_bridges_only(hass, box, hass_ws_client):
    await load(hass)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hue_plus/capabilities"})
    assert (await client.receive_json())["result"]["bridges"] == []
