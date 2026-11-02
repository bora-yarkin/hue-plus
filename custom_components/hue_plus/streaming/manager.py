# SPDX-License-Identifier: GPL-3.0-or-later
"""Runs a stream of colours to an entertainment area: starts the area, connects over DTLS, sends frames, stops the area.

EXPERIMENTAL: not yet tried against a real bridge. This module imports nothing from Home Assistant.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable, Coroutine
from typing import Any

from ..bridge import payloads
from ..bridge.api import BridgeApi, BridgeError
from . import dtls, protocol

_LOGGER = logging.getLogger(__name__)

MAX_SECONDS = 3600

Colour = tuple[int, int, int]


def channel_colours(area: dict[str, Any], colours: list[Colour]) -> dict[int, Colour]:
    """One colour for every channel of the area, or one colour per channel."""
    channels = sorted(c["channel_id"] for c in area.get("channels") or [] if isinstance(c.get("channel_id"), int))
    if not channels:
        raise ValueError("This entertainment area has no lights in it")
    if len(colours) == 1:
        return dict.fromkeys(channels, colours[0])
    if len(colours) != len(channels):
        raise ValueError(f"Give one colour for all, or {len(channels)} colours (one per channel)")
    return dict(zip(channels, colours, strict=True))


class StreamingManager:
    def __init__(
        self,
        api: BridgeApi,
        host: str,
        application_id: str,
        client_key: str,
        spawn: Callable[[Coroutine[Any, Any, None], str], asyncio.Task],
        port: int = protocol.PORT,
    ) -> None:
        self.api = api
        self._host, self._port = host, port
        self._identity = application_id
        self._key = bytes.fromhex(client_key)
        self._spawn = spawn
        self._tasks: dict[str, asyncio.Task] = {}

    async def stream(self, area_ref: str, colours: list[Colour], seconds: float) -> None:
        """Streams the colours to the area for ``seconds``. A stream that is already running to the area is replaced."""
        if not 0 < seconds <= MAX_SECONDS:
            raise ValueError(f"The duration is from 0 to {MAX_SECONDS} seconds")
        areas = await self.api.list("entertainment_configuration")
        area = next((a for a in areas if a["id"] == area_ref), None) or _only_named(areas, area_ref)
        coloured = channel_colours(area, colours)
        protocol.frame(0, area["id"], coloured)  # refuses a colour or area id the bridge would not accept, before anything starts
        await self.stop(area["id"])
        self._tasks[area["id"]] = self._spawn(self._run(area["id"], coloured, seconds), f"hue_plus stream {area['id']}")

    async def stop(self, area_ref: str | None = None) -> None:
        """Ends the stream to one area, or to every area. Returns when the area has been told to stop."""
        wanted = [area_ref] if area_ref else list(self._tasks)
        tasks = [self._tasks.pop(a) for a in wanted if a in self._tasks]
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    async def _run(self, area_id: str, colours: dict[int, Colour], seconds: float) -> None:
        client = dtls.DtlsPskClient()
        started = False
        connecting: asyncio.Future | None = None
        try:
            await self.api.put("entertainment_configuration", area_id, payloads.entertainment_action("start"))
            started = True
            connecting = asyncio.ensure_future(asyncio.to_thread(client.connect, self._host, self._port, self._identity, self._key))
            await asyncio.shield(connecting)
            loop = asyncio.get_running_loop()
            end, sequence = loop.time() + seconds, 0
            while loop.time() < end:
                client.send(protocol.frame(sequence, area_id, colours))
                sequence = (sequence + 1) & 0xFF
                await asyncio.sleep(protocol.KEEPALIVE_S)
        except (BridgeError, dtls.DtlsError) as err:
            _LOGGER.warning("Streaming to the entertainment area stopped: %s", err)
        finally:
            if connecting is not None and not connecting.done():
                # Cancelled while the handshake runs in its thread: the connection may only be closed once that thread is done with it.
                await asyncio.wait({connecting})
            client.close()
            if started:
                try:
                    await self.api.put("entertainment_configuration", area_id, payloads.entertainment_action("stop"))
                except BridgeError as err:
                    _LOGGER.warning("The entertainment area could not be told to stop streaming: %s", err)
            if self._tasks.get(area_id) is asyncio.current_task():
                del self._tasks[area_id]


def _only_named(areas: list[dict[str, Any]], name: str) -> dict[str, Any]:
    named = [a for a in areas if (a.get("metadata") or {}).get("name", "").casefold() == name.casefold()]
    if len(named) != 1:
        raise ValueError(f"No entertainment area called {name!r}" if not named else f"More than one area is called {name!r}: use its id")
    return named[0]
