# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus's own registration with the bridge, for local streaming.

Streaming needs a key that only a new registration can create (``generateclientkey``), so it cannot reuse the Hue integration's
connection. The link button on the bridge must be pressed first. The result is three secrets, kept in the config entry and never
logged: the app key, the client key (the pre-shared key of the DTLS connection) and the application id (its identity).
This module imports nothing from Home Assistant.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import aiohttp

from ..bridge.api import BridgeError

DEVICE_TYPE = "hue_plus#home_assistant"
LINK_BUTTON_NOT_PRESSED = 101
TIMEOUT = aiohttp.ClientTimeout(total=10)


class LinkButtonNotPressed(BridgeError):
    """Press the round button on the bridge, then try again."""


@dataclass(frozen=True)
class Registration:
    app_key: str
    client_key: str
    application_id: str

    def __repr__(self) -> str:
        return "Registration(<redacted>)"


async def register(session: aiohttp.ClientSession, host: str) -> Registration:
    try:
        async with session.post(
            f"https://{host}/api", json={"devicetype": DEVICE_TYPE, "generateclientkey": True}, ssl=False, timeout=TIMEOUT
        ) as response:
            answer: Any = await response.json(content_type=None)
        item = answer[0] if isinstance(answer, list) and answer and isinstance(answer[0], dict) else {}
        if "error" in item:
            if (item["error"] or {}).get("type") == LINK_BUTTON_NOT_PRESSED:
                raise LinkButtonNotPressed("Press the link button on the bridge, then try again")
            raise BridgeError("The bridge refused the registration")
        success = item.get("success") or {}
        app_key, client_key = success.get("username"), success.get("clientkey")
        if not (isinstance(app_key, str) and isinstance(client_key, str) and app_key and client_key):
            raise BridgeError("The bridge sent no client key")
        async with session.get(f"https://{host}/auth/v1", headers={"hue-application-key": app_key}, ssl=False, timeout=TIMEOUT) as response:
            application_id = response.headers.get("hue-application-id")
        if not application_id:
            raise BridgeError("The bridge sent no application id")
    except (aiohttp.ClientError, TimeoutError, ValueError) as err:
        raise BridgeError(f"The bridge could not be reached ({type(err).__name__})") from err
    return Registration(app_key, client_key, application_id)


def transport(session: aiohttp.ClientSession, host: str, app_key: str):
    """A ``bridge.api`` transport that sends requests with Hue Plus's own key."""

    async def request(method: str, path: str, body: Any) -> tuple[int, Any]:
        try:
            async with session.request(
                method, f"https://{host}/{path}", json=body, headers={"hue-application-key": app_key}, ssl=False, timeout=TIMEOUT
            ) as response:
                text = await response.text()
                return response.status, (json.loads(text) if text else {})
        except (aiohttp.ClientError, TimeoutError) as err:
            raise BridgeError(f"The bridge could not be reached ({type(err).__name__})") from err
        except ValueError as err:
            raise BridgeError("The bridge sent something that is not JSON") from err

    return request
