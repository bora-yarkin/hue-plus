# SPDX-License-Identifier: GPL-3.0-or-later
"""These tests talk to a fake server on the local machine, which the Home Assistant test plugin blocks by default."""

import pytest


@pytest.fixture(autouse=True)
def _allow_local_sockets(socket_enabled):
    yield
