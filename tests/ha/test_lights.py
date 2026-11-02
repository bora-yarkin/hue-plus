# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus's own lights: they take over the Hue integration's, do what those do, and give them back.

The bridge here is a real aiohue bridge object filled with a sanitized copy of what a real Hue Bridge Pro reported (five
lights, one of them a gradient light, a room and its grouped light)."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from unittest.mock import patch

import pytest
from aiohue.v2 import HueBridgeV2
from aiohue.v2.scene_activity import SceneActivityTracker
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hue_plus.const import CONF_HUE_ENTRY, CONF_MODULES, DOMAIN
from custom_components.hue_plus.lights import adopt

DATA = json.loads((Path(__file__).parent / "fixtures" / "home.json").read_text())
BRIDGE_ID = "0000000000000000"


class CoreBridge:
    """What the Hue integration keeps as ``runtime_data``: the aiohue bridge, and the call wrapper lights use."""

    def __init__(self, api: HueBridgeV2, entry: MockConfigEntry) -> None:
        self.api = api
        self.config_entry = entry
        self.logger = logging.getLogger("test.hue")
        self.writes: list[tuple[str, str, dict]] = []
        self.api_version = 2
        self.scene_activity_tracker = SceneActivityTracker(api.scenes)

    async def async_request_call(self, task, *args, **kwargs):
        return await task(*args, **kwargs)

    async def async_reset(self) -> bool:
        return True


@pytest.fixture(autouse=True)
def _custom_integrations(enable_custom_integrations):
    yield


async def build_bridge(hue_entry: MockConfigEntry) -> CoreBridge:
    api = HueBridgeV2("192.0.2.1", "key")
    writes: list = []

    async def request(method: str, path: str, **kwargs):
        """Reads answer from the real data; writes are recorded."""
        if method == "get":
            kind, _, rid = path.removeprefix("clip/v2/resource/").partition("/")
            return [r for r in DATA if r["type"] == kind and rid in ("", r["id"])]
        writes.append((method, path, kwargs.get("json")))
        return []

    api.request = request  # nothing goes to a network
    for controller in (api.config, api.devices, api.lights, api.groups, api.sensors, api.scenes):
        await controller.initialize(DATA)
    core = CoreBridge(api, hue_entry)
    core.writes = writes
    return core


@pytest.fixture
async def home(hass: HomeAssistant):
    """A Hue integration entry that is loaded, with its light entities in the registry as the Hue integration makes them."""
    hue_entry = MockConfigEntry(
        domain="hue", unique_id=BRIDGE_ID, title="Hue Bridge Pro", data={"host": "192.0.2.1", "api_key": "k", "api_version": 2}
    )
    hue_entry.add_to_hass(hass)
    hue_entry.runtime_data = await build_bridge(hue_entry)
    hue_entry.mock_state(hass, ConfigEntryState.LOADED)
    registry = er.async_get(hass)
    for light in hue_entry.runtime_data.api.lights:
        registry.async_get_or_create(
            "light", "hue", light.id, config_entry=hue_entry, suggested_object_id=light.metadata.name.lower().replace(" ", "_")
        )
    for group in hue_entry.runtime_data.api.groups.grouped_light.items:
        if group.owner.rtype.value == "room":
            registry.async_get_or_create("light", "hue", group.id, config_entry=hue_entry, suggested_object_id="room_1")
    return hue_entry


async def plus(hass: HomeAssistant, hue_entry: MockConfigEntry, modules: list[str]) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN, version=3, unique_id=BRIDGE_ID, data={CONF_HUE_ENTRY: hue_entry.entry_id}, options={CONF_MODULES: modules}
    )
    entry.add_to_hass(hass)
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    return entry


def light_ids(home) -> dict[str, bool]:
    return {
        light.id: "gradient" in {k for k in vars(light) if getattr(light, k)} or light.gradient is not None
        for light in home.runtime_data.api.lights
    }


async def test_the_hue_lights_are_hidden_and_renamed_and_hue_plus_takes_their_names(hass, home):
    registry = er.async_get(hass)
    before = {e.unique_id: e.entity_id for e in registry.entities.values() if e.platform == "hue" and e.domain == "light"}
    assert len(before) == 6 and all(not eid.endswith("_hue") for eid in before.values())
    await plus(hass, home, ["lights"])
    for unique_id, entity_id in before.items():
        hidden = registry.async_get(f"{entity_id}_hue")
        assert hidden is not None and hidden.unique_id == unique_id and hidden.hidden_by is er.RegistryEntryHider.INTEGRATION
        ours = registry.async_get(entity_id)
        assert ours is not None and ours.platform == DOMAIN and ours.unique_id == unique_id, entity_id


async def test_our_light_has_what_the_hue_light_has_and_the_hue_light_id(hass, home):
    await plus(hass, home, ["lights"])
    registry = er.async_get(hass)
    api = home.runtime_data.api
    for light in api.lights:
        state = hass.states.get(registry.async_get_entity_id("light", DOMAIN, light.id))
        assert state is not None and state.state in ("on", "off") and state.attributes["hue_light_id"] == light.id
        expected = len(light.effects.status_values) - 1 if light.effects else 0
        if expected > 0:
            assert "off" in state.attributes["effect_list"] and len(state.attributes["effect_list"]) >= expected
        assert ("brightness" in state.attributes or state.state == "off") or light.dimming is None


async def test_turning_a_light_on_with_an_effect_and_a_transition_reaches_the_bridge(hass, home):
    await plus(hass, home, ["lights"])
    registry = er.async_get(hass)
    light = next(x for x in home.runtime_data.api.lights if x.effects and x.supports_dimming)
    entity = registry.async_get_entity_id("light", DOMAIN, light.id)
    effect = next(e for e in hass.states.get(entity).attributes["effect_list"] if e != "off")
    await hass.services.async_call(
        "light", "turn_on", {"entity_id": entity, "brightness": 128, "effect": effect, "transition": 2}, blocking=True
    )
    method, path, body = home.runtime_data.writes[-1]
    assert (method, path) == ("put", f"clip/v2/resource/light/{light.id}")
    assert body["on"] == {"on": True} and effect in json.dumps(body), body


async def test_a_brightness_and_a_transition_reach_the_bridge_in_its_units(hass, home):
    await plus(hass, home, ["lights"])
    light = next(x for x in home.runtime_data.api.lights if x.supports_dimming)
    entity = er.async_get(hass).async_get_entity_id("light", DOMAIN, light.id)
    await hass.services.async_call("light", "turn_on", {"entity_id": entity, "brightness": 128, "transition": 2}, blocking=True)
    _method, path, body = home.runtime_data.writes[-1]
    assert (
        path.endswith(light.id) and body["dimming"]["brightness"] == pytest.approx(50.2, abs=0.1) and body["dynamics"]["duration"] == 2000
    )
    await hass.services.async_call("light", "turn_off", {"entity_id": entity}, blocking=True)
    assert home.runtime_data.writes[-1][2]["on"] == {"on": False}


async def test_a_room_gets_its_group_light_on_a_device_named_like_the_room(hass, home):
    entry = await plus(hass, home, ["lights"])
    registry = er.async_get(hass)
    group = next(g for g in home.runtime_data.api.groups.grouped_light.items if g.owner.rtype.value == "room")
    entity = registry.async_get_entity_id("light", DOMAIN, group.id)
    assert entity == "light.room_1" and hass.states.get(entity).state in ("on", "off")
    device = dr.async_get(hass).async_get_device_by_identifier((DOMAIN, group.owner.rid), entry.entry_id)
    assert device is not None and device.name == "Room 1"


async def test_a_gradient_light_names_its_zones_and_is_one_light_named_after_the_device(hass, home):
    entry = await plus(hass, home, ["lights", "zones"])
    registry = er.async_get(hass)
    gradient = next(x for x in home.runtime_data.api.lights if x.gradient is not None)
    state = hass.states.get(registry.async_get_entity_id("light", DOMAIN, gradient.id))
    device = dr.async_get(hass).async_get_device_by_identifier((DOMAIN, gradient.owner.rid), entry.entry_id)
    assert state.name == device.name  # the light itself carries the device's name, not "Zones"
    zones = state.attributes["entity_id"]
    assert len(zones) >= 2 and all(registry.async_get(z).platform == DOMAIN for z in zones)
    assert state.attributes["gradient_modes"] and state.attributes["gradient_mode"] in state.attributes["gradient_modes"]
    # on the device the light itself comes first, then its zones
    names = sorted(er.async_entries_for_device(registry, device.id), key=lambda e: (e.original_name or "", e.entity_id))
    assert names[0].entity_id == state.entity_id


async def test_removing_hue_plus_gives_the_hue_lights_back_under_their_own_names(hass, home):
    registry = er.async_get(hass)
    before = {e.unique_id: e.entity_id for e in registry.entities.values() if e.platform == "hue" and e.domain == "light"}
    entry = await plus(hass, home, ["lights"])
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        await hass.config_entries.async_remove(entry.entry_id)
        await hass.async_block_till_done()
    for unique_id, entity_id in before.items():
        back = registry.async_get(entity_id)
        assert back is not None and back.platform == "hue" and back.unique_id == unique_id and back.hidden_by is None, entity_id
    assert not any(e.platform == DOMAIN for e in registry.entities.values())


async def test_switching_the_lights_module_off_gives_them_back_too(hass, home):
    registry = er.async_get(hass)
    entry = await plus(hass, home, ["lights"])
    assert any(e.entity_id.endswith("_hue") for e in registry.entities.values())
    hass.config_entries.async_update_entry(entry, options={CONF_MODULES: ["scenes"]})
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        await hass.async_block_till_done()
    assert not any(e.entity_id.endswith("_hue") for e in registry.entities.values() if e.platform == "hue")
    assert all(e.hidden_by is None for e in registry.entities.values() if e.platform == "hue" and e.domain == "light")


async def test_something_else_using_a_name_is_left_alone_when_giving_back(hass, home):
    registry = er.async_get(hass)
    await plus(hass, home, ["lights"])
    taken = next(e for e in registry.entities.values() if e.platform == DOMAIN and e.domain == "light")
    registry.async_remove(taken.entity_id)
    registry.async_get_or_create("light", "template", "mine", suggested_object_id=taken.entity_id.split(".")[1])
    assert adopt.async_release(hass, home.entry_id) == 5  # all but the one whose name something else uses now
    assert registry.async_get(taken.entity_id).platform == "template"
    assert registry.async_get(f"{taken.entity_id}_hue").hidden_by is er.RegistryEntryHider.INTEGRATION


async def test_an_entry_from_before_the_lights_module_gets_it(hass, home):
    entry = MockConfigEntry(
        domain=DOMAIN, version=1, unique_id=BRIDGE_ID, data={CONF_HUE_ENTRY: home.entry_id}, options={CONF_MODULES: ["scenes"]}
    )
    entry.add_to_hass(hass)
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    assert entry.version == 3 and {"lights", "devices"} <= set(entry.options[CONF_MODULES])
