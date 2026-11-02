# SPDX-License-Identifier: GPL-3.0-or-later
"""The base of every entity of the sync module."""

from __future__ import annotations

from collections.abc import Awaitable

from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from ..const import DOMAIN, MANUFACTURER
from .client import GenesisUnavailable
from .coordinator import SyncCoordinator


class SyncEntity(CoordinatorEntity[SyncCoordinator]):
    _attr_has_entity_name = True

    def __init__(self, coordinator: SyncCoordinator, key: str) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.runtime.uid}_sync_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{coordinator.runtime.uid}_sync")},
            manufacturer=MANUFACTURER,
            name="Hue Spotify sync",
            via_device_id=coordinator.runtime.bridge_device_id,
        )

    @property
    def available(self) -> bool:
        return self.coordinator.connected

    async def async_command(self, command: Awaitable[None]) -> None:
        """Run a command for the service. The new state is not set here: the service confirms it with a message."""
        try:
            await command
        except GenesisUnavailable as err:
            raise HomeAssistantError(str(err)) from err
        except ValueError as err:
            raise ServiceValidationError(str(err)) from err
