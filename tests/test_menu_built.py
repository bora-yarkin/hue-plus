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
    bundle = (ROOT / "custom_components" / "hue_plus" / "frontend" / "lights" / "bundle.json").read_text(encoding="utf-8")
    assert bundle == module.build_lights(), "lights/bundle.json is out of date: run scripts/build_menu.py"


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


# The files of Home Control's dashboard that the light frame deliberately does not run (the Hue panel has no use for them). Every other file of Home Control's list is in popup.html's FILES:
# a new file of Home Control that the light panel calls into was missing once and left the wheel empty.
NOT_RUN_BY_THE_FRAME = {
    "app/batteries.js",
    "app/controls.js",
    "app/appliancedial.js",
    "app/lightgroups.js",
    "app/addpopup.js",
    "app/main.js",
    "app/lightsmasters.js",
    "app/autoscenes.js",
}


def test_the_light_frame_runs_the_files_of_home_control_it_needs():
    spec = importlib.util.spec_from_file_location("sync_light_popup", ROOT / "scripts" / "sync_light_popup.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if not module.SOURCE.is_dir():
        pytest.skip("Home Control is not checked out next to Hue Plus")
    import re

    popup = (ROOT / "custom_components" / "hue_plus" / "frontend" / "popup.html").read_text(encoding="utf-8")
    listed = json.loads(re.search(r"var FILES = (\[.*?\]);", popup, flags=re.S).group(1))
    home_control = json.loads(module._read("version.json").decode("utf-8"))["files"]
    missing = [name for name in home_control if name not in listed and name not in NOT_RUN_BY_THE_FRAME]
    assert not missing, (
        f"popup.html does not run {missing}: add them to FILES (or to NOT_RUN_BY_THE_FRAME here if the Hue panel does not need them)"
    )
    assert [name for name in listed if name in home_control] == [name for name in home_control if name in listed], (
        "popup.html runs them in Home Control's order"
    )


def test_the_hue_panels_wheel_treats_groups_as_single_lights_and_has_no_scenes_or_sync_page():
    popup = (ROOT / "custom_components" / "hue_plus" / "frontend" / "popup.html").read_text(encoding="utf-8")
    call = popup[popup.index('lightPanel(b, lpMasterNode("hue", ids), {') :][:700]
    assert "groups: true," in call
    # The Scenes and Sync pages are Home Control's lights master's: a panel named "hue" (not "page~section") has no section, so it has neither.
    assert 'lpMasterNode("hue", ids)' in popup


def test_the_light_frame_names_only_what_the_code_it_runs_defines():
    """popup.html reaches into Home Control's global names; one that Home Control removed (LWHEEL was) fails when the wheel opens, so it fails here first."""
    spec = importlib.util.spec_from_file_location("check_light_frame", ROOT / "scripts" / "check_light_frame.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.undefined_names() == [], "popup.html names what nothing it runs defines (see scripts/check_light_frame.py)"
