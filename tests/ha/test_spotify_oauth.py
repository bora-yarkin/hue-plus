# SPDX-License-Identifier: GPL-3.0-or-later
"""Developer OAuth config-entry flow and renewal against a real HA instance."""

from __future__ import annotations

import json
import time
from unittest.mock import AsyncMock, Mock, patch
from urllib.parse import parse_qs, urlsplit

import pytest
from aiohttp import web
from homeassistant.components.application_credentials import ClientCredential, async_import_client_credential
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import OAuth2TokenRequestConnectionError
from homeassistant.helpers.config_entry_oauth2_flow import MY_AUTH_CALLBACK_PATH, _decode_jwt, _encode_jwt

from custom_components.hue_plus.application_credentials import HueDeveloperOAuth
from custom_components.hue_plus.const import (
    CONF_AUTH,
    CONF_AUTH_IMPLEMENTATION,
    CONF_MODULES,
    CONF_OAUTH_TOKEN,
    CONF_SYNC_APP_ID,
    CONF_UUID,
    DOMAIN,
)
from custom_components.hue_plus.sync.client import GenesisRejected, GenesisUnavailable, async_probe
from custom_components.hue_plus.sync.oauth import sync_session

UUID = "12345678-1234-1234-1234-123456789abc"
APP = "developer-test"
APP_DOMAIN = "test-hue"
TOKENS = {"access_token": "test-access", "refresh_token": "test-refresh", "expires_in": 600}


async def authorize(hass, entry):
    hass.config.components.add("my")
    await async_import_client_credential(hass, DOMAIN, ClientCredential("developer-id", "developer-secret"), APP_DOMAIN)
    result = await entry.start_reconfigure_flow(hass)
    configure = hass.config_entries.flow.async_configure
    result = await configure(result["flow_id"], {"next_step_id": "sync_developer"})
    assert result["description_placeholders"]["redirect"] == MY_AUTH_CALLBACK_PATH
    result = await configure(result["flow_id"], {CONF_SYNC_APP_ID: APP, CONF_UUID: UUID})
    if result["type"] is FlowResultType.FORM:
        result = await configure(result["flow_id"], {"implementation": APP_DOMAIN})
    assert result["type"] is FlowResultType.EXTERNAL_STEP
    params = parse_qs(urlsplit(result["url"]).query)
    assert params["client_id"] == ["developer-id"]
    assert params["appid"] == [APP]
    assert params["redirect_uri"] == [MY_AUTH_CALLBACK_PATH]
    assert "developer-secret" not in result["url"]
    return result["flow_id"], _decode_jwt(hass, params["state"][0])


async def complete(hass, flow_id, state):
    result = await hass.config_entries.flow.async_configure(flow_id, {"code": "test-code", "state": state})
    assert result["type"] is FlowResultType.EXTERNAL_STEP_DONE
    return await hass.config_entries.flow.async_configure(flow_id)


async def test_developer_oauth_updates_existing_entry_then_manual_can_replace_it(hass, make_entry, hass_client_no_auth):
    entry = await make_entry(["bridge"], **{CONF_AUTH: "manual", CONF_UUID: UUID})
    flow_id, state = await authorize(hass, entry)
    with (
        patch.object(HueDeveloperOAuth, "_token_request", AsyncMock(return_value=TOKENS.copy())) as exchange,
        patch("custom_components.hue_plus.config_flow.async_probe") as probe,
        patch("custom_components.hue_plus.sync.setup.start"),
    ):
        client = await hass_client_no_auth()
        response = await client.get("/auth/external/callback", params={"code": "test-code", "state": _encode_jwt(hass, state)})
        assert response.status == 200
        result = await hass.config_entries.flow.async_configure(flow_id)
        await hass.async_block_till_done()
    assert result["reason"] == "sync_developer_successful"
    exchange.assert_awaited_once_with(
        {"grant_type": "authorization_code", "code": "test-code", "redirect_uri": MY_AUTH_CALLBACK_PATH},
    )
    assert probe.await_args.args[2:] == ("test-access", UUID)
    assert CONF_AUTH not in entry.data
    assert entry.data[CONF_AUTH_IMPLEMENTATION] == APP_DOMAIN
    assert entry.data[CONF_OAUTH_TOKEN]["refresh_token"] == "test-refresh"
    assert "sync" in entry.options[CONF_MODULES]
    assert entry.runtime_data.sync.oauth is not None
    assert len(hass.config_entries.async_entries(DOMAIN)) == 1

    result = await hass.config_entries.options.async_init(entry.entry_id)
    configure = hass.config_entries.options.async_configure
    result = await configure(result["flow_id"], {"next_step_id": "credentials"})
    with patch("custom_components.hue_plus.config_flow.async_probe"), patch("custom_components.hue_plus.sync.setup.start"):
        await configure(result["flow_id"], {CONF_AUTH: "new-manual", CONF_UUID: UUID})
        await hass.async_block_till_done()
    assert entry.data[CONF_AUTH] == "new-manual"
    assert CONF_OAUTH_TOKEN not in entry.data and CONF_AUTH_IMPLEMENTATION not in entry.data and CONF_SYNC_APP_ID not in entry.data


async def test_refused_oauth_uuid_leaves_previous_credentials_in_place(hass, make_entry):
    entry = await make_entry(["bridge"], **{CONF_AUTH: "manual", CONF_UUID: UUID})
    flow_id, state = await authorize(hass, entry)
    with (
        patch.object(HueDeveloperOAuth, "_token_request", AsyncMock(return_value=TOKENS.copy())),
        patch("custom_components.hue_plus.config_flow.async_probe", side_effect=GenesisRejected),
    ):
        result = await complete(hass, flow_id, state)
    assert result["reason"] == "invalid_auth"
    assert entry.data[CONF_AUTH] == "manual" and CONF_OAUTH_TOKEN not in entry.data


async def test_expired_token_rotates_without_reloading_bridge_and_is_reused_after_reload(hass, make_entry):
    with patch("custom_components.hue_plus.sync.setup.start"):
        entry = await make_entry(
            ["bridge", "sync"],
            **{
                CONF_UUID: UUID,
                CONF_SYNC_APP_ID: APP,
                CONF_AUTH_IMPLEMENTATION: APP_DOMAIN,
                CONF_OAUTH_TOKEN: {**TOKENS, "expires_at": time.time() - 1},
            },
        )
        runtime = entry.runtime_data
        new = {**TOKENS, "access_token": "renewed", "refresh_token": "rotated", "expires_at": time.time() + 600}
        implementation = Mock(async_refresh_token=AsyncMock(return_value=new))
        with patch("custom_components.hue_plus.sync.oauth.async_get_config_entry_implementation", return_value=implementation):
            assert (await runtime.sync.oauth.access())[0] == "renewed"
            await hass.async_block_till_done()
        assert entry.runtime_data is runtime
        assert entry.data[CONF_OAUTH_TOKEN]["refresh_token"] == "rotated"
        assert await hass.config_entries.async_reload(entry.entry_id)
        assert entry.runtime_data is not runtime
        assert not sync_session(hass).closed
        assert (await entry.runtime_data.sync.oauth.access())[0] == "renewed"


async def test_token_endpoint_sends_basic_and_bounds_the_result(hass):
    async def chunks(size):
        yield json.dumps(TOKENS).encode()

    response = Mock(status=200, content=Mock(iter_chunked=chunks))
    request = AsyncMock()
    request.__aenter__.return_value = response
    session = Mock(post=Mock(return_value=request))
    from custom_components.hue_plus.application_credentials import SERVER

    implementation = HueDeveloperOAuth(hass, APP_DOMAIN, ClientCredential("test-user", "test-secret"), SERVER)
    with patch("custom_components.hue_plus.application_credentials.async_get_clientsession", return_value=session):
        token = await implementation.async_refresh_token(TOKENS)
    assert token["refresh_token"] == "test-refresh"
    assert session.post.call_args.kwargs == {
        "data": {"grant_type": "refresh_token", "refresh_token": "test-refresh"},
        "headers": {"Authorization": "Basic dGVzdC11c2VyOnRlc3Qtc2VjcmV0"},
        "allow_redirects": False,
        "timeout": 15,
    }


async def test_developer_reauth_prompts_before_opening_the_browser(hass, make_entry):
    entry = await make_entry(
        ["bridge"],
        **{
            CONF_UUID: UUID,
            CONF_SYNC_APP_ID: APP,
            CONF_AUTH_IMPLEMENTATION: APP_DOMAIN,
            CONF_OAUTH_TOKEN: {**TOKENS, "expires_at": time.time() - 1},
        },
    )
    hass.config.components.add("my")
    await async_import_client_credential(hass, DOMAIN, ClientCredential("developer-id", "developer-secret"), APP_DOMAIN)
    result = await entry.start_reauth_flow(hass, context={"reauth_for": "sync"})
    assert result["step_id"] == "sync_developer_reauth"
    configure = hass.config_entries.flow.async_configure
    result = await configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.EXTERNAL_STEP
    params = parse_qs(urlsplit(result["url"]).query)
    assert params["appid"] == [APP]
    state = _decode_jwt(hass, params["state"][0])
    with (
        patch.object(HueDeveloperOAuth, "_token_request", AsyncMock(return_value={**TOKENS, "access_token": "new-access"})),
        patch("custom_components.hue_plus.config_flow.async_probe"),
    ):
        result = await complete(hass, result["flow_id"], state)
        await hass.async_block_till_done()
    assert result["reason"] == "sync_developer_successful"
    assert entry.data[CONF_UUID] == UUID
    assert entry.data[CONF_OAUTH_TOKEN]["access_token"] == "new-access"


async def test_mismatched_oauth_callback_does_not_exchange_code(hass, make_entry):
    entry = await make_entry(["bridge"])
    flow_id, state = await authorize(hass, entry)
    state["redirect_uri"] = "https://example.invalid/"
    with patch.object(HueDeveloperOAuth, "_token_request", AsyncMock()) as request:
        result = await hass.config_entries.flow.async_configure(flow_id, {"code": "test-code", "state": state})
        assert result["type"] is FlowResultType.EXTERNAL_STEP_DONE
        result = await hass.config_entries.flow.async_configure(flow_id)
    assert result["reason"] == "oauth_failed"
    request.assert_not_awaited()


async def test_spotify_websocket_does_not_forward_auth_headers_on_redirect(hass, make_entry, aiohttp_client, socket_enabled):
    await make_entry(["bridge"])
    destination = Mock()

    async def redirect(request):
        assert request.headers["auth"] == "test-token"
        raise web.HTTPFound("/unexpected")

    async def unexpected(request):
        destination(request.headers)
        return web.Response()

    app = web.Application()
    app.router.add_get("/", redirect)
    app.router.add_get("/unexpected", unexpected)
    test_server = await aiohttp_client(app)
    with pytest.raises(GenesisUnavailable):
        await async_probe(sync_session(hass), str(test_server.make_url("/")), "test-token", UUID)
    destination.assert_not_called()


async def test_bad_developer_id_does_not_make_a_token_request(hass):
    from custom_components.hue_plus.application_credentials import SERVER

    implementation = HueDeveloperOAuth(hass, APP_DOMAIN, ClientCredential("invalid:id", "test-secret"), SERVER)
    with (
        patch("custom_components.hue_plus.application_credentials.async_get_clientsession") as session,
        pytest.raises(OAuth2TokenRequestConnectionError),
    ):
        await implementation.async_refresh_token(TOKENS)
    session.assert_not_called()
