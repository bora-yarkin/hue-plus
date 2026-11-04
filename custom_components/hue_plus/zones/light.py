# SPDX-License-Identifier: GPL-3.0-or-later
"""Light entities: one grouped light and one light per zone for each gradient light.

The grouped light controls the whole tube (on, brightness, one colour for every zone). Each zone light sets the colour of
one zone. A gradient has a single brightness, so brightness on a zone light is the brightness of the whole tube.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import timedelta
from typing import Any

from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ATTR_COLOR_TEMP_KELVIN,
    ATTR_HS_COLOR,
    ATTR_TRANSITION,
    ATTR_XY_COLOR,
    ColorMode,
    LightEntity,
    LightEntityFeature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import color as color_util

from ..connection import api_or_none, read
from ..entity import accessory_device
from ..runtime import HuePlusConfigEntry, Runtime
from .colors import MAX_KELVIN, MIN_KELVIN, kelvin_to_xy, xy_to_kelvin
from .const import REFRESH_SECONDS, SCAN_SECONDS
from .manager import GradientLight

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Adds the entities of every gradient light of the bridge, now and when more appear."""
    runtime = entry.runtime_data
    api = api_or_none(runtime.link)
    if api is None:
        _LOGGER.warning("The connection to the bridge is not up, so the gradient lights are not set up")
        return

    async def scan(_now: Any = None) -> None:
        entities: list[LightEntity] = []
        try:
            resources = await read(api, "clip/v2/resource/light")
        except Exception as err:
            _LOGGER.debug("Could not look for new gradient lights: %s", err)
            return
        for resource in resources:
            # A gradient light takes at least two points; fewer is not a gradient.
            capable = int(resource.get("gradient", {}).get("points_capable", 0))
            if capable < 2 or resource["id"] in runtime.zones:
                continue
            manager = GradientLight(hass, api, resource)
            runtime.zones[manager.light_id] = manager
            entities.extend(ZoneLight(runtime, manager, i) for i in range(manager.max_zones))
            entry.async_on_unload(_keep_fresh(hass, api, manager))
        if entities:
            async_add_entities(entities)

    await scan()
    entry.async_on_unload(async_track_time_interval(hass, scan, timedelta(seconds=SCAN_SECONDS)))


def _keep_fresh(hass: HomeAssistant, api: Any, manager: GradientLight) -> Callable[[], None]:
    """Reads the light now and then, and at once when the bridge reports a change."""

    async def refresh(_now: Any = None) -> None:
        await manager.async_refresh(check_reachable=True)

    stop_timer = async_track_time_interval(hass, refresh, timedelta(seconds=REFRESH_SECONDS))
    stop_events: Callable[[], None] | None = None
    try:
        stop_events = api.lights.subscribe(lambda *_args: hass.async_create_task(manager.async_refresh()), id_filter=manager.light_id)
    except Exception:
        stop_events = None

    def stop() -> None:
        stop_timer()
        if stop_events is not None:
            stop_events()

    return stop


class _GradientEntity(LightEntity):
    """What the grouped light and the zone lights share."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_min_color_temp_kelvin = MIN_KELVIN
    _attr_max_color_temp_kelvin = MAX_KELVIN
    _attr_supported_features = LightEntityFeature.TRANSITION

    def __init__(self, runtime: Runtime, manager: GradientLight) -> None:
        self._manager = manager
        self._attr_supported_color_modes = (
            {ColorMode.HS, ColorMode.XY, ColorMode.COLOR_TEMP} if manager.has_white else {ColorMode.HS, ColorMode.XY}
        )
        self._attr_device_info = accessory_device(runtime, manager.owner_id or manager.light_id, manager.name, None)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._manager.add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()

    def _colour_xy(self) -> tuple[float, float]:
        """The colour this light shows (overridden by the grouped light and the zones)."""
        raise NotImplementedError

    @property
    def xy_color(self) -> tuple[float, float]:
        return self._colour_xy()

    @property
    def color_temp_kelvin(self) -> int | None:
        """The white temperature, when the colour is a white and the light takes whites."""
        if not self._manager.has_white:
            return None
        return xy_to_kelvin(self._colour_xy())

    def _asked_hs(self) -> tuple[float, float] | None:
        """The hue and saturation this light was last asked for and still shows (zone lights)."""
        return None

    @property
    def hs_color(self) -> tuple[float, float] | None:
        return self._asked_hs()

    @property
    def color_mode(self) -> ColorMode:
        if self.color_temp_kelvin:
            return ColorMode.COLOR_TEMP
        return ColorMode.HS if self._asked_hs() else ColorMode.XY

    def _requested_xy(self, kwargs: dict[str, Any]) -> tuple[float, float] | None:
        """The colour a turn_on call asks for: an xy colour, a hue and saturation, or a
        white temperature. It is returned as the light can show it. A hue and saturation
        is remembered for the zones it is meant for (see GradientLight.remember_ask)."""
        if kwargs.get(ATTR_XY_COLOR):
            return self._manager.clamp(tuple(kwargs[ATTR_XY_COLOR]))
        if kwargs.get(ATTR_HS_COLOR):
            hs = tuple(kwargs[ATTR_HS_COLOR])
            xy = self._manager.clamp(color_util.color_hs_to_xy(*hs))
            for zone in self._zones_asked():
                self._manager.remember_ask(zone, hs, xy)
            return xy
        if kwargs.get(ATTR_COLOR_TEMP_KELVIN):
            return kelvin_to_xy(kwargs[ATTR_COLOR_TEMP_KELVIN])
        return None

    def _zones_asked(self) -> list[int]:
        raise NotImplementedError

    @property
    def available(self) -> bool:
        return self._manager.available

    @property
    def is_on(self) -> bool:
        return self._manager.is_on

    @property
    def brightness(self) -> int:
        return self._manager.brightness

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._manager.async_apply(on=False, transition=kwargs.get(ATTR_TRANSITION))


class ZoneLight(_GradientEntity):
    """One colour zone of the tube. Brightness and switching apply to the whole tube."""

    def __init__(self, runtime: Runtime, manager: GradientLight, index: int) -> None:
        super().__init__(runtime, manager)
        self._index = index
        self._attr_unique_id = f"{manager.light_id}_zone_{index + 1}"
        self._attr_name = f"Zone {index + 1}"

    def _zones_asked(self) -> list[int]:
        return [self._index]

    @property
    def available(self) -> bool:
        """A zone the light's current style does not have is not available."""
        return self._manager.available and self._index < self._manager.zone_count

    def _asked_hs(self) -> tuple[float, float] | None:
        return self._manager.asked_hs(self._index)

    def _colour_xy(self) -> tuple[float, float]:
        pins = self._manager.pins
        x, y = pins[min(self._index, len(pins) - 1)]
        return (round(x, 4), round(y, 4))

    async def async_turn_on(self, **kwargs: Any) -> None:
        xy = self._requested_xy(kwargs)
        if self._index >= self._manager.zone_count:
            raise ServiceValidationError("This zone is not part of the light's current style")
        await self._manager.async_apply(
            on=True,
            brightness=kwargs.get(ATTR_BRIGHTNESS),
            zones={self._index: xy} if xy else None,
            transition=kwargs.get(ATTR_TRANSITION),
        )
