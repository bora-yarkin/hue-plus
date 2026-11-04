# SPDX-License-Identifier: GPL-3.0-or-later
"""Setup, options (which modules are on, and the Spotify sync's token and UUID) and re-authentication."""

from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import Any
from urllib.parse import parse_qs, urlsplit
from uuid import UUID

import aiohttp
import voluptuous as vol
from aiohue.discovery import discover_bridge
from aiohue.util import normalize_bridge_id
from homeassistant.config_entries import SOURCE_REAUTH, SOURCE_RECONFIGURE, ConfigEntry, ConfigFlowResult, FlowType, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.config_entry_oauth2_flow import AbstractOAuth2FlowHandler, async_get_redirect_uri
from homeassistant.helpers.network import NoURLAvailableError
from homeassistant.helpers.selector import (
    BooleanSelector,
    SelectSelector,
    SelectSelectorConfig,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .bridge.api import BridgeError
from .bridge.connect import peer_fingerprint, pin
from .const import (
    CONF_APP_KEY,
    CONF_AUTH,
    CONF_AUTH_IMPLEMENTATION,
    CONF_CERT_SHA256,
    CONF_HOST,
    CONF_HUE_ENTRY,
    CONF_MODULES,
    CONF_OAUTH_TOKEN,
    CONF_STREAM_APP_ID,
    CONF_STREAM_APP_KEY,
    CONF_STREAM_CLIENT_KEY,
    CONF_SYNC_APP_ID,
    CONF_SYNC_CLIENT_ID,
    CONF_SYNC_CLIENT_SECRET,
    CONF_SYNCBOX_HOST,
    CONF_SYNCBOX_REGISTRATION,
    CONF_SYNCBOX_TOKEN,
    CONF_TAKEOVER,
    CONF_UUID,
    DEFAULT_MODULES,
    DOMAIN,
    HUE_DOMAIN,
    MODULE_STREAMING,
    MODULE_SYNC,
    MODULES,
    SYNC_URL,
    TAKEOVER_ALONGSIDE,
    TAKEOVER_REPLACE,
    connects_directly,
)
from .streaming.register import LinkButtonNotPressed, Registration, register
from .sync.client import GenesisRejected, GenesisUnavailable, async_probe
from .sync.oauth import inline_oauth, sync_session
from .syncbox.client import SyncBox, SyncBoxError, SyncBoxRegistrationPending, valid_host

_LOGGER = logging.getLogger(__name__)
OAUTH_KEYS = (CONF_SYNC_APP_ID, CONF_SYNC_CLIENT_ID, CONF_SYNC_CLIENT_SECRET, CONF_AUTH_IMPLEMENTATION, CONF_OAUTH_TOKEN)
DEVELOPER_MODE = "use_developer_credentials"


class _SpotifyOptionsHandoff:
    """Carry the pending module selection between Home Assistant's two flows."""

    def __init__(self, modules: list[str]) -> None:
        self.modules = modules


CREDENTIALS_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_AUTH): TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD)),
        vol.Required(CONF_UUID): TextSelector(),
    }
)


class _CredentialsMixin:
    """Checking the sync credentials the user typed, for the options flow and for re-authentication."""

    async def _check(self, creds: dict[str, str]) -> str | None:
        """None when the service accepts the credentials, otherwise the error key."""
        try:
            await async_probe(sync_session(self.hass), SYNC_URL, creds[CONF_AUTH], creds[CONF_UUID])
        except GenesisRejected:
            return "invalid_auth"
        except GenesisUnavailable:
            return "cannot_connect"
        return None


SYNCBOX_SCHEMA = vol.Schema({vol.Required(CONF_SYNCBOX_HOST): TextSelector()})


HOST_SCHEMA = vol.Schema({vol.Required(CONF_HOST): TextSelector()})


class HuePlusConfigFlow(_CredentialsMixin, AbstractOAuth2FlowHandler, domain=DOMAIN):
    DOMAIN = DOMAIN
    VERSION = 3

    @property
    def logger(self) -> logging.Logger:
        return _LOGGER

    @property
    def extra_authorize_data(self) -> dict[str, str]:
        return {"appid": self._sync_app_id}

    def __init__(self) -> None:
        super().__init__()
        self._sync_app_id = ""
        self._sync_uuid = ""
        self._oauth_redirect = ""
        self._developer_credentials: dict[str, str] = {}
        self._host = ""
        self._fingerprint = ""
        self._box_host = ""
        self._box_name = ""
        self._bridge: ConfigEntry | None = None

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """A Hue bridge (through the Hue integration, when it has one, or directly) or a Hue Play HDMI Sync Box."""
        options = ["bridge_direct", "syncbox"]
        if self._hue_bridges():
            options.insert(0, "bridge")
        return self.async_show_menu(step_id="user", menu_options=options)

    def _hue_bridges(self) -> dict[str, ConfigEntry]:
        # Only bridges the Hue integration talks to over the v2 API can be used.
        return {e.entry_id: e for e in self.hass.config_entries.async_entries(HUE_DOMAIN) if e.data.get("api_version") == 2}

    async def async_step_bridge(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        bridges = self._hue_bridges()
        if not bridges:
            return self.async_abort(reason="no_hue_bridge")
        if user_input is None and len(bridges) > 1:
            schema = vol.Schema({vol.Required(CONF_HUE_ENTRY): vol.In({k: e.title for k, e in bridges.items()})})
            return self.async_show_form(step_id="bridge", data_schema=schema)
        chosen = bridges[user_input[CONF_HUE_ENTRY]] if user_input else next(iter(bridges.values()))
        await self.async_set_unique_id(chosen.unique_id or chosen.entry_id)
        self._abort_if_unique_id_configured()
        self._bridge = chosen
        return await self.async_step_takeover()

    async def async_step_takeover(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Whether Hue Plus leaves the Hue integration's entities alone (the safe default) or hides and renames them."""
        if user_input is not None:
            return self.async_create_entry(
                title=f"{self._bridge.title} Plus",
                data={CONF_HUE_ENTRY: self._bridge.entry_id, CONF_TAKEOVER: user_input[CONF_TAKEOVER]},
                options={CONF_MODULES: list(DEFAULT_MODULES)},
            )
        schema = vol.Schema(
            {
                vol.Required(CONF_TAKEOVER, default=TAKEOVER_ALONGSIDE): SelectSelector(
                    SelectSelectorConfig(options=[TAKEOVER_ALONGSIDE, TAKEOVER_REPLACE], translation_key="takeover", mode="list")
                )
            }
        )
        return self.async_show_form(step_id="takeover", data_schema=schema)

    async def async_step_bridge_direct(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The bridge's address. The bridge says who it is; its certificate is read now and pinned for every later connection."""
        errors: dict[str, str] = {}
        if user_input is not None:
            host = user_input[CONF_HOST].strip()
            try:
                found = await discover_bridge(host, async_get_clientsession(self.hass))
                fingerprint = await peer_fingerprint(host)
            except aiohttp.ClientError, TimeoutError, BridgeError:
                errors["base"] = "cannot_connect"
            else:
                bridge_id = normalize_bridge_id(found.id)
                if not found.supports_v2:
                    errors["base"] = "not_v2"
                elif any(e.unique_id == bridge_id for e in self._hue_bridges().values()):
                    # The Hue integration has this bridge: Hue Plus rides on its connection, as it always did.
                    return self.async_abort(reason="use_hue_integration")
                else:
                    await self.async_set_unique_id(bridge_id)
                    self._abort_if_unique_id_configured(updates={CONF_HOST: host})
                    self._host, self._fingerprint = host, fingerprint.hex()
                    return await self.async_step_bridge_link()
        return self.async_show_form(step_id="bridge_direct", data_schema=HOST_SCHEMA, errors=errors)

    async def _register(self) -> Registration | str:
        """Hue Plus's registration with the bridge, checked against the pinned certificate; or the error key."""
        try:
            return await register(async_get_clientsession(self.hass), self._host, pin(self._fingerprint))
        except LinkButtonNotPressed:
            return "link_button_not_pressed"
        except BridgeError, aiohttp.ClientError, TimeoutError:
            return "cannot_connect"

    async def async_step_bridge_link(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The bridge only registers a new app while its link button is pressed, so this waits for the person."""
        errors: dict[str, str] = {}
        if user_input is not None:
            result = await self._register()
            if isinstance(result, str):
                errors["base"] = result
            else:
                return self.async_create_entry(
                    title="Hue Bridge Plus",
                    data={
                        CONF_HOST: self._host,
                        CONF_APP_KEY: result.app_key,
                        CONF_CERT_SHA256: self._fingerprint,
                        # The registration also made the keys that local streaming needs.
                        CONF_STREAM_APP_KEY: result.app_key,
                        CONF_STREAM_CLIENT_KEY: result.client_key,
                        CONF_STREAM_APP_ID: result.application_id,
                    },
                    options={CONF_MODULES: list(DEFAULT_MODULES)},
                )
        return self.async_show_form(step_id="bridge_link", data_schema=vol.Schema({}), errors=errors)

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        entry = self._get_reconfigure_entry()
        if CONF_SYNCBOX_HOST in entry.data:
            return self.async_abort(reason="no_reconfigure")
        if isinstance(user_input, _SpotifyOptionsHandoff):
            return await self.async_step_sync_developer()
        menu = ["sync_developer"]
        if CONF_HOST in entry.data and connects_directly(entry):
            menu.insert(0, "bridge_address")
        return self.async_show_menu(step_id="reconfigure", menu_options=menu)

    async def async_step_bridge_address(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """A bridge that moved to another address. It must be the same bridge, showing the same certificate."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            host = user_input[CONF_HOST].strip()
            try:
                found = await discover_bridge(host, async_get_clientsession(self.hass))
                fingerprint = await peer_fingerprint(host)
            except aiohttp.ClientError, TimeoutError, BridgeError:
                errors["base"] = "cannot_connect"
            else:
                if normalize_bridge_id(found.id) != entry.unique_id:
                    errors["base"] = "wrong_bridge"
                elif fingerprint.hex() != entry.data[CONF_CERT_SHA256]:
                    errors["base"] = "certificate_changed"
                else:
                    return self.async_update_reload_and_abort(entry, data_updates={CONF_HOST: host})
        schema = self.add_suggested_values_to_schema(HOST_SCHEMA, {CONF_HOST: entry.data[CONF_HOST]})
        return self.async_show_form(step_id="bridge_address", data_schema=schema, errors=errors)

    async def async_step_bridge_reauth(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The bridge no longer accepts Hue Plus (removed under Apps in the Hue app, or the bridge was reset), or it shows another certificate.

        Registering again needs the link button, which also makes this the moment the certificate is learned anew.
        """
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}
        self._host = entry.data[CONF_HOST]
        if user_input is not None:
            try:
                found = await discover_bridge(self._host, async_get_clientsession(self.hass))
                self._fingerprint = (await peer_fingerprint(self._host)).hex()
            except aiohttp.ClientError, TimeoutError, BridgeError:
                errors["base"] = "cannot_connect"
            else:
                if normalize_bridge_id(found.id) != entry.unique_id:
                    errors["base"] = "wrong_bridge"
                else:
                    result = await self._register()
                    if isinstance(result, str):
                        errors["base"] = result
                    else:
                        return self.async_update_reload_and_abort(
                            entry,
                            data_updates={
                                CONF_APP_KEY: result.app_key,
                                CONF_CERT_SHA256: self._fingerprint,
                                CONF_STREAM_APP_KEY: result.app_key,
                                CONF_STREAM_CLIENT_KEY: result.client_key,
                                CONF_STREAM_APP_ID: result.application_id,
                            },
                        )
        return self.async_show_form(step_id="bridge_reauth", data_schema=vol.Schema({}), errors=errors)

    async def async_step_syncbox(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The box's address; the box says who it is, and that is what makes it the same box next time."""
        errors: dict[str, str] = {}
        if user_input is not None:
            host = user_input[CONF_SYNCBOX_HOST].strip()
            if not valid_host(host):
                errors["base"] = "invalid_host"
            else:
                try:
                    device = await SyncBox(async_get_clientsession(self.hass), host).device()
                except SyncBoxError:
                    errors["base"] = "cannot_connect"
                else:
                    await self.async_set_unique_id(device["uniqueId"])
                    self._abort_if_unique_id_configured(updates={CONF_SYNCBOX_HOST: host})
                    self._box_host, self._box_name = host, device.get("name") or "Hue Play HDMI Sync Box"
                    return await self.async_step_syncbox_register()
        return self.async_show_form(step_id="syncbox", data_schema=SYNCBOX_SCHEMA, errors=errors)

    async def _register_box(self) -> tuple[str, str] | str:
        """(registration id, access token), or the error key."""
        try:
            return await SyncBox(async_get_clientsession(self.hass), self._box_host).register("Home Assistant", "Hue Plus")
        except SyncBoxRegistrationPending:
            return "registration_pending"
        except SyncBoxError:
            return "cannot_connect"

    async def async_step_syncbox_register(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The box only registers a new app while its button is held, so this waits for the user."""
        errors: dict[str, str] = {}
        if user_input is not None:
            result = await self._register_box()
            if isinstance(result, str):
                errors["base"] = result
            else:
                registration_id, token = result
                return self.async_create_entry(
                    title=self._box_name,
                    data={CONF_SYNCBOX_HOST: self._box_host, CONF_SYNCBOX_TOKEN: token, CONF_SYNCBOX_REGISTRATION: registration_id},
                )
        return self.async_show_form(step_id="syncbox_register", data_schema=vol.Schema({}), errors=errors)

    async def async_step_syncbox_reauth(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The box no longer knows this app (it was removed in the Hue app, or the box was reset): register again."""
        errors: dict[str, str] = {}
        entry = self._get_reauth_entry()
        self._box_host = entry.data[CONF_SYNCBOX_HOST]
        if user_input is not None:
            result = await self._register_box()
            if isinstance(result, str):
                errors["base"] = result
            else:
                registration_id, token = result
                return self.async_update_reload_and_abort(
                    entry, data_updates={CONF_SYNCBOX_TOKEN: token, CONF_SYNCBOX_REGISTRATION: registration_id}
                )
        return self.async_show_form(step_id="syncbox_reauth", data_schema=vol.Schema({}), errors=errors)

    def _spotify_entry(self) -> ConfigEntry:
        return self._get_reauth_entry() if self.source == SOURCE_REAUTH else self._get_reconfigure_entry()

    async def async_step_sync_developer(self, user_input: dict[str, str] | None = None) -> ConfigFlowResult:
        """Pair a developer app with a known linked Spotify Sync UUID."""
        errors: dict[str, str] = {}
        try:
            redirect = async_get_redirect_uri(self.hass)
        except RuntimeError:
            redirect = "/auth/external/callback"
        if user_input is not None:
            app_id = user_input[CONF_SYNC_APP_ID].strip()
            try:
                uuid = str(UUID(user_input[CONF_UUID].strip()))
            except ValueError:
                errors[CONF_UUID] = "invalid_uuid"
            if not app_id or len(app_id) > 256:
                errors[CONF_SYNC_APP_ID] = "invalid_app_id"
            client_id = user_input[CONF_SYNC_CLIENT_ID].strip()
            client_secret = user_input[CONF_SYNC_CLIENT_SECRET]
            for key, value in ((CONF_SYNC_CLIENT_ID, client_id), (CONF_SYNC_CLIENT_SECRET, client_secret)):
                if not 0 < len(value) <= 1024 or not all("!" <= char <= "~" for char in value):
                    errors[key] = "invalid_client_credentials"
            if ":" in client_id:
                errors[CONF_SYNC_CLIENT_ID] = "invalid_client_credentials"
            if not errors:
                self._developer_credentials = {CONF_SYNC_CLIENT_ID: client_id, CONF_SYNC_CLIENT_SECRET: client_secret}
                self._sync_app_id = app_id
                self._sync_uuid = uuid
                self.flow_impl = inline_oauth(self.hass, self._developer_credentials)
                return await self.async_step_auth()
        entry = self._spotify_entry()
        schema = vol.Schema(
            {
                vol.Required(CONF_SYNC_APP_ID): TextSelector(),
                vol.Required(CONF_SYNC_CLIENT_ID): TextSelector(),
                vol.Required(CONF_SYNC_CLIENT_SECRET): TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD)),
                vol.Required(CONF_UUID): TextSelector(),
            }
        )
        schema = self.add_suggested_values_to_schema(
            schema,
            {key: entry.data[key] for key in (CONF_SYNC_APP_ID, CONF_SYNC_CLIENT_ID, CONF_UUID) if key in entry.data},
        )
        return self.async_show_form(
            step_id="sync_developer",
            data_schema=schema,
            errors=errors,
            description_placeholders={"redirect": redirect},
        )

    async def async_generate_authorize_url(self) -> str:
        try:
            url = await super().async_generate_authorize_url()
        except RuntimeError:
            raise NoURLAvailableError from None
        self._oauth_redirect = parse_qs(urlsplit(url).query)["redirect_uri"][0]
        return url

    async def async_step_auth(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            state = user_input.get("state")
            if (
                not isinstance(state, dict)
                or state.get("flow_id") != self.flow_id
                or state.get("redirect_uri") != self._oauth_redirect
                or not self._oauth_redirect
            ):
                return self.async_external_step_done(next_step_id="sync_oauth_failed")
            if "error" in user_input:
                return self.async_external_step_done(next_step_id="sync_oauth_failed")
            if not isinstance(user_input.get("code"), str) or not 0 < len(user_input["code"]) <= 2048:
                return self.async_external_step_done(next_step_id="sync_oauth_failed")
        return await super().async_step_auth(user_input)

    async def async_step_sync_oauth_failed(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return self.async_abort(reason="oauth_failed")

    async def async_oauth_create_entry(self, data: dict) -> ConfigFlowResult:
        """Verify Sync access before changing the existing bridge entry."""
        creds = {CONF_AUTH: data[CONF_OAUTH_TOKEN]["access_token"], CONF_UUID: self._sync_uuid}
        if error := await self._check(creds):
            return self.async_abort(reason=error)
        entry = self._spotify_entry()
        updated = {key: value for key, value in entry.data.items() if key != CONF_AUTH}
        updated.update(data)
        updated.update(self._developer_credentials)
        updated.update({CONF_SYNC_APP_ID: self._sync_app_id, CONF_UUID: self._sync_uuid})
        modules = list(entry.options.get(CONF_MODULES, DEFAULT_MODULES))
        if isinstance(self.init_data, _SpotifyOptionsHandoff) and self.init_data.modules:
            modules = self.init_data.modules.copy()
        if self.source != SOURCE_REAUTH and MODULE_SYNC not in modules:
            modules.append(MODULE_SYNC)
        changed = self.hass.config_entries.async_update_entry(
            entry,
            data=updated,
            options={**entry.options, CONF_MODULES: modules},
        )
        if not changed or not entry.update_listeners:
            self.hass.config_entries.async_schedule_reload(entry.entry_id)
        return self.async_abort(reason="sync_developer_successful")

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        if CONF_SYNCBOX_HOST in entry_data:
            return await self.async_step_syncbox_reauth()
        # The Spotify sync asks for its token with the context below; a bridge of Hue Plus's own that refuses it asks for the link button.
        if self.context.get("reauth_for") != "sync" and connects_directly(self._get_reauth_entry()):
            return await self.async_step_bridge_reauth()
        if CONF_SYNC_APP_ID in entry_data and CONF_OAUTH_TOKEN in entry_data:
            return await self.async_step_sync_developer_reauth()
        return await self.async_step_reauth_confirm()

    async def async_step_sync_developer_reauth(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is None:
            return self.async_show_form(step_id="sync_developer_reauth", data_schema=vol.Schema({}))
        data = self._get_reauth_entry().data
        self._sync_app_id = data[CONF_SYNC_APP_ID]
        self._sync_uuid = data[CONF_UUID]
        if implementation := inline_oauth(self.hass, data):
            self.flow_impl = implementation
            return await self.async_step_auth()
        return await self.async_step_pick_implementation({"implementation": data[CONF_AUTH_IMPLEMENTATION]})

    async def async_step_reauth_confirm(self, user_input: dict[str, str] | None = None) -> ConfigFlowResult:
        return await self.async_step_reauth_credentials()

    async def async_step_reauth_credentials(self, user_input: dict[str, str] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if (creds := user_input) is not None:
            if error := await self._check(creds) or self._wrong_account(creds):
                errors["base"] = error
            else:
                return self._finish_reauth(creds)
        return self.async_show_form(step_id="reauth_credentials", data_schema=CREDENTIALS_SCHEMA, errors=errors)

    def _wrong_account(self, creds: dict[str, str]) -> str | None:
        stored = self._get_reauth_entry().data.get(CONF_UUID)
        return "wrong_account" if stored and creds[CONF_UUID] != stored else None

    def _finish_reauth(self, creds: dict[str, str]) -> ConfigFlowResult:
        entry = self._get_reauth_entry()
        return self.async_update_reload_and_abort(entry, data={**entry.data, **creds})

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return HuePlusOptionsFlow()


class HuePlusOptionsFlow(_CredentialsMixin, OptionsFlow):
    def __init__(self) -> None:
        self._modules: list[str] = []

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if CONF_SYNCBOX_HOST in self.config_entry.data:
            return self.async_abort(reason="no_options")
        return self.async_show_menu(step_id="init", menu_options=["modules", "credentials", "streaming"])

    async def async_step_modules(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            self._modules = list(user_input[CONF_MODULES])
            if MODULE_SYNC in self._modules and not (self.config_entry.data.get(CONF_AUTH) or self.config_entry.data.get(CONF_OAUTH_TOKEN)):
                return await self.async_step_credentials()
            if MODULE_STREAMING in self._modules and not self.config_entry.data.get(CONF_STREAM_CLIENT_KEY):
                return await self.async_step_streaming()
            return self.async_create_entry(data={CONF_MODULES: self._modules})
        current = self.config_entry.options.get(CONF_MODULES, list(DEFAULT_MODULES))
        schema = vol.Schema(
            {
                vol.Required(CONF_MODULES, default=current): SelectSelector(
                    SelectSelectorConfig(options=list(MODULES), multiple=True, translation_key="modules")
                )
            }
        )
        return self.async_show_form(step_id="modules", data_schema=schema)

    async def async_step_credentials(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            if user_input.get(DEVELOPER_MODE):
                flow = await self.hass.config_entries.flow.async_init(
                    DOMAIN,
                    context={"source": SOURCE_RECONFIGURE, "entry_id": self.config_entry.entry_id},
                    data=_SpotifyOptionsHandoff(self._modules.copy()),
                )
                result = self.async_abort(reason="continue_developer_setup")
                result["next_flow"] = (FlowType.CONFIG_FLOW, flow["flow_id"])
                return result
            creds = {key: user_input.get(key, "").strip() for key in (CONF_AUTH, CONF_UUID)}
            errors = {key: "required" for key, value in creds.items() if not value}
            if not errors:
                if error := await self._check(creds):
                    errors["base"] = error
                else:
                    return self._store_sync_account(creds)
        schema = vol.Schema(
            {
                vol.Optional(DEVELOPER_MODE, default=False): BooleanSelector(),
                vol.Optional(CONF_AUTH): TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD)),
                vol.Optional(CONF_UUID): TextSelector(),
            }
        )
        return self.async_show_form(step_id="credentials", data_schema=schema, errors=errors)

    async def async_step_streaming(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Local streaming needs its own registration with the bridge, which only works while the bridge's link button is pressed."""
        errors: dict[str, str] = {}
        if user_input is not None:
            direct = connects_directly(self.config_entry)
            host = (
                self.config_entry.data[CONF_HOST]
                if direct
                else self.hass.config_entries.async_get_entry(self.config_entry.data[CONF_HUE_ENTRY]).data["host"]
            )
            try:
                registration = await register(
                    async_get_clientsession(self.hass), host, pin(self.config_entry.data[CONF_CERT_SHA256]) if direct else False
                )
            except LinkButtonNotPressed:
                errors["base"] = "link_button_not_pressed"
            except BridgeError:
                errors["base"] = "cannot_connect"
            else:
                modules = self._modules or list(self.config_entry.options.get(CONF_MODULES, DEFAULT_MODULES))
                if MODULE_STREAMING not in modules:
                    modules.append(MODULE_STREAMING)
                self.hass.config_entries.async_update_entry(
                    self.config_entry,
                    data={
                        **self.config_entry.data,
                        CONF_STREAM_APP_KEY: registration.app_key,
                        CONF_STREAM_CLIENT_KEY: registration.client_key,
                        CONF_STREAM_APP_ID: registration.application_id,
                    },
                    options={CONF_MODULES: modules},
                )
                return self.async_create_entry(data={CONF_MODULES: modules})
        return self.async_show_form(step_id="streaming", data_schema=vol.Schema({}), errors=errors)

    def _store_sync_account(self, creds: dict[str, str]) -> ConfigFlowResult:
        modules = self._modules or list(self.config_entry.options.get(CONF_MODULES, DEFAULT_MODULES))
        if MODULE_SYNC not in modules:
            modules.append(MODULE_SYNC)
        # One update for both: two would reload the entry twice, and the second change could land while the first
        # reload is unloading, when nothing is listening.
        self.hass.config_entries.async_update_entry(
            self.config_entry,
            data={**{key: value for key, value in self.config_entry.data.items() if key not in OAUTH_KEYS}, **creds},
            options={CONF_MODULES: modules},
        )
        return self.async_create_entry(data={CONF_MODULES: modules})
