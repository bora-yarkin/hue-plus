# SPDX-License-Identifier: GPL-3.0-or-later
"""The brightness of the lights while the box syncs."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .client import MAX_BRIGHTNESS
from .entity import SyncBoxEntity


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    runtime = entry.runtime_data
    async_add_entities([Brightness(runtime.coordinator, runtime.uid)])


class Brightness(SyncBoxEntity, NumberEntity):
    """The box counts brightness from 0 to 200, where 100 is the lights' normal brightness; the scale is kept as the box has it."""

    _attr_name = "Brightness"
    _attr_native_min_value = 0
    _attr_native_max_value = MAX_BRIGHTNESS
    _attr_native_step = 1
    _attr_mode = NumberMode.SLIDER

    def __init__(self, coordinator, uid: str) -> None:
        super().__init__(coordinator, uid, "brightness")

    @property
    def native_value(self) -> float | None:
        return self.execution.get("brightness")

    async def async_set_native_value(self, value: float) -> None:
        await self.coordinator.async_command(self.coordinator.box.execute(brightness=int(value)))
