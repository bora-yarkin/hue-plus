# SPDX-License-Identifier: GPL-3.0-or-later
"""The scene platform: each module adds its own."""

from __future__ import annotations

from .devices import scene as devices_scene
from .platform import forward

async_setup_entry = forward({"devices": devices_scene})
