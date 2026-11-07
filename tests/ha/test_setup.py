# SPDX-License-Identifier: GPL-3.0-or-later
"""The integration loads against a bridge, makes its own devices and entities, and unloads cleanly."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from custom_components.hue_plus.const import DOMAIN

from .fake_hue import BRIDGE_ID, LAMP_DEVICE, TUBE, TUBE_DEVICE


async def test_all_default_modules_load_and_unload(hass, make_entry):
    entry = await make_entry()
    assert entry.state is ConfigEntryState.LOADED
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.NOT_LOADED


async def test_it_makes_its_own_devices_and_never_borrows_the_hue_integrations(hass, make_entry):
    entry = await make_entry()
    devices = dr.async_get(hass)
    bridge = devices.async_get_device_by_identifier((DOMAIN, BRIDGE_ID), entry.entry_id)
    lamp = devices.async_get_device_by_identifier((DOMAIN, LAMP_DEVICE), entry.entry_id)
    assert bridge is not None and bridge.name == "Hue Bridge Pro" and bridge.manufacturer == "Signify"
    assert lamp is not None and lamp.name == "Floor Light" and lamp.via_device_id == bridge.id
    for device in dr.async_entries_for_config_entry(devices, entry.entry_id):
        assert all(domain == DOMAIN for domain, _ in device.identifiers)


async def test_the_bridge_module_adds_its_entities(hass, make_entry):
    await make_entry(["bridge"])
    registry = er.async_get(hass)
    by_key = {e.unique_id: e for e in registry.entities.values() if e.platform == DOMAIN}
    for key in ("zigbee_channel", "firmware", "authorized_apps", "auto_update", "search", "bridge_update"):
        assert f"{BRIDGE_ID}_{key}" in by_key, key
    channel = hass.states.get(by_key[f"{BRIDGE_ID}_zigbee_channel"].entity_id)
    assert channel.state == "11"
    apps = hass.states.get(by_key[f"{BRIDGE_ID}_authorized_apps"].entity_id)
    assert apps.state == "1" and "test-application-key" not in str(apps.attributes)


async def test_the_zones_module_adds_a_light_for_each_zone_on_the_lights_own_device(hass, make_entry):
    entry = await make_entry(["zones"])
    registry = er.async_get(hass)
    unique_ids = {e.unique_id for e in registry.entities.values() if e.platform == DOMAIN}
    assert f"{TUBE}_zone_1" in unique_ids and f"{TUBE}_group" not in unique_ids
    zone = hass.states.get(registry.async_get_entity_id("light", DOMAIN, f"{TUBE}_zone_1"))
    assert zone.state == "on" and zone.name == "Bed Light Zone 1"
    device = dr.async_get(hass).async_get_device_by_identifier((DOMAIN, TUBE_DEVICE), entry.entry_id)
    assert device is not None and device.name == "Bed Light"


async def test_a_module_that_is_off_adds_nothing(hass, make_entry):
    await make_entry([])
    assert [e for e in er.async_get(hass).entities.values() if e.platform == DOMAIN] == []


async def test_the_sensor_of_an_area_deleted_on_the_bridge_is_removed(hass, make_entry, bridge):
    from .fake_hue import AREA

    entry = await make_entry(["bridge"])
    registry = er.async_get(hass)
    assert registry.async_get_entity_id("sensor", DOMAIN, f"{BRIDGE_ID}_area_{AREA}")
    bridge.resources["entertainment_configuration"] = []
    await entry.runtime_data.coordinator.async_refresh()
    await hass.async_block_till_done()
    assert registry.async_get_entity_id("sensor", DOMAIN, f"{BRIDGE_ID}_area_{AREA}") is None


async def test_the_bridge_says_whether_home_and_away_is_set_up_and_who_is_tracked(hass, make_entry):
    await make_entry(["bridge"])
    away = hass.states.get(er.async_get(hass).async_get_entity_id("sensor", DOMAIN, f"{BRIDGE_ID}_home_and_away"))
    assert away.state == "not configured" and away.attributes["clients"] == ["phone"]


async def test_an_entry_from_before_live_scenes_moved_to_home_control_loses_the_module_and_its_sensor(hass, hue_entry):
    """Version 4 (decision D-25): the scenes module is gone; so is the sensor that listed running scenes, which has no integration now."""
    from pytest_homeassistant_custom_component.common import MockConfigEntry

    from custom_components.hue_plus.const import CONF_HUE_ENTRY, CONF_MODULES

    entry = MockConfigEntry(
        domain=DOMAIN,
        version=3,
        unique_id=BRIDGE_ID,
        data={CONF_HUE_ENTRY: hue_entry.entry_id},
        options={CONF_MODULES: ["bridge", "zones", "scenes"]},
    )
    entry.add_to_hass(hass)
    registry = er.async_get(hass)
    sensor = registry.async_get_or_create(
        "sensor", DOMAIN, f"{BRIDGE_ID}_live_scenes", config_entry=entry, suggested_object_id="live_scenes"
    )
    other = registry.async_get_or_create("sensor", DOMAIN, f"{BRIDGE_ID}_firmware", config_entry=entry, suggested_object_id="firmware")
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.version == 4 and entry.options[CONF_MODULES] == ["bridge", "zones"]
    assert registry.async_get(sensor.entity_id) is None, "the sensor of live scenes is removed"
    assert registry.async_get(other.entity_id) is not None, "other sensors are left alone"
