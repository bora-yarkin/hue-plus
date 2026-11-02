# SPDX-License-Identifier: GPL-3.0-or-later
"""The binary sensor platform: each module adds its own."""

from __future__ import annotations

from .bridge import binary_sensor as bridge_binary_sensor
from .devices import binary_sensor as devices_binary_sensor
from .platform import forward
from .syncbox import binary_sensor as syncbox_binary_sensor

async_setup_entry = forward({"bridge": bridge_binary_sensor, "devices": devices_binary_sensor, "syncbox": syncbox_binary_sensor})
