# SPDX-License-Identifier: GPL-3.0-or-later
"""Taking over the Hue integration's entities, and giving them back.

Hue Plus makes its own entity for every one the Hue integration makes (lights, sensors, buttons, scenes, switches, selects).
So that the home keeps working (automations, dashboards and groups name ``light.floor_light``), the Hue integration's entity
is hidden and renamed (``light.floor_light_hue``) and Hue Plus's entity takes the name it had. Nothing of the Hue
integration is deleted, so undoing it is a rename and an unhide.
"""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from ..const import DOMAIN, HUE_DOMAIN

SUFFIX = "_hue"
LIGHT_DOMAINS = ("light",)
DEVICE_DOMAINS = ("binary_sensor", "event", "scene", "select", "sensor", "switch")


def _hue_entities(registry: er.EntityRegistry, hue_entry_id: str, domains: tuple[str, ...]) -> list[er.RegistryEntry]:
    return [e for e in er.async_entries_for_config_entry(registry, hue_entry_id) if e.domain in domains and e.platform == HUE_DOMAIN]


def async_adopt(hass: HomeAssistant, hue_entry_id: str, domains: tuple[str, ...] = LIGHT_DOMAINS) -> int:
    """Hides every entity of these types of the Hue integration and frees its entity id. Returns how many were taken over."""
    registry = er.async_get(hass)
    taken = 0
    for entry in _hue_entities(registry, hue_entry_id, domains):
        if entry.entity_id.endswith(SUFFIX) and entry.hidden_by is er.RegistryEntryHider.INTEGRATION:
            continue  # taken over before
        new_id = f"{entry.entity_id}{SUFFIX}"
        number = 2
        while registry.async_get(new_id) is not None:
            new_id = f"{entry.entity_id}{SUFFIX}_{number}"
            number += 1
        registry.async_update_entity(entry.entity_id, new_entity_id=new_id, hidden_by=er.RegistryEntryHider.INTEGRATION)
        taken += 1
    return taken


def async_release(
    hass: HomeAssistant, hue_entry_id: str, domains: tuple[str, ...] = LIGHT_DOMAINS, plus_entry_id: str | None = None
) -> int:
    """Gives the entities back: removes Hue Plus's entity that holds each entity id, then renames and unhides the Hue one."""
    registry = er.async_get(hass)
    given = 0
    for entry in _hue_entities(registry, hue_entry_id, domains):
        if not entry.entity_id.endswith(SUFFIX) and SUFFIX not in entry.entity_id:
            continue
        if entry.hidden_by is not er.RegistryEntryHider.INTEGRATION:
            continue
        original = entry.entity_id.removesuffix(SUFFIX) if entry.entity_id.endswith(SUFFIX) else entry.entity_id.rsplit(SUFFIX, 1)[0]
        holder = registry.async_get(original)
        if holder is not None:
            if holder.platform != DOMAIN:
                continue  # something else uses the name now: leave the Hue light as it is
            registry.async_remove(original)
        registry.async_update_entity(entry.entity_id, new_entity_id=original, hidden_by=None)
        given += 1
    if plus_entry_id is not None:
        # What Hue Plus made of these types and has no Hue entity to hand back (a module switched off keeps nothing behind).
        for ours in er.async_entries_for_config_entry(registry, plus_entry_id):
            if ours.domain in domains:
                registry.async_remove(ours.entity_id)
    return given
