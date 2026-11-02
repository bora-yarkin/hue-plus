# SPDX-License-Identifier: GPL-3.0-or-later
"""Reads the bridge once a minute for the bridge module and keeps the last read for its entities and services."""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .bridge.api import BridgeApi, BridgeError
from .bridge.models import RESOURCES, Snapshot
from .const import DOMAIN, UPDATE_INTERVAL_S
from .runtime import Runtime

_LOGGER = logging.getLogger(__name__)

# The bridge answers at most three requests at a time.
CONCURRENT_READS = 3


class BridgeCoordinator(DataUpdateCoordinator[Snapshot]):
    config_entry: ConfigEntry

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, api: BridgeApi, runtime: Runtime) -> None:
        super().__init__(hass, _LOGGER, name=DOMAIN, config_entry=entry, update_interval=timedelta(seconds=UPDATE_INTERVAL_S))
        self.api = api
        self.runtime = runtime
        self.read_at = float("-inf")

    async def _async_update_data(self) -> Snapshot:
        gate = asyncio.Semaphore(CONCURRENT_READS)

        async def read(resource: str) -> tuple[str, list[dict[str, Any]]]:
            async with gate:
                try:
                    return resource, await self.api.list(resource)
                except BridgeError as err:
                    # A resource this bridge does not have is simply empty; anything else is a failure.
                    if err.status in (403, 404):
                        return resource, []
                    raise

        async def read_config() -> dict[str, Any]:
            async with gate:
                return await self.api.config()

        try:
            *lists, config = await asyncio.gather(*(read(r) for r in RESOURCES), read_config())
        except BridgeError as err:
            raise UpdateFailed(str(err)) from err
        self.read_at = time.monotonic()
        snapshot = Snapshot(config=config)
        for resource, items in lists:
            setattr(snapshot, resource, items)
        return snapshot

    async def async_call(self, call: Any) -> None:
        """Awaits a write to the bridge, then reads the bridge again so the entities show the result.

        The read is made at once, not requested: a requested refresh waits out a cool-down, and the next action would
        then look up names in what was there before the write."""
        await call
        await self.async_refresh()

    async def async_fresh(self, max_age_s: float = 2.0) -> Snapshot:
        """What the bridge holds, read now unless it was read in the last ``max_age_s`` seconds."""
        if time.monotonic() - self.read_at > max_age_s:
            await self.async_refresh()
        return self.data
