# SPDX-License-Identifier: GPL-3.0-or-later
"""The event platform: each module adds its own."""

from __future__ import annotations

from .devices import event as devices_event
from .platform import forward

async_setup_entry = forward({"devices": devices_event})
