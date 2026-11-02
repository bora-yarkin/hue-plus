# SPDX-License-Identifier: GPL-3.0-or-later
"""The base of every Hue Plus entity, and the helper that adds entities for what appears on the bridge later.

Home Assistant gives a device to exactly one config entry, so Hue Plus cannot add its entities to the devices the Hue
integration made. It makes its own: one for the bridge, and one for each light or accessory it has an entity for, named
like the Hue one and linked to the bridge's device.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .bridge import models
from .bridge.api import BridgeError
from .const import DOMAIN, MANUFACTURER
from .coordinator import BridgeCoordinator
from .runtime import Runtime


def bridge_device(runtime: Runtime) -> DeviceInfo:
    """The device of the bridge."""
    return DeviceInfo(identifiers={(DOMAIN, runtime.uid)}, name=runtime.bridge_name, manufacturer=MANUFACTURER, model="Hue Bridge")


def accessory_device(runtime: Runtime, device_id: str, name: str, model: str | None) -> DeviceInfo:
    """The device of one light or accessory, behind the bridge."""
    return DeviceInfo(
        identifiers={(DOMAIN, device_id)}, name=name, manufacturer=MANUFACTURER, model=model, via_device_id=runtime.bridge_device_id
    )


class BridgeEntity(CoordinatorEntity[BridgeCoordinator]):
    """An entity of the bridge itself, shown on the bridge's device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: BridgeCoordinator, key: str) -> None:
        super().__init__(coordinator)
        runtime = coordinator.runtime
        self._attr_unique_id = f"{runtime.uid}_{key}"
        self._attr_device_info = bridge_device(runtime)

    @property
    def snapshot(self) -> models.Snapshot:
        return self.coordinator.data

    async def write(self, call: Awaitable[Any]) -> None:
        """Runs a write to the bridge. The bridge's refusal is shown to the user in its own words."""
        try:
            await self.coordinator.async_call(call)
        except BridgeError as err:
            raise HomeAssistantError(str(err)) from err


class DeviceEntity(BridgeEntity):
    """An entity of one light or accessory, shown on that device."""

    def __init__(self, coordinator: BridgeCoordinator, key: str, device_id: str) -> None:
        super().__init__(coordinator, key)
        runtime = coordinator.runtime
        device = next((d for d in coordinator.data.device if d["id"] == device_id), {})
        self._attr_device_info = accessory_device(
            runtime,
            device_id,
            models.device_names(coordinator.data).get(device_id, "Hue device"),
            (device.get("product_data") or {}).get("product_name"),
        )


def add_as_they_appear(
    coordinator: BridgeCoordinator,
    add: AddEntitiesCallback,
    wanted: Callable[[models.Snapshot], dict[str, Callable[[], Entity]]],
) -> Callable[[], None]:
    """Adds an entity for everything ``wanted`` lists, now and whenever a new one shows up on the bridge.

    ``wanted`` maps a stable key to a function that builds the entity. Returns the function that stops listening.
    """
    known: set[str] = set()

    @callback
    def check() -> None:
        new = []
        for key, build in wanted(coordinator.data).items():
            if key not in known:
                known.add(key)
                new.append(build())
        if new:
            add(new)

    check()
    return coordinator.async_add_listener(check)
