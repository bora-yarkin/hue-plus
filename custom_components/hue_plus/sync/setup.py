# SPDX-License-Identifier: GPL-3.0-or-later
"""Brings the sync module up: the connection to Hue's sync service, kept open while the entry is loaded."""

from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError

from ..const import CONF_AUTH, CONF_OAUTH_TOKEN, CONF_UUID, SYNC_URL
from ..runtime import HuePlusConfigEntry
from .coordinator import SyncCoordinator
from .oauth import SyncOAuth, sync_session

_LOGGER = logging.getLogger(__name__)


def create(hass: HomeAssistant, entry: HuePlusConfigEntry) -> SyncCoordinator:
    """The coordinator for the stored credentials. Nothing connects until ``start``."""
    oauth = SyncOAuth(hass, entry) if entry.data.get(CONF_OAUTH_TOKEN) else None
    if not (entry.data.get(CONF_UUID) and (oauth or entry.data.get(CONF_AUTH))):
        raise ConfigEntryError("The Spotify sync is switched on but has no credentials; add them in the options")
    return SyncCoordinator(
        hass, entry, entry.runtime_data, sync_session(hass), SYNC_URL, entry.data.get(CONF_AUTH, ""), entry.data[CONF_UUID], oauth
    )


def start(hass: HomeAssistant, entry: HuePlusConfigEntry, coordinator: SyncCoordinator) -> None:
    """Opens the connection. Entities start unavailable and come up when it does; the task ends when the entry unloads."""
    entry.async_create_background_task(hass, coordinator.client.run(), "hue_plus sync connection")
