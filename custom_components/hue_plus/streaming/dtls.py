# SPDX-License-Identifier: GPL-3.0-or-later
"""A DTLS 1.2 client with a pre-shared key, over the OpenSSL library that Python itself uses.

Why this exists: Python's ``ssl`` module has no DTLS, and the Hue bridge streams only over DTLS with a pre-shared key
(``TLS_PSK_WITH_AES_128_GCM_SHA256``). The cryptography is all OpenSSL's; this file only calls it through ``ctypes``: it sets
up the context, hands over the key when OpenSSL asks for it, and runs the handshake and the writes. It implements no
cryptography itself. EXPERIMENTAL: written from OpenSSL's documentation and tested against ``openssl s_server``, not yet
against a real bridge. This module imports nothing from Home Assistant.

Calls into one connection must not overlap; ``connect`` blocks (up to ``timeout``) and belongs in a thread.
"""

from __future__ import annotations

import ctypes
import ctypes.util
import select
import socket
import time

CIPHER = b"PSK-AES128-GCM-SHA256"
DTLS1_2_VERSION = 0xFEFD
SSL_ERROR_WANT_READ, SSL_ERROR_WANT_WRITE = 2, 3
SSL_CTRL_SET_MIN_PROTO_VERSION, SSL_CTRL_SET_MAX_PROTO_VERSION = 123, 124
SSL_CTRL_OPTIONS, DTLS_CTRL_HANDLE_TIMEOUT, DTLS_CTRL_SET_LINK_MTU = 32, 74, 120
SSL_OP_NO_QUERY_MTU = 0x1000
LINK_MTU = 1400

_PSK_CALLBACK = ctypes.CFUNCTYPE(
    ctypes.c_uint, ctypes.c_void_p, ctypes.c_char_p, ctypes.c_void_p, ctypes.c_uint, ctypes.c_void_p, ctypes.c_uint
)


def psk_callback(identity: bytes, key: bytes):
    """What OpenSSL calls during the handshake to learn the identity and the key: they are copied into its buffers.

    Returning 0 makes the handshake fail; that is what happens when either would not fit. Nothing may escape into C.
    """

    def provide(_ssl, _hint, identity_out, identity_max, key_out, key_max) -> int:
        try:
            if len(identity) + 1 > identity_max or len(key) > key_max:
                return 0
            ctypes.memmove(identity_out, identity + b"\0", len(identity) + 1)
            ctypes.memmove(key_out, key, len(key))
            return len(key)
        except Exception:
            return 0

    return _PSK_CALLBACK(provide)


class DtlsError(Exception):
    """The handshake or a write failed. The message never contains the key or the identity."""


def _load_library() -> ctypes.CDLL:
    for name in (ctypes.util.find_library("ssl"), "libssl.so.3", "libssl.3.dylib", "libssl.so.1.1"):
        if not name:
            continue
        try:
            return ctypes.CDLL(name)
        except OSError:
            continue
    raise DtlsError("The OpenSSL library was not found")


def _bind(lib: ctypes.CDLL) -> ctypes.CDLL:
    """Declares the argument and result types of what is used: without them ctypes passes pointers as 32-bit integers."""
    pointer, integer = ctypes.c_void_p, ctypes.c_int
    signatures = {
        "DTLS_client_method": (pointer, []),
        "SSL_CTX_new": (pointer, [pointer]),
        "SSL_CTX_free": (None, [pointer]),
        "SSL_CTX_ctrl": (ctypes.c_long, [pointer, integer, ctypes.c_long, pointer]),
        "SSL_CTX_set_cipher_list": (integer, [pointer, ctypes.c_char_p]),
        "SSL_CTX_set_psk_client_callback": (None, [pointer, _PSK_CALLBACK]),
        "SSL_new": (pointer, [pointer]),
        "SSL_free": (None, [pointer]),
        "SSL_ctrl": (ctypes.c_long, [pointer, integer, ctypes.c_long, pointer]),
        "SSL_set_fd": (integer, [pointer, integer]),
        "SSL_connect": (integer, [pointer]),
        "SSL_get_error": (integer, [pointer, integer]),
        "SSL_write": (integer, [pointer, ctypes.c_char_p, integer]),
        "SSL_shutdown": (integer, [pointer]),
    }
    for name, (result, arguments) in signatures.items():
        function = getattr(lib, name)
        function.restype, function.argtypes = result, arguments
    return lib


class DtlsPskClient:
    def __init__(self) -> None:
        self._lib = _bind(_load_library())
        self._ctx = None
        self._ssl = None
        self._socket: socket.socket | None = None
        self._callback = None

    def connect(self, host: str, port: int, identity: str, key: bytes, timeout: float = 10.0) -> None:
        """Opens the UDP socket and runs the handshake. On any failure everything is closed again."""
        if not identity or not key:
            raise DtlsError("An identity and a key are needed")
        try:
            self._connect(host, port, identity.encode(), key, timeout)
        except BaseException:
            self.close()
            raise

    def _connect(self, host: str, port: int, identity: bytes, key: bytes, timeout: float) -> None:
        lib = self._lib

        self._callback = psk_callback(identity, key)
        self._ctx = lib.SSL_CTX_new(lib.DTLS_client_method())
        if not self._ctx:
            raise DtlsError("OpenSSL could not create a context")
        if (
            lib.SSL_CTX_ctrl(self._ctx, SSL_CTRL_SET_MIN_PROTO_VERSION, DTLS1_2_VERSION, None) != 1
            or lib.SSL_CTX_ctrl(self._ctx, SSL_CTRL_SET_MAX_PROTO_VERSION, DTLS1_2_VERSION, None) != 1
            or lib.SSL_CTX_set_cipher_list(self._ctx, CIPHER) != 1
        ):
            raise DtlsError("OpenSSL does not offer DTLS 1.2 with a pre-shared key")
        lib.SSL_CTX_set_psk_client_callback(self._ctx, self._callback)
        lib.SSL_CTX_ctrl(self._ctx, SSL_CTRL_OPTIONS, SSL_OP_NO_QUERY_MTU, None)
        self._ssl = lib.SSL_new(self._ctx)
        if not self._ssl:
            raise DtlsError("OpenSSL could not create a connection")
        lib.SSL_ctrl(self._ssl, DTLS_CTRL_SET_LINK_MTU, LINK_MTU, None)

        self._socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._socket.setblocking(False)
        self._socket.connect((host, port))
        if lib.SSL_set_fd(self._ssl, self._socket.fileno()) != 1:
            raise DtlsError("OpenSSL could not use the socket")

        deadline = time.monotonic() + timeout
        while True:
            result = lib.SSL_connect(self._ssl)
            if result == 1:
                return
            error = lib.SSL_get_error(self._ssl, result)
            if error not in (SSL_ERROR_WANT_READ, SSL_ERROR_WANT_WRITE):
                raise DtlsError("The handshake failed (wrong key or identity, or the bridge is not streaming)")
            if time.monotonic() >= deadline:
                raise DtlsError("The handshake timed out")
            readable = select.select([self._socket], [], [], 0.25)[0]
            if not readable:
                lib.SSL_ctrl(self._ssl, DTLS_CTRL_HANDLE_TIMEOUT, 0, None)  # resends what the bridge did not answer

    def send(self, data: bytes) -> None:
        if self._ssl is None:
            raise DtlsError("Not connected")
        if self._lib.SSL_write(self._ssl, data, len(data)) != len(data):
            raise DtlsError("A message could not be sent")

    def close(self) -> None:
        if self._ssl is not None:
            try:
                self._lib.SSL_shutdown(self._ssl)
            finally:
                self._lib.SSL_free(self._ssl)
                self._ssl = None
        if self._ctx is not None:
            self._lib.SSL_CTX_free(self._ctx)
            self._ctx = None
        if self._socket is not None:
            self._socket.close()
            self._socket = None
        self._callback = None
