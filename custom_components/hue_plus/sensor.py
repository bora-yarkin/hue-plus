# SPDX-License-Identifier: GPL-3.0-or-later
"""The sensor platform: each module adds its own."""

from __future__ import annotations

from .bridge import sensor as bridge_sensor
from .devices import sensor as devices_sensor
from .platform import forward
from .scenes import sensor as scenes_sensor
from .sync import sensor as sync_sensor

async_setup_entry = forward({"bridge": bridge_sensor, "devices": devices_sensor, "scenes": scenes_sensor, "sync": sync_sensor})
