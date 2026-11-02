# SPDX-License-Identifier: GPL-3.0-or-later
"""The sync box client against a fake box (what the box's published API is assumed to do)."""

import unittest

import aiohttp
from aiohttp import web

from tests.support import load

client = load("syncbox.client")

STATE = {
    "execution": {
        "mode": "video",
        "syncActive": True,
        "hdmiActive": True,
        "hdmiSource": "input2",
        "brightness": 150,
        "video": {"intensity": "high"},
    },
    "hdmi": {"input1": {"name": "Console"}, "input2": {"name": "TV box"}, "output": {"name": "TV"}},
}


class FakeBox:
    def __init__(self):
        self.registering = False
        self.seen = []
        app = web.Application()
        app.router.add_get("/api/v1", self.state)
        app.router.add_get("/api/v1/device", self.device)
        app.router.add_put("/api/v1/execution", self.execution)
        app.router.add_post("/api/v1/registrations", self.register)
        app.router.add_delete("/api/v1/registrations/{rid}", self.unregister)
        self.app = app

    def _auth(self, request):
        return request.headers.get("Authorization") == "Bearer secret"

    async def state(self, request):
        return web.json_response(STATE) if self._auth(request) else web.Response(status=401)

    async def device(self, request):
        return web.json_response({"name": "Box", "uniqueId": "box-1"})

    async def execution(self, request):
        if not self._auth(request):
            return web.Response(status=401)
        self.seen.append(await request.json())
        return web.json_response({})

    async def register(self, request):
        if not self.registering:
            return web.json_response({"code": 16, "message": "Invalid State"}, status=400)
        return web.json_response({"registrationId": "r1", "accessToken": "secret"})

    async def unregister(self, request):
        self.seen.append(("unregister", request.match_info["rid"]))
        return web.Response(status=200)


class SyncBoxTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.box = FakeBox()
        self.runner = web.AppRunner(self.box.app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await site.start()
        self.port = site._server.sockets[0].getsockname()[1]
        self.session = aiohttp.ClientSession()

    async def asyncTearDown(self):
        await self.session.close()
        await self.runner.cleanup()

    def make(self, token="secret"):
        box = client.SyncBox(self.session, "127.0.0.1", token)
        box._base = f"http://127.0.0.1:{self.port}/api/v1"  # the fake box speaks plain HTTP
        return box

    async def test_registration_waits_for_the_button_and_then_gives_a_token(self):
        box = self.make(token=None)
        with self.assertRaises(client.SyncBoxRegistrationPending):
            await box.register("Home Assistant", "hue_plus")
        self.box.registering = True
        self.assertEqual(await box.register("Home Assistant", "hue_plus"), ("r1", "secret"))
        self.assertEqual((await box.state())["execution"]["mode"], "video")

    def test_only_names_and_addresses_are_accepted_as_a_host(self):
        for good in ("box.local", "192.168.0.9", "hue-box"):
            self.assertTrue(client.valid_host(good), good)
        for bad in ("", "http://x", "box/x", "user@box", "box:80", "a b", "-box", "box."):
            self.assertFalse(client.valid_host(bad), bad)
        with self.assertRaises(ValueError):
            client.SyncBox(self.session, "evil/path")

    async def test_the_device_is_read_without_a_token(self):
        self.assertEqual((await self.make(None).device())["uniqueId"], "box-1")

    async def test_a_wrong_token_is_reported_as_one(self):
        with self.assertRaisesRegex(client.SyncBoxError, "access token") as caught:
            await self.make("wrong").state()
        self.assertEqual(caught.exception.status, 401)

    async def test_changes_send_only_what_was_given_and_refuse_what_cannot_be_right(self):
        box = self.make()
        await box.execute(mode="music", syncActive=True)
        await box.set_intensity("game", "intense")
        await box.set_hdmi_source("input3")
        self.assertEqual(
            self.box.seen, [{"mode": "music", "syncActive": True}, {"game": {"intensity": "intense"}}, {"hdmiSource": "input3"}]
        )
        for call in (
            lambda: box.execute(mode="disco"),
            lambda: box.execute(brightness=201),
            lambda: box.execute(),
            lambda: box.set_intensity("passthrough", "high"),
            lambda: box.set_intensity("video", "max"),
            lambda: box.set_hdmi_source("input9"),
        ):
            with self.assertRaises(ValueError):
                await call()
        self.assertEqual(len(self.box.seen), 3)

    async def test_the_summary_is_what_a_screen_shows(self):
        self.assertEqual(
            client.summary(await self.make().state()),
            {
                "syncing": True,
                "hdmi_active": True,
                "mode": "video",
                "source": "input2",
                "brightness": 150,
                "intensity": "high",
                "inputs": {"input1": "Console", "input2": "TV box"},
            },
        )

    async def test_an_unreachable_box_is_an_error_not_a_crash(self):
        box = client.SyncBox(self.session, "127.0.0.1", "secret")
        box._base = "http://127.0.0.1:1/api/v1"
        with self.assertRaisesRegex(client.SyncBoxError, "could not be reached"):
            await box.state()


if __name__ == "__main__":
    unittest.main()
