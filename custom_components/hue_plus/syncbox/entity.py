# SPDX-License-Identifier: GPL-3.0-or-later
"""The base of every sync box entity."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from ..const import DOMAIN, MANUFACTURER
from .coordinator import SyncBoxCoordinator


class SyncBoxEntity(CoordinatorEntity[SyncBoxCoordinator]):
    _attr_has_entity_name = True

    def __init__(self, coordinator: SyncBoxCoordinator, uid: str, key: str) -> None:
        super().__init__(coordinator)
        # "syncbox" in the id tells a screen which entities belong to one box without knowing their names.
        self._attr_unique_id = f"{uid}_syncbox_{key}"
        device = (coordinator.data or {}).get("device") or {}
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, uid)},
            manufacturer=MANUFACTURER,
            name=device.get("name") or "Hue Play HDMI Sync Box",
            model="Hue Play HDMI Sync Box",
            sw_version=device.get("firmwareVersion"),
        )

    @property
    def execution(self) -> dict:
        return (self.coordinator.data or {}).get("execution") or {}
