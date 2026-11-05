# SPDX-License-Identifier: GPL-3.0-or-later
"""Home Assistant application credentials for the Hue developer OAuth flow."""

import json
import re

import aiohttp
from homeassistant.components.application_credentials import AuthImplementation, AuthorizationServer, ClientCredential
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import OAuth2TokenRequestConnectionError, OAuth2TokenRequestReauthError
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import DOMAIN

SERVER = AuthorizationServer(
    authorize_url="https://api.meethue.com/v2/oauth2/authorize",
    token_url="https://api.meethue.com/v2/oauth2/token",
)


class HueDeveloperOAuth(AuthImplementation):
    """Hue uses HTTP Basic for both grant exchange and refresh."""

    async def _token_request(self, data: dict) -> dict:
        form = {key: value for key, value in data.items() if key != "client_id"}
        try:
            authorization = aiohttp.encode_basic_auth(self.client_id, self.client_secret)
        except ValueError:
            raise OAuth2TokenRequestConnectionError(domain=DOMAIN) from None
        session = async_get_clientsession(self.hass)
        async with session.post(
            self.token_url,
            data=form,
            headers={"Authorization": authorization},
            allow_redirects=False,
            timeout=15,
        ) as response:
            if response.status in (400, 401, 403):
                raise OAuth2TokenRequestReauthError(
                    domain=DOMAIN,
                    request_info=response.request_info,
                    status=response.status,
                )
            if response.status != 200:
                raise OAuth2TokenRequestConnectionError(domain=DOMAIN)
            body = bytearray()
            async for chunk in response.content.iter_chunked(4096):
                body.extend(chunk)
                if len(body) > 8192:
                    raise OAuth2TokenRequestConnectionError(domain=DOMAIN)
        return _validated_token(body, require_refresh=form["grant_type"] == "authorization_code")


def _validated_token(body: bytearray, *, require_refresh: bool) -> dict:
    try:
        payload = json.loads(body)
        access = payload["access_token"]
        refresh = payload.get("refresh_token")
        expiry = int(payload["expires_in"])
    except KeyError, TypeError, ValueError, OverflowError, RecursionError:
        raise OAuth2TokenRequestConnectionError(domain=DOMAIN) from None
    if not 0 < expiry <= 2**31 - 1 or not isinstance(access, str) or not re.fullmatch(r"[!-~]{1,4096}", access):
        raise OAuth2TokenRequestConnectionError(domain=DOMAIN)
    token = {"access_token": access, "expires_in": expiry}
    if "refresh_token" in payload or require_refresh:
        if not isinstance(refresh, str) or not re.fullmatch(r"[!-~]{1,4096}", refresh):
            raise OAuth2TokenRequestConnectionError(domain=DOMAIN)
        token["refresh_token"] = refresh
    return token


async def async_get_auth_implementation(
    hass: HomeAssistant,
    auth_domain: str,
    credential: ClientCredential,
) -> AuthImplementation:
    return HueDeveloperOAuth(hass, auth_domain, credential, SERVER)
