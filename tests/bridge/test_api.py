# SPDX-License-Identifier: GPL-3.0-or-later
"""BridgeApi against a fake bridge that answers the way the real one does (v2 JSON with data/errors, v1 with success/error lists)."""

import unittest

import aiohttp
from aiohttp import web

from tests.support import load

api = load("bridge.api")

KEY = "secretappkey1234567890"


class FakeBridge:
    def __init__(self):
        self.v2 = {"light": [{"id": "l1", "type": "light"}], "scene": []}
        self.config = {"name": "Bridge", "whitelist": {KEY: {"name": "home-assistant#home"}, "otherkey": {"name": "Hue#iPhone"}}}
        self.requests = []

    def app(self):
        app = web.Application()
        app.router.add_route("*", "/clip/v2/resource/{rtype}", self.v2_collection)
        app.router.add_route("*", "/clip/v2/resource/{rtype}/{rid}", self.v2_item)
        app.router.add_route("*", "/api/{key}/config", self.v1_config)
        app.router.add_route("*", "/api/{key}/config/whitelist/{target}", self.v1_revoke)
        return app

    async def v2_collection(self, request):
        self.requests.append((request.method, request.path))
        rtype = request.match_info["rtype"]
        if request.method == "GET":
            return web.json_response({"data": self.v2.get(rtype, []), "errors": []})
        body = await request.json()
        if request.method == "POST":
            if not body.get("name"):
                return web.json_response({"data": [], "errors": [{"description": "missing name"}]}, status=400)
            rid = f"new-{len(self.v2.setdefault(rtype, []))}"
            self.v2[rtype].append({"id": rid, "type": rtype, **body})
            return web.json_response({"data": [{"rid": rid, "rtype": rtype}], "errors": []}, status=200)
        return web.Response(status=405)

    async def v2_item(self, request):
        self.requests.append((request.method, request.path))
        rtype, rid = request.match_info["rtype"], request.match_info["rid"]
        item = next((i for i in self.v2.get(rtype, []) if i["id"] == rid), None)
        if item is None:
            return web.json_response({"data": [], "errors": [{"description": "not found"}]}, status=404)
        if request.method == "GET":
            return web.json_response({"data": [item], "errors": []})
        if request.method == "PUT":
            body = await request.json()
            if body.get("bad"):
                return web.json_response({"data": [], "errors": [{"description": "bad value"}]})  # 200 with errors, as the bridge does
            item.update(body)
            return web.json_response({"data": [{"rid": rid, "rtype": rtype}], "errors": []})
        if request.method == "DELETE":
            self.v2[rtype].remove(item)
            return web.json_response({"data": [{"rid": rid, "rtype": rtype}], "errors": []})
        return web.Response(status=405)

    async def v1_config(self, request):
        self.requests.append((request.method, request.path))
        if request.match_info["key"] != KEY:
            return web.json_response([{"error": {"type": 1, "description": "unauthorized user"}}])
        if request.method == "GET":
            return web.json_response(self.config)
        body = await request.json()
        if body.get("zigbeechannel") == 99:
            return web.json_response([{"error": {"type": 7, "description": "invalid value, 99, for parameter, zigbeechannel"}}])
        self.config.update(body)
        return web.json_response([{"success": {f"/config/{k}": v}} for k, v in body.items()])

    async def v1_revoke(self, request):
        self.requests.append((request.method, request.path))
        target = request.match_info["target"]
        if target not in self.config["whitelist"]:
            return web.json_response([{"error": {"type": 3, "description": "resource, /config/whitelist/x, not available"}}])
        del self.config["whitelist"][target]
        return web.json_response([{"success": f"/config/whitelist/{target} deleted"}])


class ApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.bridge = FakeBridge()
        self.runner = web.AppRunner(self.bridge.app())
        await self.runner.setup()
        site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await site.start()
        self.base = f"http://127.0.0.1:{site._server.sockets[0].getsockname()[1]}/"
        self.session = aiohttp.ClientSession()

        async def transport(method, path, body):
            async with self.session.request(method, self.base + path, json=body) as resp:
                return resp.status, await resp.json(content_type=None)

        self.api = api.BridgeApi(transport, lambda: KEY)

    async def asyncTearDown(self):
        await self.session.close()
        await self.runner.cleanup()

    async def test_list_get_put_post_delete_round_trip(self):
        self.assertEqual([item["id"] for item in await self.api.list("light")], ["l1"])
        self.assertEqual((await self.api.get("light", "l1"))["type"], "light")
        await self.api.put("light", "l1", {"on": True})
        self.assertTrue((await self.api.get("light", "l1"))["on"])
        rid = await self.api.post("scene", {"name": "Evening"})
        self.assertEqual(rid, "new-0")
        await self.api.delete("scene", rid)
        self.assertEqual(await self.api.list("scene"), [])

    async def test_a_v2_error_in_a_200_answer_raises_with_the_bridges_words(self):
        with self.assertRaisesRegex(api.BridgeError, "bad value"):
            await self.api.put("light", "l1", {"bad": True})

    async def test_a_v2_error_status_raises_with_the_status_and_the_message(self):
        with self.assertRaises(api.BridgeError) as ctx:
            await self.api.get("light", "nope")
        self.assertEqual(ctx.exception.status, 404)
        self.assertIn("not found", str(ctx.exception))
        with self.assertRaisesRegex(api.BridgeError, "missing name"):
            await self.api.post("scene", {})

    async def test_v1_config_is_read_and_written_with_the_key_in_the_path_only(self):
        self.assertEqual((await self.api.config())["name"], "Bridge")
        await self.api.put_config({"name": "Renamed"})
        self.assertEqual(self.bridge.config["name"], "Renamed")
        self.assertTrue(all(KEY in path for _, path in self.bridge.requests if "/api/" in path))

    async def test_a_v1_error_list_raises_and_never_contains_the_key(self):
        with self.assertRaises(api.BridgeError) as ctx:
            await self.api.put_config({"zigbeechannel": 99})
        self.assertIn("invalid value", str(ctx.exception))
        self.assertNotIn(KEY, str(ctx.exception))
        bad = api.BridgeApi(self.api._transport, lambda: "wrongkey")
        with self.assertRaises(api.BridgeError) as ctx:
            await bad.config()
        self.assertNotIn("wrongkey", str(ctx.exception))

    async def test_revoking_an_app_removes_only_that_key_and_an_unknown_key_is_an_error(self):
        await self.api.revoke_app("otherkey")
        self.assertEqual(list(self.bridge.config["whitelist"]), [KEY])
        with self.assertRaisesRegex(api.BridgeError, "not available"):
            await self.api.revoke_app("otherkey")

    async def test_post_without_a_rid_in_the_answer_is_an_error(self):
        async def empty(method, path, body):
            return 200, {"data": [], "errors": []}

        with self.assertRaises(api.BridgeError):
            await api.BridgeApi(empty, lambda: KEY).post("scene", {"name": "x"})

    def test_app_ids_are_stable_short_and_do_not_contain_the_key(self):
        self.assertEqual(api.app_id(KEY), api.app_id(KEY))
        self.assertNotEqual(api.app_id(KEY), api.app_id("otherkey"))
        self.assertEqual(len(api.app_id(KEY)), 12)
        self.assertNotIn(KEY[:6], api.app_id(KEY))


if __name__ == "__main__":
    unittest.main()
