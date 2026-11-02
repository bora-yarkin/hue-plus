# SPDX-License-Identifier: GPL-3.0-or-later
"""A real DTLS-PSK server for the streaming tests: ``openssl s_server``, so the handshake is checked against OpenSSL itself."""

from __future__ import annotations

import shutil
import socket
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

import pytest

KEY_HEX = "00112233445566778899aabbccddeeff"
IDENTITY = "test-application-id"


def _openssl() -> str | None:
    path = shutil.which("openssl")
    if path is None:
        return None
    help_text = subprocess.run([path, "s_server", "-help"], capture_output=True, text=True, check=False)
    return path if "-psk " in (help_text.stdout + help_text.stderr) and "-dtls1_2" in (help_text.stdout + help_text.stderr) else None


@dataclass
class DtlsServer:
    port: int
    output: Path

    def received(self) -> bytes:
        return self.output.read_bytes()


@pytest.fixture(autouse=True)
def _allow_local_sockets(socket_enabled):
    yield


@pytest.fixture
def dtls_server(tmp_path):
    openssl = _openssl()
    if openssl is None:
        pytest.skip("this machine's openssl cannot run a DTLS server with a pre-shared key")
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    output = tmp_path / "received.bin"
    with output.open("wb") as sink:
        process = subprocess.Popen(
            [
                openssl,
                "s_server",
                "-dtls1_2",
                "-nocert",
                "-psk",
                KEY_HEX,
                "-psk_identity",
                IDENTITY,
                "-cipher",
                "PSK-AES128-GCM-SHA256",
                "-accept",
                f"127.0.0.1:{port}",
                "-quiet",
            ],
            stdout=sink,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.PIPE,
        )
        time.sleep(0.5)  # the server needs a moment before it listens
        try:
            yield DtlsServer(port, output)
        finally:
            process.kill()
            process.wait()
