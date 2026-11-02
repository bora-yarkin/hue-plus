# SPDX-License-Identifier: GPL-3.0-or-later
"""The services of the bridge module: one for each action. Only administrators may call them."""

from __future__ import annotations

import re
from typing import Any

from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import entity_registry as er

from ..const import DOMAIN, HUE_DOMAIN, MODULE_BRIDGE
from ..services_base import entry_for, require_admin
from . import actions
from .api import BridgeError

# A Home Assistant entity of the Hue integration: it is turned into the bridge's id for the light or scene.
HUE_ENTITY = re.compile(r"^(light|scene)\.[a-z0-9_]+$")


def _to_bridge_ids(hass: HomeAssistant, value: Any) -> Any:
    """Replaces Home Assistant entity ids of Hue lights and scenes (anywhere in the data) by the bridge's ids for them."""
    if isinstance(value, str) and HUE_ENTITY.match(value):
        entry = er.async_get(hass).async_get(value)
        if entry and entry.unique_id and entry.platform == HUE_DOMAIN:
            return entry.unique_id
        if entry and entry.unique_id and entry.platform == DOMAIN and value.startswith("light."):
            return entry.unique_id.split("_zone_")[0]
        return value
    if isinstance(value, list):
        return [_to_bridge_ids(hass, v) for v in value]
    if isinstance(value, dict):
        return {k: _to_bridge_ids(hass, v) for k, v in value.items()}
    return value


def handler_for(name: str, spec: actions.Action):
    async def handle(hass: HomeAssistant, call: ServiceCall) -> ServiceResponse:
        await require_admin(hass, call)
        coordinator = entry_for(hass, call, MODULE_BRIDGE).runtime_data.coordinator
        snapshot = await coordinator.async_fresh()
        data = _to_bridge_ids(hass, {k: v for k, v in call.data.items() if k != "config_entry_id"})
        try:
            result = await actions.run(name, coordinator.api, snapshot, data)
        except ValueError as err:
            raise ServiceValidationError(str(err)) from err
        except BridgeError as err:
            raise HomeAssistantError(str(err)) from err
        await coordinator.async_refresh()
        return result if spec.response else None

    return handle


HANDLERS = {name: handler_for(name, spec) for name, spec in actions.ACTIONS.items()}
RESPONDING = {name for name, spec in actions.ACTIONS.items() if spec.response}
