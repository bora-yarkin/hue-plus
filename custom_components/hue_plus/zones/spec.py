# SPDX-License-Identifier: GPL-3.0-or-later
"""The services of the zones module. No Home Assistant imports."""

from __future__ import annotations

from typing import Any

from ..fieldspec import f

LIGHT = f("text", "The gradient light: its Hue id, or the entity of its zones light.", True, example="light.bed_light_zones")

SPEC: dict[str, dict[str, Any]] = {
    "set_style": {
        "description": "Sets the style of a gradient light (the Hue app's Linear, Mirrored, Scattered and Segmented) and/or turns its zones around. The colours are kept as far as the new style has room for them.",
        "fields": {
            "light": LIGHT,
            "style": f("select", "The style.", options=["linear", "mirrored", "scattered", "segmented"]),
            "flip": f("bool", "Turn the zones around (the first zone becomes the last).", default=False),
        },
    },
    "set_effect": {
        "description": "Starts one of the lights' own effects with a colour and speed of your choice, as the Hue app does when you run the underwater effect in yellow.",
        "fields": {
            "lights": f("list", "The lights (Hue ids or light entities).", True),
            "effect": f("text", "The effect, for example candle, fireplace, prism, sparkle or no_effect.", True),
            "hs_color": f("object", "A colour as [hue, saturation]. Not together with kelvin.", example="[30, 80]"),
            "kelvin": f("number", "A white temperature in kelvin. Not together with hs_color."),
            "speed": f("number", "How fast the effect moves, from 0 to 1."),
        },
    },
    "set_gradient": {
        "description": "Writes the colour points of a gradient light. The points it had before are saved to a file in the configuration folder first, so the change can be put back.",
        "fields": {
            "light": LIGHT,
            "points": f(
                "xy", "The points as [x, y] colours, from the start of the light to its end.", True, example="[[0.7, 0.3], [0.2, 0.2]]"
            ),
            "mode": f("text", "The gradient mode, one of those the light offers."),
        },
    },
}
