# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus's devices follow the bridge: one that is gone from the bridge is gone from Home Assistant.

The Hue integration removes a device when the bridge deletes it, but only the devices it made itself. Hue Plus's devices
have the same Hue ids under Hue Plus's own domain, so nothing else would ever remove them: an accessory taken off the
bridge stayed in Home Assistant with all its entities. This does for Hue Plus's devices what the Hue integration does for
its own: it removes one when the bridge reports it deleted, and, when Hue Plus starts, any that the bridge no longer has
(deleted while Home Assistant was not running).
"""

from __future__ import annotations

from aiohue.v2.controllers.events import EventType
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr

from .const import DOMAIN
from .runtime import HuePlusConfigEntry


@callback
def async_forget_removed_devices(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    runtime = entry.runtime_data
    api = runtime.link.api
    registry = dr.async_get(hass)

    # The bridge is always one of its own devices. If it lists none, its data has not loaded, and every device would look removed.
    if next(iter(api.devices), None) is None:
        return
    controllers = (api.devices, api.groups.room, api.groups.zone, api.config.service_group)

    on_bridge = {runtime.uid, f"{runtime.uid}_sync"}  # the bridge's device, and the device of the Spotify sync (not a bridge resource)
    for controller in controllers:
        on_bridge.update(resource.id for resource in controller)
    for device in dr.async_entries_for_config_entry(registry, entry.entry_id):
        if not {ident for domain, ident in device.identifiers if domain == DOMAIN} & on_bridge:
            registry.async_remove_device(device.id)

    @callback
    def forget(event: EventType, resource) -> None:
        device = registry.async_get_device_by_identifier((DOMAIN, resource.id), entry.entry_id)
        if device is not None:
            registry.async_remove_device(device.id)

    for controller in controllers:
        entry.async_on_unload(controller.subscribe(forget, event_filter=EventType.RESOURCE_DELETED))
