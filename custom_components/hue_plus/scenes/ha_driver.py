# SPDX-License-Identifier: GPL-3.0-or-later
"""The engine's view of Home Assistant: light states, and `light.turn_on` / `light.turn_off` calls."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .const import NATIVE_EFFECTS
from .driver import LightInfo

# Plays a light's own effect with a colour: (entity id, the command the engine built).
NativeWriter = Callable[[str, dict[str, Any]], Awaitable[None]]

_COLOUR_MODES = {"xy", "hs", "rgb", "rgbw", "rgbww"}
_TRANSITION_FEATURE = 32  # LightEntityFeature.TRANSITION


class HassDriver:
    def __init__(self, hass: HomeAssistant, native: NativeWriter | None = None) -> None:
        self._hass = hass
        self._native = native

    def info(self, entity_id: str) -> LightInfo | None:
        state = self._hass.states.get(entity_id)
        if state is None:
            return None
        status = state.state if state.state in ("on", "off") else "unavailable"
        attrs = state.attributes
        modes = set(attrs.get("supported_color_modes") or [])
        xy = attrs.get("xy_color")
        entry = er.async_get(self._hass).async_get(entity_id)
        group = "default"
        if entry is not None:
            group = f"{entry.platform}:{entry.config_entry_id or ''}"
            if entry.platform == "hue_plus":
                group = "hue:plus"  # its writes go through a Hue bridge
        return LightInfo(
            state=status,
            brightness=attrs.get("brightness"),
            xy=(float(xy[0]), float(xy[1])) if xy else None,
            kelvin=attrs.get("color_temp_kelvin"),
            can_colour=bool(modes & _COLOUR_MODES),
            can_white="color_temp" in modes,
            can_transition=bool((attrs.get("supported_features") or 0) & _TRANSITION_FEATURE),
            group=group,
            mode=attrs.get("color_mode"),
            effects=tuple(e for e in (attrs.get("effect_list") or ()) if e in NATIVE_EFFECTS) if self._native else (),
        )

    async def turn_on(self, entity_id: str, data: dict[str, Any]) -> None:
        if "native_effect" in data and self._native is not None:
            await self._native(entity_id, data)
            return
        await self._hass.services.async_call("light", "turn_on", {"entity_id": entity_id, **data}, blocking=False)

    async def turn_off(self, entity_id: str) -> None:
        await self._hass.services.async_call("light", "turn_off", {"entity_id": entity_id}, blocking=False)
