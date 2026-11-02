# SPDX-License-Identifier: GPL-3.0-or-later
"""The services of the zones module."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from ..const import DOMAIN, HUE_DOMAIN, MODULE_ZONES
from . import effect, gradient
from .manager import MODES, GradientLight
from .spec import SPEC

RESPONDING = {"set_gradient"}


def bridge_light_id(hass: HomeAssistant, value: str) -> str:
    """The bridge's id of a light, given that id, a Hue light entity, or the entity of a Hue Plus zones light."""
    if "." not in value:
        return value
    entry = er.async_get(hass).async_get(value)
    if entry is None or not entry.unique_id:
        raise ServiceValidationError(f"{value} is not a Hue light")
    if entry.platform == HUE_DOMAIN:
        return entry.unique_id
    if entry.platform == DOMAIN:
        return entry.unique_id.removesuffix("_group").split("_zone_")[0]
    raise ServiceValidationError(f"{value} is not a Hue light")


def manager_of(hass: HomeAssistant, light: str) -> GradientLight:
    light_id = bridge_light_id(hass, light)
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        runtime = entry.runtime_data
        if MODULE_ZONES in runtime.modules and light_id in runtime.zones:
            return runtime.zones[light_id]
    raise ServiceValidationError(f"No gradient light with id {light_id}")


async def set_style(hass: HomeAssistant, call: ServiceCall) -> None:
    style, flip = call.data.get("style"), call.data["flip"]
    if style is None and not flip:
        raise ServiceValidationError("Give a style, or flip")
    await manager_of(hass, call.data["light"]).async_set_layout(mode=MODES[style] if style else None, flip=flip)


async def set_effect(hass: HomeAssistant, call: ServiceCall) -> None:
    await effect.set_effect(
        hass,
        [bridge_light_id(hass, v) for v in call.data["lights"]],
        call.data["effect"],
        call.data.get("hs_color"),
        call.data.get("speed"),
        call.data.get("kelvin"),
    )


async def set_gradient(hass: HomeAssistant, call: ServiceCall) -> dict[str, Any]:
    return await gradient.set_points(hass, bridge_light_id(hass, call.data["light"]), call.data["points"], call.data.get("mode"))


HANDLERS = {"set_style": set_style, "set_effect": set_effect, "set_gradient": set_gradient}
assert set(HANDLERS) == set(SPEC)
