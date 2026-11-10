# SPDX-License-Identifier: GPL-3.0-or-later
"""Finding out who a bridge is before registering with it: over https, the redirect of a Bridge Pro never followed, nothing secret sent."""

import unittest

import aiohttp

from custom_components.hue_plus.bridge.api import BridgeError
from custom_components.hue_plus.bridge.connect import discover_bridge


class Reply:
    def __init__(self, status=200, body=None, error=None):
        self.status, self.body, self.error = status, body, error

    async def __aenter__(self):
        if isinstance(self.error, Exception):
            raise self.error
        return self

    async def __aexit__(self, *exc):
        return False

    def raise_for_status(self):
        if self.status >= 400:
            raise aiohttp.ClientResponseError(None, (), status=self.status)

    async def json(self, content_type=None):
        if isinstance(self.body, Exception):
            raise self.body
        return self.body


class Session:
    def __init__(self, replies):
        self.replies, self.asked = replies, []

    def get(self, url, **kwargs):
        self.asked.append((url, kwargs))
        return self.replies[url]


CONFIG = "https://192.0.2.7/api/config"
V2 = "https://192.0.2.7/clip/v2/resource"


class DiscoverTests(unittest.IsolatedAsyncioTestCase):
    async def test_a_bridge_pro_is_found_over_https_without_following_a_redirect_or_checking_its_private_certificate(self):
        session = Session({CONFIG: Reply(body={"bridgeid": "C42996FFFEC4A182", "name": "Hue Bridge Pro"}), V2: Reply(status=403)})
        found = await discover_bridge("192.0.2.7", session)
        self.assertEqual((found.id, found.supports_v2), ("C42996FFFEC4A182", True))
        self.assertTrue(all(url.startswith("https://") for url, _ in session.asked), "never plain http: that is where the redirect is")
        for _, kwargs in session.asked:
            self.assertIs(kwargs["ssl"], False)
            self.assertIs(kwargs["allow_redirects"], False)

    async def test_a_bridge_without_the_v2_api_says_so(self):
        session = Session({CONFIG: Reply(body={"bridgeid": "ABC"}), V2: Reply(status=404)})
        self.assertFalse((await discover_bridge("192.0.2.7", session)).supports_v2)

    async def test_a_v2_check_that_cannot_be_made_does_not_stop_the_discovery(self):
        session = Session({CONFIG: Reply(body={"bridgeid": "ABC"}), V2: Reply(error=aiohttp.ClientConnectionError())})
        self.assertFalse((await discover_bridge("192.0.2.7", session)).supports_v2)

    async def test_nothing_that_is_not_a_bridge_is_taken_for_one(self):
        for config in (
            Reply(error=aiohttp.ClientConnectionError()),
            Reply(error=TimeoutError()),
            Reply(status=404),
            Reply(body={"name": "x"}),
            Reply(body=ValueError("no json")),
            Reply(body=[1]),
        ):
            with self.assertRaises(BridgeError):
                await discover_bridge("192.0.2.7", Session({CONFIG: config}))


if __name__ == "__main__":
    unittest.main()
