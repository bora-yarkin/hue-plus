# SPDX-License-Identifier: GPL-3.0-or-later
"""Reductions of the bridge's data, with data shaped like what the real bridge sent."""

import unittest

from tests.support import load

models = load("bridge.models")
api = load("bridge.api")

BRIDGE_DEV = {
    "id": "bd",
    "metadata": {"name": "Hue Bridge Pro"},
    "product_data": {"model_id": "BSB003", "product_name": "Hue Bridge", "software_version": "6.3.2071556020"},
    "services": [{"rid": "b1", "rtype": "bridge"}, {"rid": "z0", "rtype": "zigbee_connectivity"}],
}
LAMP = {
    "id": "d1",
    "metadata": {"name": "Floor Light L"},
    "product_data": {"model_id": "LCA006", "product_name": "Hue color lamp", "software_version": "1.163.1"},
    "services": [{"rid": "l1", "rtype": "light"}, {"rid": "e1", "rtype": "entertainment"}],
}


def snap(**kw):
    s = models.Snapshot()
    for k, v in kw.items():
        setattr(s, k, v)
    return s


class ModelTests(unittest.TestCase):
    def test_the_bridge_device_is_the_one_with_a_bridge_service(self):
        self.assertEqual(models.bridge_device(snap(device=[LAMP, BRIDGE_DEV]))["id"], "bd")
        self.assertIsNone(models.bridge_device(snap(device=[LAMP])))

    def test_bridge_id_is_lower_case_and_missing_when_the_config_has_none(self):
        self.assertEqual(models.bridge_id(snap(config={"bridgeid": "C42996FFFEC4A182"})), "c42996fffec4a182")
        self.assertIsNone(models.bridge_id(snap()))

    def test_the_zigbee_channel_is_read_from_the_bridges_own_connectivity_resource(self):
        s = snap(
            device=[BRIDGE_DEV, LAMP],
            zigbee_connectivity=[
                {"owner": {"rid": "d1"}, "channel": {"status": "set", "value": "channel_20"}},
                {"owner": {"rid": "bd"}, "channel": {"status": "set", "value": "channel_11"}},
            ],
        )
        self.assertEqual(models.bridge_zigbee_channel(s), 11)
        self.assertIsNone(
            models.bridge_zigbee_channel(
                snap(device=[BRIDGE_DEV], zigbee_connectivity=[{"owner": {"rid": "bd"}, "channel": {"value": "garbage"}}])
            )
        )

    def test_firmware_items_join_updates_with_their_devices_and_skip_orphans(self):
        s = snap(
            device=[LAMP],
            device_software_update=[
                {"id": "u1", "owner": {"rid": "d1"}, "state": "update_pending", "problems": ["x"]},
                {"id": "u2", "owner": {"rid": "gone"}, "state": "no_update"},
            ],
        )
        self.assertEqual(
            models.firmware_items(s),
            [
                {
                    "id": "u1",
                    "device_id": "d1",
                    "name": "Floor Light L",
                    "model": "Hue color lamp",
                    "installed": "1.163.1",
                    "state": "update_pending",
                    "problems": ["x"],
                }
            ],
        )

    def test_bridge_update_reads_state_and_schedule_from_the_v1_configuration(self):
        s = snap(
            device=[BRIDGE_DEV],
            config={
                "swupdate2": {
                    "state": "noupdates",
                    "bridge": {"state": "noupdates"},
                    "autoinstall": {"on": True, "updatetime": "T16:00:00"},
                }
            },
        )
        self.assertEqual(
            models.bridge_update(s),
            {
                "installed": "6.3.2071556020",
                "state": "noupdates",
                "overall_state": "noupdates",
                "auto_install": True,
                "auto_install_time": "T16:00:00",
            },
        )
        self.assertIsNone(models.bridge_update(snap())["state"])

    def test_authorized_apps_hide_the_keys_sort_by_last_use_and_the_key_is_found_by_its_public_id(self):
        config = {
            "whitelist": {
                "keyA": {"name": "Hue#iPhone", "create date": "2026-01-01", "last use date": "2026-02-01"},
                "keyB": {"name": "home-assistant#home", "create date": "2026-03-01", "last use date": "2026-10-28"},
                "keyC": "junk",
            }
        }
        apps = models.authorized_apps(config)
        self.assertEqual([a["name"] for a in apps], ["home-assistant#home", "Hue#iPhone"])
        self.assertNotIn("keyA", str(apps))
        self.assertEqual(models.app_key_for(config, apps[1]["id"]), "keyA")
        self.assertIsNone(models.app_key_for(config, "nothing"))

    def test_matter_fabrics_name_the_known_ecosystems_only(self):
        s = snap(
            matter_fabric=[
                {"id": "f1", "status": "paired", "creation_time": "2026-01-20", "fabric_data": {"label": "Home", "vendor_id": 4937}},
                {"id": "f2", "status": "paired", "fabric_data": {"label": "x", "vendor_id": 9999}},
            ]
        )
        fabrics = models.matter_fabrics(s)
        self.assertEqual((fabrics[0]["vendor"], fabrics[1]["vendor"], fabrics[1]["vendor_id"]), ("Apple", None, 9999))

    def test_automations_carry_their_script_name_and_an_empty_error_becomes_none(self):
        s = snap(
            behavior_script=[{"id": "s1", "metadata": {"name": "Timers"}}],
            behavior_instance=[
                {"id": "a1", "metadata": {"name": "Tea"}, "enabled": True, "status": "running", "script_id": "s1", "last_error": ""},
                {"id": "a2", "metadata": {"name": "Odd"}, "enabled": False, "script_id": "unknown", "last_error": "boom"},
            ],
        )
        a = models.automations(s)
        self.assertEqual(
            (a[0]["script"], a[0]["last_error"], a[1]["script"], a[1]["last_error"], a[1]["enabled"]), ("Timers", None, None, "boom", False)
        )

    def test_light_powerup_accepts_only_the_known_presets(self):
        self.assertEqual(models.light_powerup({"powerup": {"preset": "powerfail"}}), "powerfail")
        self.assertIsNone(models.light_powerup({"powerup": {"preset": "mystery"}}))
        self.assertIsNone(models.light_powerup({}))

    def test_entertainment_areas_list_their_lights_with_positions_and_the_streamer(self):
        s = snap(
            device=[LAMP],
            light=[{"id": "l1", "owner": {"rid": "d1"}}],
            entertainment=[{"id": "e1", "owner": {"rid": "d1"}}],
            entertainment_configuration=[
                {
                    "id": "ec",
                    "metadata": {"name": "Bedroom"},
                    "configuration_type": "music",
                    "status": "active",
                    "active_streamer": {"rid": "key", "rtype": "auth_v1"},
                    "locations": {"service_locations": [{"service": {"rid": "e1"}, "positions": [{"x": 0.5, "y": -1, "z": 0}]}]},
                }
            ],
        )
        area = models.entertainment_areas(s)[0]
        self.assertEqual((area["name"], area["type"], area["status"], area["active_streamer"]), ("Bedroom", "music", "active", "key"))
        self.assertEqual(
            area["lights"],
            [
                {
                    "segments_configurable": None,
                    "max_segments": None,
                    "light_id": "l1",
                    "name": "Floor Light L",
                    "x": 0.5,
                    "y": -1,
                    "z": 0,
                }
            ],
        )

    def test_light_setup_leaves_out_what_the_bridge_does_not_report(self):
        strip = {
            "id": "l1",
            "metadata": {"function": "decorative"},
            "dimming": {"min_dim_level": 0.01},
            "color": {"gamut_type": "C"},
            "gradient": {"pixel_count": 6},
            "content_configuration": {
                "orientation": {"configurable": True, "orientation": "horizontal"},
                "order": {"configurable": False, "order": "forward"},
            },
        }
        self.assertEqual(
            models.light_setup(strip),
            {
                "function": "decorative",
                "min_brightness": 0.01,
                "gamut": "C",
                "gradient_pixel_count": 6,
                "gradient_orientation": "horizontal",
                "gradient_orientation_configurable": True,
                "gradient_order": "forward",
                "gradient_order_configurable": False,
            },
        )
        self.assertEqual(models.light_setup({"id": "l2", "metadata": {"name": "x"}}), {})

    def test_matter_and_zigbee_details_are_read_and_absent_ones_dropped(self):
        s = snap(
            matter=[{"id": "m", "max_fabrics": 16, "has_qr_code": True, "software_version_string": "1.4.2"}],
            zigbee_connectivity=[
                {"id": "z1", "status": "connected", "extended_pan_id": "pan"},
                {"id": "z2", "status": "connected"},
                {"id": "z3", "status": "connectivity_issue"},
            ],
        )
        self.assertEqual(models.matter_info(s), {"max_fabrics": 16, "has_qr_code": True, "software_version": "1.4.2"})
        self.assertEqual(models.zigbee_network(s), {"extended_pan_id": "pan", "devices": {"connected": 2, "connectivity_issue": 1}})
        self.assertEqual(models.matter_info(snap()), {})
        self.assertEqual(models.zigbee_network(snap()), {})

    def test_entertainment_areas_report_streams_channels_and_segments(self):
        s = snap(
            device=[LAMP],
            light=[{"id": "l1", "owner": {"rid": "d1"}}],
            entertainment=[
                {"id": "e1", "owner": {"rid": "d1"}, "max_streams": 4, "segments": {"configurable": False, "max_segments": 1}},
            ],
            entertainment_configuration=[
                {
                    "id": "ec",
                    "channels": [{"channel_id": 0}, {"channel_id": 1}],
                    "locations": {"service_locations": [{"service": {"rid": "e1"}, "positions": [{"x": 0, "y": 0, "z": 0}]}]},
                }
            ],
        )
        area = models.entertainment_areas(s)[0]
        self.assertEqual((area["channels"], area["max_streams"]), (2, 4))
        self.assertEqual((area["lights"][0]["segments_configurable"], area["lights"][0]["max_segments"]), (False, 1))

    def test_an_area_reports_what_its_lights_do_when_a_sync_ends(self):
        s = snap(
            behavior_script=[{"id": "sx", "metadata": {"name": "Light state after streaming"}}],
            behavior_instance=[
                {"id": "i1", "script_id": "sx", "configuration": {"end_state": "last_state", "where": [{"group": {"rid": "ec"}}]}},
                {"id": "i2", "script_id": "other", "configuration": {"end_state": "off", "where": [{"group": {"rid": "ec2"}}]}},
            ],
            entertainment_configuration=[{"id": "ec"}, {"id": "ec2"}],
        )
        self.assertEqual([a["end_state"] for a in models.entertainment_areas(s)], ["last_state", None])

    def test_rooms_hold_devices_and_zones_hold_lights_and_both_are_named(self):
        s = snap(
            device=[LAMP],
            light=[{"id": "l1", "owner": {"rid": "d1"}}],
            room=[{"id": "r1", "metadata": {"name": "Bedroom", "archetype": "bedroom"}, "children": [{"rid": "d1", "rtype": "device"}]}],
            zone=[{"id": "z1", "metadata": {"name": "Reading"}, "children": [{"rid": "l1", "rtype": "light"}]}],
        )
        self.assertEqual(models.groups(s, "room")[0]["children"], [{"id": "d1", "name": "Floor Light L"}])
        self.assertEqual(models.groups(s, "zone")[0]["children"], [{"id": "l1", "name": "Floor Light L"}])
        self.assertEqual(models.groups(s, "room")[0]["archetype"], "bedroom")

    def test_scenes_and_search_status(self):
        s = snap(
            scene=[
                {
                    "id": "sc",
                    "metadata": {"name": "Soho"},
                    "group": {"rid": "r1", "rtype": "room"},
                    "speed": 0.6,
                    "auto_dynamic": False,
                    "status": {"active": "inactive"},
                }
            ],
            zigbee_device_discovery=[{"status": "ready"}],
        )
        self.assertEqual(
            models.scenes(s)[0],
            {
                "id": "sc",
                "name": "Soho",
                "group_id": "r1",
                "group_type": "room",
                "speed": 0.6,
                "auto_dynamic": False,
                "active": "inactive",
                "last_recall": None,
            },
        )
        self.assertEqual(models.search_status(s), "ready")
        self.assertIsNone(models.search_status(snap()))


if __name__ == "__main__":
    unittest.main()
