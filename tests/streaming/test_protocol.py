# SPDX-License-Identifier: GPL-3.0-or-later
"""The HueStream message, byte by byte."""

import pytest

from custom_components.hue_plus.streaming import protocol

AREA = "01234567-89ab-cdef-0123-456789abcdef"


def test_a_message_is_a_header_naming_the_area_and_seven_bytes_per_channel():
    message = protocol.frame(5, AREA, {3: (255, 0, 128), 1: (0, 0, 0)})
    assert message[:9] == b"HueStream"
    assert message[9:16] == bytes([2, 0, 5, 0, 0, 0, 0])  # version 2.0, sequence, reserved, RGB colour space, reserved
    assert message[16:52] == AREA.encode()
    # channels are sent in order; 8-bit values are spread over 16 bits (255 -> 0xFFFF)
    assert message[52:] == bytes([1, 0, 0, 0, 0, 0, 0]) + bytes([3, 0xFF, 0xFF, 0, 0, 0x80, 0x80])
    assert len(message) == 52 + 2 * 7


def test_the_sequence_number_wraps_at_one_byte():
    assert protocol.frame(257, AREA, {0: (1, 2, 3)})[11] == 1


@pytest.mark.parametrize(
    "area, colours",
    [
        ("short", {0: (1, 2, 3)}),
        (AREA, {}),
        (AREA, dict.fromkeys(range(21), (0, 0, 0))),
        (AREA, {256: (0, 0, 0)}),
        (AREA, {0: (256, 0, 0)}),
        (AREA, {0: (-1, 0, 0)}),
        (AREA, {0: (1.5, 0, 0)}),
        (AREA, {0: (1, 2)}),
        ("é" * 36, {0: (1, 2, 3)}),
    ],
)
def test_what_the_bridge_would_not_accept_is_refused_before_anything_is_sent(area, colours):
    with pytest.raises(ValueError):
        protocol.frame(0, area, colours)
