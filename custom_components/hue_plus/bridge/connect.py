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
