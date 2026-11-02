# SPDX-License-Identifier: GPL-3.0-or-later
"""What each light does when it gets power."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant

from ..entity import DeviceEntity, add_as_they_appear
from ..runtime import HuePlusConfigEntry
from . import models, payloads

# "custom" is chosen with the set_power_on service, because it needs the state to switch on with; it is listed only while it is set.
SIMPLE_PRESETS = ["safety", "powerfail", "last_on_state"]


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities) -> None:
    coordinator = entry.runtime_data.coordinator
    entry.async_on_unload(
        add_as_they_appear(
            coordinator,
            async_add_entities,
            lambda snap: {
                light["id"]: (lambda light=light: PowerOnSelect(coordinator, light["id"], light["owner"]["rid"]))
                for light in snap.light
                if models.light_powerup(light) and (light.get("owner") or {}).get("rid")
            },
        )
    )


class PowerOnSelect(DeviceEntity, SelectEntity):
    _attr_name = "Power-on behavior"
    _attr_icon = "mdi:power-settings"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator, light_id: str, device_id: str) -> None:
        super().__init__(coordinator, f"powerup_{light_id}", device_id)
        self._light_id = light_id

    def _light(self) -> dict | None:
        return next((item for item in self.snapshot.light if item["id"] == self._light_id), None)

    @property
    def available(self) -> bool:
        return super().available and self._light() is not None

    @property
    def current_option(self) -> str | None:
        light = self._light()
        return models.light_powerup(light) if light else None

    @property
    def options(self) -> list[str]:
        return [*SIMPLE_PRESETS, "custom"] if self.current_option == "custom" else SIMPLE_PRESETS

    async def async_select_option(self, option: str) -> None:
        await self.write(self.coordinator.api.put("light", self._light_id, payloads.powerup_put(option, None, None, None, None)))
