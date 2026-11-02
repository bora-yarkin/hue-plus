# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus next to the Hue integration, which is left exactly as it was.

When Hue Plus is set up to leave the Hue integration alone (``CONF_TAKEOVER`` is "alongside"), nothing of the Hue integration is
hidden or renamed. Hue Plus's entity for each Hue entity is made with the Hue entity's id and ``_plus`` (``light.floor_light``
and ``light.floor_light_plus``) and in the same area, found through the unique id the two share. An entity Hue Plus has no Hue
twin for (its own extras) is named as Home Assistant names it.
"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..const import DOMAIN, HUE_DOMAIN, replaces_hue
from ..runtime import HuePlusConfigEntry

SUFFIX = "_plus"


def hue_twin(registry: er.EntityRegistry, domain: str, unique_id: str) -> er.RegistryEntry | None:
    """The Hue integration's entity that Hue Plus's entity with this unique id stands for."""
    entity_id = registry.async_get_entity_id(domain, HUE_DOMAIN, unique_id)
    return registry.async_get(entity_id) if entity_id else None


def twin_area(hass: HomeAssistant, twin: er.RegistryEntry) -> str | None:
    """The area of a Hue entity: its own, else its device's."""
    if twin.area_id:
        return twin.area_id
    if twin.device_id:
        device = dr.async_get(hass).async_get(twin.device_id)
        return device.area_id if device else None
    return None


def _register(hass: HomeAssistant, entry: HuePlusConfigEntry, domain: str, entity: Entity) -> None:
    registry = er.async_get(hass)
    unique_id = entity.unique_id
    if not unique_id or registry.async_get_entity_id(domain, DOMAIN, unique_id):
        return  # not a copy of a Hue entity, or already registered (it keeps the id it has)
    twin = hue_twin(registry, domain, unique_id)
    if twin is None:
        return
    created = registry.async_get_or_create(
        domain,
        DOMAIN,
        unique_id,
        config_entry=entry,
        suggested_object_id=f"{twin.entity_id.split('.', 1)[1]}{SUFFIX}",
    )
    area = twin_area(hass, twin)
    if area:
        registry.async_update_entity(created.entity_id, area_id=area)


def beside_hue(hass: HomeAssistant, entry: HuePlusConfigEntry, domain: str, add: AddEntitiesCallback) -> AddEntitiesCallback:
    """``add``, but with each new entity registered under the Hue entity's id and ``_plus`` first. Unchanged when Hue Plus replaces."""
    if replaces_hue(entry):
        return add

    def add_named(entities: Iterable[Entity], *args: Any, **kwargs: Any) -> None:
        entities = list(entities)
        for entity in entities:
            _register(hass, entry, domain, entity)
        add(entities, *args, **kwargs)

    return add_named
