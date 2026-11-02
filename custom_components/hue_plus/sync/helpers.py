# SPDX-License-Identifier: GPL-3.0-or-later
"""Small pure functions, kept free of Home Assistant imports so they can be tested on their own."""

from __future__ import annotations


def same_bridge(bridge_id: str, hue_unique_id: str | None) -> bool:
    """The sync service names the bridge by its 16-character id (c42996fffec4a182); the Hue integration uses the
    12-character form (c42996c4a182), which is the same id without the "fffe" in the middle."""
    bridge_id = bridge_id.lower()
    short = bridge_id[:6] + bridge_id[10:] if len(bridge_id) == 16 and bridge_id[6:10] == "fffe" else bridge_id
    return hue_unique_id is not None and hue_unique_id.lower() in (bridge_id, short)


def area_light_ids(area: dict) -> list[str]:
    """The Hue light ids of an entertainment area, in the order the bridge lists them."""
    return [
        service["rid"]
        for service in area.get("light_services") or []
        if isinstance(service, dict) and service.get("rtype") == "light" and isinstance(service.get("rid"), str)
    ]


def area_options(areas: dict[str, str]) -> dict[str, str]:
    """Option text -> area id. Two areas with the same name get a short id behind the name so each option is unique."""
    names = list(areas.values())
    return {(name if names.count(name) == 1 else f"{name} ({area_id[:4]})"): area_id for area_id, name in areas.items()}
