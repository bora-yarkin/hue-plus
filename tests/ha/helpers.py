# SPDX-License-Identifier: GPL-3.0-or-later
"""Small helpers shared by the Home Assistant layer tests."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from typing import Any

from homeassistant.core import HomeAssistant


async def call(hass: HomeAssistant, service: str, data: dict[str, Any] | None = None, *, context=None, response: bool = False) -> Any:
    """Calls a Hue Plus service and waits for it."""
    return await hass.services.async_call("hue_plus", service, data or {}, blocking=True, context=context, return_response=response)


async def wait_for(condition: Callable[[], bool], seconds: float = 3.0) -> None:
    """Lets background tasks run until ``condition`` holds."""
    for _ in range(int(seconds / 0.02)):
        if condition():
            return
        await asyncio.sleep(0.02)
    raise AssertionError("the condition did not hold in time")
