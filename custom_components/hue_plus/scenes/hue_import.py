# SPDX-License-Identifier: GPL-3.0-or-later
"""Reads a Hue scene from the bridge, through the connection the core Hue integration already has.

Used to import a Hue live scene: its palette, speed and lights. Reading only; nothing is
written to the bridge.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

HUE_DOMAIN = "hue"
HUE_PLUS_DOMAIN = "hue_plus"


def _api_for(hass: HomeAssistant, config_entry_id: str | None) -> Any:
    entry = hass.config_entries.async_get_entry(config_entry_id) if config_entry_id else None
    bridge = getattr(entry, "runtime_data", None) if entry is not None else None
    api = getattr(bridge, "api", None)
    if api is None:
        raise ServiceValidationError("The Hue integration is not ready")
    return api


async def _read(api: Any, path: str) -> list[dict[str, Any]]:
    result = await api.request("get", path)
    data = result.get("data") if isinstance(result, dict) else result
    return data if isinstance(data, list) else []


def _light_entity(hass: HomeAssistant, light_id: str) -> str | None:
    """The Home Assistant light of a bridge light: the Hue entity, or a light that stands in for it."""
    registry = er.async_get(hass)
    for entry in registry.entities.values():
        if entry.platform == HUE_DOMAIN and entry.domain == "light" and entry.unique_id == light_id:
            replacement = _replacement(hass, light_id)
            return replacement or entry.entity_id
    return _replacement(hass, light_id)


def _replacement(hass: HomeAssistant, light_id: str) -> str | None:
    """A light that replaces a Hue light on the dashboard (it says so in its `hue_light_id` attribute)."""
    for state in hass.states.async_all("light"):
        if state.attributes.get("hue_light_id") == light_id:
            return state.entity_id
    return None


def _palette(scene: dict[str, Any]) -> tuple[list[dict[str, Any]], bool]:
    """The palette colours of a scene: [{"xy": [x, y], "b": percent}], or kelvin for a scene that has only whites. The flag is True for a live (dynamic) palette.

    The bridge adds a white (colour temperature) entry to the palette of a colour scene; it is not part of the scene's colours, so it is left out whenever the scene has any colour."""
    palette = scene.get("palette") or {}
    out: list[dict[str, Any]] = []
    for item in palette.get("color") or []:
        xy = ((item.get("color") or {}).get("xy")) or {}
        if "x" in xy and "y" in xy:
            out.append(
                {
                    "xy": [round(xy["x"], 4), round(xy["y"], 4)],
                    "b": float((item.get("dimming") or {}).get("brightness", 100)),
                }
            )
    for item in [] if out else palette.get("color_temperature") or []:
        mirek = (item.get("color_temperature") or {}).get("mirek")
        if mirek:
            out.append(
                {
                    "k": round(1_000_000 / mirek),
                    "b": float((item.get("dimming") or {}).get("brightness", 100)),
                }
            )
    if out:
        return out, True
    for action in scene.get("actions") or []:
        body = action.get("action") or {}
        xy = ((body.get("color") or {}).get("xy")) or {}
        bri = float((body.get("dimming") or {}).get("brightness", 100))
        if "x" in xy:
            colour = {"xy": [round(xy["x"], 4), round(xy["y"], 4)], "b": bri}
            if colour not in out:
                out.append(colour)
    return out, False


def _hue_scene_entry(hass: HomeAssistant, entity_id: str) -> er.RegistryEntry:
    """The registry entry of the Hue integration's scene behind `entity_id`.

    Hue Plus runs the Hue integration's scenes again as its own entities, with the same unique id, and the dashboard lists those; the connection to the bridge belongs to
    the Hue integration's entity of that scene."""
    registry = er.async_get(hass)
    entry = registry.async_get(entity_id)
    if entry is not None and entry.domain == "scene" and entry.platform == HUE_PLUS_DOMAIN:
        entry = next(
            (e for e in registry.entities.values() if e.platform == HUE_DOMAIN and e.domain == "scene" and e.unique_id == entry.unique_id),
            None,
        )
    if entry is None or entry.platform != HUE_DOMAIN or entry.domain != "scene":
        raise ServiceValidationError(f"{entity_id} is not a Hue scene")
    return entry


async def read_scene(hass: HomeAssistant, entity_id: str) -> dict[str, Any]:
    """The palette, speed and lights of the Hue scene behind a Home Assistant scene entity."""
    entry = _hue_scene_entry(hass, entity_id)
    api = _api_for(hass, entry.config_entry_id)
    found = await _read(api, f"clip/v2/resource/scene/{entry.unique_id}")
    if not found:
        raise ServiceValidationError("The bridge does not know this scene")
    scene = found[0]
    colours, live = _palette(scene)
    if not colours:
        raise ServiceValidationError("This scene has no colours to import")
    peak = max(c["b"] for c in colours) or 100.0
    lights: list[str] = []
    for action in scene.get("actions") or []:
        target = action.get("target") or {}
        if target.get("rtype") != "light":
            continue
        light = _light_entity(hass, target.get("rid", ""))
        if light and light not in lights:
            lights.append(light)
    speed = scene.get("speed")
    return {
        "name": (scene.get("metadata") or {}).get("name", ""),
        "live": live,
        "speed": round(speed, 4) if isinstance(speed, (int, float)) else None,
        "brightness": max(1, min(255, round(peak * 2.55))),
        "palette": [{**c, "b": round(c["b"] / peak * 100, 1)} for c in colours],
        "lights": lights,
    }
