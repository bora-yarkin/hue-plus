# SPDX-License-Identifier: GPL-3.0-or-later
"""Reads the sync box now and then, and sends it commands."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed, HomeAssistantError
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from ..const import DOMAIN
from .client import SyncBox, SyncBoxError

_LOGGER = logging.getLogger(__name__)

# The box has no push channel; it answers a read in a few milliseconds.
UPDATE_INTERVAL = timedelta(seconds=10)


class SyncBoxCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, box: SyncBox) -> None:
        super().__init__(hass, _LOGGER, name=f"{DOMAIN} sync box", config_entry=entry, update_interval=UPDATE_INTERVAL)
        self.box = box

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            return await self.box.state()
        except SyncBoxError as err:
            if err.status == 401:
                raise ConfigEntryAuthFailed(str(err)) from err
            raise UpdateFailed(str(err)) from err

    async def async_command(self, command) -> None:
        """Runs a command, shows the box's refusal in its own words, and reads the new state."""
        try:
            await command
        except SyncBoxError as err:
            raise HomeAssistantError(str(err)) from err
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        await self.async_refresh()
