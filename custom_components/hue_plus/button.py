# SPDX-License-Identifier: GPL-3.0-or-later
"""The button platform: each module adds its own."""

from __future__ import annotations

from .bridge import button as bridge_button
from .platform import forward

async_setup_entry = forward({"bridge": bridge_button})
