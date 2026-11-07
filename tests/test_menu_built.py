# SPDX-License-Identifier: GPL-3.0-or-later
"""The script Home Control loads is what scripts/build_menu.py builds from frontend/src, and Hue Plus serves it and declares it."""

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_menu_js_is_built_from_the_sources():
    spec = importlib.util.spec_from_file_location("build_menu", ROOT / "scripts" / "build_menu.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    built = (ROOT / "custom_components" / "hue_plus" / "frontend" / "menu.js").read_text(encoding="utf-8")
    assert built == module.build(), "menu.js is out of date: run scripts/build_menu.py"


def test_the_declaration_names_the_script_hue_plus_serves():
    declaration = json.loads((ROOT / "custom_components" / "hue_plus" / "home_control.json").read_text())
    url = declaration["menu"]["url"]
    assert url == "/hue_plus_static/menu.js"
    assert (ROOT / "custom_components" / "hue_plus" / "frontend" / "menu.js").is_file()
    # Only the built script is served, never the sources.
    assert [p.name for p in (ROOT / "custom_components" / "hue_plus" / "frontend").iterdir()] == ["menu.js"]
