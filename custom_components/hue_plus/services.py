# SPDX-License-Identifier: GPL-3.0-or-later
"""Registers the services of every module once, when the integration loads. A service is for the bridge named by
``config_entry_id``, or for the only one that has its module switched on."""

from __future__ import annotations

from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse

from .bridge import services as bridge_services
from .const import DOMAIN
from .scenes import services as scenes_services
from .services_base import schema_for
from .spec import SPEC, fields_of
from .streaming import services as streaming_services
from .zones import services as zones_services

HANDLERS = {**bridge_services.HANDLERS, **zones_services.HANDLERS, **scenes_services.HANDLERS, **streaming_services.HANDLERS}
RESPONDING = bridge_services.RESPONDING | scenes_services.RESPONDING | set(zones_services.RESPONDING)
assert set(HANDLERS) == set(SPEC), "every service needs a handler and every handler a spec"


def async_register(hass: HomeAssistant) -> None:
    for name, handler in HANDLERS.items():

        async def handle(call: ServiceCall, handler=handler):
            return await handler(hass, call)

        hass.services.async_register(
            DOMAIN,
            name,
            handle,
            schema=schema_for(fields_of(name)),
            supports_response=SupportsResponse.OPTIONAL if name in RESPONDING else SupportsResponse.NONE,
        )
