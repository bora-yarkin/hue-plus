# SPDX-License-Identifier: GPL-3.0-or-later
"""Websocket commands for screens: what Hue Plus offers on each bridge, so a dashboard can show only what exists."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .bridge import models
from .connection import api_or_none, read
from .const import DOMAIN, HUE_DOMAIN
from .runtime import HuePlusConfigEntry, Runtime
from .spec import MODULE_OF


async def _bridge_lights(hass: HomeAssistant, entry: HuePlusConfigEntry) -> dict[str, dict[str, Any]]:
    """What each light of the bridge can do, by the Home Assistant entity of the light. The bridge is asked now (one request)."""
    api = api_or_none(entry.runtime_data.link)
    if api is None:
        return {}
    registry = er.async_get(hass)
    out: dict[str, dict[str, Any]] = {}
    for light in await read(api, "clip/v2/resource/light"):
        features = models.light_features(light)
        entity = registry.async_get_entity_id("light", DOMAIN, light["id"]) or registry.async_get_entity_id(
            "light", HUE_DOMAIN, light["id"]
        )
        if entity:
            features["entity_id"] = entity
        out[entity or light["id"]] = features
    return out


@websocket_api.websocket_command({vol.Required("type"): "hue_plus/capabilities"})
@websocket_api.async_response
async def capabilities(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Every loaded bridge: its modules, its lights' abilities and the services of the modules that are on."""
    bridges = []
    for entry in hass.config_entries.async_loaded_entries(DOMAIN):
        runtime = entry.runtime_data
        if not isinstance(runtime, Runtime):
            continue
        bridges.append(
            {
                "config_entry_id": entry.entry_id,
                "bridge": runtime.uid,
                "name": runtime.bridge_name,
                "modules": sorted(runtime.modules),
                "services": sorted(name for name, module in MODULE_OF.items() if module in runtime.modules),
                "lights": await _bridge_lights(hass, entry),
                "sync_entity": next(
                    (
                        e.entity_id
                        for e in er.async_entries_for_config_entry(er.async_get(hass), entry.entry_id)
                        if e.unique_id == f"{runtime.uid}_sync_sync"
                    ),
                    None,
                ),
            }
        )
    connection.send_result(msg["id"], {"version": 1, "bridges": bridges})


def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, capabilities)
