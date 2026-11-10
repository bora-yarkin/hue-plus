# SPDX-License-Identifier: GPL-3.0-or-later
"""The two types the copied platforms name.

The bridge object they are written for is whatever Hue Plus has for the entry: ``DirectBridge`` (direct.py) for a connection of its
own, or the Hue integration's own bridge object when Hue Plus rides on its connection. Both have what the platforms read (``api``,
``async_request_call``, ``reset_jobs``, ``logger``, ``config_entry``), so the platforms see no difference.
"""

from typing import Any

type HueBridge = Any
type HueConfigEntry = Any
