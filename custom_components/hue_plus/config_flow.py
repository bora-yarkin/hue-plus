# SPDX-License-Identifier: GPL-3.0-or-later
"""Setup, options (which modules are on, and the Spotify sync's credentials) and re-authentication."""

from __future__ import annotations

import json
import logging
import os
from collections.abc import Mapping
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    SelectSelector,
    SelectSelectorConfig,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .bridge.api import BridgeError
from .const import (
    CONF_AUTH,
    CONF_HUE_ENTRY,
    CONF_MODULES,
    CONF_STREAM_APP_ID,
    CONF_STREAM_APP_KEY,
    CONF_STREAM_CLIENT_KEY,
    CONF_SYNCBOX_HOST,
    CONF_SYNCBOX_REGISTRATION,
    CONF_SYNCBOX_TOKEN,
    CONF_TAKEOVER,
    CONF_UUID,
    CREDENTIALS_FILE,
    DEFAULT_MODULES,
    DOMAIN,
    HUE_DOMAIN,
    MODULE_STREAMING,
    MODULE_SYNC,
    MODULES,
    SYNC_URL,
    TAKEOVER_ALONGSIDE,
    TAKEOVER_REPLACE,
)
from .streaming.register import LinkButtonNotPressed, register
from .sync.client import GenesisRejected, GenesisUnavailable, async_probe
from .syncbox.client import SyncBox, SyncBoxError, SyncBoxRegistrationPending, valid_host

_LOGGER = logging.getLogger(__name__)

CREDENTIALS_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_AUTH): TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD)),
        vol.Required(CONF_UUID): TextSelector(),
    }
)


def _read_credentials_file(path: str) -> dict[str, str] | None:
    """The credentials in the file, or None when there is no usable file."""
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except OSError, ValueError:
        return None
    if isinstance(data, dict) and all(isinstance(data.get(key), str) and data[key] for key in (CONF_AUTH, CONF_UUID)):
        return {CONF_AUTH: data[CONF_AUTH], CONF_UUID: data[CONF_UUID]}
    return None


def _delete_file(path: str) -> None:
    try:
        os.remove(path)
    except OSError:
        _LOGGER.warning("Could not delete %s; delete it by hand, it holds a token", path)


class _CredentialsMixin:
    """Reading and checking the sync credentials, for the options flow and for re-authentication."""

    async def _credentials(self, user_input: dict[str, str] | None) -> tuple[dict[str, str] | None, bool]:
        """The credentials to try, and whether they came from the file."""
        if user_input is not None:
            return user_input, False
        creds = await self.hass.async_add_executor_job(_read_credentials_file, self.hass.config.path(CREDENTIALS_FILE))
        return creds, creds is not None

    async def _check(self, creds: dict[str, str]) -> str | None:
        """None when the service accepts the credentials, otherwise the error key."""
        try:
            await async_probe(async_get_clientsession(self.hass), SYNC_URL, creds[CONF_AUTH], creds[CONF_UUID])
        except GenesisRejected:
            return "invalid_auth"
        except GenesisUnavailable:
            return "cannot_connect"
        return None

    async def _forget_file(self, from_file: bool) -> None:
        if from_file:
            await self.hass.async_add_executor_job(_delete_file, self.hass.config.path(CREDENTIALS_FILE))


SYNCBOX_SCHEMA = vol.Schema({vol.Required(CONF_SYNCBOX_HOST): TextSelector()})


class HuePlusConfigFlow(_CredentialsMixin, ConfigFlow, domain=DOMAIN):
    VERSION = 3

    def __init__(self) -> None:
        self._box_host = ""
        self._box_unique_id = ""
        self._box_name = ""
        self._bridge: ConfigEntry | None = None

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """A Hue bridge (through the Hue integration) or a Hue Play HDMI Sync Box."""
        return self.async_show_menu(step_id="user", menu_options=["bridge", "syncbox"])

    async def async_step_bridge(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        # Only bridges the Hue integration talks to over the v2 API can be used.
        bridges = {e.entry_id: e for e in self.hass.config_entries.async_entries(HUE_DOMAIN) if e.data.get("api_version") == 2}
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

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        if CONF_SYNCBOX_HOST in entry_data:
            return await self.async_step_syncbox_reauth()
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, str] | None = None) -> ConfigFlowResult:
        return await self.async_step_reauth_credentials()

    async def async_step_reauth_credentials(self, user_input: dict[str, str] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        creds, from_file = await self._credentials(user_input)
        if creds is not None:
            if error := await self._check(creds) or self._wrong_account(creds):
                errors["base"] = error
            else:
                await self._forget_file(from_file)
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
            if MODULE_SYNC in self._modules and not self.config_entry.data.get(CONF_AUTH):
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

    async def async_step_credentials(self, user_input: dict[str, str] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        creds, from_file = await self._credentials(user_input)
        if creds is not None:
            if error := await self._check(creds):
                errors["base"] = error
            else:
                await self._forget_file(from_file)
                return self._store_sync_account(creds)
        return self.async_show_form(step_id="credentials", data_schema=CREDENTIALS_SCHEMA, errors=errors)

    async def async_step_streaming(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Local streaming needs its own registration with the bridge, which only works while the bridge's link button is pressed."""
        errors: dict[str, str] = {}
        if user_input is not None:
            host = self.hass.config_entries.async_get_entry(self.config_entry.data[CONF_HUE_ENTRY]).data["host"]
            try:
                registration = await register(async_get_clientsession(self.hass), host)
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
            self.config_entry, data={**self.config_entry.data, **creds}, options={CONF_MODULES: modules}
        )
        return self.async_create_entry(data={CONF_MODULES: modules})
