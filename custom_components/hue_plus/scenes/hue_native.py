# SPDX-License-Identifier: GPL-3.0-or-later
"""A Hue light's own effect (candle, underwater, ...) played with a chosen colour.

Home Assistant's ``light.turn_on`` clears the colour when it is given an effect, so a colour cannot go with one. The bridge can
take both (``effects_v2``), so this writes to the bridge through the Hue integration's connection, as the rest of Hue Plus does.

EXPERIMENTAL: written from aiohue's models, never tried on a real light. Whether a new colour restarts the effect's animation
is not known.
"""

from __future__ import annotations

import logging
from typing import Any

from aiohue.v2.models.feature import EffectStatus
from homeassistant.core import HomeAssistant

from ..runtime import HuePlusConfigEntry

_LOGGER = logging.getLogger(__name__)


def native_writer(hass: HomeAssistant, entry: HuePlusConfigEntry):
    async def write(entity_id: str, data: dict[str, Any]) -> None:
        state = hass.states.get(entity_id)
        light_id = state.attributes.get("hue_light_id") if state else None
        spec = data["native_effect"]
        if not light_id:
            # Not one of Hue Plus's own lights: no bridge id to write to, so play the colour without the effect.
            await hass.services.async_call(
                "light", "turn_on", {"entity_id": entity_id, "brightness": data["brightness"], "xy_color": spec["xy"]}, blocking=False
            )
            return
        api = entry.runtime_data.hue_entry.runtime_data.api
        await api.lights.set_state(
            light_id,
            on=True,
            brightness=round(data["brightness"] / 255 * 100, 1),
            color_xy=(spec["xy"][0], spec["xy"][1]),
            effect=EffectStatus(spec["effect"]),
            effect_speed=spec["speed"],
        )

    return write
