# SPDX-License-Identifier: GPL-3.0-or-later
import unittest

from tests.support import load

colors = load("zones.colors")


class ColourTests(unittest.TestCase):
    def test_a_white_temperature_survives_a_round_trip_within_a_few_percent(self):
        for kelvin in (2200, 2700, 4000, 5000, 6500):
            back = colors.xy_to_kelvin(colors.kelvin_to_xy(kelvin))
            self.assertIsNotNone(back, kelvin)
            self.assertAlmostEqual(back, kelvin, delta=kelvin * 0.04, msg=kelvin)

    def test_a_colour_far_from_any_white_is_not_a_white(self):
        self.assertIsNone(colors.xy_to_kelvin((0.70, 0.29)))

    def test_hue_and_saturation_survive_a_round_trip(self):
        for hue, saturation in ((0, 100), (120, 80), (240, 60), (300, 100)):
            x, y = colors.hs_to_xy(hue, saturation)
            back_hue, back_saturation = colors.xy_to_hs(x, y)
            self.assertAlmostEqual(back_hue, hue, delta=3, msg=(hue, saturation))
            self.assertAlmostEqual(back_saturation, saturation, delta=5, msg=(hue, saturation))

    def test_a_colour_outside_the_gamut_is_moved_to_its_edge_and_one_inside_is_left_alone(self):
        gamut = ((0.675, 0.322), (0.409, 0.518), (0.167, 0.04))
        inside = (0.4, 0.35)
        self.assertEqual(colors.clamp_to_gamut(inside, gamut), inside)
        outside = (0.8, 0.8)
        moved = colors.clamp_to_gamut(outside, gamut)
        self.assertNotEqual(moved, outside)
        self.assertEqual(colors.clamp_to_gamut(moved, gamut), moved)

    def test_arc_points_keep_every_pin_in_order(self):
        pins = [(0.675, 0.322), (0.409, 0.518), (0.167, 0.04)]
        points = colors.arc_points(pins)
        self.assertGreaterEqual(len(points), len(pins))
        indexes = [points.index(pin) for pin in pins]
        self.assertEqual(indexes, sorted(indexes))


if __name__ == "__main__":
    unittest.main()
