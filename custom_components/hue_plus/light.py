# SPDX-License-Identifier: GPL-3.0-or-later
"""The light platform: each module adds its own."""

from __future__ import annotations

from .lights import light as lights_light
from .platform import forward
from .zones import light as zones_light

# The zones come first: the lights read the gradient lights' managers the zones module makes.
async_setup_entry = forward({"zones": zones_light, "lights": lights_light})
