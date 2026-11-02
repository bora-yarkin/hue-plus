# SPDX-License-Identifier: GPL-3.0-or-later
# The manager imports Home Assistant, so only the pure function is taken from its source.
import ast
import pathlib
import unittest

SOURCE = (pathlib.Path(__file__).resolve().parents[2] / "custom_components" / "hue_plus" / "zones" / "manager.py").read_text()
TREE = ast.parse(SOURCE)
namespace = {"XY": tuple[float, float], "list": list}
for node in TREE.body:
    if isinstance(node, ast.FunctionDef) and node.name == "pins_from_points":
        exec(compile(ast.Module([node], []), "manager.py", "exec"), namespace)
pins_from_points = namespace["pins_from_points"]


class PinsTests(unittest.TestCase):
    def test_first_and_last_point_are_first_and_last_zone(self):
        points = [(0.1, 0.1), (0.2, 0.2), (0.3, 0.3), (0.4, 0.4), (0.5, 0.5)]
        pins = pins_from_points(points, (0, 0), 3)
        self.assertEqual(pins[0], points[0])
        self.assertEqual(pins[-1], points[-1])
        self.assertEqual(pins[1], points[2])

    def test_a_light_that_is_off_falls_back_to_its_single_colour(self):
        self.assertEqual(pins_from_points([], (0.3, 0.3), 4), [(0.3, 0.3)] * 4)

    def test_one_point_fills_every_zone(self):
        self.assertEqual(pins_from_points([(0.2, 0.3)], (0, 0), 3), [(0.2, 0.3)] * 3)

    def test_fewer_points_than_zones_are_blended(self):
        pins = pins_from_points([(0.0, 0.0), (0.4, 0.4)], (0, 0), 3)
        self.assertEqual(pins[1], (0.2, 0.2))


if __name__ == "__main__":
    unittest.main()
