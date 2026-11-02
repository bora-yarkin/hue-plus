# SPDX-License-Identifier: GPL-3.0-or-later
"""The select platform: each module adds its own."""

from __future__ import annotations

from .bridge import select as bridge_select
from .devices import select as devices_select
from .platform import forward
from .sync import select as sync_select
from .syncbox import select as syncbox_select

async_setup_entry = forward({"bridge": bridge_select, "devices": devices_select, "sync": sync_select, "syncbox": syncbox_select})
