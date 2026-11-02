# SPDX-License-Identifier: GPL-3.0-or-later
"""The switch that starts and stops the Spotify sync."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .entity import SyncEntity


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([SpotifySyncSwitch(entry.runtime_data.sync)])


class SpotifySyncSwitch(SyncEntity, SwitchEntity):
    # The switch is the main entity of its device, so it takes the device's name.
    _attr_name = None

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "sync")

    @property
    def is_on(self) -> bool | None:
        status = self.coordinator.data.sync_status
        return None if status is None else status == "start"

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.async_command(self.coordinator.client.async_set_sync(True))

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.async_command(self.coordinator.client.async_set_sync(False))
