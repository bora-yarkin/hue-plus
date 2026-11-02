# SPDX-License-Identifier: GPL-3.0-or-later
"""Writing the colour points of a Hue gradient light.

Only the gradient of one light is written, and only after checking the request
against what the bridge itself reports for that light. The points it had before
are saved to a file in the Home Assistant configuration folder first, so a
change can always be put back.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from ..connection import api_of, bridge_of, hue_entries, read


def _save_backup(path: str, data: dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def _checked_points(points: list[list[float]], capable: int) -> list[dict[str, Any]]:
    """The points in the bridge's format, after checking count and range."""
    if not 1 <= len(points) <= capable:
        raise ServiceValidationError(f"This light takes 1 to {capable} points, got {len(points)}")
    out = []
    for point in points:
        if len(point) != 2 or not all(0.0 <= float(v) <= 1.0 for v in point):
            raise ServiceValidationError(f"A point must be [x, y] between 0 and 1: {point}")
        out.append({"color": {"xy": {"x": float(point[0]), "y": float(point[1])}}})
    return out


async def set_points(
    hass: HomeAssistant,
    light_id: str,
    points: list[list[float]],
    mode: str | None,
) -> dict[str, Any]:
    """Writes the gradient points of one light. Returns what was there before and after."""
    for entry in hue_entries(hass):
        bridge = bridge_of(hass, entry)
        api = api_of(bridge) if bridge is not None else None
        if api is None:
            continue
        lights = await read(api, "clip/v2/resource/light")
        light = next((item for item in lights if item.get("id") == light_id and "gradient" in item), None)
        if light is None:
            continue
        gradient = light["gradient"]
        if mode is not None and mode not in gradient.get("mode_values", []):
            raise ServiceValidationError(f"Mode {mode} is not offered by this light")
        body = {
            "gradient": {
                "points": _checked_points(points, int(gradient.get("points_capable", 0))),
                "mode": mode or gradient.get("mode"),
            }
        }
        before = {"points": gradient.get("points"), "mode": gradient.get("mode")}
        stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        backup = hass.config.path(f"hue_plus_gradient_backup_{stamp}.json")
        await hass.async_add_executor_job(_save_backup, backup, {"light_id": light_id, "before": before})
        answer = await api.request("put", f"clip/v2/resource/light/{light_id}", json=body)
        after_list = await read(api, f"clip/v2/resource/light/{light_id}")
        after = after_list[0]["gradient"] if after_list else None
        return {
            "backup_file": backup,
            "before": before,
            "sent": body["gradient"],
            "bridge_answer": answer,
            "after": after,
        }
    raise ServiceValidationError(f"No gradient light with id {light_id} on any bridge")
