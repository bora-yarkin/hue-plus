# SPDX-License-Identifier: GPL-3.0-or-later
"""The switch platform: each module adds its own."""

from __future__ import annotations

from .bridge import switch as bridge_switch
from .devices import switch as devices_switch
from .platform import forward
from .sync import switch as sync_switch
from .syncbox import switch as syncbox_switch

async_setup_entry = forward({"bridge": bridge_switch, "devices": devices_switch, "sync": sync_switch, "syncbox": syncbox_switch})
