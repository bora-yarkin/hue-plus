# SPDX-License-Identifier: GPL-3.0-or-later
"""Finding the connection to a bridge: the Hue integration's (which Hue Plus only finds, never opens or stores a key for) or Hue Plus's own.

Every lookup is checked and reports what it did not find instead of raising.
"""

from __future__ import annotations

import json
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant

from .bridge.api import BridgeError, Transport
from .const import DOMAIN, HUE_DOMAIN
from .link import BridgeLink
from .runtime import Runtime


def bridge_apis(hass: HomeAssistant) -> list[Any]:
    """The aiohue client of every bridge that is up: the Hue integration's, and those Hue Plus connects to itself."""
    apis = []
    for entry in hass.config_entries.async_entries(HUE_DOMAIN):
        api = getattr(getattr(entry, "runtime_data", None), "api", None)
        if api is not None:
            apis.append(api)
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        runtime = entry.runtime_data
        if isinstance(runtime, Runtime) and runtime.link.hue_entry is None:
            apis.append(runtime.link.api)
    return apis


def api_or_none(link: BridgeLink) -> Any | None:
    """The link's API client, or None while the connection is not up."""
    try:
        return link.api
    except BridgeError:
        return None


async def read(api: Any, path: str) -> Any:
    """A GET request to the bridge's v2 API. Returns the list under "data"."""
    result = await api.request("get", path)
    if isinstance(result, dict) and "data" in result:
        return result["data"]
    return result


def link_transport(link: BridgeLink) -> Transport:
    """Sends requests over the link's connection (the Hue integration's, or Hue Plus's own); no second login.

    The link is asked for every request, so a reload of the connection is followed.
    """

    async def request(method: str, path: str, body: Any) -> tuple[int, Any]:
        create = link.api.create_request
        try:
            async with create(method, path, json=body) as response:
                text = await response.text()
                return response.status, (json.loads(text) if text else {})
        except (aiohttp.ClientError, TimeoutError) as err:
            raise BridgeError(f"The bridge could not be reached ({type(err).__name__})") from err
        except ValueError as err:
            raise BridgeError("The bridge sent something that is not JSON") from err

    return request
