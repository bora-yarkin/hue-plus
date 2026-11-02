# SPDX-License-Identifier: GPL-3.0-or-later
"""Fixtures for the tests that run the integration inside a (test) Home Assistant."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hue_plus.const import CONF_HUE_ENTRY, CONF_MODULES, DOMAIN

from .fake_hue import APP_KEY, BRIDGE_ID, FakeHueApi


@pytest.fixture(autouse=True)
def _custom_integrations(enable_custom_integrations):
    yield


class FakeBridge:
    """The Hue integration's bridge object: its API client, and the reset Home Assistant calls when it unloads."""

    def __init__(self, api: FakeHueApi) -> None:
        self.api = api

    async def async_reset(self) -> bool:
        return True


@pytest.fixture
def bridge() -> FakeHueApi:
    return FakeHueApi()


@pytest.fixture
def hue_entry(hass: HomeAssistant, bridge: FakeHueApi) -> MockConfigEntry:
    """A loaded Hue integration entry whose connection is the fake bridge."""
    entry = MockConfigEntry(
        domain="hue", unique_id=BRIDGE_ID, title="Hue Bridge Pro", data={"host": "192.0.2.1", "api_key": APP_KEY, "api_version": 2}
    )
    entry.add_to_hass(hass)
    entry.runtime_data = FakeBridge(bridge)
    entry.mock_state(hass, ConfigEntryState.LOADED)
    return entry


@pytest.fixture
def make_entry(hass: HomeAssistant, hue_entry: MockConfigEntry):
    """Adds a Hue Plus entry with the given modules and sets it up."""

    async def make(modules: list[str] | None = None, *, loads: bool = True, **data) -> MockConfigEntry:
        entry = MockConfigEntry(
            domain=DOMAIN,
            version=3,
            unique_id=BRIDGE_ID,
            title="Hue Bridge Pro Plus",
            data={CONF_HUE_ENTRY: hue_entry.entry_id, **data},
            options={CONF_MODULES: modules if modules is not None else ["bridge", "zones", "scenes"]},
        )
        entry.add_to_hass(hass)
        with patch("homeassistant.components.hue.async_setup_entry", return_value=True):
            assert await hass.config_entries.async_setup(entry.entry_id) is loads
            await hass.async_block_till_done()
        return entry

    return make
