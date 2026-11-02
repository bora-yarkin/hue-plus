# SPDX-License-Identifier: GPL-3.0-or-later
"""The time of day the bridge installs updates by itself."""

from __future__ import annotations

import datetime

from homeassistant.components.time import TimeEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant

from ..entity import BridgeEntity
from ..runtime import HuePlusConfigEntry
from . import models, payloads


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities) -> None:
    async_add_entities([AutoUpdateTime(entry.runtime_data.coordinator)])


class AutoUpdateTime(BridgeEntity, TimeEntity):
    _attr_name = "Automatic update time"
    _attr_icon = "mdi:clock-check-outline"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "auto_update_time")

    @property
    def native_value(self) -> datetime.time | None:
        return payloads.parse_auto_install_time(models.bridge_update(self.snapshot)["auto_install_time"])

    async def async_set_value(self, value: datetime.time) -> None:
        await self.write(self.coordinator.api.put_config(payloads.auto_update_put(None, value)))
