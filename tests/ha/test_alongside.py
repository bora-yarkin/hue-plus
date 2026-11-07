# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus set up to leave the Hue integration alone: nothing of it is hidden or renamed, Hue Plus's entities end in _plus."""

from __future__ import annotations

from unittest.mock import patch

from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import label_registry as lr
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hue_plus.const import CONF_HUE_ENTRY, CONF_MODULES, CONF_TAKEOVER, DOMAIN, TAKEOVER_ALONGSIDE

from .test_lights import BRIDGE_ID, _custom_integrations, home  # noqa: F401


async def plus_alongside(hass, hue_entry, modules):
    entry = MockConfigEntry(
        domain=DOMAIN,
        version=3,
        unique_id=BRIDGE_ID,
        data={CONF_HUE_ENTRY: hue_entry.entry_id, CONF_TAKEOVER: TAKEOVER_ALONGSIDE},
        options={CONF_MODULES: modules},
    )
    entry.add_to_hass(hass)
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    return entry


def hue_rows(registry):
    return {e.unique_id: (e.entity_id, e.hidden_by, e.area_id) for e in registry.entities.values() if e.platform == "hue"}


async def test_the_hue_entities_are_left_exactly_as_they_were_and_ours_end_in_plus(hass, home):  # noqa: F811
    registry = er.async_get(hass)
    before = hue_rows(registry)
    assert len(before) == 6
    await plus_alongside(hass, home, ["lights"])
    assert hue_rows(registry) == before
    for unique_id, (entity_id, _hidden, _area) in before.items():
        ours = registry.async_get(f"{entity_id}_plus")
        assert ours is not None and ours.platform == DOMAIN and ours.unique_id == unique_id and ours.hidden_by is None, entity_id
        assert hass.states.get(ours.entity_id) is not None


async def test_our_entity_starts_in_the_area_of_the_hue_entity_or_its_device(hass, home):  # noqa: F811
    registry = er.async_get(hass)
    study = ar.async_get(hass).async_create("Study")
    first = next(e for e in registry.entities.values() if e.platform == "hue")
    registry.async_update_entity(first.entity_id, area_id=study.id)
    await plus_alongside(hass, home, ["lights"])
    ours = registry.async_get(f"{first.entity_id}_plus")
    assert ours.area_id == study.id
    others = [e for e in registry.entities.values() if e.platform == DOMAIN and e.unique_id != first.unique_id]
    assert others and all(e.area_id is None for e in others)


async def test_removing_hue_plus_or_switching_the_lights_off_does_not_touch_the_hue_entities(hass, home):  # noqa: F811
    registry = er.async_get(hass)
    # The Hue integration itself hides some entities and names some with "_hue"; none of that is Hue Plus's to change.
    hue_group = registry.async_get_or_create(
        "light", "hue", "own-hue-name", suggested_object_id="room_hue", hidden_by=er.RegistryEntryHider.INTEGRATION
    )
    before = hue_rows(registry)
    entry = await plus_alongside(hass, home, ["lights"])
    hass.config_entries.async_update_entry(entry, options={CONF_MODULES: ["zones"]})
    with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
        await hass.async_block_till_done()
        assert hue_rows(registry) == before
        await hass.config_entries.async_remove(entry.entry_id)
        await hass.async_block_till_done()
    assert hue_rows(registry) == before
    assert registry.async_get(hue_group.entity_id).hidden_by is er.RegistryEntryHider.INTEGRATION
    assert not any(e.platform == DOMAIN for e in registry.entities.values())


async def test_the_devices_module_leaves_the_hue_scenes_alone_too_and_ours_end_in_plus(hass, home):  # noqa: F811
    from .test_lights import DATA

    registry = er.async_get(hass)
    scene = next(r for r in DATA if r["type"] == "scene")
    registry.async_get_or_create("scene", "hue", scene["id"], config_entry=home, suggested_object_id="room_1_scene_1")
    before = hue_rows(registry)
    await plus_alongside(hass, home, ["devices"])
    assert hue_rows(registry) == before
    ours = registry.async_get("scene.room_1_scene_1_plus")
    assert ours is not None and ours.platform == DOMAIN and ours.unique_id == scene["id"]
    # a Hue Plus entity with no Hue twin is named by Home Assistant
    assert all(
        e.entity_id.endswith("_plus")
        for e in registry.entities.values()
        if e.platform == DOMAIN and e.domain == "scene" and e.unique_id == scene["id"]
    )


async def test_settings_given_to_a_hue_entity_later_are_followed_by_ours(hass, home):  # noqa: F811
    registry = er.async_get(hass)
    entry = await plus_alongside(hass, home, ["lights"])
    hue = next(e for e in registry.entities.values() if e.platform == "hue")
    ours = registry.async_get(f"{hue.entity_id}_plus")
    assert (ours.area_id, ours.name, ours.icon, ours.labels) == (None, None, None, set())
    kitchen = ar.async_get(hass).async_create("Kitchen")
    label = lr.async_get(hass).async_create("Reading")
    registry.async_update_entity(hue.entity_id, area_id=kitchen.id, name="Reading lamp", icon="mdi:lamp", labels={label.label_id})
    registry.async_update_entity(hue.entity_id, hidden_by=er.RegistryEntryHider.USER)
    await hass.async_block_till_done()
    ours = registry.async_get(ours.entity_id)
    assert (ours.area_id, ours.name, ours.icon, ours.labels) == (kitchen.id, "Reading lamp", "mdi:lamp", {label.label_id})
    assert ours.hidden_by is er.RegistryEntryHider.USER
    registry.async_update_entity(hue.entity_id, area_id=None, name=None, icon=None, labels=set(), hidden_by=None)
    await hass.async_block_till_done()
    ours = registry.async_get(ours.entity_id)
    assert (ours.area_id, ours.name, ours.icon, ours.labels, ours.hidden_by) == (None, None, None, set(), None)
    assert entry.state.value == "loaded"


async def test_a_setting_changed_on_ours_is_put_back_and_a_hiding_by_the_integration_is_left(hass, home):  # noqa: F811
    registry = er.async_get(hass)
    await plus_alongside(hass, home, ["lights"])
    hue = next(e for e in registry.entities.values() if e.platform == "hue")
    ours = registry.async_get(f"{hue.entity_id}_plus")
    registry.async_update_entity(ours.entity_id, icon="mdi:bed")
    registry.async_update_entity(hue.entity_id, icon="mdi:lamp")
    await hass.async_block_till_done()
    assert registry.async_get(ours.entity_id).icon == "mdi:lamp"
    # Home Assistant or Hue Plus hiding an entity of its own accord is not a person's setting: it stays
    registry.async_update_entity(ours.entity_id, hidden_by=er.RegistryEntryHider.INTEGRATION)
    registry.async_update_entity(hue.entity_id, icon="mdi:desk-lamp")
    await hass.async_block_till_done()
    assert registry.async_get(ours.entity_id).hidden_by is er.RegistryEntryHider.INTEGRATION


async def test_the_area_and_name_a_person_gave_a_hue_device_follow_to_ours(hass, home):  # noqa: F811
    devices = dr.async_get(hass)
    entry = await plus_alongside(hass, home, ["lights"])
    ours = next(d for d in dr.async_entries_for_config_entry(devices, entry.entry_id) if d.via_device_id)
    ident = next(i for domain, i in ours.identifiers if domain == DOMAIN)
    hue = devices.async_get_or_create(config_entry_id=home.entry_id, identifiers={("hue", ident)}, name="Lamp")
    study = ar.async_get(hass).async_create("Study")
    devices.async_update_device(hue.id, area_id=study.id, name_by_user="Desk")
    await hass.async_block_till_done()
    ours = devices.async_get(ours.id)
    assert ours.area_id == study.id and ours.name_by_user == "Desk"


async def test_hiding_and_renaming_mode_does_not_mirror(hass, home):  # noqa: F811
    from .test_lights import plus

    registry = er.async_get(hass)
    await plus(hass, home, ["lights"])
    hue = next(e for e in registry.entities.values() if e.platform == "hue")
    mine = registry.async_get(hue.entity_id.removesuffix("_hue"))
    kitchen = ar.async_get(hass).async_create("Kitchen")
    registry.async_update_entity(hue.entity_id, area_id=kitchen.id, icon="mdi:lamp")
    await hass.async_block_till_done()
    assert mine.platform == DOMAIN and registry.async_get(mine.entity_id).icon is None
