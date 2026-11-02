# SPDX-License-Identifier: GPL-3.0-or-later
"""The services of the streaming module. No Home Assistant imports."""

from __future__ import annotations

from typing import Any

from ..fieldspec import f

AREA = f("text", "The entertainment area (id or name).", True, example="TV")

SPEC: dict[str, dict[str, Any]] = {
    "stream_colors": {
        "description": "Experimental. Streams colours straight to the lights of an entertainment area (no scene, no delay), for a number of seconds. Needs the streaming module and a registration with the bridge. The area cannot be used by another sync at the same time.",
        "fields": {
            "area": AREA,
            "colors": f(
                "object",
                "One [red, green, blue] colour for every light of the area, or one per light in the order of the area's channels.",
                True,
                example="[[255, 0, 0], [0, 0, 255]]",
            ),
            "duration": f("number", "How long, in seconds (up to 3600).", default=10),
        },
    },
    "stop_streaming": {
        "description": "Experimental. Stops the stream to an entertainment area, or to all of them.",
        "fields": {"area": f("text", "The entertainment area (id or name). All when empty.")},
    },
}
