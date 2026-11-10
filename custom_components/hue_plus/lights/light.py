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

import voluptuous as vol
from aiohue.v2.controllers.events import EventType
from aiohue.v2.controllers.groups import GroupedLight
from aiohue.v2.models.feature import EffectStatus
from aiohue.v2.models.light import Light
from aiohue.v2.models.resource import ResourceTypes
from homeassistant.components.light import DOMAIN as LIGHT_DOMAIN
from homeassistant.components.light import LightEntityDescription
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.service import async_register_platform_entity_service

from ..bridge import models
from ..const import DOMAIN, MANUFACTURER, PLAY_EFFECTS, replaces_hue
from ..entity import accessory_device
from ..hue.v2.group import GroupedHueLight
from ..hue.v2.light import HueLight
from ..runtime import HuePlusConfigEntry, Runtime
from . import adopt
from .alongside import beside_hue

_LOGGER = logging.getLogger(__name__)

DESCRIPTION = LightEntityDescription(key="hue_plus_light", has_entity_name=True, name=None)

SERVICE_PLAY_EFFECT = "play_effect"


def _number_in(low: float, high: float):
    """A validator for a decimal in a range. It raises ValueError, which Home Assistant's schemas turn into a refused value."""

    def check(value: Any) -> float:
        number = float(value)
        if not low <= number <= high:
            raise ValueError(f"must be from {low} to {high}")
        return number

    return check


def _xy(value: Any) -> tuple[float, float]:
    x, y = (float(v) for v in value)
    if not (0 <= x <= 1 and 0 <= y <= 1):
        raise ValueError("an xy colour is two numbers from 0 to 1")
    return x, y


PLAY_EFFECT_SCHEMA = {
    vol.Required("effect"): cv.string,
    vol.Required("xy"): _xy,
    vol.Required("brightness"): lambda value: round(_number_in(1, 255)(value)),
    vol.Required("speed"): _number_in(0, 1),
}


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
    # An action on the lights of this platform: the dashboard (Home Control) plays a light's own effect with a colour through it.
    if not hass.services.has_service(DOMAIN, SERVICE_PLAY_EFFECT):
        async_register_platform_entity_service(
            hass, DOMAIN, SERVICE_PLAY_EFFECT, entity_domain=LIGHT_DOMAIN, func="async_play_effect", schema=PLAY_EFFECT_SCHEMA
        )


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

    async def async_play_effect(self, effect: str, xy: tuple[float, float], brightness: int, speed: float) -> None:
        """One of the light's own effects with a chosen colour.

        Home Assistant's ``light.turn_on`` clears the colour when it is given an effect, so a colour cannot go with one. The bridge takes
        both, so this writes them together, through the Hue integration's call wrapper like the light's other writes. EXPERIMENTAL: written
        from aiohue's models; whether a new colour restarts the effect's animation is not known."""
        if effect not in PLAY_EFFECTS:
            raise ServiceValidationError(f"{effect} is not an effect that can be played with a colour: {', '.join(PLAY_EFFECTS)}")
        await self.bridge.async_request_call(
            self.controller.set_state,
            id=self.resource.id,
            on=True,
            brightness=round(brightness / 255 * 100, 1),
            color_xy=xy,
            effect=EffectStatus(effect),
            effect_speed=speed,
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
