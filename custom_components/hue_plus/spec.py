# SPDX-License-Identifier: GPL-3.0-or-later
"""Every service of every module in one place. No Home Assistant imports.

``services.yaml`` and the translations are generated from this (``scripts/generate_services.py``), and the Home Assistant
schemas are built from it, so they cannot disagree.
"""

from __future__ import annotations

from typing import Any

from .bridge import actions as bridge_actions
from .bridge import spec as bridge_spec
from .const import MODULE_BRIDGE, MODULE_SCENES, MODULE_STREAMING, MODULE_ZONES
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
    return problems


ACTIONS = bridge_actions.ACTIONS
