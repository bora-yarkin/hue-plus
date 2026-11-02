# SPDX-License-Identifier: GPL-3.0-or-later
"""Starting a Hue effect with a colour of its own.

Home Assistant's light entity can start an effect by name only. The Hue bridge also
takes a colour (and a speed) for an effect, as the Hue app does when you run the
underwater effect in yellow. This writes that for the lights named, after checking
each light offers the effect.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from ..connection import api_of, bridge_of, hue_entries, read
from .colors import clamp_to_gamut, gamut_of, hs_to_xy


async def set_effect(
    hass: HomeAssistant,
    light_ids: list[str],
    effect: str,
    hs_color: list[float] | None,
    speed: float | None,
    kelvin: float | None = None,
) -> None:
    """Starts an effect on Hue lights, with a colour (hue, saturation) or a white (kelvin) and/or a speed (0 to 1)."""
    if hs_color is not None and kelvin is not None:
        raise ServiceValidationError("Give a colour or a white temperature, not both")
    wanted = set(light_ids)
    done: set[str] = set()
    for entry in hue_entries(hass):
        bridge = bridge_of(hass, entry)
        api = api_of(bridge) if bridge is not None else None
        if api is None:
            continue
        for light in await read(api, "clip/v2/resource/light"):
            if light.get("id") not in wanted:
                continue
            offered = ((light.get("effects_v2") or {}).get("action") or {}).get("effect_values") or []
            if effect not in offered:
                raise ServiceValidationError(f"{(light.get('metadata') or {}).get('name', light['id'])} does not offer the effect {effect}")
            action: dict[str, Any] = {"effect": effect}
            parameters: dict[str, Any] = {}
            if hs_color is not None:
                x, y = clamp_to_gamut(hs_to_xy(float(hs_color[0]), float(hs_color[1])), gamut_of(light))
                parameters["color"] = {"xy": {"x": round(x, 4), "y": round(y, 4)}}
            if kelvin is not None:
                schema = (light.get("color_temperature") or {}).get("mirek_schema") or {}
                low, high = schema.get("mirek_minimum", 153), schema.get("mirek_maximum", 500)
                mirek = max(low, min(high, round(1_000_000 / float(kelvin))))
                parameters["color_temperature"] = {"mirek": mirek}
            if speed is not None:
                parameters["speed"] = float(speed)
            if parameters and effect != "no_effect":
                action["parameters"] = parameters
            body: dict[str, Any] = {"effects_v2": {"action": action}}
            if effect != "no_effect":
                body["on"] = {"on": True}
            await api.request("put", f"clip/v2/resource/light/{light['id']}", json=body)
            done.add(light["id"])
    missing = wanted - done
    if missing:
        raise ServiceValidationError(f"No Hue light with id {', '.join(sorted(missing))}")
