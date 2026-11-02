# SPDX-License-Identifier: GPL-3.0-or-later
"""The scenes package stays separable from the rest of Hue Plus (decision D-21), so it can move to its own integration later.

Its pure modules import nothing from Home Assistant or from the rest of Hue Plus. A few thin files connect it to both; they may
use only the listed parts of Hue Plus, so what a move has to replace is known and small.
"""

import ast
import unittest
from pathlib import Path

SCENES = Path(__file__).resolve().parents[2] / "custom_components" / "hue_plus" / "scenes"

# Connect the package to Home Assistant and to Hue Plus; every other module is pure.
THIN = {"__init__", "setup", "services", "spec", "sensor", "websocket", "ha_driver", "hue_import", "hue_native", "hue_only", "actions"}
# What the thin files may take from outside the package (relative to hue_plus).
ALLOWED_OUTSIDE = {"const", "runtime", "services_base", "fieldspec", "entity"}
# Hue-specific, and the only place the package names Hue Plus's own domain in logic.
HUE_ONLY = {"hue_import", "hue_native", "hue_only"}


def imports(path: Path):
    """(module, level) of every import in a file."""
    for node in ast.walk(ast.parse(path.read_text())):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name, 0
        elif isinstance(node, ast.ImportFrom):
            yield node.module or "", node.level


class BoundaryTests(unittest.TestCase):
    def test_the_package_has_the_files_this_test_knows_about(self):
        found = {p.stem for p in SCENES.glob("*.py")}
        self.assertTrue(found >= THIN, THIN - found)

    def test_pure_modules_import_neither_home_assistant_nor_the_rest_of_hue_plus(self):
        for path in sorted(SCENES.glob("*.py")):
            if path.stem in THIN:
                continue
            for module, level in imports(path):
                self.assertNotEqual(module.split(".")[0], "homeassistant", f"{path.name} imports {module}")
                self.assertLessEqual(level, 1, f"{path.name} reaches outside the package: {'.' * level}{module}")
                self.assertNotIn(module.split(".")[0], {"aiohue", "voluptuous"}, f"{path.name} imports {module}")

    def test_thin_files_take_only_the_allowed_parts_of_hue_plus(self):
        for stem in sorted(THIN):
            path = SCENES / f"{stem}.py"
            for module, level in imports(path):
                if level == 2:
                    self.assertIn(module.split(".")[0], ALLOWED_OUTSIDE, f"{path.name} imports ..{module}")
                self.assertLess(level, 3, path.name)

    def test_only_the_hue_files_know_about_hue(self):
        for path in sorted(SCENES.glob("*.py")):
            if path.stem in HUE_ONLY:
                continue
            for module, _ in imports(path):
                self.assertNotIn(module.split(".")[0], {"aiohue"}, f"{path.name} imports {module}")


if __name__ == "__main__":
    unittest.main()
