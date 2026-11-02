# SPDX-License-Identifier: GPL-3.0-or-later
"""What every module's services share: reading a field, finding the bridge a call is for, and the administrator check."""

from __future__ import annotations

import json
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError, Unauthorized
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN


def _object(value: Any) -> Any:
    """Data, or JSON text holding data (a service form hands over text)."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except ValueError as err:
            raise vol.Invalid(f"not valid JSON: {err}") from err
    if isinstance(value, (dict, list)):
        return value
    raise vol.Invalid("expected an object or a list")


def reader(definition: dict[str, Any]) -> Any:
    """The voluptuous validator for one field of a spec."""
    number = vol.Coerce(float)
    low, high = definition.get("min"), definition.get("max")
    integer = vol.All(vol.Coerce(int), vol.Range(min=low, max=high)) if low is not None or high is not None else vol.Coerce(int)
    readers = {
        "text": cv.string,
        "number": number,
        "int": integer,
        "bool": cv.boolean,
        "select": vol.In(definition.get("options") or []),
        "select_list": vol.All(cv.ensure_list, [vol.In(definition.get("options") or [])]),
        "list": vol.All(cv.ensure_list, [cv.string]),
        "object": _object,
        "xy": vol.All(_object, [vol.All([number], vol.Length(2, 2))]),
        "xy_one": vol.All(_object, vol.All([number], vol.Length(2, 2))),
        "lights": [dict],
        "time": cv.time,
    }
    return readers[definition["type"]]


def schema_for(fields: dict[str, dict[str, Any]]) -> vol.Schema:
    """The schema of a service: every field, and the optional ``config_entry_id`` that picks the bridge."""
    schema: dict[Any, Any] = {vol.Optional("config_entry_id"): cv.string}
    for field, definition in fields.items():
        marker = vol.Required(field) if definition["required"] else vol.Optional(field, default=definition.get("default", vol.UNDEFINED))
        schema[marker] = reader(definition)
    return vol.Schema(schema)


async def require_admin(hass: HomeAssistant, call: ServiceCall) -> None:
    """Only administrators may call these. A call with no user (an automation, script or another integration) is allowed:
    an administrator wrote it."""
    user_id = call.context.user_id
    if user_id is None:
        return
    user = await hass.auth.async_get_user(user_id)
    if user is None or not user.is_admin:
        raise Unauthorized(context=call.context, permission="admin")


def entry_for(hass: HomeAssistant, call: ServiceCall, module: str) -> ConfigEntry:
    """The loaded Hue Plus entry a call is for: the one named by ``config_entry_id``, or the only one with this module on."""
    entries = [e for e in hass.config_entries.async_loaded_entries(DOMAIN) if module in e.runtime_data.modules]
    wanted = call.data.get("config_entry_id")
    if wanted:
        entries = [e for e in entries if e.entry_id == wanted]
    if not entries:
        raise ServiceValidationError(f"No Hue Plus bridge with the {module} module switched on is loaded")
    if len(entries) > 1:
        raise ServiceValidationError("There is more than one bridge: give config_entry_id")
    return entries[0]
