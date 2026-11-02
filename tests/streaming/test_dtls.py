# SPDX-License-Identifier: GPL-3.0-or-later
"""The DTLS client against ``openssl s_server``: the handshake, what arrives, and what must fail."""

import ctypes
import time

import pytest

from custom_components.hue_plus.streaming import dtls

from .conftest import IDENTITY, KEY_HEX

KEY = bytes.fromhex(KEY_HEX)


def test_what_is_written_arrives_decrypted_at_the_server(dtls_server):
    client = dtls.DtlsPskClient()
    client.connect("127.0.0.1", dtls_server.port, IDENTITY, KEY, timeout=5)
    client.send(b"hello from hue plus")
    client.close()
    time.sleep(0.3)
    assert b"hello from hue plus" in dtls_server.received()


def test_the_identity_and_key_are_handed_to_openssl_in_its_own_buffers():
    callback = dtls.psk_callback(b"the-id", KEY)
    identity, key = ctypes.create_string_buffer(64), ctypes.create_string_buffer(64)
    assert callback(None, None, ctypes.addressof(identity), 64, ctypes.addressof(key), 64) == 16
    assert identity.value == b"the-id" and key.raw[:16] == KEY


@pytest.mark.parametrize("identity_room, key_room", [(6, 64), (64, 15)])
def test_an_identity_or_key_that_does_not_fit_is_refused_instead_of_overflowing(identity_room, key_room):
    callback = dtls.psk_callback(b"the-id", KEY)
    identity, key = ctypes.create_string_buffer(64), ctypes.create_string_buffer(64)
    assert callback(None, None, ctypes.addressof(identity), identity_room, ctypes.addressof(key), key_room) == 0
    assert key.raw == bytes(64)


def test_a_wrong_key_fails_the_handshake_without_naming_the_key_or_the_identity(dtls_server):
    client = dtls.DtlsPskClient()
    with pytest.raises(dtls.DtlsError) as caught:
        client.connect("127.0.0.1", dtls_server.port, IDENTITY, bytes(16), timeout=3)
    assert IDENTITY not in str(caught.value) and KEY_HEX not in str(caught.value)
    with pytest.raises(dtls.DtlsError, match="Not connected"):
        client.send(b"x")  # a failed connect leaves nothing open


def test_nobody_listening_ends_in_a_timeout_not_a_hang():
    client = dtls.DtlsPskClient()
    started = time.monotonic()
    with pytest.raises(dtls.DtlsError):
        client.connect("127.0.0.1", 9, IDENTITY, KEY, timeout=1)
    assert time.monotonic() - started < 5


def test_an_empty_key_or_identity_is_refused_and_closing_twice_is_harmless():
    client = dtls.DtlsPskClient()
    for identity, key in (("", KEY), (IDENTITY, b"")):
        with pytest.raises(dtls.DtlsError):
            client.connect("127.0.0.1", 9, identity, key)
    client.close()
    client.close()
