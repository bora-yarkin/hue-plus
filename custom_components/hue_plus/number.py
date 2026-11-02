# SPDX-License-Identifier: GPL-3.0-or-later
"""The number platform: each module adds its own."""

from __future__ import annotations

from .platform import forward
from .sync import number as sync_number
from .syncbox import number as syncbox_number

async_setup_entry = forward({"sync": sync_number, "syncbox": syncbox_number})
