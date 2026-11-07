# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus serves the one script Home Control loads for administrators."""

from homeassistant.setup import async_setup_component

from custom_components.hue_plus.const import DOMAIN


async def test_hue_plus_serves_its_folder_when_it_loads(hass):
    assert await async_setup_component(hass, DOMAIN, {})
    paths = {
        route.resource.canonical for route in hass.http.app.router.routes() if hasattr(route, "resource") and route.resource is not None
    }
    assert any(p.startswith("/hue_plus_static") for p in paths), paths
