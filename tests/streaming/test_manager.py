# SPDX-License-Identifier: GPL-3.0-or-later
"""A stream to an area: the bridge is told to start and stop, and frames reach a real DTLS server in between."""

import asyncio
import time

import pytest

from custom_components.hue_plus.bridge.api import BridgeError
from custom_components.hue_plus.streaming import manager as streaming

from .conftest import IDENTITY, KEY_HEX

AREA = {"id": "01234567-89ab-cdef-0123-456789abcdef", "metadata": {"name": "TV"}, "channels": [{"channel_id": 0}, {"channel_id": 1}]}


class FakeApi:
    def __init__(self, refuse_start=False):
        self.calls = []
        self.refuse_start = refuse_start

    async def list(self, resource):
        return [AREA, {"id": "b" * 36, "metadata": {"name": "Empty"}, "channels": []}]

    async def put(self, resource, rid, body):
        self.calls.append((resource, rid, body))
        if self.refuse_start and body["action"] == "start":
            raise BridgeError("The area is in use")


def make(api, port):
    return streaming.StreamingManager(
        api, "127.0.0.1", IDENTITY, KEY_HEX, lambda coroutine, name: asyncio.ensure_future(coroutine), port=port
    )


def actions(api):
    return [call[2]["action"] for call in api.calls]


async def wait_until(predicate, seconds=5):
    deadline = time.monotonic() + seconds
    while not predicate():
        assert time.monotonic() < deadline, "timed out"
        await asyncio.sleep(0.05)


async def test_a_stream_starts_the_area_sends_frames_and_stops_the_area(dtls_server):
    api = FakeApi()
    manager = make(api, dtls_server.port)
    await manager.stream("TV", [(255, 0, 0)], seconds=0.5)
    await wait_until(lambda: actions(api) == ["start", "stop"])
    received = dtls_server.received()
    assert received.count(b"HueStream") >= 2
    assert AREA["id"].encode() in received
    assert bytes([0, 255, 255, 0, 0, 0, 0]) in received and bytes([1, 255, 255, 0, 0, 0, 0]) in received  # one colour for both channels


async def test_stopping_ends_a_long_stream_and_tells_the_area(dtls_server):
    api = FakeApi()
    manager = make(api, dtls_server.port)
    await manager.stream(AREA["id"], [(0, 255, 0), (0, 0, 255)], seconds=60)
    await wait_until(lambda: dtls_server.received().count(b"HueStream") >= 1)
    await manager.stop(AREA["id"])
    assert actions(api) == ["start", "stop"]


async def test_a_new_stream_to_the_same_area_replaces_the_old_one(dtls_server):
    api = FakeApi()
    manager = make(api, dtls_server.port)
    await manager.stream("TV", [(255, 0, 0)], seconds=60)
    await wait_until(lambda: dtls_server.received().count(b"HueStream") >= 1)
    await manager.stream("TV", [(0, 0, 255)], seconds=60)
    await wait_until(lambda: actions(api) == ["start", "stop", "start"])
    await manager.stop()
    assert actions(api) == ["start", "stop", "start", "stop"]


async def test_a_wrong_key_stops_the_area_again_and_ends_the_stream(dtls_server):
    api = FakeApi()
    manager = streaming.StreamingManager(
        api, "127.0.0.1", IDENTITY, "ff" * 16, lambda coroutine, name: asyncio.ensure_future(coroutine), port=dtls_server.port
    )
    await manager.stream("TV", [(1, 2, 3)], seconds=5)
    await wait_until(lambda: actions(api) == ["start", "stop"], seconds=15)


async def test_an_area_the_bridge_will_not_start_is_not_stopped_and_not_connected_to(dtls_server):
    api = FakeApi(refuse_start=True)
    manager = make(api, dtls_server.port)
    await manager.stream("TV", [(1, 2, 3)], seconds=5)
    await wait_until(lambda: len(api.calls) == 1)
    await asyncio.sleep(0.2)
    assert actions(api) == ["start"] and dtls_server.received() == b""


@pytest.mark.parametrize(
    "area, colours, seconds",
    [
        ("Nothing", [(1, 2, 3)], 5),
        ("Empty", [(1, 2, 3)], 5),
        ("TV", [(1, 2, 3), (4, 5, 6), (7, 8, 9)], 5),
        ("TV", [(256, 0, 0)], 5),
        ("TV", [(1, 2, 3)], 0),
        ("TV", [(1, 2, 3)], streaming.MAX_SECONDS + 1),
    ],
)
async def test_a_request_that_cannot_be_right_is_refused_before_the_area_is_touched(area, colours, seconds):
    api = FakeApi()
    with pytest.raises(ValueError):
        await make(api, 1).stream(area, colours, seconds)
    assert api.calls == []
