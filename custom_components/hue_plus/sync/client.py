# SPDX-License-Identifier: GPL-3.0-or-later
"""Client of the Hue Spotify sync cloud service (the one the Hue app's Sync tab talks to).

The service is a WebSocket. It is opened with two request headers, ``auth`` (an opaque token) and ``x-genesis-uuid``.
The service then pushes ``control`` (sync state and settings), ``enums`` and ``player`` (current track) messages and
accepts ``{"type": "control", "data": {"sync_status": "start" | "stop"}}``. It is a private Signify interface, found by
watching the Hue app, and can change without notice.

This module imports nothing from Home Assistant so it can be tested against a fake server.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import Callable
from dataclasses import dataclass, replace
from typing import Any

import aiohttp

_LOGGER = logging.getLogger(__name__)

# Handshake answers that mean "these credentials are not accepted". An unknown ``auth`` token answers 500 (observed),
# which is also what a server fault looks like, so a 500 only counts as a rejection when it repeats.
REJECTED_AT_ONCE = (401, 403)
REJECTED_WHEN_REPEATED = (500,)
REPEATS_BEFORE_REJECTION = 3

HEARTBEAT_S = 30
RECONNECT_MIN_S = 5
RECONNECT_MAX_S = 300
# A connection that lasted at least this long was healthy, so the next reconnect starts from the short delay again.
HEALTHY_AFTER_S = 30
PROBE_TIMEOUT_S = 10
# The service sends its settings ("control") and what they can be set to ("enums") as soon as a connection opens. A connection
# that has not delivered both after this long is incomplete (seen: only the track arrived) and is replaced by a new one.
SETTINGS_TIMEOUT_S = 10
SETTINGS_MESSAGES = frozenset({"control", "enums"})


class GenesisRejected(Exception):
    """The service does not accept the credentials."""


class GenesisUnavailable(Exception):
    """The service cannot be reached, or there is no open connection to send on."""


@dataclass(frozen=True)
class SyncState:
    """What the service last told us. ``None`` (or an empty tuple) means not told yet."""

    sync_status: str | None = None
    bridge_id: str | None = None
    entertainment_id: str | None = None
    playback_device: str | None = None
    # Settings. ``palette`` is the chosen palette name, or "auto"; ``style`` indexes ``styles``.
    brightness: int | None = None
    light_delay: int | None = None
    intensity: str | None = None
    palette: str | None = None
    style: int | None = None
    # What the settings can be set to, from the service's "enums" message. ``palettes`` is (name, colours) pairs.
    intensities: tuple[str, ...] = ()
    palettes: tuple[tuple[str, tuple[tuple[int, ...], ...]], ...] = ()
    styles: tuple[str, ...] = ()
    track: str | None = None
    artists: tuple[str, ...] = ()
    album: str | None = None
    album_art_url: str | None = None
    is_playing: bool | None = None


def apply_message(state: SyncState, message: Any) -> SyncState:
    """Return ``state`` updated with one message from the service. Unknown or malformed messages change nothing."""
    if not isinstance(message, dict) or not isinstance(message.get("data"), dict):
        return state
    data = message["data"]
    if message.get("type") == "control":
        device = data.get("current_playback_device")
        return replace(
            state,
            sync_status=data.get("sync_status", state.sync_status),
            bridge_id=data.get("bridge_id", state.bridge_id),
            entertainment_id=data.get("entertainment_id", state.entertainment_id),
            playback_device=device.get("name") if isinstance(device, dict) else state.playback_device,
            brightness=data.get("brightness", state.brightness),
            light_delay=data.get("light_delay", state.light_delay),
            intensity=_mode(data.get("intensity_mode"), state.intensity),
            palette=_mode(data.get("color_mode"), state.palette),
            style=data.get("algo", state.style),
        )
    if message.get("type") == "enums":
        return replace(
            state,
            intensities=tuple(i for i in data.get("intensities") or [] if isinstance(i, str)),
            palettes=tuple(
                (p["name"], tuple(tuple(c) for c in p.get("colors") or []))
                for p in data.get("color_palettes") or []
                if isinstance(p, dict) and isinstance(p.get("name"), str)
            ),
            styles=tuple(a["name"] for a in data.get("algorithms") or [] if isinstance(a, dict) and isinstance(a.get("name"), str)),
        )
    if message.get("type") == "player":
        if data.get("type") != "track":
            return replace(state, track=None, artists=(), album=None, album_art_url=None, is_playing=None)
        track, album, playing = data.get("track"), data.get("album"), data.get("is_playing")
        return replace(
            state,
            track=track.get("name") if isinstance(track, dict) else None,
            artists=tuple(a["name"] for a in data.get("artists") or [] if isinstance(a, dict) and "name" in a),
            album=album.get("name") if isinstance(album, dict) else None,
            album_art_url=_album_art(album),
            is_playing=playing if isinstance(playing, bool) else None,
        )
    return state


def _mode(setting: Any, default: str | None) -> str | None:
    """The chosen option of a ``{"mode": ..., "value": ...}`` setting. ``value`` is what is actually shown (it differs
    from ``mode`` when ``mode`` is "auto")."""
    return setting.get("mode", default) if isinstance(setting, dict) else default


# The album art is shown about 260 px wide, so the smallest picture of at least this width is the best fit.
ART_WIDTH = 300


def _album_art(album: Any) -> str | None:
    """The address of the album's cover, or None. The service lists the same cover in several sizes."""
    pictures = [
        (p["width"], p["url"])
        for p in (album.get("albumart_urls") if isinstance(album, dict) else None) or []
        if isinstance(p, dict) and isinstance(p.get("width"), int) and isinstance(p.get("url"), str)
    ]
    if not pictures:
        return None
    big_enough = [p for p in pictures if p[0] >= ART_WIDTH]
    return min(big_enough)[1] if big_enough else max(pictures)[1]


def _headers(auth: str, uuid: str) -> dict[str, str]:
    return {"auth": auth, "x-genesis-uuid": uuid}


async def async_probe(session: aiohttp.ClientSession, url: str, auth: str, uuid: str, timeout_s: float = PROBE_TIMEOUT_S) -> SyncState:
    """Connect once and return the first state the service sends. Raises GenesisRejected or GenesisUnavailable."""
    try:
        async with asyncio.timeout(timeout_s), session.ws_connect(url, headers=_headers(auth, uuid)) as ws:
            state = SyncState()
            async for msg in ws:
                if msg.type is not aiohttp.WSMsgType.TEXT:
                    break
                state = apply_message(state, json.loads(msg.data))
                if state.sync_status is not None:
                    return state
    except aiohttp.WSServerHandshakeError as err:
        if err.status in REJECTED_AT_ONCE + REJECTED_WHEN_REPEATED:
            raise GenesisRejected(f"The service answered {err.status}") from err
        raise GenesisUnavailable(f"The service answered {err.status}") from err
    except (aiohttp.ClientError, TimeoutError, ValueError) as err:
        raise GenesisUnavailable(f"The service could not be reached: {type(err).__name__}") from err
    raise GenesisUnavailable("The service closed the connection before sending its state")


class GenesisClient:
    """Keeps one WebSocket to the service open and mirrors its state. ``run`` must be awaited as a task."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        url: str,
        auth: str,
        uuid: str,
        *,
        on_state: Callable[[SyncState], None],
        on_connection: Callable[[bool], None],
        on_rejected: Callable[[], None],
        reconnect_min_s: float = RECONNECT_MIN_S,
        reconnect_max_s: float = RECONNECT_MAX_S,
        settings_timeout_s: float = SETTINGS_TIMEOUT_S,
    ) -> None:
        self._session = session
        self._url = url
        self._headers = _headers(auth, uuid)
        self._on_state = on_state
        self._on_connection = on_connection
        self._on_rejected = on_rejected
        self._reconnect_min_s = reconnect_min_s
        self._reconnect_max_s = reconnect_max_s
        self._settings_timeout_s = settings_timeout_s
        self._seen: set[str] = set()
        self._ws: aiohttp.ClientWebSocketResponse | None = None
        self.state = SyncState()

    @property
    def connected(self) -> bool:
        return self._ws is not None and not self._ws.closed

    async def run(self) -> None:
        """Connect, mirror the state, and reconnect after a drop. Ends only when cancelled or the credentials are
        rejected (then ``on_rejected`` has been called once)."""
        delay = self._reconnect_min_s
        repeated_500s = 0
        loop = asyncio.get_running_loop()
        while True:
            started = loop.time()
            try:
                await self._serve()
                repeated_500s = 0
            except aiohttp.WSServerHandshakeError as err:
                if err.status in REJECTED_AT_ONCE:
                    self._on_rejected()
                    return
                if err.status in REJECTED_WHEN_REPEATED:
                    repeated_500s += 1
                    if repeated_500s >= REPEATS_BEFORE_REJECTION:
                        self._on_rejected()
                        return
                else:
                    repeated_500s = 0
                _LOGGER.warning("The Hue sync service answered %s; retrying in %.0f s", err.status, delay)
            except (aiohttp.ClientError, TimeoutError) as err:
                _LOGGER.warning("The Hue sync service connection failed (%s); retrying in %.0f s", type(err).__name__, delay)
            else:
                _LOGGER.info("The Hue sync service closed the connection; reconnecting in %.0f s", delay)
            healthy = loop.time() - started >= HEALTHY_AFTER_S
            await asyncio.sleep(delay)
            delay = self._reconnect_min_s if healthy else min(delay * 2, self._reconnect_max_s)

    async def _serve(self) -> None:
        async with self._session.ws_connect(self._url, headers=self._headers, heartbeat=HEARTBEAT_S) as ws:
            self._ws = ws
            self._seen = set()
            _LOGGER.debug("Connected to the Hue sync service")
            self._on_connection(True)
            watchdog = asyncio.create_task(self._close_if_incomplete(ws))
            try:
                async for msg in ws:
                    if msg.type is aiohttp.WSMsgType.TEXT:
                        self._handle(msg.data)
                    elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                        break
            finally:
                watchdog.cancel()
                self._ws = None
                _LOGGER.debug("Disconnected from the Hue sync service")
                self._on_connection(False)

    async def _close_if_incomplete(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        """Closes a connection that did not deliver the settings in time, so ``run`` opens a new one."""
        await asyncio.sleep(self._settings_timeout_s)
        missing = SETTINGS_MESSAGES - self._seen
        if missing and not ws.closed:
            _LOGGER.warning(
                "The Hue sync service did not send its %s within %.0f s (it sent: %s); reconnecting",
                " and ".join(sorted(missing)),
                self._settings_timeout_s,
                ", ".join(sorted(self._seen)) or "nothing",
            )
            await ws.close()

    def _handle(self, text: str) -> None:
        try:
            message = json.loads(text)
        except ValueError:
            _LOGGER.debug("Ignored a message that is not JSON")
            return
        kind = message.get("type") if isinstance(message, dict) else type(message).__name__
        _LOGGER.debug("Received a %s message", kind)
        if isinstance(kind, str):
            self._seen.add(kind)
        new_state = apply_message(self.state, message)
        if new_state != self.state:
            self.state = new_state
            self._on_state(new_state)

    async def _send_control(self, data: dict[str, Any]) -> None:
        """Send one setting change. The new state arrives as a message from the service, not from here."""
        if self._ws is None or self._ws.closed:
            raise GenesisUnavailable("Not connected to the Hue sync service")
        await self._ws.send_str(json.dumps({"type": "control", "data": data}))

    async def async_set_sync(self, on: bool) -> None:
        await self._send_control({"sync_status": "start" if on else "stop"})

    async def async_set_brightness(self, percent: int) -> None:
        await self._send_control({"brightness": percent})

    async def async_set_light_delay(self, seconds: int) -> None:
        """Whole seconds; the service ignores fractions."""
        await self._send_control({"light_delay": seconds})

    async def async_set_intensity(self, name: str) -> None:
        if name not in self.state.intensities:
            raise ValueError(f"Unknown intensity {name!r}")
        await self._send_control({"intensity_mode": {"mode": name, "value": name}})

    async def async_set_palette(self, name: str) -> None:
        colours = dict(self.state.palettes).get(name)
        if colours is None:
            raise ValueError(f"Unknown palette {name!r}")
        await self._send_control({"color_mode": {"mode": name, "value": name, "colors": [list(c) for c in colours]}})

    async def async_set_style(self, name: str) -> None:
        if name not in self.state.styles:
            raise ValueError(f"Unknown style {name!r}")
        await self._send_control({"algo": self.state.styles.index(name)})

    async def async_set_area(self, entertainment_id: str) -> None:
        await self._send_control({"entertainment_id": entertainment_id})
