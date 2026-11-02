import pytest


@pytest.fixture(autouse=True)
def _allow_local_sockets(socket_enabled):
    yield
