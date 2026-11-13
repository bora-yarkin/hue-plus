# SPDX-License-Identifier: GPL-3.0-or-later
"""The request bodies and what they refuse."""

import unittest
from datetime import time

from tests.support import load

p = load("bridge.payloads")


class PayloadTests(unittest.TestCase):
    def test_a_scene_takes_the_current_look_of_the_lights(self):
        lights = [
            {
                "id": "a",
                "on": {"on": True},
                "dimming": {"brightness": 40},
                "color_temperature": {"mirek": 366, "mirek_valid": True},
                "color": {"xy": {"x": 0.3, "y": 0.3}},
            },
            {
                "id": "b",
                "on": {"on": True},
                "dimming": {"brightness": 80},
                "color_temperature": {"mirek_valid": False},
                "color": {"xy": {"x": 0.5, "y": 0.4}},
            },
            {"id": "c", "on": {"on": False}},
        ]
        actions = p.scene_actions_from_lights(lights)
        self.assertEqual(actions[0]["action"], {"on": {"on": True}, "dimming": {"brightness": 40}, "color_temperature": {"mirek": 366}})
        self.assertEqual(actions[1]["action"]["color"], {"xy": {"x": 0.5, "y": 0.4}})
        self.assertNotIn("color_temperature", actions[1]["action"])
        self.assertEqual(actions[2], {"target": {"rid": "c", "rtype": "light"}, "action": {"on": {"on": False}}})

    def test_scene_post_and_put_validate(self):
        body = p.scene_post("Evening", "r1", "room", [{"target": {}}], 0.5, True)
        self.assertEqual(
            (body["metadata"], body["group"], body["speed"], body["auto_dynamic"]),
            ({"name": "Evening"}, {"rid": "r1", "rtype": "room"}, 0.5, True),
        )
        for bad in (
            lambda: p.scene_post("x", "r", "house", [{}], None, None),
            lambda: p.scene_post("x", "r", "room", [], None, None),
            lambda: p.scene_post("x", "r", "room", [{}], 1.5, None),
            lambda: p.scene_put(None, None, None, None),
        ):
            with self.assertRaises(ValueError):
                bad()
        self.assertEqual(p.scene_put("New", 0.2, None, None), {"metadata": {"name": "New"}, "speed": 0.2})

    def test_rooms_hold_devices_and_zones_hold_lights(self):
        self.assertEqual(p.group_post("room", "Den", "office", ["d1"])["children"], [{"rid": "d1", "rtype": "device"}])
        self.assertEqual(p.group_post("zone", "Reading", None, ["l1"])["children"], [{"rid": "l1", "rtype": "light"}])
        self.assertEqual(p.group_post("zone", "Reading", None, [])["metadata"], {"name": "Reading", "archetype": "other"})
        with self.assertRaises(ValueError):
            p.group_put("room", None, None, None)
        self.assertEqual(p.group_put("room", "A", None, [])["children"], [])

    def test_entertainment_bodies_check_type_positions_and_need_a_light(self):
        body = p.entertainment_post("Music", "music", [("e1", 0.5, -1, 0, None)])
        self.assertEqual(body["configuration_type"], "music")
        self.assertEqual(body["locations"]["service_locations"][0]["positions"], [{"x": 0.5, "y": -1, "z": 0}])
        for bad in (
            lambda: p.entertainment_post("x", "party", [("e", 0, 0, 0, None)]),
            lambda: p.entertainment_post("x", "music", []),
            lambda: p.entertainment_post("x", "music", [("e", 2, 0, 0, None)]),
            lambda: p.entertainment_action("pause"),
            lambda: p.entertainment_put(None, None, None),
        ):
            with self.assertRaises(ValueError):
                bad()
        self.assertEqual(p.entertainment_action("stop"), {"action": "stop"})

    def test_every_position_of_a_strip_can_be_given_and_is_written_as_it_is(self):
        ends = [{"x": -0.5, "y": 0.0, "z": 0.2}, {"x": 0.5, "y": 0.4, "z": 0.2}]
        body = p.entertainment_put(None, None, [("e1", -0.5, 0.0, 0.2, None, ends)], [])
        self.assertEqual(body["locations"]["service_locations"][0]["positions"], ends)
        with self.assertRaises(ValueError):
            p.entertainment_put(None, None, [("e1", 0.0, 0.0, 0.0, None, [{"x": 2.0, "y": 0.0, "z": 0.0}])], [])

    def test_moving_a_light_keeps_its_brightness_balance_and_the_other_positions_of_its_segments(self):
        existing = [
            {
                "service": {"rid": "e1", "rtype": "entertainment"},
                "positions": [{"x": 0.0, "y": 0.0, "z": 0.0}, {"x": 0.2, "y": 0.0, "z": 0.0}],
                "equalization_factor": 2.5,
            }
        ]
        body = p.entertainment_put(None, None, [("e1", 0.5, 0.5, 0.0, None), ("e2", -1, 0, 0, None)], existing)
        moved, added = body["locations"]["service_locations"]
        self.assertEqual(moved["equalization_factor"], 2.5)
        self.assertEqual(moved["positions"], [{"x": 0.5, "y": 0.5, "z": 0.0}, {"x": 0.7, "y": 0.5, "z": 0.0}])
        self.assertEqual((added["equalization_factor"], len(added["positions"])), (1, 1))  # a new light starts at 1, with one position
        # the segments never leave the room
        far = p.entertainment_put(None, None, [("e1", 0.95, 0, 0, None)], existing)
        self.assertEqual(far["locations"]["service_locations"][0]["positions"][1]["x"], 1.0)
        # a balance that is given replaces the old one, and must be more than 0
        given = p.entertainment_put(None, None, [("e1", 0, 0, 0, 0.5)], existing)
        self.assertEqual(given["locations"]["service_locations"][0]["equalization_factor"], 0.5)
        with self.assertRaises(ValueError):
            p.entertainment_put(None, None, [("e1", 0, 0, 0, 0)], existing)

    def test_performance_is_auto_or_one_light_that_streams(self):
        self.assertEqual(p.entertainment_put(None, None, None, None, ("auto", None)), {"stream_proxy": {"mode": "auto"}})
        self.assertEqual(
            p.entertainment_put(None, None, None, None, ("manual", "e1")),
            {"stream_proxy": {"mode": "manual", "node": {"rid": "e1", "rtype": "entertainment"}}},
        )
        for bad in (("manual", None), ("fast", None)):
            with self.assertRaises(ValueError):
                p.entertainment_put(None, None, None, None, bad)

    def test_timed_effects_send_milliseconds_and_no_effect_needs_no_duration(self):
        self.assertEqual(p.timed_effect_put("sunrise", 900), {"timed_effects": {"effect": "sunrise", "duration": 900000}})
        self.assertEqual(p.timed_effect_put("no_effect", None), {"timed_effects": {"effect": "no_effect"}})
        for bad in (
            lambda: p.timed_effect_put("sunrise", None),
            lambda: p.timed_effect_put("sunrise", 0),
            lambda: p.timed_effect_put("disco", 5),
        ):
            with self.assertRaises(ValueError):
                bad()

    def test_signals_need_colours_only_when_they_use_them(self):
        self.assertEqual(p.signal_put("on_off", 2, None), {"signaling": {"signal": "on_off", "duration": 2000}})
        # The real bridge refuses a signaling write without a duration, also the one that ends a signal.
        self.assertEqual(p.signal_put("no_signal", 5, None), {"signaling": {"signal": "no_signal", "duration": 0}})
        self.assertEqual(p.signal_put("alternating", 1, [(0.1, 0.2), (0.3, 0.4)])["signaling"]["colors"][1], {"xy": {"x": 0.3, "y": 0.4}})
        for bad in (
            lambda: p.signal_put("alternating", 1, None),
            lambda: p.signal_put("on_off_color", 1, [(0, 0)] * 3),
            lambda: p.signal_put("strobe", 1, None),
            lambda: p.signal_put("on_off", 0, None),
        ):
            with self.assertRaises(ValueError):
                bad()

    def test_light_setup_names_only_what_changes_and_refuses_unknown_values(self):
        self.assertEqual(p.light_setup_put("mixed", None, None), {"metadata": {"function": "mixed"}})
        self.assertEqual(
            p.light_setup_put(None, "vertical", "reversed"),
            {"content_configuration": {"orientation": {"orientation": "vertical"}, "order": {"order": "reversed"}}},
        )
        for bad in (
            lambda: p.light_setup_put("shiny", None, None),
            lambda: p.light_setup_put(None, "diagonal", None),
            lambda: p.light_setup_put(None, None, "sideways"),
            lambda: p.light_setup_put(None, None, None),
        ):
            with self.assertRaises(ValueError):
                bad()

    def test_motion_areas_use_the_shape_the_bridge_accepted(self):
        self.assertEqual(p.motion_area_put("Hall", False), {"name": "Hall", "enabled": False})
        with self.assertRaises(ValueError):
            p.motion_area_put(None, None)
        body = p.motion_area_post("Hall", "r1", "room", ["c1", "c2", "c3"])
        self.assertEqual(
            body,
            {
                "name": "Hall",
                "group": {"rid": "r1", "rtype": "room"},
                "participants": [{"resource": {"rid": c, "rtype": "motion_area_candidate"}} for c in ("c1", "c2", "c3")],
            },
        )
        for bad in (
            lambda: p.motion_area_post("Hall", "r1", "room", ["c1", "c2"]),
            lambda: p.motion_area_post("Hall", "r1", "room", ["c1", "c2", "c3", "c4", "c5"]),
            lambda: p.motion_area_post("Hall", "r1", "home", ["c1", "c2", "c3"]),
        ):
            with self.assertRaises(ValueError):
                bad()

    def test_a_motion_area_controls_lights_through_the_motion_sensor_template(self):
        slots = [
            {"at": time(23, 0), "scene": "s3", "off_after_minutes": 10},
            {"at": time(7, 0), "scene": "s1", "off_after_minutes": None},
        ]
        config = p.motion_area_configuration("a1", [("r1", "room")], slots, 4000)
        self.assertEqual(config["source"], {"rid": "a1", "rtype": "motion_area_configuration"})
        self.assertEqual(config["where"], [{"group": {"rid": "r1", "rtype": "room"}}])
        first, second = config["when"]["timeslots"]
        self.assertEqual(first["start_time"], {"type": "time", "time": {"hour": 7, "minute": 0}})
        self.assertNotIn("on_no_motion", first)
        self.assertEqual(second["on_no_motion"], {"after": {"minutes": 10}, "recall_single": [{"action": "all_off"}]})
        self.assertEqual(second["on_motion"], {"recall_single": [{"action": {"recall": {"rid": "s3", "rtype": "scene"}}}]})
        self.assertEqual(config["settings"], {"daylight_sensitivity": {"dark_threshold": 4000, "offset": 7000}})
        self.assertNotIn("settings", p.motion_area_configuration("a1", [("r1", "room")], slots, None))
        for bad in (
            lambda: p.motion_area_configuration("a1", [], slots, None),
            lambda: p.motion_area_configuration("a1", [("r1", "room")], [], None),
            lambda: p.motion_area_configuration("a1", [("r1", "room")], [*slots, slots[1]], None),
            lambda: p.motion_area_configuration("a1", [("r1", "room")], [{"at": time(7, 0), "scene": "s", "off_after_minutes": 0}], None),
            lambda: p.motion_area_configuration("a1", [("r1", "room")], slots, 70000),
        ):
            with self.assertRaises(ValueError):
                bad()
        self.assertEqual(p.motion_sensitivity_put(2), {"sensitivity": {"sensitivity": 2}})

    def test_a_motion_area_time_can_start_at_sunrise_or_sunset_and_leave_the_lights_alone(self):
        slots = [
            {"at": time(23, 0), "scene": "s3", "off_after_minutes": 10},
            {"sun": "sunrise", "offset_minutes": -30, "scene": None},
            {"sun": "sunset", "scene": "s1", "off_after_minutes": 15},
        ]
        slots_out = p.motion_area_configuration("a1", [("r1", "room")], slots, None)["when"]["timeslots"]
        self.assertEqual([t["start_time"]["type"] for t in slots_out], ["sunrise", "sunset", "time"], "in the order of the day")
        self.assertEqual(slots_out[0]["start_time"], {"type": "sunrise", "offset": {"minutes": -30}})
        self.assertEqual(slots_out[0]["on_motion"], {"recall_single": [{"action": "do_nothing"}]})
        self.assertNotIn("on_no_motion", slots_out[0], "no lights, so nothing to switch off")
        self.assertEqual(slots_out[1]["start_time"], {"type": "sunset"}, "no offset is not written")
        self.assertIn("on_no_motion", slots_out[1])
        for bad in (
            [{"sun": "noon", "scene": "s"}],
            [{"sun": "sunset", "offset_minutes": 500, "scene": "s"}],
            [{"sun": "sunset", "scene": "s"}, {"sun": "sunset", "scene": "t"}],
        ):
            with self.assertRaises(ValueError):
                p.motion_area_configuration("a1", [("r1", "room")], bad, None)

    def test_streaming_end_states_take_a_scene_only_for_scene(self):
        self.assertEqual(
            p.streaming_end_configuration("a1", "last_state", None),
            {"end_state": "last_state", "where": [{"group": {"rid": "a1", "rtype": "entertainment_configuration"}}]},
        )
        self.assertEqual(p.streaming_end_configuration("a1", "scene", "s1")["scene"], {"rid": "s1", "rtype": "scene"})
        for bad in (
            lambda: p.streaming_end_configuration("a1", "scene", None),
            lambda: p.streaming_end_configuration("a1", "off", "s1"),
            lambda: p.streaming_end_configuration("a1", "melt", None),
        ):
            with self.assertRaises(ValueError):
                bad()

    def test_power_on_behaviour(self):
        self.assertEqual(p.powerup_put("safety", None, None, None, None), {"powerup": {"preset": "safety"}})
        custom = p.powerup_put("custom", "on", 60, 300, None)["powerup"]
        self.assertEqual(
            (custom["on"], custom["dimming"]["dimming"], custom["color"]["mode"]),
            ({"mode": "on", "on": {"on": True}}, {"brightness": 60}, "color_temperature"),
        )
        self.assertEqual(p.powerup_put("custom", "previous", None, None, (0.3, 0.3))["powerup"]["color"]["mode"], "color")
        for bad in (
            lambda: p.powerup_put("mystery", None, None, None, None),
            lambda: p.powerup_put("custom", "maybe", None, None, None),
            lambda: p.powerup_put("custom", "on", 0, None, None),
        ):
            with self.assertRaises(ValueError):
                bad()

    def test_metadata_automation_and_recall_bodies(self):
        self.assertEqual(p.metadata_put("Lamp", None), {"metadata": {"name": "Lamp"}})
        self.assertEqual(p.identify_put(), {"identify": {"action": "identify"}})
        self.assertEqual(
            p.automation_post("s1", "Tea", {"when": 1}, False),
            {"type": "behavior_instance", "script_id": "s1", "enabled": False, "metadata": {"name": "Tea"}, "configuration": {"when": 1}},
        )
        self.assertEqual(p.automation_put(None, None, False), {"enabled": False})
        self.assertEqual(p.recall_put("activate"), {"recall": {"action": "activate"}})
        for bad in (lambda: p.metadata_put(None, None), lambda: p.automation_put(None, None, None), lambda: p.recall_put("toggle")):
            with self.assertRaises(ValueError):
                bad()

    def test_bridge_configuration_bodies_and_the_update_time_format(self):
        self.assertEqual(p.auto_update_put(True, time(16, 30)), {"swupdate2": {"autoinstall": {"on": True, "updatetime": "T16:30:00"}}})
        self.assertEqual(p.auto_update_put(False, None), {"swupdate2": {"autoinstall": {"on": False}}})
        self.assertEqual(p.parse_auto_install_time("T16:00:00"), time(16, 0))
        self.assertIsNone(p.parse_auto_install_time("16:00"))
        self.assertIsNone(p.parse_auto_install_time("Tnonsense"))
        self.assertIsNone(p.parse_auto_install_time(None))
        self.assertEqual(p.zigbee_channel_put(15), {"zigbeechannel": 15})
        self.assertEqual(p.config_put("Bridge", "Europe/Istanbul"), {"name": "Bridge", "timezone": "Europe/Istanbul"})
        for bad in (
            lambda: p.zigbee_channel_put(10),
            lambda: p.zigbee_channel_put(27),
            lambda: p.config_put(None, None),
            lambda: p.auto_update_put(None, None),
        ):
            with self.assertRaises(ValueError):
                bad()


if __name__ == "__main__":
    unittest.main()
