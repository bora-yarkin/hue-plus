# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus's lights: every light, room and zone of the bridge, with everything the Hue integration's lights do.

For now they are the Hue integration's own light entities (``HueLight``, ``GroupedHueLight``, Apache-2.0, part of Home
Assistant) moved onto Hue Plus's devices: brightness, colour, white, transitions, flash and the lights' effects work the
same. Hue Plus adds ``hue_light_id`` to every light and, for gradient lights, the gradient's style and zones. The Hue
integration's connection to the bridge is still the one in use; when Hue Plus has its own, these classes are the code to copy
out of the Hue integration.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from aiohue.v2.controllers.events import EventType
from aiohue.v2.controllers.groups import GroupedLight
from aiohue.v2.models.light import Light
from aiohue.v2.models.resource import ResourceTypes
from homeassistant.components.hue.v2.group import GroupedHueLight
from homeassistant.components.hue.v2.light import HueLight
from homeassistant.components.light import LightEntityDescription
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..bridge import models
from ..const import DOMAIN, MANUFACTURER, replaces_hue
from ..entity import accessory_device
from ..runtime import HuePlusConfigEntry, Runtime
from . import adopt
from .alongside import beside_hue

_LOGGER = logging.getLogger(__name__)

DESCRIPTION = LightEntityDescription(key="hue_plus_light", has_entity_name=True, name=None)


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    runtime = entry.runtime_data
    bridge = runtime.link.bridge
    api = bridge.api
    # Taking over comes first: the entities below must find their entity ids free.
    if replaces_hue(entry):
        taken = adopt.async_adopt(hass, runtime.link.hue_entry_id)
        if taken:
            _LOGGER.info("Took over %s light entities of the Hue integration (hidden, and renamed with %s)", taken, adopt.SUFFIX)
    async_add_entities = beside_hue(hass, entry, "light", async_add_entities)

    @callback
    def add_light(_event: EventType, resource: Light) -> None:
        async_add_entities([HuePlusLight(runtime, bridge, api.lights, resource)])

    async_add_entities(HuePlusLight(runtime, bridge, api.lights, light) for light in api.lights)
    entry.async_on_unload(api.lights.subscribe(add_light, event_filter=EventType.RESOURCE_ADDED))

    async def add_group(_event: EventType, resource: GroupedLight) -> None:
        # The grouped light can appear before its room or zone does.
        retries = 5
        group = api.groups.grouped_light.get_zone(resource.id)
        while retries and group is None:
            retries -= 1
            await asyncio.sleep(0.5)
            group = api.groups.grouped_light.get_zone(resource.id)
        if group is not None:
            async_add_entities([HuePlusGroupLight(runtime, bridge, resource, group)])

    for item in api.groups.grouped_light.items:
        if item.owner.rtype not in (ResourceTypes.BRIDGE_HOME, ResourceTypes.PRIVATE_GROUP):
            await add_group(EventType.RESOURCE_ADDED, item)
    entry.async_on_unload(api.groups.grouped_light.subscribe(add_group, event_filter=EventType.RESOURCE_ADDED))


class HuePlusLight(HueLight):
    """One light: the Hue integration's light, on a Hue Plus device."""

    entity_description = DESCRIPTION

    def __init__(self, runtime: Runtime, bridge: Any, controller: Any, resource: Light) -> None:
        super().__init__(bridge, controller, resource)
        self.runtime = runtime
        device = self.device
        self._attr_device_info = (
            accessory_device(runtime, device.id, device.metadata.name, device.product_data.product_name)
            if device is not None
            else DeviceInfo(identifiers={(DOMAIN, runtime.uid)})
        )

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        manager = self.runtime.zones.get(self.resource.id)
        if manager is not None:
            self.async_on_remove(manager.add_listener(self.async_write_ha_state))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        attributes = dict(super().extra_state_attributes or {})
        attributes["hue_light_id"] = self.resource.id
        coordinator = self.runtime.coordinator
        raw = (
            next((item for item in coordinator.data.light if item["id"] == self.resource.id), None)
            if coordinator and coordinator.data
            else None
        )
        if raw:
            attributes.update({f"hue_{key}": value for key, value in models.light_setup(raw).items()})
        manager = self.runtime.zones.get(self.resource.id)
        if manager is not None:
            registry = er.async_get(self.hass)
            zones = [registry.async_get_entity_id("light", DOMAIN, f"{manager.light_id}_zone_{i + 1}") for i in range(manager.zone_count)]
            attributes.update(
                {
                    "entity_id": [z for z in zones if z],
                    "zone_colors": [list(p) for p in manager.pins],
                    "gradient_mode": manager.mode,
                    "gradient_modes": list(manager.data.get("gradient", {}).get("mode_values", [])),
                    "last_read_from_bridge": manager.last_read,
                    "last_write_seconds": manager.last_write_seconds,
                }
            )
        return attributes


class HuePlusGroupLight(GroupedHueLight):
    """The lights of a room or zone as one: the Hue integration's grouped light, on the room's or zone's Hue Plus device."""

    def __init__(self, runtime: Runtime, bridge: Any, resource: GroupedLight, group: Any) -> None:
        super().__init__(bridge, resource, group)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, group.id)},
            name=group.metadata.name,
            manufacturer=MANUFACTURER,
            model=group.type.value.title(),
            via_device_id=runtime.bridge_device_id,
        )
