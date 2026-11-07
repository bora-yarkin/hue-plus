# SPDX-License-Identifier: GPL-3.0-or-later
"""Every service of every module in one place. No Home Assistant imports.

``services.yaml`` and the translations are generated from this (``scripts/generate_services.py``), and the Home Assistant
schemas are built from it, so they cannot disagree.
"""

from __future__ import annotations

from typing import Any

from .bridge import actions as bridge_actions
from .bridge import spec as bridge_spec
from .const import DOMAIN, MODULE_BRIDGE, MODULE_SCENES, MODULE_STREAMING, MODULE_ZONES, PLAY_EFFECTS
from .fieldspec import f
from .scenes import spec as scenes_spec
from .streaming import spec as streaming_spec
from .zones import spec as zones_spec

SPECS: dict[str, dict[str, dict[str, Any]]] = {
    MODULE_BRIDGE: bridge_spec.SPEC,
    MODULE_ZONES: zones_spec.SPEC,
    MODULE_SCENES: scenes_spec.SPEC,
    MODULE_STREAMING: streaming_spec.SPEC,
}

SPEC: dict[str, dict[str, Any]] = {name: service for spec in SPECS.values() for name, service in spec.items()}
MODULE_OF: dict[str, str] = {name: module for module, spec in SPECS.items() for name in spec}


# Actions on entities rather than on the bridge: a call carries a target, the scenes of Hue Plus, and the platform that owns the entities registers the
# action (devices/scene.py). They are described here so that services.yaml and the translations are written from one place with the others.
ENTITY_SERVICES: dict[str, dict[str, Any]] = {
    "activate_scene": {
        "description": "Starts a Hue scene with the options the scene's turn on action does not have: live (dynamic) at a speed, a brightness and a fade time. These are the options of the Hue integration's action of the same name.",
        "target": {"entity": {"integration": DOMAIN, "domain": "scene"}},
        "fields": {
            "dynamic": f("bool", "Play the scene live, its colours keep moving, instead of showing it as a still picture.", default=False),
            "speed": f("int", "How fast a live scene moves, from 0 to 100 percent.", min=0, max=100),
            "brightness": f("int", "The brightness the scene starts with, from 1 to 255.", min=1, max=255),
            "transition": f("number", "The fade time in seconds, from 0 to 3600."),
        },
    },
    "play_effect": {
        "description": "Plays one of a Hue light's own effects with a chosen colour, which the light's turn on action cannot (it clears the colour when it is given an effect). The dashboard plays live scenes through it. Experimental.",
        "target": {"entity": {"integration": DOMAIN, "domain": "light"}},
        "fields": {
            "effect": f("select", "The effect.", True, options=list(PLAY_EFFECTS)),
            "xy": f("xy_one", "The colour as [x, y], each from 0 to 1.", True, example="[0.35, 0.3]"),
            "brightness": f("int", "The brightness, from 1 to 255.", True, min=1, max=255),
            "speed": f("number", "How fast the effect runs, from 0 (slow) to 1 (fast).", True),
        },
    },
}


def fields_of(name: str) -> dict[str, dict[str, Any]]:
    """The fields of a service. Bridge actions that cannot be undone get a required ``confirm``."""
    if MODULE_OF[name] == MODULE_BRIDGE:
        return bridge_spec.fields_of(name)
    return dict(SPEC[name]["fields"])


def check_spec() -> list[str]:
    """Problems in the description: a name used twice, or a bridge service without an action."""
    problems = bridge_spec.check_spec()
    seen: set[str] = set()
    for spec in SPECS.values():
        for name in spec:
            if name in seen:
                problems.append(f"{name} is a service of two modules")
            seen.add(name)
    problems += [f"{name} is both an action on the bridge and on entities" for name in ENTITY_SERVICES if name in seen]
    return problems


ACTIONS = bridge_actions.ACTIONS
