# SPDX-License-Identifier: GPL-3.0-or-later
"""The dashboard module: a Hue panel in the sidebar when it is on, nothing when it is off, one panel however many bridges."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from custom_components.hue_plus import dashboard
from custom_components.hue_plus.const import DEFAULT_MODULES, MODULE_DASHBOARD, MODULES


@pytest.fixture
def panel():
    """Home Assistant's panel registration, replaced so that what Hue Plus asks of it can be read."""
    with (
        patch("custom_components.hue_plus.dashboard.async_setup_component", AsyncMock(return_value=True)) as setup,
        patch("custom_components.hue_plus.dashboard.panel_custom.async_register_panel", AsyncMock()) as register,
        patch("custom_components.hue_plus.dashboard.frontend.async_remove_panel") as remove,
    ):
        yield type("Panel", (), {"setup": setup, "register": register, "remove": remove})


def test_the_module_is_offered_but_is_not_on_by_default():
    assert MODULE_DASHBOARD in MODULES
    assert MODULE_DASHBOARD not in DEFAULT_MODULES


async def test_without_the_module_no_panel_is_registered(make_entry, panel):
    await make_entry(["bridge", "zones"])
    panel.register.assert_not_called()


async def test_the_module_registers_an_administrators_only_panel_of_its_own(make_entry, panel):
    await make_entry(["bridge", "zones", MODULE_DASHBOARD])
    panel.register.assert_awaited_once()
    kwargs = panel.register.await_args.kwargs
    assert kwargs["frontend_url_path"] == dashboard.PANEL_URL_PATH
    assert kwargs["webcomponent_name"] == dashboard.PANEL_ELEMENT
    assert kwargs["require_admin"] is True
    assert kwargs["embed_iframe"] is True
    assert kwargs["module_url"].startswith("/hue_plus_static/panel.js?v=")


async def test_the_panel_is_registered_once_and_stays_until_the_last_bridge_stops(hass, panel):
    first, second = SimpleNamespace(entry_id="one"), SimpleNamespace(entry_id="two")
    await dashboard.async_enable(hass, first)
    await dashboard.async_enable(hass, second)
    panel.register.assert_awaited_once()

    dashboard.async_disable(hass, first)
    panel.remove.assert_not_called()
    dashboard.async_disable(hass, second)
    panel.remove.assert_called_once_with(hass, dashboard.PANEL_URL_PATH)


async def test_the_address_of_the_panel_changes_with_its_files(hass, panel):
    await dashboard.async_enable(hass, SimpleNamespace(entry_id="one"))
    with patch.object(dashboard, "_version", return_value="aaaaaaaaaaaa"):
        dashboard.async_disable(hass, SimpleNamespace(entry_id="one"))
        await dashboard.async_enable(hass, SimpleNamespace(entry_id="one"))
    assert panel.register.await_args.kwargs["module_url"].endswith("?v=aaaaaaaaaaaa")


async def test_unloading_the_only_bridge_removes_the_panel(hass, make_entry, panel):
    entry = await make_entry(["bridge", MODULE_DASHBOARD])
    assert await hass.config_entries.async_unload(entry.entry_id)
    panel.remove.assert_called_once_with(hass, dashboard.PANEL_URL_PATH)


async def test_a_missing_frontend_leaves_the_integration_working_without_a_panel(make_entry, panel):
    panel.setup.return_value = False
    entry = await make_entry(["bridge", MODULE_DASHBOARD])
    panel.register.assert_not_called()
    assert entry.state.value == "loaded"


def test_the_served_files_are_the_ones_the_panel_names():
    for name in dashboard.FILES:
        assert (dashboard.FRONTEND / name).is_file()
