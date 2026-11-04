# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus's own connection to a bridge, with the bridge's certificate pinned.

``DirectBridge`` is the part of the Hue integration's bridge object that its platforms (which Hue Plus runs) use: the aiohue client
(``api``), the scene tracker, ``async_request_call``, and the entry, logger and hass they read. Connecting, reconnecting and the
event stream are aiohue's. The one difference from the Hue integration is the certificate: aiohue switches the check off, so
``PinnedBridgeV2`` sends every request, and the event stream, only to a server showing the certificate the bridge showed when
Hue Plus registered with it.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from contextlib import asynccontextmanager
from typing import Any

import aiohttp
from aiohue import HueBridgeV2, Unauthorized
from aiohue.errors import AiohueException, BridgeBusy
from aiohue.v2.scene_activity import SceneActivityTracker
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady, HomeAssistantError

from .bridge.connect import pin
from .const import CONF_APP_KEY, CONF_CERT_SHA256, CONF_HOST

_LOGGER = logging.getLogger(__name__)
INITIALIZE_TIMEOUT_S = 10


class PinnedBridgeV2(HueBridgeV2):
    """aiohue's client, sending only to a server that shows the pinned certificate (``create_request`` is aiohue's, with the pin)."""

    def __init__(self, host: str, app_key: str, fingerprint_hex: str) -> None:
        super().__init__(host, app_key)
        self._pin = pin(fingerprint_hex)

    @asynccontextmanager
    async def create_request(self, method: str, path: str, **kwargs: Any):
        """aiohue's own request (its ``ssl=False`` replaced by the pin), because a request's ``ssl`` beats the connector's."""
        if self._websession is None:
            self._websession = aiohttp.ClientSession(connector=aiohttp.TCPConnector(limit_per_host=3))
        kwargs["ssl"] = self._pin
        kwargs["headers"] = {**kwargs.get("headers", {}), "hue-application-key": self._app_key}
        async with self._websession.request(method, f"https://{self._host}/{path}", **kwargs) as response:
            yield response


class DirectBridge:
    """One bridge, over a connection of Hue Plus's own."""

    api_version = 2

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.config_entry = entry
        self.logger = logging.getLogger(__name__)
        self.scene_activity_tracker: SceneActivityTracker | None = None
        self.reset_jobs: list[Callable[[], Any]] = []
        self.api = PinnedBridgeV2(entry.data[CONF_HOST], entry.data[CONF_APP_KEY], entry.data[CONF_CERT_SHA256])

    async def async_initialize(self) -> None:
        """Connects and reads the bridge. Raises what a config entry's setup should raise when that fails."""
        try:
            async with asyncio.timeout(INITIALIZE_TIMEOUT_S):
                await self.api.initialize()
        except Unauthorized as err:
            await self.api.close()
            raise ConfigEntryAuthFailed("The bridge no longer accepts Hue Plus's registration") from err
        except aiohttp.ServerFingerprintMismatch as err:
            await self.api.close()
            raise ConfigEntryAuthFailed("The bridge shows a different certificate than when Hue Plus registered with it") from err
        except (TimeoutError, aiohttp.ClientError, BridgeBusy) as err:
            await self.api.close()
            raise ConfigEntryNotReady(
                f"The bridge at {self.config_entry.data[CONF_HOST]} could not be reached ({type(err).__name__})"
            ) from err
        self.scene_activity_tracker = SceneActivityTracker(self.api.scenes)
        self.scene_activity_tracker.start()
        self.reset_jobs.append(self.scene_activity_tracker.stop)

    async def async_close(self) -> None:
        while self.reset_jobs:
            self.reset_jobs.pop()()
        await self.api.close()

    async def async_request_call(self, task: Callable, *args: Any, **kwargs: Any) -> Any:
        """Runs a request to the bridge. The bridge warns about writes that change nothing; those are not errors."""
        try:
            return await task(*args, **kwargs)
        except AiohueException as err:
            if "may not have effect" in str(err):
                self.logger.debug("Request failed: %s", err)
                return None
            raise HomeAssistantError(f"Request failed: {err}") from err
        except aiohttp.ClientError as err:
            raise HomeAssistantError(f"Request failed due to a connection error: {err}") from err
