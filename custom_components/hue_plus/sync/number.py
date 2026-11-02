# SPDX-License-Identifier: GPL-3.0-or-later
"""Brightness and light delay of the sync."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from homeassistant.components.number import NumberEntity, NumberEntityDescription, NumberMode
from homeassistant.const import PERCENTAGE, EntityCategory, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .client import GenesisClient, SyncState
from .entity import SyncEntity


@dataclass(frozen=True, kw_only=True)
class SyncNumberDescription(NumberEntityDescription):
    value: Callable[[SyncState], int | None]
    set_value: Callable[[GenesisClient, int], Awaitable[None]]


NUMBERS = (
    SyncNumberDescription(
        key="brightness",
        translation_key="brightness",
        native_min_value=1,
        native_max_value=100,
        native_step=1,
        native_unit_of_measurement=PERCENTAGE,
        value=lambda state: state.brightness,
        set_value=lambda client, value: client.async_set_brightness(value),
    ),
    # The service takes whole seconds. 10 s is the largest value tried; the Hue app's own limit is not known.
    SyncNumberDescription(
        key="light_delay",
        translation_key="light_delay",
        native_min_value=0,
        native_max_value=10,
        native_step=1,
        native_unit_of_measurement=UnitOfTime.SECONDS,
        value=lambda state: state.light_delay,
        set_value=lambda client, value: client.async_set_light_delay(value),
    ),
)


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities(SyncNumber(entry.runtime_data.sync, description) for description in NUMBERS)


class SyncNumber(SyncEntity, NumberEntity):
    entity_description: SyncNumberDescription
    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.SLIDER

    def __init__(self, coordinator, description: SyncNumberDescription) -> None:
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> float | None:
        return self.entity_description.value(self.coordinator.data)

    async def async_set_native_value(self, value: float) -> None:
        await self.async_command(self.entity_description.set_value(self.coordinator.client, int(value)))
