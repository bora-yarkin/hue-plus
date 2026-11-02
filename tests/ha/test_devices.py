# SPDX-License-Identifier: GPL-3.0-or-later
"""The devices module: the Hue integration's buttons, scenes, sensors and switches, run again on Hue Plus's devices.

Uses the same real aiohue bridge, filled with sanitized data, as the lights tests."""

from __future__ import annotations

from unittest.mock import patch

from aiohue.v2.controllers.events import EventType
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.hue_plus import follow
from custom_components.hue_plus.const import CONF_MODULES, DOMAIN
from custom_components.hue_plus.lights import adopt

from .test_lights import BRIDGE_ID, DATA, _custom_integrations, home, plus  # noqa: F401 - fixtures


def by_domain(hass) -> dict[str, list[er.RegistryEntry]]:
    out: dict[str, list[er.RegistryEntry]] = {}
    for entry in er.async_get(hass).entities.values():
        if entry.platform == DOMAIN:
            out.setdefault(entry.domain, []).append(entry)
    return out


async def test_the_buttons_scenes_and_switches_of_the_bridge_exist_on_hue_plus_devices(hass, home):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    entities = by_domain(hass)
    assert len(entities["event"]) >= 5  # one for each button
    assert len(entities["scene"]) == sum(1 for r in DATA if r["type"] == "scene")
    devices = dr.async_get(hass)
    for kind in ("event", "scene", "sensor", "switch", "binary_sensor"):
        for registry_entry in entities.get(kind, []):
            device = devices.async_get(registry_entry.device_id)
            assert device is not None and device.config_entry_id == entry.entry_id, registry_entry.entity_id
            assert all(domain == DOMAIN for domain, _ in device.identifiers), registry_entry.entity_id


async def test_the_hue_integrations_entities_are_hidden_and_hue_plus_takes_their_names(hass, home):  # noqa: F811
    registry = er.async_get(hass)
    scene = next(r for r in DATA if r["type"] == "scene")
    # The ids the Hue integration gives them are the ones Hue Plus's entities want: room and scene name, device and button name.
    registry.async_get_or_create("scene", "hue", scene["id"], config_entry=home, suggested_object_id="room_1_scene_1")
    await plus(hass, home, ["devices"])
    for entity_id, unique_id in (("scene.room_1_scene_1", scene["id"]),):
        hidden = registry.async_get(f"{entity_id}_hue")
        assert hidden is not None and hidden.platform == "hue" and hidden.hidden_by is er.RegistryEntryHider.INTEGRATION
        ours = registry.async_get(entity_id)
        assert ours is not None and ours.platform == DOMAIN and ours.unique_id == unique_id


async def test_a_scene_can_be_activated_from_hue_plus(hass, home):  # noqa: F811
    await plus(hass, home, ["devices"])
    scene = by_domain(hass)["scene"][0]
    await hass.services.async_call("scene", "turn_on", {"entity_id": scene.entity_id}, blocking=True)
    method, path, body = home.runtime_data.writes[-1]
    assert (method, path.split("/")[-2]) == ("put", "scene") and body.get("recall", {}).get("action") in (
        "active",
        "dynamic_palette",
        "static",
    )


async def test_switching_the_devices_module_off_gives_the_entities_back(hass, home):  # noqa: F811
    registry = er.async_get(hass)
    scene = next(r for r in DATA if r["type"] == "scene")
    registry.async_get_or_create("scene", "hue", scene["id"], config_entry=home, suggested_object_id="room_1_scene_1")
    entry = await plus(hass, home, ["devices"])
    assert registry.async_get("scene.room_1_scene_1_hue") is not None
    hass.config_entries.async_update_entry(entry, options={CONF_MODULES: ["scenes"]})
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        await hass.async_block_till_done()
    back = registry.async_get("scene.room_1_scene_1")
    assert back is not None and back.platform == "hue" and back.hidden_by is None
    assert not by_domain(hass).get("scene")
    assert adopt.DEVICE_DOMAINS  # the domains the module owns are named in one place


def hue_plus_device_ids(hass, entry) -> set[str]:
    return {i for d in dr.async_entries_for_config_entry(dr.async_get(hass), entry.entry_id) for dom, i in d.identifiers if dom == DOMAIN}


def stale_device(hass, entry, hue_id: str):
    """What Hue Plus left behind before it followed the bridge: a device, with an entity, for an accessory the bridge no longer has."""
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={(DOMAIN, hue_id)}, name="Hue Smart button 1"
    )
    entity = er.async_get(hass).async_get_or_create("sensor", DOMAIN, f"{hue_id}_battery", config_entry=entry, device_id=device.id)
    return device, entity


async def test_a_device_the_bridge_no_longer_has_is_removed_when_hue_plus_starts(hass, home):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    kept = hue_plus_device_ids(hass, entry)
    device, entity = stale_device(hass, entry, "00000000-dead-beef-0000-000000000000")
    assert hue_plus_device_ids(hass, entry) == kept | {"00000000-dead-beef-0000-000000000000"}
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        assert await hass.config_entries.async_reload(entry.entry_id)
        await hass.async_block_till_done()
    assert dr.async_get(hass).async_get(device.id) is None
    assert er.async_get(hass).async_get(entity.entity_id) is None
    assert hue_plus_device_ids(hass, entry) == kept  # the bridge's own device and every accessory it still has stay


async def test_the_device_of_the_spotify_sync_is_not_taken_for_a_removed_one(hass, home):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    sync = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={(DOMAIN, f"{BRIDGE_ID}_sync")}, name="Hue Spotify sync"
    )
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        assert await hass.config_entries.async_reload(entry.entry_id)
        await hass.async_block_till_done()
    assert dr.async_get(hass).async_get(sync.id) is not None


async def test_a_device_deleted_from_the_bridge_while_running_is_removed(hass, home):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    api = home.runtime_data.api
    button = next(
        d
        for d in api.devices
        if (device := dr.async_get(hass).async_get_device_by_identifier((DOMAIN, d.id), entry.entry_id)) and by_device(hass, device)
    )
    device = dr.async_get(hass).async_get_device_by_identifier((DOMAIN, button.id), entry.entry_id)
    entities = by_device(hass, device)
    await api.devices._handle_event(EventType.RESOURCE_DELETED, {"id": button.id, "type": "device"})
    await hass.async_block_till_done()
    assert dr.async_get(hass).async_get(device.id) is None
    assert all(er.async_get(hass).async_get(entity_id) is None for entity_id in entities)
    assert hue_plus_device_ids(hass, entry) >= {d.id for d in api.devices}


async def test_nothing_is_removed_when_the_bridges_data_has_not_loaded(hass, home):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    kept = hue_plus_device_ids(hass, entry)
    for item in list(home.runtime_data.api.devices):
        home.runtime_data.api.devices._items.pop(item.id)
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        assert await hass.config_entries.async_reload(entry.entry_id)
        await hass.async_block_till_done()
    assert hue_plus_device_ids(hass, entry) >= kept - {d.id for d in home.runtime_data.api.devices}


def by_device(hass, device) -> list[str]:
    return [e.entity_id for e in er.async_entries_for_device(er.async_get(hass), device.id)]


def a_named_device(hass, entry, api):
    return next(
        d
        for d in api.devices
        if (device := dr.async_get(hass).async_get_device_by_identifier((DOMAIN, d.id), entry.entry_id)) and by_device(hass, device)
    )


async def test_a_device_renamed_on_the_bridge_while_running_is_renamed_on_its_hue_plus_device(hass, home):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    api = home.runtime_data.api
    button = a_named_device(hass, entry, api)
    await api.devices._handle_event(
        EventType.RESOURCE_UPDATED,
        {"id": button.id, "type": "device", "metadata": {"name": "Door Switch", "archetype": "unknown_archetype"}},
    )
    await hass.async_block_till_done()
    assert dr.async_get(hass).async_get_device_by_identifier((DOMAIN, button.id), entry.entry_id).name == "Door Switch"


async def test_a_name_the_user_set_in_home_assistant_survives_a_rename_on_the_bridge(hass, home):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    api = home.runtime_data.api
    button = a_named_device(hass, entry, api)
    registry = dr.async_get(hass)
    device = registry.async_get_device_by_identifier((DOMAIN, button.id), entry.entry_id)
    registry.async_update_device(device.id, name_by_user="Mine")
    await api.devices._handle_event(
        EventType.RESOURCE_UPDATED,
        {"id": button.id, "type": "device", "metadata": {"name": "Door Switch", "archetype": "unknown_archetype"}},
    )
    await hass.async_block_till_done()
    renamed = registry.async_get(device.id)
    assert (renamed.name, renamed.name_by_user) == ("Door Switch", "Mine")


async def test_the_hue_integrations_entity_of_a_device_added_while_running_is_hidden_after_a_moment(hass, home, freezer):  # noqa: F811
    entry = await plus(hass, home, ["devices"])
    registry = er.async_get(hass)
    added = registry.async_get_or_create("event", "hue", "late-button-1", config_entry=home, suggested_object_id="new_switch_button_1")
    other = registry.async_get_or_create("event", DOMAIN, "ours-1", config_entry=entry, suggested_object_id="ours_1")
    await hass.async_block_till_done()
    assert registry.async_get(added.entity_id).hidden_by is None  # not at once: the Hue integration is still adding its entities
    freezer.tick(follow.ADOPT_DELAY_SECONDS + 1)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    hidden = registry.async_get("event.new_switch_button_1_hue")
    assert hidden is not None and hidden.unique_id == "late-button-1" and hidden.hidden_by is er.RegistryEntryHider.INTEGRATION
    assert registry.async_get(other.entity_id).hidden_by is None  # Hue Plus's own entities are never hidden


async def test_a_light_of_the_hue_integration_is_left_alone_when_the_lights_module_is_off(hass, home, freezer):  # noqa: F811
    await plus(hass, home, ["devices"])
    registry = er.async_get(hass)
    light = registry.async_get_or_create("light", "hue", "late-light", config_entry=home, suggested_object_id="new_lamp")
    freezer.tick(follow.ADOPT_DELAY_SECONDS + 1)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert registry.async_get(light.entity_id).hidden_by is None


async def test_the_buttons_of_one_switch_have_different_names(hass, home):  # noqa: F811
    await plus(hass, home, ["devices"])
    names_by_device: dict[str, list[str | None]] = {}
    for entry in by_domain(hass).get("event", []):
        names_by_device.setdefault(entry.device_id, []).append(entry.original_name)
    switches = [names for names in names_by_device.values() if len(names) > 1]
    assert switches
    for names in switches:
        assert len(set(names)) == len(names), names
        assert all(name and name.startswith("Button ") for name in names), names
