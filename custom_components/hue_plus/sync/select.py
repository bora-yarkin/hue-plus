# SPDX-License-Identifier: GPL-3.0-or-later
"""Intensity, palette, style and area of the sync."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.select import SelectEntity, SelectEntityDescription
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .coordinator import SyncCoordinator
from .entity import SyncEntity
from .helpers import area_options


@dataclass(frozen=True, kw_only=True)
class SyncSelectDescription(SelectEntityDescription):
    options_of: Callable[[SyncCoordinator], list[str]]
    current_of: Callable[[SyncCoordinator], str | None]
    select: Callable[[SyncCoordinator, str], Awaitable[None]]
    attributes_of: Callable[[SyncCoordinator], dict[str, Any]] | None = None


def _current_style(coordinator: SyncCoordinator) -> str | None:
    state = coordinator.data
    return state.styles[state.style] if state.style is not None and 0 <= state.style < len(state.styles) else None


def _current_area(coordinator: SyncCoordinator) -> str | None:
    return next(
        (text for text, area_id in area_options(coordinator.areas).items() if area_id == coordinator.data.entertainment_id),
        None,
    )


SELECTS = (
    SyncSelectDescription(
        key="intensity",
        translation_key="intensity",
        options_of=lambda c: list(c.data.intensities),
        current_of=lambda c: c.data.intensity,
        select=lambda c, option: c.client.async_set_intensity(option),
    ),
    SyncSelectDescription(
        key="palette",
        translation_key="palette",
        options_of=lambda c: [name for name, _ in c.data.palettes],
        current_of=lambda c: c.data.palette,
        select=lambda c, option: c.client.async_set_palette(option),
        # The colours of each palette, so a dashboard can draw them next to the name.
        attributes_of=lambda c: {"colors": {name: [list(rgb) for rgb in colours] for name, colours in c.data.palettes}},
    ),
    SyncSelectDescription(
        key="style",
        translation_key="style",
        options_of=lambda c: list(c.data.styles),
        current_of=_current_style,
        select=lambda c, option: c.client.async_set_style(option),
    ),
    SyncSelectDescription(
        key="area",
        translation_key="area",
        options_of=lambda c: list(area_options(c.areas)),
        # The Hue ids of the lights in the chosen area: the lights the sync plays on while it runs.
        attributes_of=lambda c: {"light_ids": c.area_lights.get(c.data.entertainment_id or "", [])},
        current_of=_current_area,
        select=lambda c, option: c.client.async_set_area(area_options(c.areas)[option]),
    ),
)


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities(SyncSelect(entry.runtime_data.sync, description) for description in SELECTS)


class SyncSelect(SyncEntity, SelectEntity):
    entity_description: SyncSelectDescription
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator: SyncCoordinator, description: SyncSelectDescription) -> None:
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def options(self) -> list[str]:
        return self.entity_description.options_of(self.coordinator)

    @property
    def available(self) -> bool:
        # The choices arrive after the connection does (and the areas after that), so there is nothing to pick yet.
        return super().available and bool(self.options)

    @property
    def current_option(self) -> str | None:
        return self.entity_description.current_of(self.coordinator)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        of = self.entity_description.attributes_of
        return of(self.coordinator) if of else None

    async def async_select_option(self, option: str) -> None:
        await self.async_command(self.entity_description.select(self.coordinator, option))
