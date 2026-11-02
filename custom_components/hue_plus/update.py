# SPDX-License-Identifier: GPL-3.0-or-later
"""The update platform: each module adds its own."""

from __future__ import annotations

from .bridge import update as bridge_update
from .platform import forward

async_setup_entry = forward({"bridge": bridge_update})
