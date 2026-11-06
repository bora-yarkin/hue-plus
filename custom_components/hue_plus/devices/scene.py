# SPDX-License-Identifier: GPL-3.0-or-later
"""The Hue integration's scene entities, on Hue Plus's devices."""

from __future__ import annotations

from typing import Any

from homeassistant.components.scene import DOMAIN as SCENE_DOMAIN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.service import async_register_platform_entity_service

from ..const import DOMAIN
from ..runtime import HuePlusConfigEntry
from .core import run_platform

SERVICE_ACTIVATE_SCENE = "activate_scene"


def _number(kind: type, low: float, high: float):
    """A validator for a whole number or a decimal in a range. It raises ValueError, which Home Assistant's schemas turn into a refused value."""

    def check(value: Any):
        try:
            number = kind(value)
        except (TypeError, ValueError) as err:
            raise ValueError("not a number") from err
        if not low <= number <= high:
            raise ValueError(f"must be from {low} to {high}")
        return number

    return check


# The options of the Hue integration's own action of that name, which the dashboard uses to start a scene live.
ACTIVATE_SCENE_SCHEMA = {
    "dynamic": cv.boolean,
    "speed": _number(int, 0, 100),
    "transition": _number(float, 0, 3600),
    "brightness": _number(int, 1, 255),
}


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    await run_platform(hass, entry, "scene", async_add_entities)
    # Hue Plus's scene entities are the Hue integration's, run again. Home Assistant 2026.11 moved the Hue integration's ``activate_scene``
    # action out of its scene platform and into the integration, for the entities of the ``hue`` platform only, so Hue Plus's scenes no
    # longer got ``hue_plus.activate_scene``. Older versions still register it from the platform, which has just run: then there is nothing to add.
    if not hass.services.has_service(DOMAIN, SERVICE_ACTIVATE_SCENE):
        async_register_platform_entity_service(
            hass,
            DOMAIN,
            SERVICE_ACTIVATE_SCENE,
            entity_domain=SCENE_DOMAIN,
            func="_async_activate",
            schema=ACTIVATE_SCENE_SCHEMA,
        )
