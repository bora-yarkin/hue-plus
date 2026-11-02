# SPDX-License-Identifier: GPL-3.0-or-later
"""What Spotify is playing, as the sync service sees it."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .entity import SyncEntity


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    async_add_entities([NowPlayingSensor(entry.runtime_data.sync)])


class NowPlayingSensor(SyncEntity, SensorEntity):
    _attr_translation_key = "now_playing"

    def __init__(self, coordinator) -> None:
        super().__init__(coordinator, "now_playing")

    @property
    def native_value(self) -> str | None:
        return self.coordinator.data.track

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.coordinator.data
        return {
            "artists": list(data.artists),
            "album": data.album,
            "album_art_url": data.album_art_url,
            "is_playing": data.is_playing,
            "playback_device": data.playback_device,
        }
