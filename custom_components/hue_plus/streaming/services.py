# SPDX-License-Identifier: GPL-3.0-or-later
"""The services of the streaming module."""

from __future__ import annotations

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from ..bridge.api import BridgeError
from ..const import MODULE_STREAMING
from ..services_base import entry_for, require_admin
from .manager import StreamingManager


def _manager(hass: HomeAssistant, call: ServiceCall) -> StreamingManager:
    manager = entry_for(hass, call, MODULE_STREAMING).runtime_data.streaming
    if manager is None:
        raise ServiceValidationError("Streaming has no registration with the bridge; add one in the integration's options")
    return manager


async def stream_colors(hass: HomeAssistant, call: ServiceCall) -> None:
    await require_admin(hass, call)
    colours = [tuple(c) for c in call.data["colors"]] if call.data["colors"] and isinstance(call.data["colors"][0], list | tuple) else None
    if colours is None:
        raise ServiceValidationError("colors is a list of [red, green, blue] colours")
    try:
        await _manager(hass, call).stream(call.data["area"], colours, call.data["duration"])
    except ValueError as err:
        raise ServiceValidationError(str(err)) from err
    except BridgeError as err:
        raise HomeAssistantError(str(err)) from err


async def stop_streaming(hass: HomeAssistant, call: ServiceCall) -> None:
    await require_admin(hass, call)
    await _manager(hass, call).stop(call.data.get("area") or None)


HANDLERS = {"stream_colors": stream_colors, "stop_streaming": stop_streaming}
