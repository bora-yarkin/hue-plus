# SPDX-License-Identifier: GPL-3.0-or-later
"""Platforms are files at the top of the integration, but entities belong to modules. A top-level platform file hands
the setup to each module that is switched on and has entities of that platform."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from types import ModuleType
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .runtime import HuePlusConfigEntry


def forward(
    modules: Mapping[str, ModuleType],
) -> Callable[[HomeAssistant, HuePlusConfigEntry, AddEntitiesCallback], Any]:
    """The ``async_setup_entry`` of a platform file: set up the modules' entities of this platform, in a fixed order."""

    async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
        for name, module in modules.items():
            if name in entry.runtime_data.modules:
                await module.async_setup_entry(hass, entry, async_add_entities)

    return async_setup_entry
