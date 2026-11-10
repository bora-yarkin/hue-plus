# SPDX-License-Identifier: GPL-3.0-or-later
"""Certificate pinning for a connection of Hue Plus's own to a bridge.

A bridge's certificate is signed by Signify's private authority and has no public chain, so the usual check is impossible
(the Hue integration and its library switch checking off). Hue Plus pins instead: while registering with the bridge, which needs
a person at the link button, it reads the SHA-256 fingerprint of the certificate the bridge shows, and every later
connection must show the same one. This module imports nothing from Home Assistant.
"""

from __future__ import annotations

import asyncio
import hashlib
import ssl
from dataclasses import dataclass

import aiohttp

from .api import BridgeError

HTTPS_PORT = 443
CONNECT_TIMEOUT_S = 10


async def peer_fingerprint(host: str, port: int = HTTPS_PORT) -> bytes:
    """The SHA-256 of the DER certificate the server at ``host`` shows. The certificate is not verified: it is being learned."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    try:
        async with asyncio.timeout(CONNECT_TIMEOUT_S):
            _reader, writer = await asyncio.open_connection(host, port, ssl=context)
    except (OSError, TimeoutError, ssl.SSLError) as err:
        raise BridgeError(f"The bridge could not be reached ({type(err).__name__})") from err
    try:
        certificate = writer.get_extra_info("ssl_object").getpeercert(binary_form=True)
    finally:
        writer.close()
    if not certificate:
        raise BridgeError("The bridge showed no certificate")
    return hashlib.sha256(certificate).digest()


def pin(fingerprint_hex: str) -> aiohttp.Fingerprint:
    """The aiohttp ``ssl`` argument that only accepts a server showing this certificate."""
    return aiohttp.Fingerprint(bytes.fromhex(fingerprint_hex))


@dataclass(frozen=True)
class DiscoveredBridge:
    host: str
    id: str  # the bridge's id as the bridge writes it, 16 hexadecimal digits
    supports_v2: bool


async def discover_bridge(host: str, session: aiohttp.ClientSession) -> DiscoveredBridge:
    """Who the bridge at ``host`` is and whether it speaks the v2 API, read over https.

    The bridge's certificate is not checked here (it has no public chain; it is being learned, see ``peer_fingerprint``), and nothing
    secret is sent or read. The Hue integration's library asks over plain http, which a Bridge Pro answers with a redirect to https:
    followed with Home Assistant's own certificate check that fails on the bridge's private authority, so it cannot be used here.
    """
    timeout = aiohttp.ClientTimeout(total=CONNECT_TIMEOUT_S)
    try:
        async with session.get(f"https://{host}/api/config", ssl=False, allow_redirects=False, timeout=timeout) as response:
            response.raise_for_status()
            data = await response.json(content_type=None)
    except (aiohttp.ClientError, TimeoutError, ValueError) as err:
        raise BridgeError(f"The bridge could not be reached ({type(err).__name__})") from err
    if not isinstance(data, dict) or not isinstance(data.get("bridgeid"), str):
        raise BridgeError("That is not a Hue bridge")
    try:
        # The v2 API answers 403 (forbidden) to a request that has no application key.
        async with session.get(
            f"https://{host}/clip/v2/resource", ssl=False, allow_redirects=False, raise_for_status=False, timeout=timeout
        ) as response:
            supports_v2 = response.status == 403
    except aiohttp.ClientError, TimeoutError:
        supports_v2 = False
    return DiscoveredBridge(host, data["bridgeid"], supports_v2)
