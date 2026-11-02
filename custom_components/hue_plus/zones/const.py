# SPDX-License-Identifier: GPL-3.0-or-later
"""Limits and timings of the zones module."""

# The most colour zones one gradient light gets. A zone is a "pin" of the Hue app; the bridge blends smoothly between
# them. A light gets as many as fit with a blend point between each two (a light taking 5 points gets 3), and never more
# than this.
MAX_ZONES = 8

# Seconds between looks for gradient lights that were added to a bridge after setup.
SCAN_SECONDS = 60

# Seconds between reads of the bridge. Changes made elsewhere (the Hue app) also arrive through the bridge's event
# stream when it is available; this is the fallback.
REFRESH_SECONDS = 10
