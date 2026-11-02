# SPDX-License-Identifier: GPL-3.0-or-later
"""The services of the scenes module."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError

from ..const import MODULE_SCENES
from ..services_base import entry_for
from . import hue_import
from .actions import run_actions
from .definitions import DefinitionError, parse_brightness, parse_definition, parse_range, parse_speed
from .hue_only import hue_only, require_hue_lights
from .library import clean_area
from .setup import ScenesRuntime

RESPONDING = {"import_hue_scene", "get_library"}


def _scenes(hass: HomeAssistant, call: ServiceCall) -> ScenesRuntime:
    return entry_for(hass, call, MODULE_SCENES).runtime_data.scenes


async def scene_start(hass: HomeAssistant, call: ServiceCall) -> None:
    entry = entry_for(hass, call, MODULE_SCENES)
    scenes = entry.runtime_data.scenes
    try:
        request = scenes.library.request({k: v for k, v in call.data.items() if k != "config_entry_id"})
        definition = parse_definition(request)
        require_hue_lights(hass, entry, (light.entity_id for light in definition.lights))
        scenes.engine.start(definition)
    except (DefinitionError, ValueError) as err:
        raise ServiceValidationError(str(err)) from err
    if definition.actions:
        entry.async_create_background_task(hass, run_actions(hass, definition.actions, call.context), "hue_plus scene actions")


async def scene_update(hass: HomeAssistant, call: ServiceCall) -> None:
    data = call.data
    try:
        _scenes(hass, call).engine.update(
            data["scene_id"],
            speed=parse_speed(data["speed"]) if "speed" in data else None,
            range_pct=parse_range(data["range"]) if "range" in data else None,
            brightness=parse_brightness(data["brightness"]) if "brightness" in data else None,
        )
    except (DefinitionError, KeyError) as err:
        raise ServiceValidationError(str(err)) from err


def _on_running(method: str):
    async def handle(hass: HomeAssistant, call: ServiceCall) -> None:
        try:
            getattr(_scenes(hass, call).engine, method)(call.data["scene_id"])
        except KeyError as err:
            raise ServiceValidationError(str(err)) from err

    return handle


async def scene_stop(hass: HomeAssistant, call: ServiceCall) -> None:
    _scenes(hass, call).engine.stop(call.data["scene_id"])


async def scene_save(hass: HomeAssistant, call: ServiceCall) -> None:
    scenes = _scenes(hass, call)
    try:
        scenes.library.save_scene({k: v for k, v in call.data.items() if k != "config_entry_id"})
    except DefinitionError as err:
        raise ServiceValidationError(str(err)) from err
    scenes.save_later()


async def scene_delete(hass: HomeAssistant, call: ServiceCall) -> None:
    scenes = _scenes(hass, call)
    scenes.library.delete_scene(call.data["id"])
    scenes.save_later()


async def area_save(hass: HomeAssistant, call: ServiceCall) -> None:
    entry = entry_for(hass, call, MODULE_SCENES)
    scenes = entry.runtime_data.scenes
    try:
        area = clean_area({k: v for k, v in call.data.items() if k != "config_entry_id"})
        require_hue_lights(hass, entry, (light["entity_id"] for light in area["lights"]))
        scenes.library.save_area(area)
    except DefinitionError as err:
        raise ServiceValidationError(str(err)) from err
    scenes.save_later()


async def area_delete(hass: HomeAssistant, call: ServiceCall) -> None:
    scenes = _scenes(hass, call)
    scenes.library.delete_area(call.data["id"])
    scenes.save_later()


async def locate_light(hass: HomeAssistant, call: ServiceCall) -> None:
    entity_id = call.data["entity_id"]
    if not entity_id.startswith("light."):
        raise ServiceValidationError("locate_light takes a light")
    require_hue_lights(hass, entry_for(hass, call, MODULE_SCENES), [entity_id])
    identifier = _scenes(hass, call).identifier
    try:
        await (identifier.start(entity_id) if call.data["active"] else identifier.stop(entity_id))
    except ValueError as err:
        raise ServiceValidationError(str(err)) from err


async def import_hue_scene(hass: HomeAssistant, call: ServiceCall) -> dict[str, Any]:
    _scenes(hass, call)
    return await hue_import.read_scene(hass, call.data["entity_id"])


async def get_library(hass: HomeAssistant, call: ServiceCall) -> dict[str, Any]:
    entry = entry_for(hass, call, MODULE_SCENES)
    return {**entry.runtime_data.scenes.library.listing(), "hue_only": hue_only(entry)}


HANDLERS = {
    "scene_start": scene_start,
    "scene_update": scene_update,
    "scene_freeze": _on_running("freeze"),
    "scene_play": _on_running("play"),
    "scene_stop": scene_stop,
    "scene_save": scene_save,
    "scene_delete": scene_delete,
    "area_save": area_save,
    "area_delete": area_delete,
    "locate_light": locate_light,
    "import_hue_scene": import_hue_scene,
    "get_library": get_library,
}
