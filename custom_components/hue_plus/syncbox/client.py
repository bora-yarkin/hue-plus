# SPDX-License-Identifier: GPL-3.0-or-later
"""Client of the Hue Play HDMI Sync Box's local API (``https://<box>/api/v1``).

EXPERIMENTAL. Written from Signify's published description of the API for a device the author does not own, and tested only
against a fake box. If you own a sync box, please try it and fix what differs (the tests show what is assumed).

The box uses a certificate it made itself, so the connection is not verified (the same as the Hue bridge's). It is asked for
a registration once, while its button is held, and then answers to the access token it gave. This module imports nothing from
Home Assistant.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

import aiohttp

HOST = re.compile(r"[A-Za-z0-9]([A-Za-z0-9.-]{0,251}[A-Za-z0-9])?")
MODES = ("video", "game", "music", "passthrough", "powersave")
INTENSITIES = ("subtle", "moderate", "high", "intense")
MAX_BRIGHTNESS = 200
TIMEOUT_S = 10


class SyncBoxError(Exception):
    """The box refused a request, or could not be reached."""

    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


class SyncBoxRegistrationPending(SyncBoxError):
    """The box is not in registration mode: hold its button until the light turns green, then try again."""


def valid_host(host: str) -> bool:
    """A host name or IPv4 address, nothing that could change where the request goes (a path, a user name, a port)."""
    return HOST.fullmatch(host) is not None


class SyncBox:
    def __init__(self, session: aiohttp.ClientSession, host: str, token: str | None = None) -> None:
        if not valid_host(host):
            raise ValueError("The host is a name or an address")
        self._session = session
        self._base = f"https://{host}/api/v1"
        self._token = token

    async def _request(self, method: str, path: str, body: Any = None) -> Any:
        headers = {"Authorization": f"Bearer {self._token}"} if self._token else {}
        try:
            async with self._session.request(
                method, f"{self._base}{path}", json=body, headers=headers, ssl=False, timeout=aiohttp.ClientTimeout(total=TIMEOUT_S)
            ) as response:
                payload = await response.json(content_type=None) if response.content_length != 0 else {}
                if response.status == 401:
                    raise SyncBoxError("The box does not accept the access token", 401)
                if response.status >= 400:
                    message = payload.get("message") if isinstance(payload, dict) else None
                    raise SyncBoxError(message or f"The box answered {response.status}", response.status)
                return payload
        except (aiohttp.ClientError, TimeoutError) as err:
            raise SyncBoxError(f"The box could not be reached ({type(err).__name__})") from err

    async def register(self, app_name: str, instance_name: str) -> tuple[str, str]:
        """Asks for a registration. Returns (registration id, access token). Hold the box's button first."""
        try:
            answer = await self._request("POST", "/registrations", {"appName": app_name, "instanceName": instance_name})
        except SyncBoxError as err:
            if err.status == 400:
                raise SyncBoxRegistrationPending("Hold the button on the box until its light turns green, then try again", 400) from err
            raise
        self._token = answer["accessToken"]
        return answer["registrationId"], answer["accessToken"]

    async def device(self) -> dict[str, Any]:
        """What the box says about itself without an access token: its name, type and unique id."""
        answer = await self._request("GET", "/device")
        if not isinstance(answer, dict) or not answer.get("uniqueId"):
            raise SyncBoxError("The box sent no unique id")
        return answer

    async def unregister(self, registration_id: str) -> None:
        await self._request("DELETE", f"/registrations/{registration_id}")

    async def state(self) -> dict[str, Any]:
        """Everything the box reports: device, hue, execution, hdmi, behavior."""
        answer = await self._request("GET", "")
        if not isinstance(answer, dict) or "execution" not in answer:
            raise SyncBoxError("The box sent no execution state")
        return answer

    async def execute(self, **changes: Any) -> None:
        """Changes what the box does. Only what is given is changed."""
        if (mode := changes.get("mode")) is not None and mode not in MODES:
            raise ValueError(f"The mode is one of {', '.join(MODES)}")
        if (brightness := changes.get("brightness")) is not None and not 0 <= brightness <= MAX_BRIGHTNESS:
            raise ValueError(f"The brightness is from 0 to {MAX_BRIGHTNESS}")
        if not changes:
            raise ValueError("Nothing to change")
        await self._request("PUT", "/execution", changes)

    async def set_intensity(self, mode: str, intensity: str) -> None:
        """How strongly the lights follow the picture or the sound in a mode."""
        if mode not in ("video", "game", "music"):
            raise ValueError("Intensity is set for video, game or music")
        if intensity not in INTENSITIES:
            raise ValueError(f"The intensity is one of {', '.join(INTENSITIES)}")
        await self._request("PUT", "/execution", {mode: {"intensity": intensity}})

    async def set_hdmi_source(self, source: str) -> None:
        if source not in ("input1", "input2", "input3", "input4"):
            raise ValueError("The source is input1 to input4")
        await self._request("PUT", "/execution", {"hdmiSource": source})


def summary(state: Mapping[str, Any]) -> dict[str, Any]:
    """The few things a screen shows: whether it syncs, in what mode, the source, brightness and the inputs' names."""
    execution = state.get("execution") or {}
    hdmi = state.get("hdmi") or {}
    mode = execution.get("mode")
    return {
        "syncing": bool(execution.get("syncActive")),
        "hdmi_active": bool(execution.get("hdmiActive")),
        "mode": mode,
        "source": execution.get("hdmiSource"),
        "brightness": execution.get("brightness"),
        "intensity": (execution.get(mode) or {}).get("intensity") if mode in ("video", "game", "music") else None,
        "inputs": {key: value.get("name") for key, value in hdmi.items() if key.startswith("input") and isinstance(value, dict)},
    }
