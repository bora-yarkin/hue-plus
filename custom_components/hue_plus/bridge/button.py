# SPDX-License-Identifier: GPL-3.0-or-later
"""Buttons: flash a light, search for new devices, check for a bridge update."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant

from ..entity import BridgeEntity, DeviceEntity, add_as_they_appear
from ..runtime import HuePlusConfigEntry
from . import payloads


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities) -> None:
    coordinator = entry.runtime_data.coordinator
    async_add_entities([SearchButton(coordinator), CheckUpdateButton(coordinator)])
    entry.async_on_unload(
        add_as_they_appear(
            coordinator,
            async_add_entities,
            lambda snap: {
                light["id"]: (lambda light=light: IdentifyButton(coordinator, light["id"], light["owner"]["rid"]))
                for light in snap.light
                if (light.get("owner") or {}).get("rid")
            },
        )
    )


class IdentifyButton(DeviceEntity, ButtonEntity):
    _attr_name = "Identify"
    _attr_icon = "mdi:flash"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator, light_id: str, device_id: str) -> None:
        super().__init__(coordinator, f"identify_{light_id}", device_id)
        self._light_id = light_id

    async def async_press(self) -> None:
        await self.write(self.coordinator.api.put("light", self._light_id, payloads.identify_put()))


class SearchButton(BridgeEntity, ButtonEntity):
    _attr_name = "Search for new devices"
    _attr_icon = "mdi:magnify-scan"

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "search")

    @property
    def available(self) -> bool:
        return super().available and bool(self.snapshot.zigbee_device_discovery)

    async def async_press(self) -> None:
        discovery = self.snapshot.zigbee_device_discovery[0]
        await self.write(self.coordinator.api.put("zigbee_device_discovery", discovery["id"], {"action": {"action_type": "search"}}))


class CheckUpdateButton(BridgeEntity, ButtonEntity):
    _attr_name = "Check for update"
    _attr_icon = "mdi:update"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "check_update")

    async def async_press(self) -> None:
        await self.write(self.coordinator.api.put_config(payloads.CHECK_FOR_UPDATE))
