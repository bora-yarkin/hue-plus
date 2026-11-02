# SPDX-License-Identifier: GPL-3.0-or-later
"""The streaming module inside Home Assistant: its registration in the options, and its two services."""

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import ServiceValidationError

from custom_components.hue_plus.bridge.api import BridgeError
from custom_components.hue_plus.const import (
    CONF_MODULES,
    CONF_STREAM_APP_ID,
    CONF_STREAM_APP_KEY,
    CONF_STREAM_CLIENT_KEY,
    DOMAIN,
)
from custom_components.hue_plus.streaming import register

KEYS = {CONF_STREAM_APP_KEY: "app-key", CONF_STREAM_CLIENT_KEY: "00" * 16, CONF_STREAM_APP_ID: "app-id"}


async def test_switching_streaming_on_asks_for_the_link_button_and_stores_the_keys(hass, make_entry):
    entry = await make_entry(["bridge"])
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "modules"})
    result = await hass.config_entries.options.async_configure(result["flow_id"], {CONF_MODULES: ["bridge", "streaming"]})
    assert result["step_id"] == "streaming"
    with patch("custom_components.hue_plus.config_flow.register", AsyncMock(side_effect=register.LinkButtonNotPressed("press"))):
        result = await hass.config_entries.options.async_configure(result["flow_id"], {})
    assert result["errors"] == {"base": "link_button_not_pressed"}
    with patch("custom_components.hue_plus.config_flow.register", AsyncMock(side_effect=BridgeError("down"))):
        result = await hass.config_entries.options.async_configure(result["flow_id"], {})
    assert result["errors"] == {"base": "cannot_connect"}
    done = register.Registration("app-key", "00" * 16, "app-id")
    with patch("custom_components.hue_plus.config_flow.register", AsyncMock(return_value=done)):
        result = await hass.config_entries.options.async_configure(result["flow_id"], {})
        assert result["type"] is FlowResultType.CREATE_ENTRY
        await hass.async_block_till_done()
    assert {key: entry.data[key] for key in KEYS} == KEYS and "streaming" in entry.options[CONF_MODULES]
    assert entry.runtime_data.streaming is not None


async def test_streaming_without_a_registration_does_not_load(hass, make_entry):
    entry = await make_entry(["bridge", "streaming"], loads=False)
    assert entry.state is ConfigEntryState.SETUP_ERROR


async def test_the_services_pass_the_request_to_the_manager_and_explain_a_bad_one(hass, make_entry):
    entry = await make_entry(["bridge", "streaming"], **KEYS)
    manager = entry.runtime_data.streaming
    with patch.object(manager, "stream", AsyncMock()) as stream, patch.object(manager, "stop", AsyncMock()) as stop:
        await hass.services.async_call(DOMAIN, "stream_colors", {"area": "TV", "colors": [[255, 0, 0]], "duration": 5}, blocking=True)
        stream.assert_awaited_once_with("TV", [(255, 0, 0)], 5)
        await hass.services.async_call(DOMAIN, "stop_streaming", {"area": "TV"}, blocking=True)
        stop.assert_awaited_once_with("TV")
        await hass.services.async_call(DOMAIN, "stop_streaming", {}, blocking=True)
        stop.assert_awaited_with(None)
        stream.side_effect = ValueError("No entertainment area called 'x'")
        with pytest.raises(ServiceValidationError, match="No entertainment area"):
            await hass.services.async_call(DOMAIN, "stream_colors", {"area": "x", "colors": [[1, 2, 3]], "duration": 5}, blocking=True)
        with pytest.raises(ServiceValidationError, match="list of"):
            await hass.services.async_call(DOMAIN, "stream_colors", {"area": "x", "colors": ["red"], "duration": 5}, blocking=True)


async def test_the_services_need_the_module(hass, make_entry):
    await make_entry(["bridge"])
    with pytest.raises(ServiceValidationError, match="streaming module"):
        await hass.services.async_call(DOMAIN, "stop_streaming", {}, blocking=True)


async def test_unloading_stops_every_stream(hass, make_entry):
    with patch("custom_components.hue_plus.streaming.manager.StreamingManager.stop", AsyncMock()) as stop:
        entry = await make_entry(["bridge", "streaming"], **KEYS)
        assert await hass.config_entries.async_unload(entry.entry_id)
        stop.assert_awaited_once_with()
    assert entry.state is ConfigEntryState.NOT_LOADED
