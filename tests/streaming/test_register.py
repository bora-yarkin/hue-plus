# SPDX-License-Identifier: GPL-3.0-or-later
"""Registering with the bridge for streaming, against a stand-in for the HTTP session."""

import pytest

from custom_components.hue_plus.bridge.api import BridgeError
from custom_components.hue_plus.streaming import register


class Reply:
    def __init__(self, body=None, headers=None, text=""):
        self._body, self.headers, self._text, self.status = body, headers or {}, text, 200

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def json(self, content_type=None):
        return self._body

    async def text(self):
        return self._text


class Session:
    def __init__(self, post, get=None):
        self._post, self._get, self.seen = post, get, []

    def post(self, url, **kwargs):
        self.seen.append(("post", url, kwargs.get("json")))
        return self._post

    def get(self, url, **kwargs):
        self.seen.append(("get", url, kwargs.get("headers")))
        return self._get


GOOD = [{"success": {"username": "app-key-value", "clientkey": "00" * 16}}]


async def test_a_registration_gives_the_keys_and_the_application_id_and_never_shows_them():
    session = Session(Reply(GOOD), Reply(headers={"hue-application-id": "app-id-value"}))
    registration = await register.register(session, "bridge.local")
    assert (registration.app_key, registration.client_key, registration.application_id) == ("app-key-value", "00" * 16, "app-id-value")
    assert session.seen[0][2] == {"devicetype": register.DEVICE_TYPE, "generateclientkey": True}
    assert session.seen[1][2] == {"hue-application-key": "app-key-value"}
    assert "app-key-value" not in repr(registration) and "app-id-value" not in repr(registration)


async def test_an_unpressed_link_button_is_told_apart_from_other_refusals():
    pressed = Session(Reply([{"error": {"type": 101, "description": "link button not pressed"}}]))
    with pytest.raises(register.LinkButtonNotPressed):
        await register.register(pressed, "bridge.local")
    other = Session(Reply([{"error": {"type": 7, "description": "invalid value"}}]))
    with pytest.raises(BridgeError) as caught:
        await register.register(other, "bridge.local")
    assert not isinstance(caught.value, register.LinkButtonNotPressed)


@pytest.mark.parametrize(
    "post, get",
    [
        (Reply({"unexpected": 1}), None),
        (Reply([{"success": {"username": "u"}}]), None),
        (Reply(GOOD), Reply(headers={})),
    ],
)
async def test_an_answer_without_the_keys_or_the_application_id_is_an_error(post, get):
    with pytest.raises(BridgeError):
        await register.register(Session(post, get), "bridge.local")
