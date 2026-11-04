# SPDX-License-Identifier: GPL-3.0-or-later
"""Tests of client.py against a fake local WebSocket server. Run: python -m unittest -v (from this folder)."""

import asyncio
import json
import logging
import time
import unittest

import aiohttp
from aiohttp import web

from tests.support import load

client = load("sync.client")
helpers = load("sync.helpers")

AUTH, UUID = "a" * 27, "12345678-1234-1234-1234-123456789abc"
CONTROL = {
    "type": "control",
    "data": {
        "sync_status": "stop",
        "bridge_id": "b1",
        "entertainment_id": "e1",
        "current_playback_device": {"name": "Mac"},
        "brightness": 100,
        "light_delay": 0,
        "intensity_mode": {"mode": "extreme", "value": "extreme"},
        "color_mode": {"mode": "auto", "value": "Flare", "colors": [[1, 2, 3]]},
        "algo": 0,
    },
}
ENUMS = {
    "type": "enums",
    "data": {
        "sync_statuses": ["start", "stop"],
        "intensities": ["auto", "subtle", "extreme"],
        "color_palettes": [{"name": "auto", "colors": []}, {"name": "Flare", "colors": [[40, 161, 255], [92, 209, 255]]}],
        "algorithms": [{"name": "Classic"}, {"name": "Pulse"}],
    },
}
PLAYER = {
    "type": "player",
    "data": {
        "type": "track",
        "artists": [{"name": "Iron Maiden"}],
        "is_playing": True,
        "album": {
            "name": "Album",
            "albumart_urls": [
                {"width": 640, "url": "https://art/640"},
                {"width": 300, "url": "https://art/300"},
                {"width": 64, "url": "https://art/64"},
            ],
        },
        "track": {"name": "Run to the Hills"},
    },
}


class FakeService:
    """Accepts only the right headers, pushes a control and a player message, and records what it receives."""

    def __init__(self, handshake_status=None, incomplete_connections=0, omit=("control", "enums")):
        self.incomplete_connections = incomplete_connections
        self.omit = omit
        self.received = []
        self.headers_seen = []
        self.connections = 0
        self.handshake_status = handshake_status
        self.sockets = []
        self.accepted_auth = AUTH

    async def handler(self, request):
        self.headers_seen.append(dict(request.headers))
        if self.handshake_status:
            return web.Response(status=self.handshake_status)
        if request.headers.get("auth") != self.accepted_auth or request.headers.get("x-genesis-uuid") != UUID:
            return web.Response(status=401)
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        self.connections += 1
        self.sockets.append(ws)
        incomplete = self.connections <= self.incomplete_connections
        for message in (ENUMS, CONTROL, PLAYER):
            if not (incomplete and message["type"] in self.omit):
                await ws.send_json(message)
        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                body = json.loads(msg.data)
                self.received.append(body)
                await ws.send_json({"type": "control", "data": body["data"]})  # the service echoes what it accepted
        return ws


class ClientTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.runners = []
        self.session = aiohttp.ClientSession()

    async def asyncTearDown(self):
        await self.session.close()
        for runner in self.runners:
            await runner.cleanup()

    async def serve(self, service):
        app = web.Application()
        app.router.add_get("/", service.handler)
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "127.0.0.1", 0)
        await site.start()
        self.runners.append(runner)
        return f"http://127.0.0.1:{site._server.sockets[0].getsockname()[1]}/"

    def make(self, url, auth=AUTH, **kw):
        self.events = {"states": [], "connection": [], "rejected": 0}
        return client.GenesisClient(
            self.session,
            url,
            auth,
            UUID,
            on_state=self.events["states"].append,
            on_connection=self.events["connection"].append,
            on_rejected=lambda: self.events.__setitem__("rejected", self.events["rejected"] + 1),
            reconnect_min_s=0.05,
            reconnect_max_s=0.2,
            settings_timeout_s=0.3,
            **kw,
        )

    async def until(self, condition, timeout=3):
        async with asyncio.timeout(timeout):
            while not condition():
                await asyncio.sleep(0.01)

    # --- apply_message
    def test_control_and_player_messages_update_the_state(self):
        state = client.apply_message(client.SyncState(), CONTROL)
        state = client.apply_message(state, PLAYER)
        self.assertEqual((state.sync_status, state.bridge_id, state.playback_device), ("stop", "b1", "Mac"))
        self.assertEqual((state.track, state.artists, state.album), ("Run to the Hills", ("Iron Maiden",), "Album"))

    def test_a_player_message_that_is_not_a_track_clears_the_track(self):
        state = client.apply_message(client.apply_message(client.SyncState(), PLAYER), {"type": "player", "data": {"type": "none"}})
        self.assertEqual((state.track, state.artists, state.album, state.album_art_url, state.is_playing), (None, (), None, None, None))

    def test_the_player_message_gives_the_cover_closest_to_300_px_and_whether_it_plays(self):
        state = client.apply_message(client.SyncState(), PLAYER)
        self.assertEqual((state.album_art_url, state.is_playing), ("https://art/300", True))
        paused = client.apply_message(state, {"type": "player", "data": {**PLAYER["data"], "is_playing": False}})
        self.assertIs(paused.is_playing, False)

    def test_the_cover_falls_back_to_the_biggest_when_all_are_small_and_to_none_without_any(self):
        small = {
            "type": "player",
            "data": {"type": "track", "album": {"albumart_urls": [{"width": 64, "url": "a"}, {"width": 200, "url": "b"}]}},
        }
        self.assertEqual(client.apply_message(client.SyncState(), small).album_art_url, "b")
        none = {"type": "player", "data": {"type": "track", "album": {"albumart_urls": [{"width": "x", "url": "a"}, 5, {"url": "z"}]}}}
        self.assertIsNone(client.apply_message(client.SyncState(), none).album_art_url)
        self.assertIsNone(
            client.apply_message(client.SyncState(), {"type": "player", "data": {"type": "track", "is_playing": "yes"}}).is_playing
        )

    def test_malformed_or_unknown_messages_change_nothing(self):
        base = client.apply_message(client.SyncState(), CONTROL)
        for bad in (
            None,
            [],
            "x",
            {"type": "control"},
            {"type": "control", "data": []},
            {"type": "enums", "data": {"a": 1}},
            {"type": "control", "data": {"current_playback_device": "oops"}},
        ):
            self.assertEqual(client.apply_message(base, bad), base, bad)

    def test_settings_and_choices_are_read_from_the_messages(self):
        state = client.apply_message(client.apply_message(client.SyncState(), ENUMS), CONTROL)
        self.assertEqual((state.brightness, state.light_delay, state.intensity, state.palette, state.style), (100, 0, "extreme", "auto", 0))
        self.assertEqual(state.intensities, ("auto", "subtle", "extreme"))
        self.assertEqual(state.palettes, (("auto", ()), ("Flare", ((40, 161, 255), (92, 209, 255)))))
        self.assertEqual(state.styles, ("Classic", "Pulse"))

    def test_a_partial_control_message_keeps_the_other_settings(self):
        state = client.apply_message(client.apply_message(client.SyncState(), CONTROL), {"type": "control", "data": {"brightness": 40}})
        self.assertEqual((state.brightness, state.light_delay, state.intensity), (40, 0, "extreme"))

    def test_malformed_enums_are_ignored_item_by_item(self):
        bad = {
            "type": "enums",
            "data": {
                "intensities": ["auto", 5, None],
                "color_palettes": ["x", {"colors": []}, {"name": "ok", "colors": [[1, 1, 1]]}],
                "algorithms": [{"name": 3}, {"name": "Classic"}],
            },
        }
        state = client.apply_message(client.SyncState(), bad)
        self.assertEqual((state.intensities, state.palettes, state.styles), (("auto",), (("ok", ((1, 1, 1),)),), ("Classic",)))

    # --- client against the fake service
    async def test_oauth_renews_an_open_websocket_at_its_deadline(self):
        service = FakeService()
        url = await self.serve(service)
        first = True

        async def oauth_access():
            nonlocal first
            if first:
                first = False
                return AUTH, time.time() + 0.25
            service.accepted_auth = "renewed-access"
            return service.accepted_auth, time.time() + 30

        connection = self.make(url, oauth_access=oauth_access)
        task = asyncio.create_task(connection.run())
        try:
            await self.until(lambda: service.connections >= 2)
            self.assertEqual([headers["auth"] for headers in service.headers_seen], [AUTH, "renewed-access"])
            self.assertEqual(self.events["rejected"], 0)
            await connection.async_set_sync(True)
            await self.until(lambda: connection.state.sync_status == "start")
            await connection.async_set_sync(False)
            await self.until(lambda: connection.state.sync_status == "stop")
        finally:
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task

    async def test_revoked_oauth_ends_the_loop_and_reports_rejection_once(self):
        async def oauth_access():
            raise client.GenesisRejected

        connection = self.make("http://127.0.0.1:1", oauth_access=oauth_access)
        await asyncio.wait_for(connection.run(), 1)
        self.assertEqual(self.events["rejected"], 1)

    async def test_connects_with_the_two_headers_mirrors_state_and_sends_start_and_stop(self):
        service = FakeService()
        c = self.make(await self.serve(service))
        task = asyncio.create_task(c.run())
        await self.until(lambda: c.state.track is not None)
        self.assertTrue(c.connected)
        self.assertEqual(service.headers_seen[0]["auth"], AUTH)
        self.assertEqual(service.headers_seen[0]["x-genesis-uuid"], UUID)
        await c.async_set_sync(True)
        await self.until(lambda: c.state.sync_status == "start")
        await c.async_set_sync(False)
        await self.until(lambda: c.state.sync_status == "stop")
        self.assertEqual(
            service.received, [{"type": "control", "data": {"sync_status": "start"}}, {"type": "control", "data": {"sync_status": "stop"}}]
        )
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        self.assertFalse(c.connected)
        self.assertEqual(self.events["connection"][-1], False)

    async def test_every_setting_is_sent_in_the_format_the_service_accepted(self):
        service = FakeService()
        c = self.make(await self.serve(service))
        task = asyncio.create_task(c.run())
        await self.until(lambda: c.state.styles and c.state.track)
        await c.async_set_brightness(60)
        await c.async_set_light_delay(2)
        await c.async_set_intensity("subtle")
        await c.async_set_palette("Flare")
        await c.async_set_palette("auto")
        await c.async_set_style("Pulse")
        await c.async_set_area("area-2")
        await self.until(lambda: len(service.received) == 7 and c.state.entertainment_id == "area-2")
        self.assertEqual(
            [m["data"] for m in service.received],
            [
                {"brightness": 60},
                {"light_delay": 2},
                {"intensity_mode": {"mode": "subtle", "value": "subtle"}},
                {"color_mode": {"mode": "Flare", "value": "Flare", "colors": [[40, 161, 255], [92, 209, 255]]}},
                {"color_mode": {"mode": "auto", "value": "auto", "colors": []}},
                {"algo": 1},
                {"entertainment_id": "area-2"},
            ],
        )
        self.assertEqual(
            (c.state.brightness, c.state.light_delay, c.state.intensity, c.state.palette, c.state.style), (60, 2, "subtle", "auto", 1)
        )
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    async def test_an_unknown_choice_is_refused_and_nothing_is_sent(self):
        service = FakeService()
        c = self.make(await self.serve(service))
        task = asyncio.create_task(c.run())
        await self.until(lambda: c.state.styles)
        for call in (c.async_set_intensity("loud"), c.async_set_palette("Neon"), c.async_set_style("Waltz")):
            with self.assertRaises(ValueError):
                await call
        await asyncio.sleep(0.1)
        self.assertEqual(service.received, [])
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    async def test_a_connection_that_lacks_the_settings_is_replaced_and_the_warning_names_what_arrived(self):
        service = FakeService(incomplete_connections=2)
        c = self.make(await self.serve(service))
        with self.assertLogs(client._LOGGER, level=logging.WARNING) as logs:
            task = asyncio.create_task(c.run())
            await self.until(lambda: c.state.styles and c.state.sync_status and service.connections == 3)
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
        self.assertEqual(service.connections, 3)
        warnings = [line for line in logs.output if "did not send its" in line]
        self.assertEqual(len(warnings), 2)
        self.assertIn("control and enums", warnings[0])
        self.assertIn("it sent: player", warnings[0])
        self.assertNotIn(AUTH, "\n".join(logs.output))

    async def test_a_complete_connection_is_not_replaced(self):
        service = FakeService()
        c = self.make(await self.serve(service))
        task = asyncio.create_task(c.run())
        await self.until(lambda: c.state.styles and c.state.sync_status)
        await asyncio.sleep(0.8)
        self.assertEqual(service.connections, 1)
        self.assertTrue(c.connected)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    async def test_sending_while_disconnected_raises(self):
        c = self.make("http://127.0.0.1:1/")
        with self.assertRaises(client.GenesisUnavailable):
            await c.async_set_sync(True)

    async def test_reconnects_after_the_service_drops_the_connection(self):
        service = FakeService()
        c = self.make(await self.serve(service))
        task = asyncio.create_task(c.run())
        await self.until(lambda: service.connections == 1 and c.connected)
        await service.sockets[0].close()
        await self.until(lambda: service.connections == 2 and c.connected)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    async def test_a_401_ends_the_loop_at_once_and_reports_rejection_once(self):
        c = self.make(await self.serve(FakeService()), auth="wrong")
        await asyncio.wait_for(c.run(), 3)
        self.assertEqual(self.events["rejected"], 1)

    async def test_a_500_is_retried_and_only_a_repeated_500_is_a_rejection(self):
        service = FakeService(handshake_status=500)
        c = self.make(await self.serve(service))
        await asyncio.wait_for(c.run(), 3)
        self.assertEqual(len(service.headers_seen), client.REPEATS_BEFORE_REJECTION)
        self.assertEqual(self.events["rejected"], 1)

    async def test_a_503_is_retried_forever_not_a_rejection(self):
        service = FakeService(handshake_status=503)
        c = self.make(await self.serve(service))
        task = asyncio.create_task(c.run())
        await self.until(lambda: len(service.headers_seen) >= 6)
        self.assertFalse(task.done())
        self.assertEqual(self.events["rejected"], 0)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    async def test_the_token_never_appears_in_the_logs(self):
        service = FakeService(handshake_status=503)
        c = self.make(await self.serve(service))
        with self.assertLogs(client._LOGGER, level=logging.DEBUG) as logs:
            task = asyncio.create_task(c.run())
            await self.until(lambda: len(service.headers_seen) >= 2)
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
        self.assertNotIn(AUTH, "\n".join(logs.output))

    # --- probe
    async def test_probe_returns_the_first_state(self):
        url = await self.serve(FakeService())
        state = await client.async_probe(self.session, url, AUTH, UUID)
        self.assertEqual(state.sync_status, "stop")

    async def test_probe_maps_401_to_rejected_and_unreachable_to_unavailable(self):
        url = await self.serve(FakeService())
        with self.assertRaises(client.GenesisRejected):
            await client.async_probe(self.session, url, "wrong", UUID)
        with self.assertRaises(client.GenesisUnavailable):
            await client.async_probe(self.session, "http://127.0.0.1:1/", AUTH, UUID)

    async def test_probe_maps_500_to_rejected_and_503_to_unavailable(self):
        with self.assertRaises(client.GenesisRejected):
            await client.async_probe(self.session, await self.serve(FakeService(500)), AUTH, UUID)
        with self.assertRaises(client.GenesisUnavailable):
            await client.async_probe(self.session, await self.serve(FakeService(503)), AUTH, UUID)


class HelperTests(unittest.TestCase):
    def test_the_bridge_ids_of_the_two_services_match(self):
        self.assertTrue(helpers.same_bridge("c42996fffec4a182", "c42996c4a182"))
        self.assertTrue(helpers.same_bridge("C42996FFFEC4A182", "c42996c4a182"))
        self.assertTrue(helpers.same_bridge("c42996fffec4a182", "c42996fffec4a182"))

    def test_other_bridges_and_missing_ids_do_not_match(self):
        self.assertFalse(helpers.same_bridge("c42996fffec4a182", "c42996c4a183"))
        self.assertFalse(helpers.same_bridge("c42996fffec4a182", None))
        self.assertFalse(helpers.same_bridge("short", "c42996c4a182"))

    def test_the_light_ids_of_an_area_are_its_light_services_only(self):
        area = {
            "light_services": [
                {"rtype": "light", "rid": "a"},
                {"rtype": "device", "rid": "x"},
                {"rtype": "light", "rid": "b"},
                "junk",
                {"rtype": "light"},
            ]
        }
        self.assertEqual(helpers.area_light_ids(area), ["a", "b"])
        self.assertEqual(helpers.area_light_ids({}), [])
        self.assertEqual(helpers.area_light_ids({"light_services": None}), [])

    def test_area_options_use_the_name_unless_two_areas_share_it(self):
        self.assertEqual(helpers.area_options({"aaaa1": "Bedroom", "bbbb2": "Living room"}), {"Bedroom": "aaaa1", "Living room": "bbbb2"})
        both = helpers.area_options({"aaaa1": "Room", "bbbb2": "Room", "cccc3": "Other"})
        self.assertEqual(sorted(both.values()), ["aaaa1", "bbbb2", "cccc3"])
        self.assertEqual(len(both), 3)
        self.assertEqual(both["Other"], "cccc3")
        self.assertNotIn("Room", both)


if __name__ == "__main__":
    unittest.main()
