# SPDX-License-Identifier: GPL-3.0-or-later
"""The actions, with a stand-in for the bridge API that records what would be sent."""

import unittest

from tests.support import load

actions = load("bridge.actions")
models = load("bridge.models")
api = load("bridge.api")


class Recorder:
    """Stands in for BridgeApi: every write is recorded as (kind, resource, id, body)."""

    def __init__(self, own_key="ownkey"):
        self.calls = []
        self.own_key = own_key

    async def put(self, resource, rid, body):
        self.calls.append(("put", resource, rid, body))

    async def post(self, resource, body):
        self.calls.append(("post", resource, None, body))
        return "new-id"

    async def delete(self, resource, rid):
        self.calls.append(("delete", resource, rid, None))

    async def put_config(self, body):
        self.calls.append(("put_config", None, None, body))

    async def revoke_app(self, key):
        self.calls.append(("revoke", None, key, None))

    async def list(self, resource):
        return {"clip": [{"resources": ["light", "motion"]}], "motion_area_candidate": [{"id": "c1"}], "motion_area_configuration": []}.get(
            resource, []
        )

    async def request(self, method, path, body=None):
        self.calls.append(("request", method, path, body))
        return [{"id": "x"}]

    def is_own_key(self, key):
        return key == self.own_key


def lamp(device_id, name, light_id, ent_id):
    return (
        {
            "id": device_id,
            "metadata": {"name": name},
            "services": [{"rid": light_id, "rtype": "light"}, {"rid": ent_id, "rtype": "entertainment"}],
        },
        {
            "id": light_id,
            "owner": {"rid": device_id},
            "on": {"on": True},
            "dimming": {"brightness": 50},
            "color": {"xy": {"x": 0.3, "y": 0.3}},
            "color_temperature": {"mirek_valid": False},
        },
        {"id": ent_id, "owner": {"rid": device_id}},
    )


def world():
    d1, l1, e1 = lamp("d1", "Floor Light", "l1", "e1")
    d2, l2, e2 = lamp("d2", "Bed Light", "l2", "e2")
    return models.Snapshot(
        device=[d1, d2],
        light=[l1, l2],
        entertainment=[e1, e2],
        room=[
            {"id": "r1", "metadata": {"name": "Bedroom"}, "children": [{"rid": "d1", "rtype": "device"}, {"rid": "d2", "rtype": "device"}]}
        ],
        zone=[{"id": "z1", "metadata": {"name": "Reading"}, "children": [{"rid": "l1", "rtype": "light"}]}],
        scene=[
            {"id": "s1", "metadata": {"name": "Soho"}, "actions": [{"target": {"rid": "l1", "rtype": "light"}, "action": {}}]},
            {"id": "s2", "metadata": {"name": "Twin"}},
            {"id": "s3", "metadata": {"name": "twin"}},
        ],
        entertainment_configuration=[{"id": "ec1", "metadata": {"name": "Music"}}],
        behavior_script=[{"id": "bs1", "metadata": {"name": "Timers"}}],
        behavior_instance=[{"id": "bi1", "metadata": {"name": "Tea"}}],
        zigbee_device_discovery=[{"id": "zdd"}],
        matter=[{"id": "m1"}],
        matter_fabric=[{"id": "f1", "fabric_data": {"label": "Home"}}],
        smart_scene=[{"id": "ss1", "metadata": {"name": "Daily"}}],
        config={"whitelist": {"ownkey": {"name": "home-assistant#home"}, "otherkey": {"name": "Hue#iPhone"}}},
    )


class ActionTests(unittest.IsolatedAsyncioTestCase):
    async def go(self, name, data, snap=None, rec=None):
        rec = rec or Recorder()
        result = await actions.run(name, rec, snap or world(), data)
        return rec.calls, result

    # --- finding things
    async def test_things_are_found_by_id_or_by_name_and_ambiguous_names_are_refused(self):
        calls, _ = await self.go("delete_scene", {"scene": "s1", "confirm": True})
        self.assertEqual(calls, [("delete", "scene", "s1", None)])
        calls, _ = await self.go("delete_scene", {"scene": "SOHO", "confirm": True})
        self.assertEqual(calls[0][2], "s1")
        with self.assertRaisesRegex(ValueError, "More than one"):
            await self.go("delete_scene", {"scene": "twin", "confirm": True})
        with self.assertRaisesRegex(ValueError, "No scene called"):
            await self.go("delete_scene", {"scene": "nope", "confirm": True})

    async def test_every_destructive_action_refuses_without_confirm_and_nothing_is_sent(self):
        destructive = [n for n, a in actions.ACTIONS.items() if a.destructive]
        self.assertEqual(len(destructive), 13)
        for name in destructive:
            for confirm in ({}, {"confirm": False}, {"confirm": "yes"}):
                rec = Recorder()
                with self.assertRaisesRegex(ValueError, "confirm"):
                    await actions.run(name, rec, world(), dict(confirm))
                self.assertEqual(rec.calls, [], name)

    async def test_the_destructive_ones_are_the_ones_that_delete_revoke_or_disrupt(self):
        expected = {
            "delete_scene",
            "delete_smart_scene",
            "delete_room",
            "delete_zone",
            "delete_motion_area",
            "delete_entertainment_area",
            "delete_automation",
            "revoke_app",
            "install_bridge_update",
            "set_zigbee_channel",
            "press_link_button",
            "remove_device",
            "remove_matter_fabric",
        }
        self.assertEqual(expected, {n for n, a in actions.ACTIONS.items() if a.destructive})

    # --- lights
    async def test_lights_are_found_by_the_name_of_their_device_and_effects_are_sent(self):
        calls, _ = await self.go("timed_effect", {"light": "Bed Light", "effect": "sunrise", "duration": 600})
        self.assertEqual(calls, [("put", "light", "l2", {"timed_effects": {"effect": "sunrise", "duration": 600000}})])
        calls, _ = await self.go("signal", {"light": "l1", "signal": "alternating", "duration": 3, "colors_xy": [[0.1, 0.2], [0.3, 0.4]]})
        self.assertEqual(calls[0][3]["signaling"]["colors"][0], {"xy": {"x": 0.1, "y": 0.2}})
        calls, _ = await self.go("identify", {"light": "l1"})
        self.assertEqual(calls[0][3], {"identify": {"action": "identify"}})

    async def test_light_setup_is_refused_for_a_direction_the_bridge_says_is_fixed(self):
        strip = {
            "id": "l9",
            "metadata": {"name": "Strip"},
            "content_configuration": {"orientation": {"configurable": True}, "order": {"configurable": False}},
        }
        s = models.Snapshot()
        s.light = [strip]
        calls, _ = await self.go("configure_light", {"light": "l9", "function": "decorative", "gradient_orientation": "vertical"}, snap=s)
        self.assertEqual(
            calls[0][3],
            {"metadata": {"function": "decorative"}, "content_configuration": {"orientation": {"orientation": "vertical"}}},
        )
        with self.assertRaisesRegex(ValueError, "order of this light cannot be changed"):
            await self.go("configure_light", {"light": "l9", "gradient_order": "reversed"}, snap=s)
        with self.assertRaisesRegex(ValueError, "orientation of this light cannot be changed"):
            await self.go("configure_light", {"light": "l1", "gradient_orientation": "vertical"})

    async def test_streaming_end_state_changes_the_areas_automation_and_keeps_where(self):
        s = models.Snapshot()
        s.entertainment_configuration = [{"id": "a1", "metadata": {"name": "TV"}}, {"id": "a2", "metadata": {"name": "Desk"}}]
        s.scene = [{"id": "sc1", "metadata": {"name": "Movie"}}]
        s.behavior_script = [{"id": "sx", "metadata": {"name": "Light state after streaming"}}]
        s.behavior_instance = [
            {
                "id": "i1",
                "script_id": "sx",
                "configuration": {"end_state": "last_state", "where": [{"group": {"rid": "a1", "rtype": "entertainment_configuration"}}]},
            }
        ]
        calls, _ = await self.go("set_streaming_end_state", {"area": "TV", "end_state": "scene", "scene": "Movie"}, snap=s)
        self.assertEqual(calls[0][:3], ("put", "behavior_instance", "i1"))
        self.assertEqual(
            calls[0][3]["configuration"],
            {
                "end_state": "scene",
                "scene": {"rid": "sc1", "rtype": "scene"},
                "where": [{"group": {"rid": "a1", "rtype": "entertainment_configuration"}}],
            },
        )
        calls, _ = await self.go("set_streaming_end_state", {"area": "Desk", "end_state": "off"}, snap=s)
        self.assertEqual((calls[0][0], calls[0][1], calls[0][3]["script_id"]), ("post", "behavior_instance", "sx"))
        s.behavior_script = []
        with self.assertRaisesRegex(ValueError, "no 'Light state after streaming' script"):
            await self.go("set_streaming_end_state", {"area": "Desk", "end_state": "off"}, snap=s)

    async def test_a_motion_area_is_made_only_from_lights_the_bridge_offers(self):
        s = models.Snapshot()
        s.room = [{"id": "r1", "metadata": {"name": "Hall"}}]
        s.device = [{"id": f"d{i}", "metadata": {"name": f"Lamp {i}"}} for i in (1, 2, 3, 4)]
        s.light = [{"id": f"l{i}", "owner": {"rid": f"d{i}"}} for i in (1, 2, 3, 4)]

        class Offers(Recorder):
            async def list(self, resource):
                if resource == "motion_area_candidate":
                    return [{"id": f"c{i}", "owner": {"rid": f"d{i}"}} for i in (1, 2, 3)]
                return []

        calls, result = await self.go(
            "create_motion_area", {"name": "Hall", "group": "Hall", "lights": ["Lamp 1", "Lamp 2", "l3"]}, snap=s, rec=Offers()
        )
        self.assertEqual(result, {"id": "new-id"})
        self.assertEqual(calls[0][3]["name"], "Hall")
        self.assertEqual(calls[0][3]["group"], {"rid": "r1", "rtype": "room"})
        self.assertEqual([p["resource"]["rid"] for p in calls[0][3]["participants"]], ["c1", "c2", "c3"])
        with self.assertRaisesRegex(ValueError, "cannot take part"):
            await self.go("create_motion_area", {"name": "Hall", "group": "Hall", "lights": ["l1", "l2", "l4"]}, snap=s, rec=Offers())
        with self.assertRaisesRegex(ValueError, "This cannot be undone"):
            await self.go("delete_motion_area", {"area": "x"})

    def _area_world(self):
        s = models.Snapshot()
        s.room = [{"id": "r1", "metadata": {"name": "Hall"}}]
        s.scene = [{"id": "s1", "metadata": {"name": "Read"}}, {"id": "s2", "metadata": {"name": "Nightlight"}}]
        s.behavior_script = [{"id": "ms", "metadata": {"name": "Motion Sensor"}}]

        class Bridge(Recorder):
            def __init__(self, instances):
                super().__init__()
                self.instances = instances

            async def list(self, resource):
                return {
                    "motion_area_configuration": [
                        {
                            "id": "a1",
                            "name": "Hall area",
                            "services": [
                                {"rid": "cv1", "rtype": "convenience_area_motion"},
                                {"rid": "sc1", "rtype": "security_area_motion"},
                            ],
                        }
                    ],
                    "behavior_instance": self.instances,
                }.get(resource, [])

        return s, Bridge

    async def test_a_motion_area_is_renamed_and_its_sensitivity_goes_to_its_motion_service(self):
        s, bridge = self._area_world()
        calls, _ = await self.go("set_motion_area", {"area": "Hall area", "name": "Entrance", "sensitivity": 2}, snap=s, rec=bridge([]))
        self.assertEqual(calls[0], ("put", "motion_area_configuration", "a1", {"name": "Entrance"}))
        self.assertEqual(calls[1], ("put", "convenience_area_motion", "cv1", {"sensitivity": {"sensitivity": 2}}))

    async def test_switching_an_area_on_switches_its_motion_service_on_which_calibrates_it(self):
        s, bridge = self._area_world()
        calls, _ = await self.go("set_motion_area", {"area": "a1", "enabled": True}, snap=s, rec=bridge([]))
        self.assertEqual(calls[0], ("put", "motion_area_configuration", "a1", {"enabled": True}))
        self.assertEqual(calls[1], ("put", "convenience_area_motion", "cv1", {"enabled": True}))

    async def test_the_devices_of_a_motion_area_are_replaced_by_three_or_four_candidates(self):
        s, bridge = self._area_world()
        s.device = [{"id": f"d{i}", "metadata": {"name": f"Lamp {i}"}} for i in (1, 2, 3, 4, 5)]
        s.light = [{"id": f"l{i}", "owner": {"rid": f"d{i}"}} for i in (1, 2, 3, 4, 5)]

        class WithCandidates(bridge):
            async def list(self, resource):
                if resource == "motion_area_candidate":
                    return [{"id": f"c{i}", "owner": {"rid": f"d{i}"}} for i in (1, 2, 3, 4)]
                return await super().list(resource)

        calls, _ = await self.go("set_motion_area", {"area": "a1", "lights": ["d1", "Lamp 2", "l3"]}, snap=s, rec=WithCandidates([]))
        self.assertEqual(calls[0][:3], ("put", "motion_area_configuration", "a1"))
        self.assertEqual([p["resource"]["rid"] for p in calls[0][3]["participants"]], ["c1", "c2", "c3"])
        with self.assertRaisesRegex(ValueError, "three or four"):
            await self.go("set_motion_area", {"area": "a1", "lights": ["d1", "d2"]}, snap=s, rec=WithCandidates([]))
        with self.assertRaisesRegex(ValueError, "cannot take part"):
            await self.go("set_motion_area", {"area": "a1", "lights": ["d1", "d2", "l5"]}, snap=s, rec=WithCandidates([]))

    async def test_what_a_motion_area_does_replaces_its_automation_or_makes_it(self):
        s, bridge = self._area_world()
        data = {
            "area": "a1",
            "groups": ["Hall"],
            "slots": [{"time": "07:00", "scene": "Read", "off_after_minutes": 10}, {"time": "23:00", "scene": "Nightlight"}],
            "dark_threshold": 3000,
        }
        calls, _ = await self.go("set_motion_area_lights", data, snap=s, rec=bridge([]))
        self.assertEqual((calls[0][0], calls[0][1], calls[0][3]["script_id"]), ("post", "behavior_instance", "ms"))
        configuration = calls[0][3]["configuration"]
        self.assertEqual(configuration["source"], {"rid": "a1", "rtype": "motion_area_configuration"})
        self.assertEqual(
            [t["on_motion"]["recall_single"][0]["action"]["recall"]["rid"] for t in configuration["when"]["timeslots"]], ["s1", "s2"]
        )
        mine = {"id": "bi9", "configuration": {"source": {"rid": "a1", "rtype": "motion_area_configuration"}}}
        other = {"id": "bi8", "configuration": {"source": {"rid": "other", "rtype": "motion"}}}
        calls, _ = await self.go("set_motion_area_lights", data, snap=s, rec=bridge([other, mine]))
        self.assertEqual((calls[0][0], calls[0][1], calls[0][2]), ("put", "behavior_instance", "bi9"))
        with self.assertRaisesRegex(ValueError, "No scene called"):
            await self.go("set_motion_area_lights", {**data, "slots": [{"time": "07:00", "scene": "Nope"}]}, snap=s, rec=bridge([]))

    async def test_an_area_time_can_start_at_sunset_and_a_time_without_a_scene_leaves_the_lights_alone(self):
        s, bridge = self._area_world()
        data = {
            "area": "a1",
            "groups": ["Hall"],
            "slots": [{"sun": "sunrise", "offset_minutes": 15}, {"sun": "sunset", "scene": "Read", "off_after_minutes": 10}],
        }
        calls, _ = await self.go("set_motion_area_lights", data, snap=s, rec=bridge([]))
        slots = calls[0][3]["configuration"]["when"]["timeslots"]
        self.assertEqual(slots[0]["start_time"], {"type": "sunrise", "offset": {"minutes": 15}})
        self.assertEqual(slots[0]["on_motion"], {"recall_single": [{"action": "do_nothing"}]})
        self.assertEqual(slots[1]["start_time"], {"type": "sunset"})
        for bad in ({"time": "07:00", "sun": "sunset"}, {"scene": "Read"}):
            with self.assertRaisesRegex(ValueError, "Each time is"):
                await self.go("set_motion_area_lights", {**data, "slots": [bad]}, snap=s, rec=bridge([]))

    async def test_deleting_a_motion_area_deletes_the_automation_that_uses_it_first(self):
        s, bridge = self._area_world()
        mine = {"id": "bi9", "configuration": {"source": {"rid": "a1", "rtype": "motion_area_configuration"}}}
        other = {"id": "bi8", "configuration": {"source": {"rid": "other", "rtype": "motion"}}}
        calls, _ = await self.go("delete_motion_area", {"area": "a1", "confirm": True}, snap=s, rec=bridge([other, mine]))
        self.assertEqual(calls, [("delete", "behavior_instance", "bi9", None), ("delete", "motion_area_configuration", "a1", None)])

    async def test_power_on_converts_kelvin_to_mirek(self):
        calls, _ = await self.go(
            "set_power_on", {"light": "l1", "preset": "custom", "on": "on", "brightness": 70, "color_temperature_kelvin": 2700}
        )
        self.assertEqual(calls[0][3]["powerup"]["color"], {"mode": "color_temperature", "color_temperature": {"mirek": 370}})
        calls, _ = await self.go("set_power_on", {"light": "l1", "preset": "safety"})
        self.assertEqual(calls[0][3], {"powerup": {"preset": "safety"}})

    async def test_set_name_reaches_every_kind_and_refuses_an_unknown_one(self):
        for kind, ref, resource in (
            ("light", "l1", "light"),
            ("device", "d1", "device"),
            ("room", "r1", "room"),
            ("zone", "z1", "zone"),
            ("scene", "s1", "scene"),
            ("entertainment_area", "ec1", "entertainment_configuration"),
            ("automation", "bi1", "behavior_instance"),
        ):
            calls, _ = await self.go("set_name", {"resource": kind, "id": ref, "name": "New"})
            self.assertEqual((calls[0][1], calls[0][2]), (resource, ref), kind)
        with self.assertRaisesRegex(ValueError, "The resource is"):
            await self.go("set_name", {"resource": "toaster", "id": "x", "name": "N"})

    # --- scenes
    async def test_a_scene_for_a_room_records_the_lights_of_the_rooms_devices(self):
        calls, result = await self.go("create_scene", {"name": "Now", "group": "Bedroom"})
        body = calls[0][3]
        self.assertEqual(result, {"id": "new-id"})
        self.assertEqual((body["group"], [a["target"]["rid"] for a in body["actions"]]), ({"rid": "r1", "rtype": "room"}, ["l1", "l2"]))
        calls, _ = await self.go("create_scene", {"name": "Named", "group": "r1", "lights": ["Bed Light", "l1"]})
        self.assertEqual(
            [a["target"]["rid"] for a in calls[0][3]["actions"]], ["l1", "l2"], "naming every light of the room is naming none"
        )
        with self.assertRaisesRegex(ValueError, "sets every light"):  # the real bridge refuses a scene that leaves a light of its room out
            await self.go("create_scene", {"name": "Only one", "group": "r1", "lights": ["Bed Light"]})

    async def test_a_scene_for_a_zone_uses_the_zones_lights_and_given_actions_may_be_json_text(self):
        calls, _ = await self.go("create_scene", {"name": "Z", "group": "Reading", "group_type": "zone"})
        self.assertEqual([a["target"]["rid"] for a in calls[0][3]["actions"]], ["l1"])
        calls, _ = await self.go(
            "create_scene",
            {"name": "Given", "group": "r1", "actions": '[{"target": {"rid": "l1", "rtype": "light"}, "action": {"on": {"on": true}}}]'},
        )
        self.assertEqual(calls[0][3]["actions"][0]["action"], {"on": {"on": True}})
        with self.assertRaisesRegex(ValueError, "not valid JSON"):
            await self.go("create_scene", {"name": "Bad", "group": "r1", "actions": "{oops"})

    async def test_updating_a_scene_needs_something_to_change(self):
        calls, _ = await self.go("update_scene", {"scene": "Soho", "speed": 0.3})
        self.assertEqual(calls, [("put", "scene", "s1", {"speed": 0.3})])
        with self.assertRaisesRegex(ValueError, "Nothing to change"):
            await self.go("update_scene", {"scene": "Soho"})

    async def test_a_scene_can_record_how_its_own_lights_look_now(self):
        calls, _ = await self.go("update_scene", {"scene": "Soho", "record_current": True})
        self.assertEqual(calls[0][:3], ("put", "scene", "s1"))
        recorded = calls[0][3]["actions"]
        self.assertTrue(recorded and all(a["target"]["rtype"] == "light" and "on" in a["action"] for a in recorded))
        with self.assertRaisesRegex(ValueError, "either actions or record_current"):
            await self.go("update_scene", {"scene": "Soho", "record_current": True, "actions": "[]"})

    async def test_smart_scenes(self):
        calls, _ = await self.go("set_smart_scene", {"smart_scene": "Daily", "action": "deactivate"})
        self.assertEqual(calls, [("put", "smart_scene", "ss1", {"recall": {"action": "deactivate"}})])
        calls, result = await self.go("create_smart_scene", {"name": "S", "group": "Bedroom", "week_timeslots": '[{"timeslots": []}]'})
        self.assertEqual((calls[0][3]["week_timeslots"], result), ([{"timeslots": []}], {"id": "new-id"}))

    # --- rooms and zones
    async def test_rooms_take_devices_and_zones_take_lights_given_by_name(self):
        calls, result = await self.go("create_room", {"name": "Den", "archetype": "office", "members": ["Floor Light"]})
        self.assertEqual((calls[0][3]["children"], result), ([{"rid": "d1", "rtype": "device"}], {"id": "new-id"}))
        calls, _ = await self.go("create_zone", {"name": "Z", "members": ["Bed Light", "l1"]})
        self.assertEqual(calls[0][3]["children"], [{"rid": "l2", "rtype": "light"}, {"rid": "l1", "rtype": "light"}])
        calls, _ = await self.go("update_zone", {"zone": "Reading", "members": []})
        self.assertEqual(calls[0][3], {"children": []})
        calls, _ = await self.go("delete_room", {"room": "Bedroom", "confirm": True})
        self.assertEqual(calls, [("delete", "room", "r1", None)])

    # --- entertainment areas
    async def test_an_entertainment_area_maps_lights_to_their_entertainment_services(self):
        calls, _ = await self.go(
            "create_entertainment_area",
            {"name": "Party", "area_type": "music", "lights": [{"light": "Bed Light", "x": 0.5, "y": 1, "z": 0}, {"light": "l1"}]},
        )
        locs = calls[0][3]["locations"]["service_locations"]
        self.assertEqual([(loc["service"]["rid"], loc["positions"][0]["x"]) for loc in locs], [("e2", 0.5), ("e1", 0)])
        with self.assertRaisesRegex(ValueError, "light and a position"):
            await self.go("create_entertainment_area", {"name": "P", "area_type": "music", "lights": ["nope"]})
        calls, _ = await self.go("control_entertainment_area", {"area": "Music", "action": "stop"})
        self.assertEqual(calls[0][3], {"action": "stop"})

    async def test_updating_an_area_keeps_what_the_bridge_holds_for_the_lights_that_stay(self):
        snap = world()
        snap.entertainment_configuration = [
            {
                "id": "ec1",
                "metadata": {"name": "Music"},
                "locations": {
                    "service_locations": [
                        {
                            "service": {"rid": "e1", "rtype": "entertainment"},
                            "positions": [{"x": 0, "y": 0, "z": 0}],
                            "equalization_factor": 3,
                        }
                    ]
                },
            }
        ]
        calls, _ = await self.go(
            "update_entertainment_area", {"area": "Music", "lights": [{"light": "Floor Light", "x": 0.4, "y": -0.4, "z": 0}]}, snap
        )
        loc = calls[0][3]["locations"]["service_locations"][0]
        self.assertEqual((loc["equalization_factor"], loc["positions"]), (3, [{"x": 0.4, "y": -0.4, "z": 0}]))
        calls, _ = await self.go(
            "update_entertainment_area",
            {
                "area": "Music",
                "lights": [{"light": "Floor Light", "balance": 0.5}],
                "performance": "manual",
                "performance_light": "Bed Light",
            },
            snap,
        )
        self.assertEqual(calls[0][3]["locations"]["service_locations"][0]["equalization_factor"], 0.5)
        self.assertEqual(calls[0][3]["stream_proxy"], {"mode": "manual", "node": {"rid": "e2", "rtype": "entertainment"}})

    async def test_a_light_without_an_entertainment_service_cannot_join_an_area(self):
        snap = world()
        snap.entertainment = []
        with self.assertRaisesRegex(ValueError, "cannot be part of an entertainment area"):
            await self.go("create_entertainment_area", {"name": "P", "area_type": "music", "lights": [{"light": "l1"}]}, snap)

    # --- automations
    async def test_automations_are_created_from_a_template_and_changed_by_name(self):
        calls, result = await self.go("create_automation", {"template": "Timers", "name": "Tea", "configuration": {"minutes": 5}})
        self.assertEqual((calls[0][3]["script_id"], calls[0][3]["enabled"], result), ("bs1", True, {"id": "new-id"}))
        calls, _ = await self.go("update_automation", {"automation": "Tea", "enabled": False})
        self.assertEqual(calls, [("put", "behavior_instance", "bi1", {"enabled": False})])

    # --- the bridge
    async def test_revoking_an_app_by_public_id_but_never_the_key_in_use_and_never_by_the_key_itself(self):
        theirs = models.authorized_apps(world().config)
        other = next(a for a in theirs if a["name"] == "Hue#iPhone")
        own = next(a for a in theirs if a["name"] == "home-assistant#home")
        calls, _ = await self.go("revoke_app", {"app": other["id"], "confirm": True})
        self.assertEqual(calls, [("revoke", None, "otherkey", None)])
        with self.assertRaisesRegex(ValueError, "lock Home Assistant out"):
            await self.go("revoke_app", {"app": own["id"], "confirm": True})
        with self.assertRaisesRegex(ValueError, "No app with that id"):
            await self.go("revoke_app", {"app": "otherkey", "confirm": True})

    async def test_bridge_configuration_calls(self):
        calls, _ = await self.go("configure_bridge", {"name": "Home"})
        self.assertEqual(calls, [("put_config", None, None, {"name": "Home"})])
        calls, _ = await self.go("set_zigbee_channel", {"channel": 20, "confirm": True})
        self.assertEqual(calls[0][3], {"zigbeechannel": 20})
        with self.assertRaisesRegex(ValueError, "11 to 26"):
            await self.go("set_zigbee_channel", {"channel": 5, "confirm": True})
        calls, _ = await self.go("press_link_button", {"confirm": True})
        self.assertEqual(calls[0][3], {"linkbutton": True})
        calls, _ = await self.go("check_for_update", {})
        self.assertEqual(calls[0][3], {"swupdate2": {"checkforupdate": True}})

    async def test_search_for_devices_and_removing_a_matter_fabric(self):
        calls, _ = await self.go("search_for_devices", {})
        self.assertEqual(calls, [("put", "zigbee_device_discovery", "zdd", {"action": {"action_type": "search"}})])
        calls, _ = await self.go("search_for_devices", {"allow_default_link_key": True})
        self.assertEqual(calls[0][3]["action"]["action_type"], "search_allow_default_link_key")
        calls, _ = await self.go("remove_matter_fabric", {"fabric": "Home", "confirm": True})
        self.assertEqual(calls, [("delete", "matter_fabric", "f1", None)])
        empty = models.Snapshot()
        with self.assertRaisesRegex(ValueError, "cannot search"):
            await self.go("search_for_devices", {}, empty)

    async def test_removing_a_device(self):
        calls, _ = await self.go("remove_device", {"device": "Bed Light", "confirm": True})
        self.assertEqual(calls, [("delete", "device", "d2", None)])

    # --- raw and information
    async def test_raw_requests_are_limited_to_known_resources_and_changes_need_confirm(self):
        calls, result = await self.go("raw_request", {"resource": "light", "id": "l1"})
        self.assertEqual((calls, result), ([("request", "GET", "light/l1", None)], {"data": [{"id": "x"}]}))
        with self.assertRaisesRegex(ValueError, "needs confirm"):
            await self.go("raw_request", {"resource": "light", "id": "l1", "method": "PUT", "body": {"on": {"on": False}}})
        calls, _ = await self.go(
            "raw_request", {"resource": "light", "id": "l1", "method": "put", "body": '{"on": {"on": false}}', "confirm": True}
        )
        self.assertEqual(calls, [("request", "PUT", "light/l1", {"on": {"on": False}})])
        with self.assertRaisesRegex(ValueError, "The resource is one of"):
            await self.go("raw_request", {"resource": "whitelist"})
        with self.assertRaisesRegex(ValueError, "The method is"):
            await self.go("raw_request", {"resource": "light", "method": "PATCH"})

    async def test_get_resources_returns_the_asked_kinds_without_any_app_key(self):
        _, result = await self.go("get_resources", {"kinds": ["apps", "rooms", "devices"]})
        self.assertEqual(set(result), {"apps", "rooms", "devices"})
        self.assertNotIn("ownkey", str(result))
        self.assertNotIn("otherkey", str(result))
        _, everything = await self.go("get_resources", {})
        self.assertEqual(set(everything), set(actions.KINDS))
        with self.assertRaisesRegex(ValueError, "Unknown kinds"):
            await self.go("get_resources", {"kinds": ["secrets"]})


if __name__ == "__main__":
    unittest.main()
