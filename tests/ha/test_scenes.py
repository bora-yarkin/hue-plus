# SPDX-License-Identifier: GPL-3.0-or-later
"""Live scenes through the services: saving, starting on real light entities, stopping, and surviving a restart."""

import pytest
import voluptuous as vol
from homeassistant.const import EVENT_HOMEASSISTANT_FINAL_WRITE
from homeassistant.core import Context
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import async_mock_service

from custom_components.hue_plus.const import DOMAIN

from .fake_hue import BRIDGE_ID
from .helpers import call, wait_for

LIGHTS = [{"entity_id": "light.left", "x": -1, "y": 0, "z": 0}, {"entity_id": "light.right", "x": 1, "y": 0, "z": 0}]
ATTRIBUTES = {"supported_color_modes": ["xy"], "color_mode": "xy", "brightness": 200, "xy_color": [0.4, 0.4], "supported_features": 32}


@pytest.fixture
async def turn_on(hass, make_entry):
    """Two lights, and a recorder in place of ``light.turn_on``. The entry is set up first: its zones module loads the light
    integration, which would replace a recorder registered earlier."""
    await make_entry(["scenes"])
    for entity_id in ("light.left", "light.right"):
        hass.states.async_set(entity_id, "on", ATTRIBUTES)
    return async_mock_service(hass, "light", "turn_on")


async def test_a_preset_plays_on_a_saved_area_and_stops(hass, turn_on):
    await call(hass, "area_save", {"id": "room", "name": "Room", "lights": LIGHTS})
    await call(hass, "scene_start", {"scene_id": "now", "preset": "candle", "area": "room"})
    await wait_for(lambda: {c.data["entity_id"] for c in turn_on} == {"light.left", "light.right"})
    assert all("xy_color" in c.data and 1 <= c.data["brightness"] <= 255 for c in turn_on)
    assert hass.states.get("sensor.hue_bridge_pro_live_scenes").state == "1"
    await call(hass, "scene_freeze", {"scene_id": "now"})
    assert hass.states.get("sensor.hue_bridge_pro_live_scenes").attributes["sessions"]["now"]["state"] == "frozen"
    await call(hass, "scene_stop", {"scene_id": "now"})
    assert hass.states.get("sensor.hue_bridge_pro_live_scenes").state == "0"


async def test_a_bad_request_is_explained_and_starts_nothing(hass, turn_on):
    with pytest.raises(ServiceValidationError, match="lights"):
        await call(hass, "scene_start", {"scene_id": "x", "preset": "candle"})
    with pytest.raises(vol.Invalid, match="preset"):
        await call(hass, "scene_start", {"scene_id": "x", "preset": "nope", "lights": LIGHTS})
    assert hass.states.get("sensor.hue_bridge_pro_live_scenes").state == "0"
    assert list(turn_on) == []


async def test_a_person_changing_a_light_takes_it_out_of_the_scene(hass, turn_on, hass_admin_user):
    await call(hass, "scene_start", {"scene_id": "now", "preset": "ocean", "lights": LIGHTS})
    await wait_for(lambda: len(turn_on) >= 2)
    hass.states.async_set("light.left", "on", {**ATTRIBUTES, "brightness": 10}, context=Context(user_id=hass_admin_user.id))
    await wait_for(lambda: hass.states.get("sensor.hue_bridge_pro_live_scenes").attributes["sessions"]["now"]["lights"] == ["light.right"])


async def test_saved_scenes_and_areas_survive_a_restart(hass, make_entry, hass_storage):
    entry = await make_entry(["scenes"])
    await call(hass, "area_save", {"id": "room", "name": "Room", "lights": LIGHTS, "ui": {"things": ["tv"]}})
    await call(hass, "scene_save", {"id": "evening", "name": "Evening", "preset": "sunset_glow", "area": "room"})
    hass.bus.async_fire(EVENT_HOMEASSISTANT_FINAL_WRITE)
    await hass.async_block_till_done()
    stored = hass_storage[f"{DOMAIN}.scenes.{BRIDGE_ID}"]["data"]
    assert stored["scenes"]["evening"]["area"] == "room" and stored["areas"]["room"]["ui"] == {"things": ["tv"]}
    assert await hass.config_entries.async_reload(entry.entry_id)
    library = await call(hass, "get_library", response=True)
    assert [s["id"] for s in library["scenes"]] == ["evening"] and len(library["presets"]) >= 12


async def test_a_screen_can_read_the_library_over_the_websocket(hass, make_entry, hass_ws_client):
    await make_entry(["scenes"])
    await call(hass, "scene_save", {"id": "s", "name": "S", "preset": "ocean"})
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hue_plus/library"})
    reply = await client.receive_json()
    assert reply["success"] and [s["id"] for s in reply["result"]["scenes"]] == ["s"]
    assert len(reply["result"]["presets"]) >= 12 and reply["result"]["running"] == {}


async def test_the_websocket_needs_a_bridge_with_the_scenes_module(hass, make_entry, hass_ws_client):
    await make_entry(["bridge"])
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hue_plus/library"})
    assert (await client.receive_json())["success"] is False


STORE_KEY = f"{DOMAIN}.scenes.{BRIDGE_ID}"
GOOD_AREA = {"id": "room", "name": "Room", "lights": LIGHTS, "ui": {}}


def _stored(hass_storage, data):
    hass_storage[STORE_KEY] = {"version": 1, "minor_version": 1, "key": STORE_KEY, "data": data}


async def test_a_damaged_store_loads_what_is_good_and_keeps_a_copy_of_the_rest(hass, make_entry, hass_storage):
    damaged = {
        "areas": {"room": GOOD_AREA, "bad": {"id": "bad", "name": "B", "lights": [{"entity_id": "lock.door"}]}},
        "scenes": {
            "s": {"id": "s", "name": "S", "ui": {}, "preset": "ocean", "area": "room"},
            "x": {"id": "x", "name": "X", "speed": 99},
        },
    }
    _stored(hass_storage, damaged)
    await make_entry(["scenes"])
    library = await call(hass, "get_library", response=True)
    assert [a["id"] for a in library["areas"]] == ["room"] and [s["id"] for s in library["scenes"]] == ["s"]
    copy = hass_storage[f"{STORE_KEY}.damaged"]["data"]
    assert copy["stored"] == damaged and len(copy["problems"]) == 2


async def test_unreadable_storage_does_not_stop_the_module(hass, make_entry, hass_storage):
    _stored(hass_storage, ["not", "a", "library"])
    await make_entry(["scenes"])
    assert (await call(hass, "get_library", response=True))["scenes"] == []
    assert hass_storage[f"{STORE_KEY}.damaged"]["data"]["stored"] == ["not", "a", "library"]


async def test_the_colour_source_is_saved_and_an_unknown_one_is_refused(hass, turn_on):
    await call(hass, "scene_save", {"id": "s", "name": "S", "preset": "ocean", "colour_source": "palette"})
    with pytest.raises(vol.Invalid, match="colour_source"):
        await call(hass, "scene_save", {"id": "t", "name": "T", "preset": "ocean", "colour_source": "disco"})
    assert [s["id"] for s in (await call(hass, "get_library", response=True))["scenes"]] == ["s"]
    await call(hass, "scene_start", {"scene_id": "s", "lights": LIGHTS})
    await wait_for(lambda: hass.states.get("sensor.hue_bridge_pro_live_scenes").attributes["sessions"]["s"]["colour_source"] == "palette")


# --- device actions (HP-10.4) -------------------------------------------------------------------------------------------------


async def test_a_scene_switches_its_devices_when_it_starts_with_the_starting_users_context(hass, turn_on, hass_admin_user):
    off = async_mock_service(hass, "media_player", "turn_off")
    closed = async_mock_service(hass, "cover", "close_cover")
    on = async_mock_service(hass, "switch", "turn_on")
    actions = [
        {"entity_id": "media_player.tv", "do": "off"},
        {"entity_id": "cover.blind", "do": "off"},
        {"entity_id": "switch.fan_plug", "do": "on"},
    ]
    context = Context(user_id=hass_admin_user.id)
    await call(hass, "scene_start", {"scene_id": "film", "preset": "ocean", "lights": LIGHTS, "actions": actions}, context=context)
    await wait_for(lambda: off and closed and on)
    assert [c.data for c in off] == [{"entity_id": "media_player.tv"}]
    assert [c.data for c in closed] == [{"entity_id": "cover.blind"}]
    assert [c.data for c in on] == [{"entity_id": "switch.fan_plug"}]
    assert off[0].context.user_id == hass_admin_user.id  # Home Assistant's own permission checks apply to it


async def test_actions_run_at_the_start_only_not_when_a_running_scene_is_adjusted(hass, turn_on):
    off = async_mock_service(hass, "media_player", "turn_off")
    start = {"scene_id": "film", "preset": "ocean", "lights": LIGHTS, "actions": [{"entity_id": "media_player.tv", "do": "off"}]}
    await call(hass, "scene_start", start)
    await wait_for(lambda: off and len(turn_on) >= 2)
    await call(hass, "scene_update", {"scene_id": "film", "speed": 9, "brightness": 90})
    await call(hass, "scene_freeze", {"scene_id": "film"})
    await call(hass, "scene_play", {"scene_id": "film"})
    await hass.async_block_till_done()
    assert len(off) == 1
    await call(hass, "scene_start", start)  # starting it again is a start, and switches the device again
    await wait_for(lambda: len(off) == 2)


async def test_a_failing_action_does_not_stop_the_other_actions_or_the_scene(hass, turn_on):
    async def broken(call):
        raise RuntimeError("the TV does not answer")

    hass.services.async_register("media_player", "turn_off", broken)
    fan = async_mock_service(hass, "fan", "turn_off")
    actions = [{"entity_id": "media_player.tv", "do": "off"}, {"entity_id": "fan.bedroom", "do": "off"}]
    await call(hass, "scene_start", {"scene_id": "film", "preset": "ocean", "lights": LIGHTS, "actions": actions})
    await wait_for(lambda: fan and len(turn_on) >= 2)
    assert hass.states.get("sensor.hue_bridge_pro_live_scenes").state == "1"


async def test_actions_on_other_domains_are_refused_and_start_nothing(hass, turn_on):
    unlock = async_mock_service(hass, "lock", "unlock")
    run = async_mock_service(hass, "script", "turn_on")
    for entity_id in ("lock.front_door", "script.anything", "automation.a", "alarm_control_panel.home"):
        with pytest.raises(ServiceValidationError):
            await call(
                hass,
                "scene_start",
                {"scene_id": "x", "preset": "ocean", "lights": LIGHTS, "actions": [{"entity_id": entity_id, "do": "on"}]},
            )
    with pytest.raises(vol.Invalid):
        await call(
            hass,
            "scene_save",
            {"id": "x", "name": "X", "preset": "ocean", "actions": [{"entity_id": "lock.front_door", "do": "on"}], "extra": 1},
        )
    assert unlock == [] and run == [] and list(turn_on) == []
    assert hass.states.get("sensor.hue_bridge_pro_live_scenes").state == "0"


async def test_a_saved_scenes_actions_run_when_it_is_started_by_id(hass, turn_on):
    off = async_mock_service(hass, "media_player", "turn_off")
    await call(
        hass,
        "scene_save",
        {"id": "film", "name": "Film", "preset": "ocean", "lights": LIGHTS, "actions": [{"entity_id": "media_player.tv", "do": "off"}]},
    )
    await call(hass, "scene_start", {"scene_id": "film"})
    await wait_for(lambda: off)


# --- a light's own effect (HP-10.7, experimental) ------------------------------------------------------------------------------

NATIVE = {
    **ATTRIBUTES,
    "supported_color_modes": ["xy", "color_temp"],
    "effect_list": ["off", "candle", "underwater", "sunrise"],
    "hue_light_id": "L-1",
}


async def test_a_hue_light_plays_its_own_effect_through_the_bridge_with_the_scenes_colours(hass, make_entry, bridge):
    await make_entry(["scenes"])
    hass.states.async_set("light.left", "on", NATIVE)
    hass.states.async_set("light.right", "on", ATTRIBUTES)
    turn_on = async_mock_service(hass, "light", "turn_on")
    looks = {"light.left": {"native": "underwater", "palette": [{"hs": [200, 100]}, {"hs": [280, 100]}]}}
    await call(hass, "scene_start", {"scene_id": "sea", "preset": "ocean", "lights": LIGHTS, "looks": looks})
    await wait_for(lambda: bridge.lights.set_state_calls and turn_on)
    first = bridge.lights.set_state_calls[0]
    assert first["id"] == "L-1" and first["on"] is True and first["effect"].value == "underwater"
    assert 0 < first["brightness"] <= 100 and len(first["color_xy"]) == 2 and 0 <= first["effect_speed"] <= 1
    assert {c.data["entity_id"] for c in turn_on} == {"light.right"}  # the other light is driven normally


async def test_a_hue_light_without_a_bridge_id_gets_the_colours_without_the_effect(hass, make_entry, bridge):
    await make_entry(["scenes"])
    hass.states.async_set("light.left", "on", {k: v for k, v in NATIVE.items() if k != "hue_light_id"})
    hass.states.async_set("light.right", "on", ATTRIBUTES)
    turn_on = async_mock_service(hass, "light", "turn_on")
    await call(
        hass, "scene_start", {"scene_id": "sea", "preset": "ocean", "lights": LIGHTS, "looks": {"light.left": {"native": "underwater"}}}
    )
    await wait_for(lambda: {c.data["entity_id"] for c in turn_on} == {"light.left", "light.right"})
    assert bridge.lights.set_state_calls == []
    assert all("effect" not in c.data for c in turn_on)


async def test_a_light_that_does_not_offer_the_effect_is_driven_normally(hass, turn_on, bridge):
    hass.states.async_set("light.left", "on", {**NATIVE, "effect_list": ["off", "candle"]})
    await call(
        hass, "scene_start", {"scene_id": "sea", "preset": "ocean", "lights": LIGHTS, "looks": {"light.left": {"native": "underwater"}}}
    )
    await wait_for(lambda: {c.data["entity_id"] for c in turn_on} == {"light.left", "light.right"})
    assert bridge.lights.set_state_calls == []


async def alongside_lights(hass, make_entry):
    """Hue Plus next to the Hue integration, a Hue light and one of another make (Matter)."""
    await make_entry(["scenes"], takeover="alongside")
    registry = er.async_get(hass)
    registry.async_get_or_create("light", DOMAIN, "hue-1", suggested_object_id="left")
    registry.async_get_or_create("light", "matter", "bulb-1", suggested_object_id="right")
    for entity_id in ("light.left", "light.right"):
        hass.states.async_set(entity_id, "on", ATTRIBUTES)
    return async_mock_service(hass, "light", "turn_on")


async def test_next_to_the_hue_integration_a_scene_refuses_a_light_that_is_not_hues(hass, make_entry):
    turn_on = await alongside_lights(hass, make_entry)
    with pytest.raises(ServiceValidationError, match=r"light\.right"):
        await call(hass, "scene_start", {"scene_id": "x", "preset": "candle", "lights": LIGHTS})
    assert list(turn_on) == [] and hass.states.get("sensor.hue_bridge_pro_live_scenes").state == "0"
    await call(hass, "scene_start", {"scene_id": "x", "preset": "candle", "lights": LIGHTS[:1]})
    await wait_for(lambda: {c.data["entity_id"] for c in turn_on} == {"light.left"})


async def test_next_to_the_hue_integration_an_area_and_a_located_light_must_be_hues_too(hass, make_entry):
    await alongside_lights(hass, make_entry)
    with pytest.raises(ServiceValidationError, match=r"light\.right"):
        await call(hass, "area_save", {"id": "room", "name": "Room", "lights": LIGHTS})
    with pytest.raises(ServiceValidationError, match=r"light\.right"):
        await call(hass, "locate_light", {"entity_id": "light.right", "active": True})
    library = await call(hass, "get_library", {}, response=True)
    assert library["areas"] == [] and library["hue_only"] is True
    await call(hass, "area_save", {"id": "room", "name": "Room", "lights": LIGHTS[:1]})
    assert [a["id"] for a in (await call(hass, "get_library", {}, response=True))["areas"]] == ["room"]


async def test_without_that_choice_scenes_take_any_light_as_before(hass, turn_on):
    await call(hass, "area_save", {"id": "room", "name": "Room", "lights": LIGHTS})
    assert (await call(hass, "get_library", {}, response=True))["hue_only"] is False
