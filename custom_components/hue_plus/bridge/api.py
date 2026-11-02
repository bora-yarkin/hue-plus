# SPDX-License-Identifier: GPL-3.0-or-later
"""The bridge's two APIs, v2 (``clip/v2/resource``) and v1 (``api/<key>/...``), as plain async calls.

This module imports nothing from Home Assistant. The transport that sends a request is given to it: in Home Assistant it is the
connection of the Hue integration (so there is no second login), in the tests a fake bridge. The app key is only ever put in the
URL of a v1 request, and never in an error message or a log.
"""

from __future__ import annotations

import hashlib
from collections.abc import Awaitable, Callable
from typing import Any

# (method, path, json body or None) -> (HTTP status, parsed JSON body)
Transport = Callable[[str, str, Any], Awaitable[tuple[int, Any]]]


class BridgeError(Exception):
    """The bridge refused a request, or could not be asked."""

    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


def app_id(app_key: str) -> str:
    """A short public name for an authorized app. The key itself is a password and is never shown or logged."""
    return hashlib.sha256(app_key.encode()).hexdigest()[:12]


def _v2_errors(payload: Any) -> str:
    errors = payload.get("errors") if isinstance(payload, dict) else None
    return "; ".join(str(e.get("description", e)) for e in errors) if errors else ""


def _v1_errors(payload: Any) -> str:
    """v1 answers a failed write with a list holding ``{"error": {"description": ...}}`` items."""
    if not isinstance(payload, list):
        return ""
    return "; ".join(str(item["error"].get("description", item["error"])) for item in payload if isinstance(item, dict) and "error" in item)


class BridgeApi:
    def __init__(self, transport: Transport, app_key: Callable[[], str]) -> None:
        self._transport = transport
        self._app_key = app_key

    # ---- v2 ----

    async def _v2(self, method: str, path: str, body: Any = None) -> list[dict[str, Any]]:
        status, payload = await self._transport(method, f"clip/v2/resource/{path}", body)
        problem = _v2_errors(payload)
        if status >= 400 or problem:
            raise BridgeError(problem or f"The bridge answered {status}", status)
        data = payload.get("data") if isinstance(payload, dict) else None
        return data if isinstance(data, list) else []

    async def list(self, resource: str) -> list[dict[str, Any]]:
        return await self._v2("GET", resource)

    async def get(self, resource: str, rid: str) -> dict[str, Any]:
        data = await self._v2("GET", f"{resource}/{rid}")
        if not data:
            raise BridgeError(f"No {resource} {rid}", 404)
        return data[0]

    async def put(self, resource: str, rid: str, body: dict[str, Any]) -> None:
        await self._v2("PUT", f"{resource}/{rid}", body)

    async def post(self, resource: str, body: dict[str, Any]) -> str:
        """Creates a resource and returns its id."""
        data = await self._v2("POST", resource, body)
        if not data or "rid" not in data[0]:
            raise BridgeError("The bridge did not say what it created")
        return data[0]["rid"]

    async def delete(self, resource: str, rid: str) -> None:
        await self._v2("DELETE", f"{resource}/{rid}")

    async def request(self, method: str, resource_path: str, body: Any = None) -> list[dict[str, Any]]:
        """Any v2 request, for what has no method of its own. ``resource_path`` is like ``light`` or ``light/<id>``."""
        return await self._v2(method, resource_path, body)

    # ---- v1 ----

    def is_own_key(self, key: str) -> bool:
        """Whether ``key`` is the one this API talks to the bridge with."""
        return key == self._app_key()

    async def _v1(self, method: str, path: str, body: Any = None) -> Any:
        status, payload = await self._transport(method, f"api/{self._app_key()}/{path}", body)
        problem = _v1_errors(payload)
        if status >= 400 or problem:
            raise BridgeError(problem or f"The bridge answered {status}", status)
        return payload

    async def config(self) -> dict[str, Any]:
        payload = await self._v1("GET", "config")
        if not isinstance(payload, dict):
            raise BridgeError("The bridge sent no configuration")
        return payload

    async def put_config(self, body: dict[str, Any]) -> None:
        await self._v1("PUT", "config", body)

    async def revoke_app(self, key: str) -> None:
        await self._v1("DELETE", f"config/whitelist/{key}")
