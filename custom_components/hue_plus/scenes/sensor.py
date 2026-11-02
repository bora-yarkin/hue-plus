# SPDX-License-Identifier: GPL-3.0-or-later
"""One sensor that lists the running scenes, and how many are saved."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..entity import bridge_device
from ..runtime import HuePlusConfigEntry, Runtime


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([RunningScenes(entry.runtime_data)])


class RunningScenes(SensorEntity):
    _attr_should_poll = False
    _attr_has_entity_name = True
    _attr_name = "Live scenes"
    _attr_icon = "mdi:palette"
    _unrecorded_attributes = frozenset({"sessions"})

    def __init__(self, runtime: Runtime) -> None:
        self._scenes = runtime.scenes
        self._attr_unique_id = f"{runtime.uid}_live_scenes"
        self._attr_device_info = bridge_device(runtime)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._scenes.engine.add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()

    @property
    def native_value(self) -> int:
        return len(self._scenes.engine.sessions)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {
            "sessions": self._scenes.engine.snapshot(),
            "saved_scenes": len(self._scenes.library.scenes),
            "saved_areas": len(self._scenes.library.areas),
        }
