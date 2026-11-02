# SPDX-License-Identifier: GPL-3.0-or-later
"""The Hue integration's sensor entities, on Hue Plus's devices."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .core import run_platform


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    await run_platform(hass, entry, "sensor", async_add_entities)
