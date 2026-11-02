# SPDX-License-Identifier: GPL-3.0-or-later
"""One Hue gradient light: its state, and the writes that change it.

The bridge keeps a list of colour points for a gradient light and blends
smoothly between them. This class presents that list as a few "zones" (pins)
and turns changes to a zone into one write of the whole list, because the
bridge only accepts the whole list. All zone changes of one light go through
one lock, so two zones changed at the same moment cannot overwrite each other.
"""

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from homeassistant.core import HomeAssistant

from ..connection import read
from .colors import arc_points, clamp_to_gamut, gamut_of
from .const import MAX_ZONES

_LOGGER = logging.getLogger(__name__)

XY = tuple[float, float]

# The styles of a gradient light, by the names the Hue app uses and the bridge's names for them.
MODES = {
    "linear": "interpolated_palette",
    "mirrored": "interpolated_palette_mirrored",
    "scattered": "random_pixelated",
    "segmented": "segmented_palette",
}
# In these two styles the zones are pins with a smooth blend between them, so a light taking 5
# points has 3 zones. In the other two every point is a colour of its own: 5 zones, no blend.
SMOOTH_MODES = ("interpolated_palette", "interpolated_palette_mirrored")

# Seconds after our own write in which reads from the bridge are ignored.
BUSY_SECONDS = 4.0

# How far (in xy) a zone may be from the colour written for it and still count as that colour:
# the bridge rounds the colours it stores.
ASKED_TOLERANCE = 0.004


def pins_from_points(points: list[XY], fallback: XY, zones: int) -> list[XY]:
    """The zone colours for a list of gradient points.

    The first and last point are the first and last zone, the middle zone is the
    middle point. A list shorter than the zones is filled in by blending; an
    empty list (a light that is off) falls back to the light's single colour.
    """
    if not points:
        return [fallback] * zones
    if len(points) == 1:
        return [points[0]] * zones
    if zones == 1:
        return [points[0]]
    pins = []
    for i in range(zones):
        # position along the list, 0 for the first zone and len-1 for the last
        pos = i * (len(points) - 1) / (zones - 1)
        low = int(pos)
        high = min(low + 1, len(points) - 1)
        frac = pos - low
        pins.append(
            (
                points[low][0] + (points[high][0] - points[low][0]) * frac,
                points[low][1] + (points[high][1] - points[low][1]) * frac,
            )
        )
    return pins


class GradientLight:
    """A gradient light on a Hue bridge."""

    def __init__(self, hass: HomeAssistant, api: Any, resource: dict[str, Any]) -> None:
        self.hass = hass
        self.api = api
        self.light_id: str = resource["id"]
        self.name: str = resource.get("metadata", {}).get("name", "Gradient light")
        self.model_archetype: str = resource.get("metadata", {}).get("archetype", "")
        self.owner_id: str | None = (resource.get("owner") or {}).get("rid")
        self.data: dict[str, Any] = resource
        self.available = True
        self._listeners: list[Callable[[], None]] = []
        self._lock = asyncio.Lock()
        self._pins: list[XY] | None = None
        self._busy_until = 0.0
        self.last_read: str | None = None
        self._unreachable = False
        self.last_write_seconds: float | None = None
        self._generation = 0
        # The hue and saturation last asked for each zone, with the colour they were
        # written as. A colour at the rim of the wheel is moved onto the edge of what
        # the light can show; remembering the request lets the zone keep reporting the
        # rim position (and not a lower saturation) for as long as it shows that colour.
        self._asked: dict[int, tuple[tuple[float, float], XY]] = {}

    # --- state -------------------------------------------------------------

    @property
    def is_on(self) -> bool:
        return bool(self.data.get("on", {}).get("on"))

    @property
    def brightness(self) -> int:
        """Brightness 0 to 255, for the whole light (a gradient has one brightness)."""
        pct = float(self.data.get("dimming", {}).get("brightness", 0))
        return max(1, round(pct * 2.55)) if self.is_on else 0

    @property
    def has_white(self) -> bool:
        """Whether the light also takes a white temperature."""
        return "color_temperature" in self.data

    @property
    def mode(self) -> str:
        return self.data.get("gradient", {}).get("mode", "interpolated_palette")

    @property
    def points_capable(self) -> int:
        return int(self.data.get("gradient", {}).get("points_capable", 0))

    def zones_for(self, mode: str) -> int:
        """The zones in a style: in a smooth style as many as fit with a blend point between
        each two (a light taking 5 points gets 3), otherwise one for every point."""
        if mode in SMOOTH_MODES:
            return max(2, min(MAX_ZONES, (self.points_capable + 1) // 2))
        return max(2, min(MAX_ZONES, self.points_capable))

    @property
    def zone_count(self) -> int:
        """The zones of this light in its current style."""
        return self.zones_for(self.mode)

    @property
    def max_zones(self) -> int:
        """The most zones the light has in any style (the zone lights that exist for it)."""
        return max(self.zones_for(mode) for mode in MODES.values())

    @property
    def smooth(self) -> bool:
        """Whether the zones are blended into a line (Linear and Mirrored)."""
        return self.mode in SMOOTH_MODES

    @property
    def pins(self) -> list[XY]:
        """The current zone colours."""
        if self._pins is None:
            self._pins = self._pins_from_data()
        return self._pins

    def clamp(self, xy: XY) -> XY:
        """A colour as the light can show it."""
        return clamp_to_gamut(xy, gamut_of(self.data))

    def remember_ask(self, zone: int, hs: tuple[float, float], xy: XY) -> None:
        self._asked[zone] = (hs, xy)

    def asked_hs(self, zone: int) -> tuple[float, float] | None:
        """The hue and saturation asked for a zone, while the zone still shows that colour."""
        asked = self._asked.get(zone)
        if asked is None:
            return None
        pin = self.pins[zone]
        if abs(pin[0] - asked[1][0]) > ASKED_TOLERANCE or abs(pin[1] - asked[1][1]) > ASKED_TOLERANCE:
            return None
        return asked[0]

    def _pins_from_data(self) -> list[XY]:
        points = [
            (p["color"]["xy"]["x"], p["color"]["xy"]["y"])
            for p in self.data.get("gradient", {}).get("points", [])
            if p.get("color", {}).get("xy")
        ]
        xy = self.data.get("color", {}).get("xy") or {"x": 0.3127, "y": 0.329}
        return pins_from_points(points, (xy["x"], xy["y"]), self.zone_count)

    def _points_for(self, pins: list[XY], mode: str) -> list[XY]:
        """The points to write for the zone colours in a style. Linear has a point on the
        colour wheel between each two zones, as the Hue app writes it, so the blend stays
        vivid (when the light has room for them); the other styles write the zone colours
        themselves."""
        if mode != "interpolated_palette" or len(pins) < 2 or 2 * len(pins) - 1 > self.points_capable:
            return list(pins)
        return arc_points(pins)

    def _gradient_body(self, pins: list[XY], mode: str, keep_pins: bool = False) -> dict[str, Any]:
        """The gradient to write. Every colour is moved onto what the light can show; with
        keep_pins the zone colours themselves (which the bridge already holds) are left as
        they are, so a change of style does not shift them."""
        gamut = gamut_of(self.data)
        kept = {tuple(p) for p in pins} if keep_pins else set()
        return {
            "points": [
                {"color": {"xy": {"x": round(x, 4), "y": round(y, 4)}}}
                for x, y in (q if tuple(q) in kept else clamp_to_gamut(q, gamut) for q in self._points_for(pins, mode))
            ],
            "mode": mode,
        }

    def pins_for_mode(self, mode: str) -> list[XY]:
        """The current zone colours as the zones of another style: going to more zones adds the
        blend colours between the pins, going to fewer keeps every other one."""
        pins = list(self.pins)
        wanted = self.zones_for(mode)
        if wanted == len(pins):
            return pins
        points = arc_points(pins) if wanted > len(pins) and len(pins) >= 2 else pins
        return pins_from_points(points, pins[0], wanted)

    # --- listeners ---------------------------------------------------------

    def add_listener(self, callback: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(callback)

        def remove() -> None:
            if callback in self._listeners:
                self._listeners.remove(callback)

        return remove

    def _notify(self) -> None:
        for callback in list(self._listeners):
            callback()

    # --- reading -----------------------------------------------------------

    async def _check_reachable(self) -> None:
        """Whether the light answers the bridge: the bridge reports this on the light's device,
        not on the light. A bridge that reports nothing leaves the light reachable."""
        if self.owner_id is None:
            return
        try:
            for item in await read(self.api, "clip/v2/resource/zigbee_connectivity"):
                if (item.get("owner") or {}).get("rid") == self.owner_id:
                    self._unreachable = item.get("status") not in (None, "connected")
                    return
        except Exception:
            return

    async def async_refresh(self, check_reachable: bool = False) -> None:
        """Reads the light from the bridge and tells the entities.

        For a few seconds after our own write the bridge's answer is not trusted:
        it can still describe the old colours, and the change event our write
        causes would otherwise put them back.
        """
        if time.monotonic() < self._busy_until:
            return
        generation = self._generation
        try:
            result = await read(self.api, f"clip/v2/resource/light/{self.light_id}")
            if generation != self._generation:
                return  # a write started while this was being read: the answer is old
            self.data = result[0]
            if check_reachable:
                await self._check_reachable()
            self.available = not self._unreachable
            self.last_read = datetime.now(UTC).isoformat(timespec="seconds")
        except Exception as err:
            if self.available:
                _LOGGER.warning("Could not read %s from the bridge: %s", self.name, err)
            self.available = False
        else:
            self._pins = None
        self._notify()

    # --- writing -----------------------------------------------------------

    async def async_apply(
        self,
        *,
        on: bool | None = None,
        brightness: int | None = None,
        zones: dict[int, XY] | None = None,
        transition: float | None = None,
    ) -> None:
        """Changes the light. 'zones' maps a zone number to a colour; brightness is 1 to 255."""
        async with self._lock:
            body: dict[str, Any] = {}
            if on is not None:
                body["on"] = {"on": on}
            if brightness is not None:
                body["dimming"] = {"brightness": max(1.0, round(brightness / 255 * 100, 1))}
                body.setdefault("on", {"on": True})
            if zones:
                pins = list(self.pins)
                gamut = gamut_of(self.data)
                for number, xy in zones.items():
                    if 0 <= number < len(pins):
                        pins[number] = clamp_to_gamut((float(xy[0]), float(xy[1])), gamut)
                body["gradient"] = self._gradient_body(pins, self.mode)
                body.setdefault("on", {"on": True})
                self._pins = pins
            if transition is not None:
                body["dynamics"] = {"duration": int(transition * 1000)}
            if not body:
                return
            self._generation += 1
            self._busy_until = time.monotonic() + BUSY_SECONDS
            # Show the change at once: the bridge takes a moment to answer a write.
            if "gradient" in body:
                self.data.setdefault("gradient", {})["points"] = body["gradient"]["points"]
            if "on" in body:
                self.data.setdefault("on", {})["on"] = body["on"]["on"]
            if "dimming" in body:
                self.data.setdefault("dimming", {})["brightness"] = body["dimming"]["brightness"]
            self._notify()
            started = time.monotonic()
            try:
                await self.api.request("put", f"clip/v2/resource/light/{self.light_id}", json=body)
            except Exception:
                # The change did not happen: go back to what the bridge says.
                self._busy_until = 0.0
                self._generation += 1
                self.hass.async_create_task(self.async_refresh())
                raise
            self.last_write_seconds = round(time.monotonic() - started, 2)
            self._busy_until = time.monotonic() + BUSY_SECONDS
            self._notify()
        self.hass.async_create_task(self._refresh_later())

    async def async_set_layout(self, *, mode: str | None = None, flip: bool = False) -> None:
        """Changes the style of the light (Linear, Mirrored, Scattered, Segmented) and/or turns its
        zones around. The colours are kept as far as the new style has room for them. The light
        is not switched on or off."""
        async with self._lock:
            target = mode or self.mode
            offered = self.data.get("gradient", {}).get("mode_values", [])
            if target not in offered:
                raise ValueError(f"The light does not offer the style {target}")
            pins = self.pins_for_mode(target)
            if flip:
                pins = pins[::-1]
            gradient = self._gradient_body(pins, target, keep_pins=True)
            self._generation += 1
            self._busy_until = time.monotonic() + BUSY_SECONDS
            self.data.setdefault("gradient", {}).update(gradient)
            self._pins = None
            self._notify()
            try:
                await self.api.request("put", f"clip/v2/resource/light/{self.light_id}", json={"gradient": gradient})
            except Exception:
                self._busy_until = 0.0
                self._generation += 1
                self.hass.async_create_task(self.async_refresh())
                raise
            self._busy_until = time.monotonic() + BUSY_SECONDS
        self.hass.async_create_task(self._refresh_later())

    async def _refresh_later(self) -> None:
        await asyncio.sleep(BUSY_SECONDS + 0.5)
        await self.async_refresh()
