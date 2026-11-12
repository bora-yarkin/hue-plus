# SPDX-License-Identifier: GPL-3.0-or-later
"""Builds the scripts Hue Plus serves from the sources at the root of the repository (frontend/src and frontend/app), in the order they need:

- custom_components/hue_plus/frontend/menu.js: the Hue Plus pages Home Control loads for administrators (frontend/src).
- custom_components/hue_plus/frontend/app.js: the Hue dashboard panel (dashboard module): a host that gives the same pages a place to run (frontend/app), the same pages, and the
  panel's own tabs. panel.js, the loader Home Assistant opens, is written by hand and is not built.

Run from the repository root:  python3 scripts/build_menu.py
`tests/test_menu_built.py` fails when either file is not what this writes.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "frontend" / "src"  # not shipped
BUILT = ROOT / "custom_components" / "hue_plus" / "frontend" / "menu.js"
APP_SOURCES = ROOT / "frontend" / "app"  # not shipped
APP_BUILT = ROOT / "custom_components" / "hue_plus" / "frontend" / "app.js"
EFFECTS_BUILT = ROOT / "custom_components" / "hue_plus" / "frontend" / "effects.json"
DECLARATION = ROOT / "custom_components" / "hue_plus" / "home_control.json"
ORDER = (
    "prologue.js",
    "strings.js",
    "huecss.js",
    "adapter.js",
    "hmdraft.js",
    "hueplus.js",
    "huemenu.js",
    "huewizard.js",
    "humotion.js",
    "huerooms.js",
    "huesync.js",
    "huescenes.js",
    "huenewscene.js",
    "huestyle.js",
    "epilogue.js",
)


def build() -> str:
    return "".join((SOURCES / name).read_text(encoding="utf-8").rstrip("\n") + "\n\n" for name in ORDER).rstrip("\n") + "\n"


# The panel's own tabs run inside the pages' scope (they use the same helpers), just before the registration at the end.
APP_INSIDE = ("shell.js", "home.js", "scenes.js", "autotab.js", "light.js", "syncpage.js")


def _css() -> str:
    text = "".join((APP_SOURCES / name).read_text(encoding="utf-8") for name in ("app.css",))
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"\s*([{};:,>])\s*", r"\1", re.sub(r"\s+", " ", text)).strip()


def build_app() -> str:
    icons = json.loads((APP_SOURCES / "icons.json").read_text(encoding="utf-8"))
    head = "/* The Hue dashboard panel. Built by scripts/build_menu.py from frontend/app and frontend/src; edit those files, not this one. */\n"
    head += "var HOST_ICONS = " + json.dumps(icons, separators=(",", ":"), sort_keys=True) + ";\n"
    head += "var HOST_CSS = " + json.dumps(_css()) + ";\n"
    host = (APP_SOURCES / "host.js").read_text(encoding="utf-8").rstrip("\n") + "\n\n"
    plugin = ORDER[:-1]
    parts = [(SOURCES / name) for name in plugin] + [(APP_SOURCES / name) for name in APP_INSIDE] + [SOURCES / ORDER[-1]]
    return head + host + "".join(p.read_text(encoding="utf-8").rstrip("\n") + "\n\n" for p in parts).rstrip("\n") + "\n"


def build_effects() -> str:
    """The effects catalogue the light panel's effects page shows (the pictures, speeds and default colours worked out against the Hue app and the bridge), from Hue Plus's declaration for Home Control."""
    declaration = json.loads(DECLARATION.read_text(encoding="utf-8"))
    platforms = [name for name, kind in declaration["lights"].items() if kind.get("effects")]
    source = {
        "id": "hue_plus",
        "name": declaration["name"],
        "kind": "provider",
        "lights": {"platforms": platforms},
        "groups": declaration["catalogue"]["groups"],
        "effects": declaration["catalogue"]["effects"],
        "set_effect": declaration["set_effect"],
    }
    return json.dumps(source, separators=(",", ":"), ensure_ascii=False) + "\n"


if __name__ == "__main__":
    EFFECTS_BUILT.write_text(build_effects(), encoding="utf-8")
    BUILT.write_text(build(), encoding="utf-8")
    APP_BUILT.write_text(build_app(), encoding="utf-8")
    print("menu.js:", len(build().splitlines()), "lines;", "app.js:", len(build_app().splitlines()), "lines")
