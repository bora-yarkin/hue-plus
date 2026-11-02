# SPDX-License-Identifier: GPL-3.0-or-later
"""Lets a screen read the saved scenes, areas and presets in one request."""

from __future__ import annotations

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from ..const import DOMAIN, MODULE_SCENES


@websocket_api.websocket_command({vol.Required("type"): "hue_plus/library", vol.Optional("config_entry_id"): str})
@websocket_api.async_response
async def library(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    entries = [
        e
        for e in hass.config_entries.async_loaded_entries(DOMAIN)
        if MODULE_SCENES in e.runtime_data.modules and msg.get("config_entry_id") in (None, e.entry_id)
    ]
    if len(entries) != 1:
        connection.send_error(msg["id"], "not_found", "Exactly one Hue Plus bridge with the scenes module must match; give config_entry_id")
        return
    connection.send_result(
        msg["id"], {**entries[0].runtime_data.scenes.library.listing(), "running": entries[0].runtime_data.scenes.engine.snapshot()}
    )


def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, library)
