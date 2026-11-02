# SPDX-License-Identifier: GPL-3.0-or-later
"""Access to the Hue integration's own connection to the bridge.

Nothing here opens a connection or stores a key: the core Hue integration already has an authenticated connection to each
bridge, and this module only finds it. Where that connection is kept differs between Home Assistant versions, so every
lookup is checked and reports what it did not find instead of raising.
"""

from __future__ import annotations

import json
from typing import Any

import aiohttp
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .bridge.api import BridgeError, Transport
from .const import HUE_DOMAIN


def hue_entries(hass: HomeAssistant) -> list[ConfigEntry]:
    """The configured Hue bridges."""
    return list(hass.config_entries.async_entries(HUE_DOMAIN))


def bridge_of(hass: HomeAssistant, entry: ConfigEntry) -> Any | None:
    """The Hue integration's bridge object for one config entry, if it is loaded."""
    bridge = getattr(entry, "runtime_data", None)
    if bridge is None:
        bridge = hass.data.get(HUE_DOMAIN, {}).get(entry.entry_id)
    return bridge


def api_of(bridge: Any) -> Any | None:
    """The bridge's API client (the object that makes requests to the bridge)."""
    return getattr(bridge, "api", None)


async def read(api: Any, path: str) -> Any:
    """A GET request to the bridge's v2 API. Returns the list under "data"."""
    result = await api.request("get", path)
    if isinstance(result, dict) and "data" in result:
        return result["data"]
    return result


def hue_transport(hue_entry: ConfigEntry) -> Transport:
    """Sends requests over the connection the Hue integration already has to the bridge (no second login).

    The Hue entry is looked at for every request, so a reload of the Hue integration is followed.
    """

    async def request(method: str, path: str, body: Any) -> tuple[int, Any]:
        try:
            create = hue_entry.runtime_data.api.create_request
        except AttributeError as err:
            raise BridgeError("The Hue integration is not loaded, or is not using the bridge's v2 API") from err
        try:
            async with create(method, path, json=body) as response:
                text = await response.text()
                return response.status, (json.loads(text) if text else {})
        except (aiohttp.ClientError, TimeoutError) as err:
            raise BridgeError(f"The bridge could not be reached ({type(err).__name__})") from err
        except ValueError as err:
            raise BridgeError("The bridge sent something that is not JSON") from err

    return request
