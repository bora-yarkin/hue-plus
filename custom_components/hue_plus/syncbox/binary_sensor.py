# SPDX-License-Identifier: GPL-3.0-or-later
"""Whether the box receives a picture."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .entity import SyncBoxEntity


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    runtime = entry.runtime_data
    async_add_entities([HdmiSignal(runtime.coordinator, runtime.uid)])


class HdmiSignal(SyncBoxEntity, BinarySensorEntity):
    _attr_name = "HDMI signal"

    def __init__(self, coordinator, uid: str) -> None:
        super().__init__(coordinator, uid, "hdmi_signal")

    @property
    def is_on(self) -> bool:
        return bool(self.execution.get("hdmiActive"))
