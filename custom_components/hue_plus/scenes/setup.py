# SPDX-License-Identifier: GPL-3.0-or-later
"""Brings the scenes module up: the engine, the identify helper, and the saved scenes and areas."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.storage import Store

from ..const import DOMAIN
from ..runtime import HuePlusConfigEntry
from .engine import Engine
from .ha_driver import HassDriver
from .hue_native import native_writer
from .identify import Identifier
from .library import Library

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
SAVE_DELAY_S = 1.0


@dataclass
class ScenesRuntime:
    engine: Engine
    identifier: Identifier
    library: Library
    store: Store[dict[str, Any]]

    def save_later(self) -> None:
        """Writes the saved scenes and areas soon (several changes in a row are one write)."""
        self.store.async_delay_save(self.library.as_json, SAVE_DELAY_S)


async def _load_library(hass: HomeAssistant, store: Store[dict[str, Any]], key: str) -> Library:
    """The saved library. Anything that cannot be kept is logged, and the file as it was is copied aside first."""
    stored = await store.async_load()
    library, problems = Library.restore(stored)
    if problems:
        for problem in problems:
            _LOGGER.warning("Hue Plus scenes: %s", problem)
        # The next save would overwrite the damaged file; keep what was in it so nothing is lost silently.
        await Store(hass, STORAGE_VERSION, f"{key}.damaged").async_save({"stored": stored, "problems": problems})
    return library


async def async_setup(hass: HomeAssistant, entry: HuePlusConfigEntry) -> ScenesRuntime:
    runtime = entry.runtime_data
    driver = HassDriver(hass, native_writer(hass, entry))
    engine = Engine(driver, spawn=lambda coro: hass.async_create_background_task(coro, f"{DOMAIN} scene"))
    identifier = Identifier(driver, engine, spawn=lambda coro: hass.async_create_background_task(coro, f"{DOMAIN} locate"))
    store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.scenes.{runtime.uid}")
    scenes = ScenesRuntime(engine, identifier, await _load_library(hass, store, f"{DOMAIN}.scenes.{runtime.uid}"), store)

    @callback
    def state_changed(event: Event) -> None:
        """A light changed by a person (a user's call, not the engine's) leaves its scene."""
        entity_id = event.data.get("entity_id", "")
        if event.context.user_id and engine.owns(entity_id):
            engine.changed_by_someone(entity_id)

    entry.async_on_unload(hass.bus.async_listen("state_changed", state_changed))

    async def stop() -> None:
        """Stops every scene and puts back any light being located."""
        engine.stop_all()
        await identifier.stop_all()

    entry.async_on_unload(stop)
    return scenes
