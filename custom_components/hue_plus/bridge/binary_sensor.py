# SPDX-License-Identifier: GPL-3.0-or-later
"""Whether the bridge reaches the internet and its services."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant

from ..entity import BridgeEntity
from ..runtime import HuePlusConfigEntry

# v1 "internetservices" key -> name
SERVICES = (("internet", "Internet"), ("remoteaccess", "Remote access"), ("time", "Time service"), ("swupdate", "Update service"))


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities) -> None:
    async_add_entities(InternetService(entry.runtime_data.coordinator, key, name) for key, name in SERVICES)


class InternetService(BridgeEntity, BinarySensorEntity):
    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator, key: str, name: str) -> None:
        super().__init__(coordinator, f"service_{key}")
        self._key = key
        self._attr_name = name

    @property
    def is_on(self) -> bool | None:
        state = (self.snapshot.config.get("internetservices") or {}).get(self._key)
        return None if state is None else state == "connected"
