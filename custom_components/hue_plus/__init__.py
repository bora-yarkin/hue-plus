# SPDX-License-Identifier: GPL-3.0-or-later
"""Philips Hue Plus: everything the Hue bridge can do that the Hue integration does not show.

Four modules, each switched on or off per bridge: ``bridge`` (firmware, apps, automations, scenes, rooms, zones,
entertainment areas, Matter, settings, effects), ``zones`` (per-zone control of gradient lights), ``scenes`` (live scenes
that move a palette across the lights of an area) and ``sync`` (Hue's cloud Spotify sync). It rides on the connection the
Hue integration already has to the bridge, so there is no second login, or connects to the bridge itself (``direct.py``).

Unofficial; not affiliated with or endorsed by Signify.
"""

from __future__ import annotations

import logging

import aiohttp
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError, ConfigEntryNotReady
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from . import follow, forget, services, websocket
from .bridge.api import BridgeApi
from .bridge.connect import pin
from .connection import link_transport
from .const import (
    CONF_APP_KEY,
    CONF_CERT_SHA256,
    CONF_HOST,
    CONF_HUE_ENTRY,
    CONF_MODULES,
    CONF_STREAM_APP_ID,
    CONF_STREAM_APP_KEY,
    CONF_STREAM_CLIENT_KEY,
    CONF_SYNCBOX_HOST,
    CONF_SYNCBOX_REGISTRATION,
    CONF_SYNCBOX_TOKEN,
    DEFAULT_MODULES,
    MODULE_BRIDGE,
    MODULE_DEVICES,
    MODULE_LIGHTS,
    MODULE_SCENES,
    MODULE_STREAMING,
    MODULE_SYNC,
    connects_directly,
    replaces_hue,
)
from .coordinator import BridgeCoordinator
from .direct import DirectBridge
from .entity import bridge_device
from .lights import adopt
from .lights.alongside import async_follow_hue_settings
from .link import BridgeLink
from .runtime import HuePlusConfigEntry, Runtime, SyncBoxRuntime
from .scenes import setup as scenes_setup
from .streaming.manager import StreamingManager
from .streaming.register import transport as stream_transport
from .sync import setup as sync_setup
from .syncbox.client import SyncBox, SyncBoxError
from .syncbox.coordinator import SyncBoxCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.EVENT,
    Platform.LIGHT,
    Platform.NUMBER,
    Platform.SCENE,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.TIME,
    Platform.UPDATE,
]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    services.async_register(hass)
    websocket.async_register(hass)
    return True


async def _async_setup_syncbox(hass: HomeAssistant, entry: HuePlusConfigEntry) -> bool:
    """A Hue Play HDMI Sync Box: no bridge, no modules; its entities come from the ``syncbox`` package."""
    box = SyncBox(async_get_clientsession(hass), entry.data[CONF_SYNCBOX_HOST], entry.data[CONF_SYNCBOX_TOKEN])
    coordinator = SyncBoxCoordinator(hass, entry, box)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = SyncBoxRuntime(uid=entry.unique_id or entry.entry_id, coordinator=coordinator)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry) -> bool:
    if CONF_SYNCBOX_HOST in entry.data:
        return await _async_setup_syncbox(hass, entry)
    link = await (_async_direct_link(hass, entry) if connects_directly(entry) else _async_hue_link(hass, entry))
    runtime = Runtime(
        link=link,
        modules=frozenset(entry.options.get(CONF_MODULES, DEFAULT_MODULES)),
        uid=link.uid,
        bridge_name=_bridge_name(hass, link),
    )
    entry.runtime_data = runtime
    if replaces_hue(entry):
        if MODULE_LIGHTS not in runtime.modules:
            # The lights module is off: the Hue integration's lights are given back (this is also how switching it off works).
            adopt.async_release(hass, link.hue_entry_id, adopt.LIGHT_DOMAINS, entry.entry_id)
        if MODULE_DEVICES not in runtime.modules:
            adopt.async_release(hass, link.hue_entry_id, adopt.DEVICE_DOMAINS, entry.entry_id)
    runtime.bridge_device_id = dr.async_get(hass).async_get_or_create(config_entry_id=entry.entry_id, **bridge_device(runtime)).id
    if MODULE_BRIDGE in runtime.modules:
        api = BridgeApi(link_transport(link), lambda: link.app_key)
        runtime.coordinator = BridgeCoordinator(hass, entry, api, runtime)
        await runtime.coordinator.async_config_entry_first_refresh()
    if MODULE_SCENES in runtime.modules:
        runtime.scenes = await scenes_setup.async_setup(hass, entry)
    if MODULE_SYNC in runtime.modules:
        runtime.sync = sync_setup.create(hass, entry)
    if MODULE_STREAMING in runtime.modules:
        runtime.streaming = _streaming(hass, entry, link)
        entry.async_on_unload(runtime.streaming.stop)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    forget.async_forget_removed_devices(hass, entry)
    follow.async_follow_hue(hass, entry)
    async_follow_hue_settings(hass, entry)
    if runtime.sync is not None:
        sync_setup.start(hass, entry, runtime.sync)
    entry.async_on_unload(entry.add_update_listener(_reload))
    return True


def _streaming(hass: HomeAssistant, entry: HuePlusConfigEntry, link: BridgeLink) -> StreamingManager:
    """Local streaming with Hue Plus's own registration (the Hue integration's key cannot stream)."""
    if not all(entry.data.get(key) for key in (CONF_STREAM_APP_KEY, CONF_STREAM_CLIENT_KEY, CONF_STREAM_APP_ID)):
        raise ConfigEntryError("Streaming is switched on but has no registration with the bridge; add it in the options")
    host = link.host
    api = BridgeApi(
        stream_transport(async_get_clientsession(hass), host, entry.data[CONF_STREAM_APP_KEY], link.tls),
        lambda: entry.data[CONF_STREAM_APP_KEY],
    )
    return StreamingManager(
        api,
        host,
        entry.data[CONF_STREAM_APP_ID],
        entry.data[CONF_STREAM_CLIENT_KEY],
        lambda coroutine, name: entry.async_create_background_task(hass, coroutine, name),
    )


async def _async_hue_link(hass: HomeAssistant, entry: HuePlusConfigEntry) -> BridgeLink:
    """Rides on the Hue integration's connection, which has to be there."""
    hue_entry = hass.config_entries.async_get_entry(entry.data[CONF_HUE_ENTRY])
    if hue_entry is None:
        raise ConfigEntryError("The Hue integration entry this was set up for no longer exists")
    if hue_entry.state is not ConfigEntryState.LOADED:
        raise ConfigEntryNotReady("The Hue integration is not loaded yet")
    return BridgeLink.of_hue_entry(hue_entry)


async def _async_direct_link(hass: HomeAssistant, entry: HuePlusConfigEntry) -> BridgeLink:
    """Connects to the bridge with Hue Plus's own registration; the connection is closed when the entry unloads."""
    bridge = DirectBridge(hass, entry)
    await bridge.async_initialize()
    entry.async_on_unload(bridge.async_close)
    return BridgeLink(
        uid=entry.unique_id or entry.entry_id,
        title=entry.title,
        host=lambda: entry.data[CONF_HOST],
        app_key=lambda: entry.data[CONF_APP_KEY],
        bridge=lambda: bridge,
        hue_entry=None,
        tls=lambda: pin(entry.data[CONF_CERT_SHA256]),
    )


def _bridge_name(hass: HomeAssistant, link: BridgeLink) -> str:
    """What the bridge's device is called (for example "Hue Bridge Pro"), so entity ids read well."""
    if link.hue_entry is None:
        device = getattr(link.api.config, "bridge_device", None)
        name = getattr(getattr(device, "product_data", None), "product_name", None)
        return name or link.title
    devices = dr.async_entries_for_config_entry(dr.async_get(hass), link.hue_entry.entry_id)
    bridge = next((d for d in devices if d.via_device_id is None), None)
    return (bridge.name_by_user or bridge.name) if bridge and (bridge.name_by_user or bridge.name) else link.title


async def _reload(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """The modules or the credentials changed."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: HuePlusConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_migrate_entry(hass: HomeAssistant, entry: HuePlusConfigEntry) -> bool:
    """Version 2 added the lights module and version 3 the devices module; an older entry gets them, as new entries do."""
    modules = list(entry.options.get(CONF_MODULES, DEFAULT_MODULES))
    if entry.version < 2 and MODULE_LIGHTS not in modules:
        modules.append(MODULE_LIGHTS)
    if entry.version < 3 and MODULE_DEVICES not in modules:
        modules.append(MODULE_DEVICES)
    if entry.version < 3:
        hass.config_entries.async_update_entry(entry, options={**entry.options, CONF_MODULES: modules}, version=3)
    return True


async def async_remove_entry(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """Hue Plus is removed: the Hue integration's lights are given back under their own names. A sync box forgets its registration."""
    if CONF_SYNCBOX_HOST in entry.data:
        box = SyncBox(async_get_clientsession(hass), entry.data[CONF_SYNCBOX_HOST], entry.data[CONF_SYNCBOX_TOKEN])
        try:
            await box.unregister(entry.data[CONF_SYNCBOX_REGISTRATION])
        except SyncBoxError as err:
            _LOGGER.warning("The sync box could not be told to forget Hue Plus (%s); remove it in the Hue app if you want to", err)
        return
    if connects_directly(entry):
        await _async_revoke_registration(hass, entry)
        return
    if replaces_hue(entry):
        adopt.async_release(hass, entry.data[CONF_HUE_ENTRY], adopt.LIGHT_DOMAINS + adopt.DEVICE_DOMAINS)


async def _async_revoke_registration(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """The bridge forgets Hue Plus's registration (best effort: a bridge that cannot be reached keeps it until removed in the Hue app)."""
    key = entry.data[CONF_APP_KEY]
    try:
        async with async_get_clientsession(hass).delete(
            f"https://{entry.data[CONF_HOST]}/api/{key}/config/whitelist/{key}",
            ssl=pin(entry.data[CONF_CERT_SHA256]),
            timeout=aiohttp.ClientTimeout(total=10),
        ):
            pass
    except (aiohttp.ClientError, TimeoutError) as err:
        _LOGGER.warning(
            "The bridge could not be told to forget Hue Plus (%s); remove it under Apps in the Hue app if you want to", type(err).__name__
        )
