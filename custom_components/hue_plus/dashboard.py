# SPDX-License-Identifier: GPL-3.0-or-later
"""The dashboard module: a sidebar panel of Hue Plus's own that looks and works like the Hue app.

It is separate from the Home Control dashboard and does not touch it: the panel is its own page (in an iframe, so its script and the
Home Control script never share a page), made of the same pages the Hue Plus menu has in Home Control's Settings plus the Hue app's
Home, Automations and Sync tabs. Every action in it is a call of a Hue Plus service or of Home Assistant's own light and scene services,
so Home Assistant's permission checks apply; the panel is for administrators because Hue Plus's services are.

The panel is registered once however many bridges have the module on, and removed when the last of them stops.
"""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

from .const import DOMAIN
from .runtime import HuePlusConfigEntry

PANEL_URL_PATH = "hue-plus"
PANEL_ELEMENT = "hue-plus-panel"
PANEL_TITLE = "Hue"
# The Hue logo, from the icon set that icon.js gives Home Assistant's pages.
PANEL_ICON = "hueplus:logo"
ICON_SCRIPT = "icon.js"
STATIC_URL = f"/{DOMAIN}_static"
FRONTEND = Path(__file__).parent / "frontend"
# The files of the panel: the loader Home Assistant opens, and the application it loads.
FILES = ("panel.js", "app.js", ICON_SCRIPT)

_LOGGER = logging.getLogger(__name__)
_USERS = f"{DOMAIN}_dashboard_panel"
_ICON_URL = f"{DOMAIN}_dashboard_icon"


def _version() -> str:
    """A short fingerprint of the panel's files, so a changed file is requested again whatever the browser or a proxy remembers."""
    digest = hashlib.sha256()
    for name in FILES:
        digest.update((FRONTEND / name).read_bytes())
    return digest.hexdigest()[:12]


async def async_enable(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """Registers the panel for this bridge, unless another bridge already has."""
    users: set[str] = hass.data.setdefault(_USERS, set())
    if not users:
        # Home Assistant's frontend is only needed when this module is on: it is set up here rather than required of every installation.
        if not await async_setup_component(hass, "panel_custom", {}):
            _LOGGER.error("The dashboard module needs Home Assistant's frontend, which could not be set up; the Hue panel is not added")
            del hass.data[_USERS]
            return
        version = await hass.async_add_executor_job(_version)
        # The sidebar is outside the panel's frame, so its icon is a script of Home Assistant's own pages (loaded when a page is next opened).
        icon_url = f"{STATIC_URL}/{ICON_SCRIPT}?v={version}"
        frontend.add_extra_js_url(hass, icon_url)
        hass.data[_ICON_URL] = icon_url
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name=PANEL_ELEMENT,
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            module_url=f"{STATIC_URL}/panel.js?v={version}",
            embed_iframe=True,
            require_admin=True,
            handle_safe_area=True,
            config={},
        )
    users.add(entry.entry_id)


def async_disable(hass: HomeAssistant, entry: HuePlusConfigEntry) -> None:
    """This bridge no longer has the module: the panel goes when no bridge does."""
    users: set[str] = hass.data.get(_USERS, set())
    users.discard(entry.entry_id)
    if not users and _USERS in hass.data:
        del hass.data[_USERS]
        frontend.async_remove_panel(hass, PANEL_URL_PATH)
        icon_url = hass.data.pop(_ICON_URL, None)
        # Unloading must not fail when Home Assistant's frontend has already gone (it is stopping).
        if icon_url and frontend.DATA_EXTRA_MODULE_URL in hass.data:
            frontend.remove_extra_js_url(hass, icon_url)
