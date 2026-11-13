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
APP_INSIDE = (
    "shell.js",
    "sortable.js",
    "home.js",
    "scenes.js",
    "switchpages.js",
    "cyclepage.js",
    "lightsettings.js",
    "autotab.js",
    "light.js",
    "syncpage.js",
    "menupages.js",
)


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
    return _scaled(head + host + "".join(p.read_text(encoding="utf-8").rstrip("\n") + "\n\n" for p in parts).rstrip("\n") + "\n")


def _scaled(text: str) -> str:
    """The panel is a phone drawn at any width: every length written in px (the Hue app's points, at its width of 393) becomes a rem, and the
    panel's style sheet sets the root font size from the panel's width (16px at 393). Lengths that code works out while running stay px."""

    def rem(match: re.Match[str]) -> str:
        return f"{float(match.group(1)) / 16:.5f}".rstrip("0").rstrip(".") + "rem"

    return re.sub(r"(?<![\w.#])(\d*\.?\d+)px\b", rem, text)


POPUP = ROOT / "custom_components" / "hue_plus" / "frontend" / "popup.html"
LIGHTS = ROOT / "custom_components" / "hue_plus" / "frontend" / "lights"
LIGHTS_BUILT = LIGHTS / "bundle.json"


def build_lights() -> str:
    """The files of Home Control's dashboard that the light frame runs (the list FILES in popup.html), in one answer: the frame asks for this instead of
    some sixty files one after another, which took many seconds through a proxy. Each file is still run as a script of its own, so nothing about it changes."""
    listed = json.loads(re.search(r"var FILES = (\[.*?\]);", POPUP.read_text(encoding="utf-8"), flags=re.S).group(1))
    return json.dumps([[name, (LIGHTS / name).read_text(encoding="utf-8")] for name in listed], separators=(",", ":"), ensure_ascii=False) + "\n"


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
    LIGHTS_BUILT.write_text(build_lights(), encoding="utf-8")
    BUILT.write_text(build(), encoding="utf-8")
    APP_BUILT.write_text(build_app(), encoding="utf-8")
    print("menu.js:", len(build().splitlines()), "lines;", "app.js:", len(build_app().splitlines()), "lines")
