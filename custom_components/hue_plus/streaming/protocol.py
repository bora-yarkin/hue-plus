# SPDX-License-Identifier: GPL-3.0-or-later
"""The messages of Hue Entertainment streaming (version 2): a header naming the area, then one colour per channel.

EXPERIMENTAL. Written from Signify's published description of the "HueStream" format; not yet tried against a real bridge.
This module imports nothing from Home Assistant.
"""

from __future__ import annotations

from collections.abc import Mapping

PORT = 2100
MAX_CHANNELS = 20
# The bridge ends a stream that is silent for about ten seconds; a frame this often keeps it open and keeps the lights steady.
KEEPALIVE_S = 0.1
AREA_ID_LENGTH = 36


def frame(sequence: int, area_id: str, colours: Mapping[int, tuple[int, int, int]]) -> bytes:
    """One message: channel id -> (red, green, blue) from 0 to 255. Raises ValueError for anything the bridge would not accept."""
    if len(area_id) != AREA_ID_LENGTH or not area_id.isascii():
        raise ValueError("The area id is 36 ASCII characters")
    if not 1 <= len(colours) <= MAX_CHANNELS:
        raise ValueError(f"A message holds 1 to {MAX_CHANNELS} channels")
    header = b"HueStream" + bytes([2, 0, sequence & 0xFF, 0, 0, 0, 0]) + area_id.encode("ascii")
    body = bytearray()
    for channel, colour in sorted(colours.items()):
        if not 0 <= channel <= 255:
            raise ValueError("A channel id is from 0 to 255")
        if len(colour) != 3 or any(not isinstance(v, int) or not 0 <= v <= 255 for v in colour):
            raise ValueError("A colour is three whole numbers from 0 to 255")
        body.append(channel)
        for value in colour:
            body += (value * 257).to_bytes(2, "big")  # 0..255 spread over 0..65535
    return header + bytes(body)
