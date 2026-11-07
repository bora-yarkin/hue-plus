# SPDX-License-Identifier: GPL-3.0-or-later
"""Builds custom_components/hue_plus/frontend/menu.js from the files in frontend/src (at the root of the repository), in the order the pages need them.

Run from the repository root:  python3 scripts/build_menu.py
`tests/test_menu_built.py` fails when menu.js is not what this writes.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "frontend" / "src"  # not shipped
BUILT = ROOT / "custom_components" / "hue_plus" / "frontend" / "menu.js"  # the only file the integration serves
ORDER = (
    "prologue.js",
    "strings.js",
    "huecss.js",
    "adapter.js",
    "hmdraft.js",
    "hueplus.js",
    "huemenu.js",
    "huesync.js",
    "huescenes.js",
    "huestyle.js",
    "epilogue.js",
)


def build() -> str:
    return "".join((SOURCES / name).read_text(encoding="utf-8").rstrip("\n") + "\n\n" for name in ORDER).rstrip("\n") + "\n"


if __name__ == "__main__":
    BUILT.write_text(build(), encoding="utf-8")
    print("menu.js:", len(build().splitlines()), "lines")
