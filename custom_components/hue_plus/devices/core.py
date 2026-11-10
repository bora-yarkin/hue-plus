# SPDX-License-Identifier: GPL-3.0-or-later
"""Runs a platform of the Hue integration for Hue Plus.

The Hue integration's platforms (sensors, motion and contact sensors, buttons and dials, scenes, switches and selects) are
run again with Hue Plus's config entry, so each of those entities exists once more, on Hue Plus's devices, with every
feature it has there. The Hue integration's own entities are hidden and renamed (see ``lights/adopt.py``) so that Hue Plus's
take over their names. When Hue Plus has a connection of its own, these are the platforms to copy out of the Hue integration.
"""

from __future__ import annotations

import importlib
import logging
from collections.abc import Iterable
from typing import Any

from aiohue.v2.models.resource import ResourceTypes
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..const import DOMAIN, HUE_DOMAIN, MANUFACTURER, replaces_hue
from ..entity import accessory_device, bridge_device
from ..lights import adopt
from ..lights.alongside import beside_hue
from ..runtime import HuePlusConfigEntry, Runtime

_LOGGER = logging.getLogger(__name__)


class _Entry:
    """The config entry a platform of the Hue integration is given: the bridge connection, Hue's settings, Hue Plus's lifetime."""

    def __init__(self, ours: HuePlusConfigEntry) -> None:
        self._ours = ours
        # Riding on the Hue integration: its settings. With a connection of Hue Plus's own there are none, so Hue Plus's entry answers.
        self._settings = ours.runtime_data.link.hue_entry or ours

    @property
    def runtime_data(self) -> Any:
        return self._ours.runtime_data.link.bridge

    def async_on_unload(self, func: Any) -> Any:
        return self._ours.async_on_unload(func)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._settings, name)


def rehome(runtime: Runtime, bridge: Any, entity: Entity) -> None:
    """Moves an entity of the Hue integration onto the Hue Plus device that stands for the same device, group or bridge."""
    api = bridge.api
    info = getattr(entity, "_attr_device_info", None) or {}
    ident = next((i for d, i in info.get("identifiers", ()) if d == HUE_DOMAIN), None)
    if ident is None:
        return
    if ident in (api.config.bridge_id, runtime.uid):
        entity._attr_device_info = bridge_device(runtime)
        return
    device = api.devices.get(ident)
    if device is not None:
        # The bridge is also a device of its own in the Hue API (the one that carries its firmware and connectivity): it is the bridge's
        # device here too, not a second "Hue Bridge" next to it.
        if any(getattr(service, "rtype", None) == ResourceTypes.BRIDGE for service in device.services):
            entity._attr_device_info = bridge_device(runtime)
            return
        entity._attr_device_info = accessory_device(runtime, device.id, device.metadata.name, device.product_data.product_name)
        return
    group = api.groups.get(ident)
    if group is not None:
        entity._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, group.id)},
            name=group.metadata.name,
            manufacturer=MANUFACTURER,
            model=group.type.value.title(),
            via_device_id=runtime.bridge_device_id,
        )
        return
    entity._attr_device_info = bridge_device(runtime)


async def run_platform(hass: HomeAssistant, entry: HuePlusConfigEntry, platform: str, add: AddEntitiesCallback) -> None:
    """Sets up one platform of the Hue integration on Hue Plus's devices, and takes over that platform's entities first."""
    runtime = entry.runtime_data
    bridge = runtime.link.bridge
    if replaces_hue(entry):
        taken = adopt.async_adopt(hass, runtime.link.hue_entry_id, (platform,))
        if taken:
            _LOGGER.info("Took over %s %s entities of the Hue integration", taken, platform)
    add = beside_hue(hass, entry, platform, add)

    def add_rehomed(entities: Iterable[Entity], *args: Any, **kwargs: Any) -> None:
        moved = list(entities)
        for entity in moved:
            rehome(runtime, bridge, entity)
        add(moved, *args, **kwargs)

    module = importlib.import_module(f"{__package__.rsplit('.', 1)[0]}.hue.{platform}")
    await module.async_setup_entry(hass, _Entry(entry), add_rehomed)
