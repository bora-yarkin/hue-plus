# SPDX-License-Identifier: GPL-3.0-or-later
"""The services' description: complete, consistent with the handlers, and the generated files are up to date."""

import importlib.util
import json
import pathlib
import re
import unittest

from tests.support import load

spec = load("spec")
actions = load("bridge.actions")

ROOT = pathlib.Path(__file__).resolve().parent.parent
FOLDER = ROOT / "custom_components" / "hue_plus"
KNOWN_TYPES = {"text", "number", "int", "bool", "select", "select_list", "list", "object", "xy", "xy_one", "lights", "time"}


class SpecTests(unittest.TestCase):
    def test_no_problems_are_reported(self):
        self.assertEqual(spec.check_spec(), [])

    def test_every_bridge_service_has_an_action_and_every_action_a_service(self):
        bridge = {name for name, module in spec.MODULE_OF.items() if module == "bridge"}
        self.assertEqual(bridge, set(actions.ACTIONS))

    def test_destructive_services_require_the_confirm_field(self):
        for name, action in actions.ACTIONS.items():
            self.assertEqual("confirm" in spec.fields_of(name), action.destructive or name == "raw_request", name)
            if action.destructive:
                self.assertTrue(spec.fields_of(name)["confirm"]["required"], name)

    def test_every_field_has_a_known_type_a_description_and_selects_have_options(self):
        for name in spec.SPEC:
            for field, definition in spec.fields_of(name).items():
                self.assertIn(definition["type"], KNOWN_TYPES, f"{name}.{field}")
                self.assertTrue(definition["description"], f"{name}.{field}")
                if definition["type"] in ("select", "select_list"):
                    self.assertTrue(definition["options"], f"{name}.{field}")

    def test_every_field_a_bridge_action_reads_is_in_the_spec(self):
        source = (FOLDER / "bridge" / "actions.py").read_text()
        used = set(re.findall(r'data\["(\w+)"\]', source)) | set(re.findall(r'data\.get\("(\w+)"', source))
        declared = {field for name in actions.ACTIONS for field in spec.fields_of(name)}
        self.assertEqual(used - declared, set())

    def test_no_service_name_is_used_by_two_modules(self):
        names = [name for module_spec in spec.SPECS.values() for name in module_spec]
        self.assertEqual(len(names), len(set(names)))


class GeneratedFilesTests(unittest.TestCase):
    """services.yaml, strings.json and translations/en.json are written by scripts/generate_services.py."""

    def test_they_are_what_the_generator_writes(self):
        script = importlib.util.spec_from_file_location("generate_services", ROOT / "scripts" / "generate_services.py")
        generator = importlib.util.module_from_spec(script)
        script.loader.exec_module(generator)
        for target, expected in generator.render().items():
            self.assertEqual(
                (FOLDER / target).read_text(encoding="utf-8"), expected, f"{target} is out of date: run scripts/generate_services.py"
            )

    def test_strings_and_translations_are_the_same_and_valid_json(self):
        strings = json.loads((FOLDER / "strings.json").read_text())
        self.assertEqual(strings, json.loads((FOLDER / "translations" / "en.json").read_text()))
        self.assertEqual(set(strings["services"]), set(spec.SPEC) | set(spec.ENTITY_SERVICES))


if __name__ == "__main__":
    unittest.main()
