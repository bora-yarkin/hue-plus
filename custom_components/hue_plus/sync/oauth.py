# SPDX-License-Identifier: GPL-3.0-or-later
"""Keep each bridge's developer OAuth session current."""

from __future__ import annotations

import time

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_CLOSE
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import (
    ImplementationUnavailableError,
    OAuth2TokenRequestReauthError,
    UnknownImplementationError,
)
from homeassistant.helpers.aiohttp_client import async_create_clientsession
from homeassistant.helpers.config_entry_oauth2_flow import async_get_config_entry_implementation
from homeassistant.util.hass_dict import HassKey

from ..const import CONF_OAUTH_TOKEN
from .client import GenesisRejected, GenesisUnavailable

RENEW_EARLY_S = 30
DATA_SYNC_SESSION: HassKey[aiohttp.ClientSession] = HassKey("hue_plus_sync_session")


async def _reject_redirect(session, context, event) -> None:
    raise aiohttp.ClientError("Hue Sync attempted to redirect")


@callback
def sync_session(hass: HomeAssistant) -> aiohttp.ClientSession:
    """Share one HA-managed session that keeps Sync auth headers on their original host."""
    if DATA_SYNC_SESSION not in hass.data:
        trace = aiohttp.TraceConfig()
        trace.on_request_redirect.append(_reject_redirect)
        session = async_create_clientsession(hass, auto_cleanup=False, trace_configs=[trace])

        @callback
        def close_session(event) -> None:
            session.detach()

        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_CLOSE, close_session)
        hass.data[DATA_SYNC_SESSION] = session
    return hass.data[DATA_SYNC_SESSION]


class SyncOAuth:
    """One consumer renews and saves the token before using it for a new connection."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self._refresh_update = None

    async def access(self) -> tuple[str, float]:
        data = self.entry.data
        token = data[CONF_OAUTH_TOKEN]
        if self._renew_at(token) <= time.time():
            try:
                implementation = await async_get_config_entry_implementation(self.hass, self.entry)
                token = await implementation.async_refresh_token(token)
            except UnknownImplementationError, OAuth2TokenRequestReauthError:
                raise GenesisRejected("Hue developer sign-in needs to be renewed") from None
            except ImplementationUnavailableError, aiohttp.ClientError, TimeoutError:
                raise GenesisUnavailable("Could not refresh the Hue developer token") from None
            if self.entry.data is not data:
                raise GenesisUnavailable("Hue Sync configuration changed during renewal")
            updated = {**data, CONF_OAUTH_TOKEN: token}
            self._refresh_update = (updated, self.entry.options, self.entry.title)
            if not self.hass.config_entries.async_update_entry(self.entry, data=updated):
                self._refresh_update = None
        return token["access_token"], self._renew_at(token)

    @staticmethod
    def _renew_at(token: dict) -> float:
        return token["expires_at"] - min(RENEW_EARLY_S, token["expires_in"] / 2)

    @callback
    def consume_refresh_update(self) -> bool:
        """Suppress bridge reload for this runtime's own token write only."""
        update = self._refresh_update
        self._refresh_update = None
        return update is not None and self.entry.data == update[0] and self.entry.options is update[1] and self.entry.title == update[2]
