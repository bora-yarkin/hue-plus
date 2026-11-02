# SPDX-License-Identifier: GPL-3.0-or-later
"""The bridge's own automations (on or off) and its automatic updates."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant

from ..const import MODULE_DEVICES
from ..entity import BridgeEntity, add_as_they_appear
from ..runtime import HuePlusConfigEntry
from . import models, payloads


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities) -> None:
    coordinator = entry.runtime_data.coordinator
    async_add_entities([AutoUpdateSwitch(coordinator)])
    # The devices module brings the Hue integration's own switches for the bridge's automations: no second one then.
    if MODULE_DEVICES not in entry.runtime_data.modules:
        entry.async_on_unload(
            add_as_they_appear(
                coordinator,
                async_add_entities,
                lambda snap: {a["id"]: (lambda a=a: AutomationSwitch(coordinator, a["id"])) for a in models.automations(snap)},
            )
        )


class AutomationSwitch(BridgeEntity, SwitchEntity):
    """A Hue automation that lives on the bridge (a schedule, a timer, what the lights do after streaming, an accessory's buttons)."""

    _attr_icon = "mdi:robot"
    _unrecorded_attributes = frozenset({"configuration"})

    def __init__(self, coordinator, automation_id: str) -> None:
        super().__init__(coordinator, f"automation_{automation_id}")
        self._automation_id = automation_id

    def _item(self) -> dict[str, Any] | None:
        return next((a for a in models.automations(self.snapshot) if a["id"] == self._automation_id), None)

    @property
    def available(self) -> bool:
        return super().available and self._item() is not None

    @property
    def name(self) -> str:
        item = self._item()
        return f"Automation {item['name']}" if item else "Automation"

    @property
    def is_on(self) -> bool | None:
        item = self._item()
        return item["enabled"] if item else None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        item = self._item()
        if not item:
            return None
        return {key: item[key] for key in ("script", "status", "last_error", "configuration", "id")}

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.write(self.coordinator.api.put("behavior_instance", self._automation_id, payloads.automation_put(None, None, True)))

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.write(self.coordinator.api.put("behavior_instance", self._automation_id, payloads.automation_put(None, None, False)))


class AutoUpdateSwitch(BridgeEntity, SwitchEntity):
    _attr_name = "Automatic updates"
    _attr_icon = "mdi:update"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "auto_update")

    @property
    def is_on(self) -> bool | None:
        return models.bridge_update(self.snapshot)["auto_install"]

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self.write(self.coordinator.api.put_config(payloads.auto_update_put(True, None)))

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self.write(self.coordinator.api.put_config(payloads.auto_update_put(False, None)))
