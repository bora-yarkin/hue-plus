# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus's devices and entities follow what the Hue integration does while Home Assistant keeps running.

Everything Hue Plus copies from the Hue integration is set up once, when Hue Plus starts. Two things then happen on the
bridge while it runs, and the Hue integration answers both on its own, so Hue Plus has to answer them too:

* A device or room is renamed in the Hue app. The Hue integration renames its device in the registry; Hue Plus's device has
  the same Hue id under Hue Plus's domain and kept the name it was created with.
* A device is added (a new dimmer switch). The Hue integration creates its entities, and only the ones that existed when
  Hue Plus started were hidden, so the new accessory showed up twice, once from each integration. Taking over is the same
  step as at startup (``adopt.async_adopt``), done shortly after the Hue integration has finished adding the entities.
"""

from __future__ import annotations

from aiohue.v2.controllers.events import EventType
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later

from .const import DOMAIN, HUE_DOMAIN, MODULE_DEVICES, MODULE_LIGHTS, replaces_hue
from .lights import adopt
from .runtime import HuePlusConfigEntry

# The Hue integration adds the entities of a new device over a few moments; renaming one while it is still being added
# would leave its state under the old entity id.
ADOPT_DELAY_SECONDS = 5.0


@callback
def async_follow_hue(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    runtime = entry.runtime_data
    _follow_renames(hass, entry)
    domains = (adopt.LIGHT_DOMAINS if MODULE_LIGHTS in runtime.modules else ()) + (
        adopt.DEVICE_DOMAINS if MODULE_DEVICES in runtime.modules else ()
    )
    if domains and replaces_hue(entry):  # next to the Hue integration nothing is taken over, so a new accessory needs nothing
        _take_over_new_entities(hass, entry, runtime.link.hue_entry_id, domains)


@callback
def _follow_renames(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """A device or room renamed on the bridge is renamed on its Hue Plus device."""
    api = entry.runtime_data.link.api
    devices = dr.async_get(hass)

    @callback
    def rename(event: EventType, resource) -> None:
        device = devices.async_get_device_by_identifier((DOMAIN, resource.id), entry.entry_id)
        if device is not None and device.name != resource.metadata.name:
            devices.async_update_device(device.id, name=resource.metadata.name)

    # The bridge is always one of its own devices; if it lists none, its data has not loaded (as in ``forget``).
    if next(iter(api.devices), None) is not None:
        for controller in (api.devices, api.groups.room, api.groups.zone, api.config.service_group):
            entry.async_on_unload(controller.subscribe(rename, event_filter=EventType.RESOURCE_UPDATED))


@callback
def _take_over_new_entities(hass: HomeAssistant, entry: HuePlusConfigEntry, hue_entry_id: str, domains: tuple[str, ...]) -> None:
    """Hides the Hue integration's entities of an accessory added while running, a few moments after they appear."""
    entities = er.async_get(hass)
    pending: CALLBACK_TYPE | None = None

    @callback
    def take_over(_now) -> None:
        nonlocal pending
        pending = None
        adopt.async_adopt(hass, hue_entry_id, domains)

    @callback
    def entity_added(event: Event) -> None:
        nonlocal pending
        if event.data["action"] != "create" or pending is not None:
            return
        added = entities.async_get(event.data["entity_id"])
        if added is not None and added.platform == HUE_DOMAIN and added.config_entry_id == hue_entry_id:
            pending = async_call_later(hass, ADOPT_DELAY_SECONDS, take_over)

    @callback
    def stop() -> None:
        if pending is not None:
            pending()

    entry.async_on_unload(hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, entity_added))
    entry.async_on_unload(stop)
