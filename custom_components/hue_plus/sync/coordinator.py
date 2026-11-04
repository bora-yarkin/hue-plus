# SPDX-License-Identifier: GPL-3.0-or-later
"""Holds the connection to the sync service and tells the entities when something changes."""

from __future__ import annotations

import logging

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from ..connection import read
from ..const import DOMAIN
from ..runtime import Runtime
from .client import GenesisClient, SyncState
from .helpers import area_light_ids, same_bridge

_LOGGER = logging.getLogger(__name__)

# The Spotify sync only works in entertainment areas that were created for music.
MUSIC_AREA_TYPE = "music"


class SyncCoordinator(DataUpdateCoordinator[SyncState]):
    """Push-based: the service sends every change, so there is nothing to poll."""

    config_entry: ConfigEntry

    def __init__(
        self, hass: HomeAssistant, entry: ConfigEntry, runtime: Runtime, session: aiohttp.ClientSession, url: str, auth: str, uuid: str
    ) -> None:
        super().__init__(hass, _LOGGER, name=f"{DOMAIN} sync", config_entry=entry)
        self.runtime = runtime
        self.uuid = uuid
        self.connected = False
        # Entertainment area id -> name, for the music areas of the bridge the service is tied to.
        self.areas: dict[str, str] = {}
        # Entertainment area id -> the Hue light ids in it, so a dashboard can show which lights the sync plays on.
        self.area_lights: dict[str, list[str]] = {}
        self._areas_bridge: str | None = None
        self.client = GenesisClient(
            session,
            url,
            auth,
            uuid,
            on_state=self._state_changed,
            on_connection=self._connection_changed,
            on_rejected=self._rejected,
        )
        self.data = self.client.state

    def _state_changed(self, state: SyncState) -> None:
        self.async_set_updated_data(state)
        if state.bridge_id and state.bridge_id != self._areas_bridge:
            self._areas_bridge = state.bridge_id
            self.config_entry.async_create_background_task(self.hass, self._async_load_areas(state.bridge_id), "hue_plus sync areas")

    def _connection_changed(self, connected: bool) -> None:
        self.connected = connected
        if not connected:
            self._areas_bridge = None  # load the areas again after the next connect
        self.async_update_listeners()

    def _rejected(self) -> None:
        """The seven-day token expired: the user is asked for a new one (a reauthentication)."""
        _LOGGER.error("The Hue sync service no longer accepts the stored token; asking for a new one")
        self.config_entry.async_start_reauth(self.hass, context={"reauth_for": "sync"})

    async def _async_load_areas(self, bridge_id: str) -> None:
        """Asks the bridge, over the Hue integration's connection, which music areas exist."""
        link = self.runtime.link
        if not same_bridge(bridge_id, link.uid):
            _LOGGER.warning("The sync service is tied to bridge %s, which is not the bridge this entry is for", bridge_id)
        try:
            areas = await read(link.api, "clip/v2/resource/entertainment_configuration")
            music_areas = [area for area in areas if area.get("configuration_type") == MUSIC_AREA_TYPE]
            self.areas = {area["id"]: area["metadata"]["name"] for area in music_areas}
            self.area_lights = {area["id"]: area_light_ids(area) for area in music_areas}
        except (AttributeError, KeyError, TypeError, aiohttp.ClientError, TimeoutError) as err:
            _LOGGER.warning("The music areas of bridge %s could not be listed: %s: %s", bridge_id, type(err).__name__, err)
            return
        self.async_update_listeners()
