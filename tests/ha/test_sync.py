# SPDX-License-Identifier: GPL-3.0-or-later
"""The Spotify sync module: entities follow what the service says, and commands go to the service."""

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.helpers import entity_registry as er

from custom_components.hue_plus.const import CONF_AUTH, CONF_UUID, DOMAIN
from custom_components.hue_plus.sync.client import SyncState

from .fake_hue import AREA, BRIDGE_ID, LAMP, TUBE

CREDENTIALS = {CONF_AUTH: "a" * 27, CONF_UUID: "12345678-1234-1234-1234-123456789abc"}
STATE = SyncState(
    sync_status="stop",
    bridge_id="c42996fffec4a182",
    entertainment_id=AREA,
    brightness=80,
    light_delay=2,
    intensity="Moderate",
    intensities=("Subtle", "Moderate", "High"),
    palette="auto",
    palettes=(("Flare", ((255, 0, 0),)),),
    style=0,
    styles=("Pulse", "Glow"),
    track="A song",
    artists=("An artist",),
    is_playing=True,
)


@pytest.fixture
async def sync(hass, make_entry):
    with patch("custom_components.hue_plus.sync.setup.start"):
        entry = await make_entry(["sync"], **CREDENTIALS)
    coordinator = entry.runtime_data.sync
    coordinator._connection_changed(True)
    coordinator._state_changed(STATE)
    await hass.async_block_till_done()
    return coordinator


def entity_id(hass, domain: str, key: str) -> str:
    return er.async_get(hass).async_get_entity_id(domain, DOMAIN, f"{BRIDGE_ID}_sync_{key}")


async def test_the_entities_show_what_the_service_said(hass, sync):
    assert hass.states.get(entity_id(hass, "switch", "sync")).state == "off"
    assert hass.states.get(entity_id(hass, "number", "brightness")).state == "80"
    assert hass.states.get(entity_id(hass, "select", "intensity")).state == "Moderate"
    assert hass.states.get(entity_id(hass, "select", "style")).state == "Pulse"
    playing = hass.states.get(entity_id(hass, "sensor", "now_playing"))
    assert playing.state == "A song" and playing.attributes["artists"] == ["An artist"]
    assert "a" * 27 not in str(playing.attributes)


async def test_the_area_choice_lists_the_music_areas_of_the_bridge(hass, sync):
    await sync._async_load_areas("c42996fffec4a182")
    area = hass.states.get(entity_id(hass, "select", "area"))
    assert area.attributes["options"] == ["Bedroom"] and area.state == "Bedroom"
    assert set(area.attributes["light_ids"]) == {LAMP, TUBE}


async def test_turning_the_switch_on_sends_start_and_leaves_the_state_to_the_service(hass, sync):
    with patch.object(sync.client, "async_set_sync", AsyncMock()) as command:
        await hass.services.async_call("switch", "turn_on", {"entity_id": entity_id(hass, "switch", "sync")}, blocking=True)
    command.assert_awaited_once_with(True)
    assert hass.states.get(entity_id(hass, "switch", "sync")).state == "off"


async def test_everything_is_unavailable_while_the_connection_is_down(hass, sync):
    sync._connection_changed(False)
    await hass.async_block_till_done()
    assert hass.states.get(entity_id(hass, "switch", "sync")).state == "unavailable"


async def test_a_token_the_service_refuses_starts_re_authentication_and_is_kept_until_a_new_one_is_given(hass, make_entry, caplog):
    with patch("custom_components.hue_plus.sync.setup.start"):
        entry = await make_entry(["sync"], **CREDENTIALS)
        with patch.object(entry, "async_start_reauth") as reauth:
            entry.runtime_data.sync._rejected()
            await hass.async_block_till_done()
    reauth.assert_called_once()
    assert entry.data[CONF_AUTH] == CREDENTIALS[CONF_AUTH]
    assert CREDENTIALS[CONF_AUTH] not in caplog.text


async def test_the_sync_without_credentials_does_not_load(hass, make_entry):
    entry = await make_entry(["sync"], loads=False)
    assert entry.state is ConfigEntryState.SETUP_ERROR
