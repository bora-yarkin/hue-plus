# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus next to the Hue integration, which is left exactly as it was, and which Hue Plus follows.

When Hue Plus is set up to leave the Hue integration alone (``CONF_TAKEOVER`` is "alongside"), nothing of the Hue integration is
hidden or renamed. Hue Plus's entity for each Hue entity is made with the Hue entity's id and ``_plus`` (``light.floor_light``
and ``light.floor_light_plus``) found through the unique id the two share. Their settings follow the Hue entity's for as long as Hue Plus runs (``async_follow_hue_settings``): area, name, icon, labels and being hidden by the user, and the area and name of the device. An entity Hue Plus has no Hue
twin for (its own extras) is named as Home Assistant names it.
"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..const import CONF_HUE_ENTRY, DOMAIN, HUE_DOMAIN, connects_directly, replaces_hue
from ..runtime import HuePlusConfigEntry

SUFFIX = "_plus"


def hue_twin(registry: er.EntityRegistry, domain: str, unique_id: str) -> er.RegistryEntry | None:
    """The Hue integration's entity that Hue Plus's entity with this unique id stands for."""
    entity_id = registry.async_get_entity_id(domain, HUE_DOMAIN, unique_id)
    return registry.async_get(entity_id) if entity_id else None


def _mirror_entity(registry: er.EntityRegistry, plus: er.RegistryEntry) -> None:
    """Gives a Hue Plus entity the settings its Hue twin has: area, name, icon, labels, and being hidden by the user."""
    twin = hue_twin(registry, plus.domain, plus.unique_id)
    if twin is None:
        return
    changes: dict[str, Any] = {}
    # The entity's own area only: an entity without one takes its device's, and the device's area is mirrored below.
    if plus.area_id != twin.area_id:
        changes["area_id"] = twin.area_id
    if plus.name != twin.name:
        changes["name"] = twin.name
    if plus.icon != twin.icon:
        changes["icon"] = twin.icon
    if plus.labels != twin.labels:
        changes["labels"] = set(twin.labels)
    user_hidden = twin.hidden_by is er.RegistryEntryHider.USER
    if user_hidden != (plus.hidden_by is er.RegistryEntryHider.USER) and plus.hidden_by in (None, er.RegistryEntryHider.USER):
        changes["hidden_by"] = er.RegistryEntryHider.USER if user_hidden else None
    if changes:
        registry.async_update_entity(plus.entity_id, **changes)


def _mirror_device(devices: dr.DeviceRegistry, plus: dr.DeviceEntry, hue_entry_id: str) -> None:
    """Gives a Hue Plus device the area and the name a person gave the Hue integration's device (the Hue ids are the same)."""
    ids = {ident for domain, ident in plus.identifiers if domain == DOMAIN}
    twin = next((d for ident in ids if (d := devices.async_get_device_by_identifier((HUE_DOMAIN, ident), hue_entry_id)) is not None), None)
    if twin is None:
        return
    changes: dict[str, Any] = {}
    if plus.area_id != twin.area_id:
        changes["area_id"] = twin.area_id
    if plus.name_by_user != twin.name_by_user:
        changes["name_by_user"] = twin.name_by_user
    if changes:
        devices.async_update_device(plus.id, **changes)


@callback
def async_mirror_all(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """Mirrors every Hue Plus entity and device of this entry from the Hue integration's."""
    registry = er.async_get(hass)
    devices = dr.async_get(hass)
    for device in dr.async_entries_for_config_entry(devices, entry.entry_id):
        _mirror_device(devices, device, entry.data[CONF_HUE_ENTRY])
    for plus in er.async_entries_for_config_entry(registry, entry.entry_id):
        _mirror_entity(registry, plus)


@callback
def _entity_changed(registry: er.EntityRegistry, entry: HuePlusConfigEntry, event: Event) -> None:
    """A Hue entity changed: its Hue Plus twin takes the change."""
    if event.data["action"] != "update":
        return
    row = registry.async_get(event.data["entity_id"])
    if row is None or row.platform != HUE_DOMAIN:
        return
    plus_id = registry.async_get_entity_id(row.domain, DOMAIN, row.unique_id)
    plus = registry.async_get(plus_id) if plus_id else None
    if plus is not None and plus.config_entry_id == entry.entry_id:
        _mirror_entity(registry, plus)


@callback
def _device_changed(devices: dr.DeviceRegistry, entry: HuePlusConfigEntry, hue_entry_id: str, event: Event) -> None:
    """A Hue device changed: its Hue Plus twin takes the change."""
    if event.data["action"] != "update":
        return
    hue = devices.async_get(event.data["device_id"])
    if hue is None:
        return
    for domain, ident in hue.identifiers:
        if domain == HUE_DOMAIN:
            plus = devices.async_get_device_by_identifier((DOMAIN, ident), entry.entry_id)
            if plus is not None:
                _mirror_device(devices, plus, hue_entry_id)


@callback
def async_follow_hue_settings(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """Keeps Hue Plus's entities and devices in step with the Hue integration's, one way (Hue to Hue Plus), for as long as the entry runs.

    A setting changed on a Hue Plus entity itself is put back the next time the Hue entity or device changes or Home Assistant starts.
    """
    if replaces_hue(entry) or connects_directly(entry):
        return  # nothing to follow: Hue Plus replaces the Hue entities, or there are none
    registry = er.async_get(hass)
    devices = dr.async_get(hass)
    hue_entry_id = entry.data[CONF_HUE_ENTRY]

    @callback
    def entity_changed(event: Event) -> None:
        _entity_changed(registry, entry, event)

    @callback
    def device_changed(event: Event) -> None:
        _device_changed(devices, entry, hue_entry_id, event)

    entry.async_on_unload(hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, entity_changed))
    entry.async_on_unload(hass.bus.async_listen(dr.EVENT_DEVICE_REGISTRY_UPDATED, device_changed))
    async_mirror_all(hass, entry)


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
    _mirror_entity(registry, created)


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
