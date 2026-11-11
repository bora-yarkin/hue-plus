# SPDX-License-Identifier: GPL-3.0-or-later
"""Routines, button actions, daily smart scenes and sensor settings: what is sent, and what is refused."""

import unittest
from datetime import time

from tests.bridge.test_actions import Recorder, world
from tests.support import load

actions = load("bridge.actions")
models = load("bridge.models")
payloads = load("bridge.payloads")

ROOM_GROUP = {"group": {"rid": "r1", "rtype": "room"}}


def snapshot():
    snap = world()
    snap.behavior_script = [
        {"id": "w", "metadata": {"name": "Basic wake up routine"}},
        {"id": "g", "metadata": {"name": "Native Go To Sleep"}},
        {"id": "t", "metadata": {"name": "Timers"}},
        {"id": "sc", "metadata": {"name": "Schedule"}},
        {"id": "ch", "metadata": {"name": "Coming home"}},
        {"id": "lh", "metadata": {"name": "Leaving home"}},
        {"id": "sa", "metadata": {"name": "Smoke alarm"}},
    ]
    snap.device.append({"id": "dim", "metadata": {"name": "Dimmer"}, "services": []})
    snap.button = [
        {"id": "b1", "owner": {"rid": "dim"}, "metadata": {"control_id": 1}, "button": {"last_event": "short_release"}},
        {"id": "b2", "owner": {"rid": "dim"}, "metadata": {"control_id": 2}, "button": {}},
    ]
    snap.behavior_instance = [
        {
            "id": "acc",
            "metadata": {"name": "Dimmer"},
            "configuration": {
                "buttons": {
                    "b1": {"on_short_release": {"action": "all_off"}, "where": [ROOM_GROUP]},
                    "b2": {"on_repeat": {"action": "dim_up"}},
                }
            },
        }
    ]
    snap.motion = [{"id": "m1", "owner": {"rid": "d1"}, "enabled": True, "sensitivity": {"sensitivity": 1, "sensitivity_max": 4}}]
    snap.geolocation = [{"id": "gl", "is_configured": False}]
    snap.geofence_client = [{"id": "gc", "name": "phone"}]
    return snap


class RoutineTests(unittest.IsolatedAsyncioTestCase):
    async def go(self, name, data):
        rec = Recorder()
        result = await actions.run(name, rec, snapshot(), data)
        return rec.calls, result

    async def test_a_wake_up_routine_is_the_shape_a_real_bridge_accepted(self):
        calls, result = await self.go(
            "create_routine",
            {
                "routine": "wake_up",
                "name": "Morning",
                "group": "Bedroom",
                "time": time(7, 0),
                "days": ["monday", "tuesday"],
                "enabled": False,
            },
        )
        (kind, resource, _, body) = calls[0]
        self.assertEqual((kind, resource, result), ("post", "behavior_instance", {"id": "new-id"}))
        self.assertEqual(body["script_id"], "w")
        self.assertFalse(body["enabled"])
        self.assertEqual(
            body["configuration"],
            {
                "fade_in_duration": {"seconds": 900},
                "end_brightness": 100.0,
                "when": {"time_point": {"type": "time", "time": {"hour": 7, "minute": 0}}, "recurrence_days": ["monday", "tuesday"]},
                "where": [ROOM_GROUP],
            },
        )

    async def test_go_to_sleep_fades_out_and_turns_off_and_a_timer_recalls_a_scene(self):
        calls, _ = await self.go(
            "create_routine", {"routine": "go_to_sleep", "name": "Sleep", "group": "r1", "time": time(22, 30), "minutes": 20}
        )
        configuration = calls[0][3]["configuration"]
        self.assertEqual((configuration["fade_out_duration"], configuration["end_state"]), ({"seconds": 1200}, "turn_off"))
        self.assertEqual(len(configuration["when"]["recurrence_days"]), 7)
        calls, _ = await self.go("create_routine", {"routine": "timer", "name": "Tea", "group": "Bedroom", "minutes": 5, "scene": "Soho"})
        self.assertEqual(
            calls[0][3]["configuration"],
            {
                "duration": {"minutes": 5},
                "what": [{"group": ROOM_GROUP["group"], "recall": {"rid": "s1", "rtype": "scene"}}],
                "where": [ROOM_GROUP],
            },
        )

    async def test_a_routine_that_cannot_be_right_is_refused_before_anything_is_sent(self):
        bad = [
            {"routine": "wake_up", "name": "x", "group": "Bedroom"},
            {"routine": "wake_up", "name": "x", "group": "Bedroom", "time": time(7, 0), "days": ["funday"]},
            {"routine": "wake_up", "name": "x", "group": "Bedroom", "time": time(7, 0), "end_brightness": 150},
            {"routine": "go_to_sleep", "name": "x", "group": "Bedroom", "time": time(7, 0), "minutes": 500},
            {"routine": "timer", "name": "x", "group": "Bedroom", "minutes": 5},
            {"routine": "timer", "name": "x", "group": "Bedroom", "scene": "Soho"},
            {"routine": "nap", "name": "x", "group": "Bedroom", "time": time(7, 0)},
            {"routine": "wake_up", "name": "x", "group": "Nowhere", "time": time(7, 0)},
        ]
        for data in bad:
            rec = Recorder()
            with self.assertRaises(ValueError, msg=data):
                await actions.run("create_routine", rec, snapshot(), data)
            self.assertEqual(rec.calls, [], data)

    async def test_a_bridge_without_the_template_says_so(self):
        snap = snapshot()
        snap.behavior_script = []
        with self.assertRaisesRegex(ValueError, "no 'Basic wake up routine' template"):
            await actions.run(
                "create_routine", Recorder(), snap, {"routine": "wake_up", "name": "x", "group": "Bedroom", "time": time(7, 0)}
            )


class AppWizardRoutineTests(unittest.IsolatedAsyncioTestCase):
    """The settings the Hue app's wizards ask for, in the fields the bridge accepted for them."""

    async def go(self, name, data):
        rec = Recorder()
        await actions.run(name, rec, snapshot(), data)
        return rec.calls[0]

    async def test_wake_up_and_go_to_sleep_carry_their_style_and_when_the_lights_go_off(self):
        wake = {"routine": "wake_up", "name": "x", "group": "Bedroom", "time": time(7, 0), "style": "basic", "turn_off_after_minutes": 10}
        configuration = (await self.go("create_routine", wake))[3]["configuration"]
        self.assertEqual((configuration["style"], configuration["turn_lights_off_after"]), ("basic", {"minutes": 10}))
        sleep = {"routine": "go_to_sleep", "name": "x", "group": "Bedroom", "time": time(22, 0), "style": "sunset"}
        self.assertEqual((await self.go("create_routine", sleep))[3]["configuration"]["style"], "sunset")
        configuration = (await self.go("create_routine", {**wake, "style": None, "turn_off_after_minutes": None}))[3]["configuration"]
        self.assertNotIn("style", configuration)
        self.assertNotIn("turn_lights_off_after", configuration)
        for bad in ({**wake, "style": "sunset"}, {**sleep, "style": "sunrise"}, {**wake, "turn_off_after_minutes": 999}):
            with self.assertRaises(ValueError):
                await self.go("create_routine", bad)

    async def test_a_lighting_schedule_can_end_and_randomise_its_times(self):
        data = {
            "routine": "schedule",
            "name": "x",
            "group": "Bedroom",
            "time": time(18, 0),
            "until": time(23, 0),
            "scene": "Soho",
            "randomize_minutes": 15,
        }
        when = (await self.go("create_routine", data))[3]["configuration"]["when_extended"]
        self.assertEqual(when["end_at"], {"time_point": {"type": "time", "time": {"hour": 23, "minute": 0}}})
        self.assertEqual(when["randomization"], {"minutes": 15})
        with self.assertRaises(ValueError):
            await self.go("create_routine", {**data, "randomize_minutes": 500})

    async def test_changing_a_routine_writes_its_settings_again_through_its_own_template(self):
        snap = snapshot()
        snap.behavior_instance = [{"id": "bi1", "script_id": "w", "metadata": {"name": "Morning"}}]
        rec = Recorder()
        await actions.run(
            "update_routine",
            rec,
            snap,
            {"automation": "Morning", "name": "Early", "group": "Bedroom", "time": time(6, 0), "style": "sunrise", "enabled": False},
        )
        kind, resource, rid, body = rec.calls[0]
        self.assertEqual((kind, resource, rid), ("put", "behavior_instance", "bi1"))
        self.assertEqual(body["metadata"], {"name": "Early"})
        self.assertFalse(body["enabled"])
        self.assertEqual(body["configuration"]["when"]["time_point"]["time"], {"hour": 6, "minute": 0})
        snap.behavior_instance = [{"id": "bi2", "script_id": "other", "metadata": {"name": "Buttons"}}]
        with self.assertRaisesRegex(ValueError, "Only a routine made from"):
            await actions.run("update_routine", Recorder(), snap, {"automation": "Buttons", "group": "Bedroom"})


class MoreRoutineTests(unittest.IsolatedAsyncioTestCase):
    async def go(self, data):
        rec = Recorder()
        await actions.run("create_routine", rec, snapshot(), data)
        return rec.calls[0][3]

    async def test_a_schedule_recalls_a_scene_at_a_time_on_chosen_days(self):
        body = await self.go(
            {
                "routine": "schedule",
                "name": "Evening",
                "group": "Bedroom",
                "time": time(21, 30),
                "days": ["friday"],
                "scene": "Soho",
                "enabled": False,
            }
        )
        self.assertEqual(body["script_id"], "sc")
        self.assertEqual(
            body["configuration"],
            {
                "when_extended": {
                    "start_at": {"time_point": {"type": "time", "time": {"hour": 21, "minute": 30}}},
                    "recurrence_days": ["friday"],
                },
                "what": [{"group": ROOM_GROUP["group"], "recall": {"rid": "s1", "rtype": "scene"}}],
                "where": [ROOM_GROUP],
            },
        )

    async def test_coming_home_is_always_or_between_two_times(self):
        always = await self.go({"routine": "coming_home", "name": "Hello", "group": "Bedroom", "scene": "Soho"})
        self.assertEqual(always["configuration"]["when_constrained"], {"type": "always"})
        between = await self.go(
            {"routine": "coming_home", "name": "Hello", "group": "Bedroom", "scene": "Soho", "time": time(18, 0), "until": time(23, 0)}
        )
        self.assertEqual(
            between["configuration"]["when_constrained"],
            {"type": "between", "start": {"hour": 18, "minute": 0}, "end": {"hour": 23, "minute": 0}},
        )
        with self.assertRaisesRegex(ValueError, "both"):
            await self.go({"routine": "coming_home", "name": "Hello", "group": "Bedroom", "scene": "Soho", "time": time(18, 0)})

    async def test_leaving_home_and_the_smoke_alarm_only_name_their_lights(self):
        for kind, script in (("leaving_home", "lh"), ("smoke_alarm", "sa")):
            body = await self.go({"routine": kind, "name": kind, "group": "Bedroom"})
            self.assertEqual((body["script_id"], body["configuration"]), (script, {"where": [ROOM_GROUP]}))

    async def test_a_schedule_and_coming_home_need_a_scene(self):
        for data in (
            {"routine": "schedule", "name": "x", "group": "Bedroom", "time": time(8, 0)},
            {"routine": "coming_home", "name": "x", "group": "Bedroom"},
        ):
            with self.assertRaisesRegex(ValueError, "scene"):
                await self.go(data)


class StepTests(unittest.IsolatedAsyncioTestCase):
    async def test_a_step_is_relative_and_goes_to_the_bridge_as_one(self):
        rec = Recorder()
        await actions.run("light_step", rec, snapshot(), {"lights": ["Floor Light", "Bed Light"], "brightness_step": -20, "mirek_step": 50})
        self.assertEqual([c[:3] for c in rec.calls], [("put", "light", "l1"), ("put", "light", "l2")])
        self.assertEqual(
            rec.calls[0][3],
            {"dimming_delta": {"action": "down", "brightness_delta": 20.0}, "color_temperature_delta": {"action": "up", "mirek_delta": 50}},
        )

    async def test_a_step_that_cannot_be_right_changes_nothing(self):
        for data in (
            {"lights": ["Floor Light"]},
            {"lights": ["Floor Light"], "brightness_step": 150},
            {"lights": ["Floor Light"], "mirek_step": 400},
            {"lights": []},
            {"lights": ["Nowhere"], "brightness_step": 5},
        ):
            rec = Recorder()
            with self.assertRaises(ValueError, msg=data):
                await actions.run("light_step", rec, snapshot(), data)
            self.assertEqual(rec.calls, [], data)


class ListTests(unittest.IsolatedAsyncioTestCase):
    async def test_motion_areas_and_the_resources_the_bridge_supports_are_asked_for_now(self):
        result = await actions.run("get_resources", Recorder(), snapshot(), {"kinds": ["motion_areas", "supported_resources"]})
        self.assertEqual(
            result,
            {"motion_areas": {"candidates": [{"id": "c1"}], "areas": [], "services": []}, "supported_resources": ["light", "motion"]},
        )


class ButtonTests(unittest.IsolatedAsyncioTestCase):
    async def go(self, data):
        rec = Recorder()
        snap = snapshot()
        snap.scene = [*snap.scene, {"id": "s2", "metadata": {"name": "Dusk"}}]
        await actions.run("configure_button", rec, snap, data)
        return rec.calls

    async def test_one_press_changes_and_everything_else_stays_as_it_was(self):
        (call,) = await self.go({"accessory": "Dimmer", "button": 1, "press": "short", "action": "dim_up"})
        self.assertEqual(call[:3], ("put", "behavior_instance", "acc"))
        buttons = call[3]["configuration"]["buttons"]
        self.assertEqual(buttons["b1"], {"on_short_release": {"action": "dim_up"}, "where": [ROOM_GROUP]})
        self.assertEqual(buttons["b2"], {"on_repeat": {"action": "dim_up"}})

    async def test_a_scene_is_recalled_the_way_the_hue_app_sets_it_up(self):
        (call,) = await self.go({"accessory": "Dimmer", "button": 1, "press": "long", "action": "scene", "scene": "Soho", "with_off": True})
        self.assertEqual(
            call[3]["configuration"]["buttons"]["b1"]["on_long_press"],
            {
                "recall_single_extended": {
                    "actions": [{"action": {"recall": {"rid": "s1", "rtype": "scene"}}}],
                    "with_off": {"enabled": True},
                }
            },
        )

    async def test_a_scene_cycle_is_written_the_way_the_hue_app_writes_it(self):
        # the shape was read from a real bridge's dimmer: seven scenes, three seconds, smart on/off
        (call,) = await self.go(
            {
                "accessory": "Dimmer",
                "button": 1,
                "press": "short",
                "action": "scene_cycle",
                "scenes": ["Soho", "Dusk"],
                "with_off": True,
                "repeat_timeout": 3,
            }
        )
        self.assertEqual(
            call[3]["configuration"]["buttons"]["b1"]["on_short_release"],
            {
                "scene_cycle_extended": {
                    "repeat_timeout": {"seconds": 3},
                    "slots": [
                        [{"action": {"recall": {"rid": "s1", "rtype": "scene"}}}],
                        [{"action": {"recall": {"rid": "s2", "rtype": "scene"}}}],
                    ],
                    "with_off": {"enabled": True},
                }
            },
        )
        (call,) = await self.go({"accessory": "Dimmer", "button": 1, "press": "long", "action": "do_nothing"})
        self.assertEqual(call[3]["configuration"]["buttons"]["b1"]["on_long_press"], {"action": "do_nothing"})
        # the other press of the button, and the button's target room, stay
        self.assertEqual(call[3]["configuration"]["buttons"]["b1"]["where"], [ROOM_GROUP])

    async def test_entire_home_off_and_a_time_based_light_are_written_the_way_the_hue_app_writes_them(self):
        # both shapes were read from a real bridge: the Door dimmer's long press, and the Desk dimmer's time-based light
        (call,) = await self.go({"accessory": "Dimmer", "button": 1, "press": "long", "action": "home_off"})
        self.assertEqual(call[3]["configuration"]["buttons"]["b1"]["on_long_press"], {"action": "home_off"})
        (call,) = await self.go(
            {
                "accessory": "Dimmer",
                "button": 1,
                "press": "long",
                "action": "time_based",
                "slots": [{"time": "20:00", "scene": "Dusk"}, {"time": "07:00", "scene": "Soho"}],
            }
        )
        self.assertEqual(
            call[3]["configuration"]["buttons"]["b1"]["on_long_press"],
            {
                "time_based_extended": {
                    "repeat_timeout": {"seconds": 3},
                    "slots": [
                        {"actions": [{"action": {"recall": {"rid": "s1", "rtype": "scene"}}}], "start_time": {"hour": 7, "minute": 0}},
                        {"actions": [{"action": {"recall": {"rid": "s2", "rtype": "scene"}}}], "start_time": {"hour": 20, "minute": 0}},
                    ],
                    "with_off": {"enabled": False},
                }
            },
        )

    async def test_a_time_based_light_without_times_uses_the_hue_apps_schedule_from_the_scenes_of_the_buttons_room(self):
        rec = Recorder()
        snap = snapshot()
        room = {"rid": "r1", "rtype": "room"}
        snap.scene = [
            {"id": name.lower(), "metadata": {"name": name}, "group": room}
            for name in ("Energize", "Concentrate", "Read", "Relax", "Nightlight")
        ]
        snap.scene.append(
            {"id": "other", "metadata": {"name": "Read"}, "group": {"rid": "elsewhere", "rtype": "room"}}
        )  # another room's scene is not used
        await actions.run("configure_button", rec, snap, {"accessory": "Dimmer", "button": 1, "press": "long", "action": "time_based"})
        slots = rec.calls[0][3]["configuration"]["buttons"]["b1"]["on_long_press"]["time_based_extended"]["slots"]
        self.assertEqual(
            [s["actions"][0]["action"]["recall"]["rid"] for s in slots], ["energize", "concentrate", "read", "relax", "nightlight"]
        )
        self.assertEqual([s["start_time"]["hour"] for s in slots], [7, 10, 17, 20, 23])
        self.assertNotIn("other", str(slots))
        snap.scene = snap.scene[:2]
        with self.assertRaisesRegex(ValueError, "no scene called"):
            await actions.run("configure_button", rec, snap, {"accessory": "Dimmer", "button": 1, "press": "long", "action": "time_based"})

    async def test_a_time_based_light_needs_times_that_differ_and_scenes_that_exist(self):
        base = {"accessory": "Dimmer", "button": 1, "press": "short", "action": "time_based"}
        for slots, words in (
            ([{"time": "07:00", "scene": "Soho"}], "2 to 10 times"),
            ([{"time": "07:00", "scene": "Soho"}, {"time": "07:00", "scene": "Dusk"}], "cannot be the same"),
            ([{"time": "07:00", "scene": "Soho"}, {"time": "20:00", "scene": "Nowhere"}], "No scene called"),
            ([{"time": "07:00"}, {"time": "20:00", "scene": "Soho"}], "scene"),
        ):
            with self.assertRaisesRegex(ValueError, words):
                await self.go({**base, "slots": slots})

    async def test_a_cycle_needs_scenes_that_exist_and_a_sensible_length_and_time(self):
        base = {"accessory": "Dimmer", "button": 1, "press": "short", "action": "scene_cycle"}
        for extra, words in (
            ({"scenes": ["Soho"]}, "2 to 10 scenes"),
            ({"scenes": ["Soho"] * 11}, "2 to 10 scenes"),
            ({}, "2 to 10 scenes"),
            ({"scenes": ["Soho", "Nowhere"]}, "No scene called"),
            ({"scenes": ["Soho", "Dusk"], "repeat_timeout": 60}, "1 to 10 seconds"),
        ):
            with self.assertRaisesRegex(ValueError, words):
                await self.go({**base, **extra})

    async def test_what_cannot_be_set_is_refused(self):
        for data, words in (
            ({"accessory": "Dimmer", "button": 9, "press": "short", "action": "dim_up"}, "has buttons 1, 2"),
            ({"accessory": "Dimmer", "button": 1, "press": "double", "action": "dim_up"}, "press is one of"),
            ({"accessory": "Dimmer", "button": 1, "press": "short", "action": "dance"}, "action is one of"),
            ({"accessory": "Dimmer", "button": 1, "press": "short", "action": "scene"}, "scene to recall"),
            ({"accessory": "Nothing", "button": 1, "press": "short", "action": "dim_up"}, "No accessory"),
        ):
            with self.assertRaisesRegex(ValueError, words):
                await self.go(data)

    def test_the_accessories_are_listed_with_their_buttons_and_automation(self):
        (dimmer,) = models.accessories(snapshot())
        self.assertEqual((dimmer["name"], dimmer["automation_id"], [b["number"] for b in dimmer["buttons"]]), ("Dimmer", "acc", [1, 2]))
        self.assertEqual(dimmer["actions"]["b1"]["on_short_release"], {"action": "all_off"})
        self.assertEqual(dimmer["targets"]["b1"], ["r1"])  # the room the button acts on


class OtherTests(unittest.IsolatedAsyncioTestCase):
    async def test_a_daily_smart_scene_orders_its_slots_and_repeats_them_on_the_chosen_days(self):
        rec = Recorder()
        snap = snapshot()
        snap.scene = [{"id": "s1", "metadata": {"name": "Soho"}}, {"id": "s2", "metadata": {"name": "Dusk"}}]
        await actions.run(
            "create_daily_smart_scene",
            rec,
            snap,
            {
                "name": "Day",
                "group": "Bedroom",
                "slots": [{"time": "21:00", "scene": "Dusk"}, {"time": "07:00", "scene": "Soho"}],
                "days": ["saturday"],
            },
        )
        body = rec.calls[0][3]
        (week,) = body["week_timeslots"]
        self.assertEqual(week["recurrence"], ["saturday"])
        self.assertEqual([(s["start_time"]["time"]["hour"], s["target"]["rid"]) for s in week["timeslots"]], [(7, "s1"), (21, "s2")])
        self.assertEqual(body["group"], {"rid": "r1", "rtype": "room"})

    async def test_a_daily_smart_scene_needs_slots_with_a_time_and_a_scene(self):
        for slots in ([], [{"time": "07:00"}], "not json"):
            with self.assertRaises(ValueError, msg=slots):
                await actions.run("create_daily_smart_scene", Recorder(), snapshot(), {"name": "x", "group": "Bedroom", "slots": slots})

    async def test_a_motion_sensor_is_switched_and_tuned_by_the_name_of_its_device(self):
        rec = Recorder()
        await actions.run("configure_sensor", rec, snapshot(), {"sensor": "Floor Light", "enabled": False, "sensitivity": 3})
        self.assertEqual(rec.calls, [("put", "motion", "m1", {"enabled": False, "sensitivity": {"sensitivity": 3}})])
        with self.assertRaisesRegex(ValueError, "Nothing to change"):
            await actions.run("configure_sensor", Recorder(), snapshot(), {"sensor": "Floor Light"})

    def test_home_and_away_reports_whether_it_is_set_up_and_who_is_tracked(self):
        self.assertEqual(models.home_and_away(snapshot()), {"configured": False, "clients": ["phone"]})


if __name__ == "__main__":
    unittest.main()
