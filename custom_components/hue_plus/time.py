# SPDX-License-Identifier: GPL-3.0-or-later
"""The time platform: each module adds its own."""

from __future__ import annotations

from .bridge import time as bridge_time
from .platform import forward

async_setup_entry = forward({"bridge": bridge_time})
