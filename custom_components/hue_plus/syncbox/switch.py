# SPDX-License-Identifier: GPL-3.0-or-later
"""The switch that starts and stops the sync."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .entity import SyncBoxEntity


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    runtime = entry.runtime_data
    async_add_entities([SyncSwitch(runtime.coordinator, runtime.uid)])


class SyncSwitch(SyncBoxEntity, SwitchEntity):
    _attr_name = None

    def __init__(self, coordinator, uid: str) -> None:
        super().__init__(coordinator, uid, "sync")

    @property
    def is_on(self) -> bool:
        return bool(self.execution.get("syncActive"))

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.coordinator.async_command(self.coordinator.box.execute(syncActive=True))

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.coordinator.async_command(self.coordinator.box.execute(syncActive=False))
