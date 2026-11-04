# SPDX-License-Identifier: GPL-3.0-or-later
"""Setting up, choosing modules, and the Spotify sync's credentials."""

from unittest.mock import patch

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.hue_plus.const import (
    CONF_AUTH,
    CONF_HUE_ENTRY,
    CONF_MODULES,
    CONF_TAKEOVER,
    CONF_UUID,
    DEFAULT_MODULES,
    DOMAIN,
    TAKEOVER_ALONGSIDE,
    TAKEOVER_REPLACE,
)
from custom_components.hue_plus.sync.client import GenesisRejected

from .fake_hue import BRIDGE_ID

CREDENTIALS = {CONF_AUTH: "a" * 27, CONF_UUID: "12345678-1234-1234-1234-123456789abc"}


async def start_bridge_flow(hass):
    """The first screen is a choice between a bridge and a sync box; this takes the bridge."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert result["type"] is FlowResultType.MENU and result["menu_options"] == ["bridge", "syncbox"]
    return await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "bridge"})


async def test_without_the_hue_integration_there_is_nothing_to_set_up(hass):
    result = await start_bridge_flow(hass)
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "no_hue_bridge"


async def test_a_hue_bridge_using_the_old_api_cannot_be_used(hass):
    MockConfigEntry(domain="hue", unique_id="old", data={"host": "x", "api_version": 1}).add_to_hass(hass)
    result = await start_bridge_flow(hass)
    assert result["reason"] == "no_hue_bridge"


async def test_a_bridge_is_added_after_one_question_that_defaults_to_leaving_the_hue_entities_alone(hass, hue_entry):
    with patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        result = await start_bridge_flow(hass)
        assert result["type"] is FlowResultType.FORM and result["step_id"] == "takeover"
        default = next(k for k in result["data_schema"].schema if k == CONF_TAKEOVER).default()
        assert default == TAKEOVER_ALONGSIDE
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_TAKEOVER: default})
        assert result["type"] is FlowResultType.CREATE_ENTRY
        assert result["data"] == {CONF_HUE_ENTRY: hue_entry.entry_id, CONF_TAKEOVER: TAKEOVER_ALONGSIDE}
        assert result["options"][CONF_MODULES] == list(DEFAULT_MODULES)
        assert result["result"].unique_id == BRIDGE_ID
        again = await start_bridge_flow(hass)
    assert again["type"] is FlowResultType.ABORT and again["reason"] == "already_configured"


async def test_hiding_and_renaming_can_be_chosen(hass, hue_entry):
    with patch("custom_components.hue_plus.async_setup_entry", return_value=True):
        result = await start_bridge_flow(hass)
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_TAKEOVER: TAKEOVER_REPLACE})
    assert result["data"][CONF_TAKEOVER] == TAKEOVER_REPLACE


async def test_modules_can_be_changed_and_the_integration_reloads(hass, make_entry):
    entry = await make_entry(["bridge"])
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "modules"})
    result = await hass.config_entries.options.async_configure(result["flow_id"], {CONF_MODULES: ["bridge", "scenes"]})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert entry.options[CONF_MODULES] == ["bridge", "scenes"]
    assert entry.runtime_data.scenes is not None


async def test_switching_the_sync_on_asks_for_credentials_and_checks_them(hass, make_entry):
    entry = await make_entry(["bridge"])
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "modules"})
    result = await hass.config_entries.options.async_configure(result["flow_id"], {CONF_MODULES: ["bridge", "sync"]})
    assert result["step_id"] == "credentials"
    with patch("custom_components.hue_plus.config_flow.async_probe", side_effect=GenesisRejected):
        result = await hass.config_entries.options.async_configure(result["flow_id"], CREDENTIALS)
    assert result["errors"] == {"base": "invalid_auth"}
    with (
        patch("custom_components.hue_plus.config_flow.async_probe"),
        patch("custom_components.hue_plus.sync.setup.start"),
    ):
        result = await hass.config_entries.options.async_configure(result["flow_id"], CREDENTIALS)
        assert result["type"] is FlowResultType.CREATE_ENTRY
        await hass.async_block_till_done()
    assert entry.data[CONF_AUTH] == CREDENTIALS[CONF_AUTH] and "sync" in entry.options[CONF_MODULES]
    assert entry.runtime_data.sync is not None


async def test_a_credentials_file_in_the_configuration_folder_is_ignored(hass, make_entry, tmp_path):
    entry = await make_entry(["bridge"])
    token_file = tmp_path / "hue_plus_spotify_token.json"
    token_file.write_text('{"auth": "' + "b" * 27 + '", "uuid": "u-1"}')
    hass.config.config_dir = str(tmp_path)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "credentials"})
    assert result["type"] is FlowResultType.FORM and result["step_id"] == "credentials"
    assert CONF_AUTH not in entry.data and token_file.exists()


async def test_re_authentication_asks_for_a_new_token_and_replaces_it(hass, make_entry):
    entry = await make_entry(["bridge"], **CREDENTIALS)
    result = await entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_credentials"
    new = {CONF_AUTH: "c" * 27, CONF_UUID: CREDENTIALS[CONF_UUID]}
    with patch("custom_components.hue_plus.config_flow.async_probe"), patch("custom_components.hue_plus.sync.setup.start"):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], new)
        await hass.async_block_till_done()
    assert result["type"] is FlowResultType.ABORT and result["reason"] == "reauth_successful"
    assert entry.data[CONF_AUTH] == "c" * 27


async def test_re_authentication_refuses_another_hue_account(hass, make_entry):
    entry = await make_entry(["bridge"], **CREDENTIALS)
    result = await entry.start_reauth_flow(hass)
    with patch("custom_components.hue_plus.config_flow.async_probe"):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_AUTH: "c" * 27, CONF_UUID: "another-account"})
    assert result["errors"] == {"base": "wrong_account"}
    assert entry.data[CONF_AUTH] == CREDENTIALS[CONF_AUTH]
