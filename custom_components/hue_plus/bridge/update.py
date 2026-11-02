# SPDX-License-Identifier: GPL-3.0-or-later
"""Firmware of the bridge and of every light and accessory, with install."""

from __future__ import annotations

from typing import Any

from homeassistant.components.update import UpdateEntity, UpdateEntityFeature
from homeassistant.core import HomeAssistant

from ..entity import BridgeEntity, DeviceEntity, add_as_they_appear
from ..runtime import HuePlusConfigEntry
from . import models, payloads

# What the bridge calls the states of a device's update (v2) and of the bridge's own (v1).
DEVICE_PENDING = ("update_pending", "ready_to_install")
BRIDGE_IDLE = ("noupdates",)
BRIDGE_BUSY = ("installing",)

UPDATE_AVAILABLE = "update available"


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities) -> None:
    coordinator = entry.runtime_data.coordinator
    async_add_entities([BridgeUpdate(coordinator)])
    entry.async_on_unload(
        add_as_they_appear(
            coordinator,
            async_add_entities,
            lambda snap: {i["id"]: (lambda i=i: DeviceUpdate(coordinator, i["id"], i["device_id"])) for i in models.firmware_items(snap)},
        )
    )


class BridgeUpdate(BridgeEntity, UpdateEntity):
    _attr_name = "Bridge firmware"
    _attr_supported_features = UpdateEntityFeature.INSTALL

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "bridge_update")

    @property
    def installed_version(self) -> str | None:
        return models.bridge_update(self.snapshot)["installed"]

    @property
    def latest_version(self) -> str | None:
        """The bridge does not say which version is coming, so a waiting update is shown as such."""
        state = models.bridge_update(self.snapshot)["state"]
        return self.installed_version if state in (None, *BRIDGE_IDLE) else UPDATE_AVAILABLE

    @property
    def in_progress(self) -> bool:
        return models.bridge_update(self.snapshot)["state"] in BRIDGE_BUSY

    async def async_install(self, version: str | None, backup: bool, **kwargs: Any) -> None:
        await self.write(self.coordinator.api.put_config(payloads.INSTALL_BRIDGE_UPDATE))


class DeviceUpdate(DeviceEntity, UpdateEntity):
    _attr_name = "Firmware"
    _attr_supported_features = UpdateEntityFeature.INSTALL

    def __init__(self, coordinator, update_id: str, device_id: str) -> None:
        super().__init__(coordinator, f"update_{update_id}", device_id)
        self._update_id = update_id

    def _item(self) -> dict[str, Any] | None:
        return next((i for i in models.firmware_items(self.snapshot) if i["id"] == self._update_id), None)

    @property
    def available(self) -> bool:
        return super().available and self._item() is not None

    @property
    def installed_version(self) -> str | None:
        item = self._item()
        return item["installed"] if item else None

    @property
    def latest_version(self) -> str | None:
        item = self._item()
        if item is None:
            return None
        return UPDATE_AVAILABLE if item["state"] in (*DEVICE_PENDING, "installing") else item["installed"]

    @property
    def in_progress(self) -> bool:
        item = self._item()
        return bool(item) and item["state"] == "installing"

    async def async_install(self, version: str | None, backup: bool, **kwargs: Any) -> None:
        # Documented as setting the state to "installing"; not yet tried on a real update, since none was waiting.
        await self.write(self.coordinator.api.put("device_software_update", self._update_id, {"state": "installing"}))
