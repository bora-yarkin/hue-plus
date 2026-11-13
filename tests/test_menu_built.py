# SPDX-License-Identifier: GPL-3.0-or-later
"""The script Home Control loads is what scripts/build_menu.py builds from frontend/src, and Hue Plus serves it and declares it."""

import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent


def test_menu_js_is_built_from_the_sources():
    spec = importlib.util.spec_from_file_location("build_menu", ROOT / "scripts" / "build_menu.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    built = (ROOT / "custom_components" / "hue_plus" / "frontend" / "menu.js").read_text(encoding="utf-8")
    assert built == module.build(), "menu.js is out of date: run scripts/build_menu.py"
    effects = (ROOT / "custom_components" / "hue_plus" / "frontend" / "effects.json").read_text(encoding="utf-8")
    assert effects == module.build_effects(), "effects.json is out of date: run scripts/build_menu.py"
    app = (ROOT / "custom_components" / "hue_plus" / "frontend" / "app.js").read_text(encoding="utf-8")
    assert app == module.build_app(), "app.js is out of date: run scripts/build_menu.py"


def test_the_declaration_names_the_script_hue_plus_serves():
    declaration = json.loads((ROOT / "custom_components" / "hue_plus" / "home_control.json").read_text())
    url = declaration["menu"]["url"]
    assert url == "/hue_plus_static/menu.js"
    assert (ROOT / "custom_components" / "hue_plus" / "frontend" / "menu.js").is_file()
    # Only the built scripts, the panel's loader and sidebar icon, the effects catalogue, the frame of the light panel and the copy of Home Control's code it runs are served, never the sources.
    assert sorted(p.name for p in (ROOT / "custom_components" / "hue_plus" / "frontend").iterdir()) == [
        "app.js",
        "effects.json",
        "icon.js",
        "lights",
        "menu.js",
        "panel.js",
        "popup.html",
    ]


def test_the_light_panel_is_home_controls_code_as_it_is():
    """The copy in lights/ is byte for byte what the sibling checkout of Home Control has (run scripts/sync_light_popup.py to refresh it)."""
    spec = importlib.util.spec_from_file_location("sync_light_popup", ROOT / "scripts" / "sync_light_popup.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if not module.SOURCE.is_dir():
        pytest.skip("Home Control is not checked out next to Hue Plus")
    assert module.sync(check=True), "lights/ differs from Home Control's dashboard: run scripts/sync_light_popup.py"
