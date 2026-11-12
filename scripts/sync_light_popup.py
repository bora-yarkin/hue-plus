# SPDX-License-Identifier: GPL-3.0-or-later
"""Copies the code of Home Control's dashboard into the Hue dashboard panel, for its light popup (the colour wheel, the white and effects pages, the brightness button).

The light popup is Home Control's code; the Hue panel opens it as it is instead of drawing a second one. Nothing else of Home Control's dashboard is shown in the panel. The copy is made byte for byte from a sibling checkout of Home Control, so a change there
is picked up by running this again (the copy is in git so that the integration works without Home Control being installed):

    python3 scripts/sync_light_popup.py            # copy
    python3 scripts/sync_light_popup.py --check    # fail when the copy differs from Home Control's files (used by a test when the checkout is there)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / "home-control" / "custom_components" / "home_control" / "frontend"
TARGET = ROOT / "custom_components" / "hue_plus" / "frontend" / "lights"


def _files() -> tuple[str, ...]:
    """What the dashboard of Home Control runs, in its order (its version.json), except main.js: the Hue panel starts itself."""
    listed = json.loads((SOURCE / "version.json").read_text(encoding="utf-8"))["files"]
    runtime = [name for name in listed if name != "app/main.js"]
    return ("ha-adapter.js", "camera-stream.js", *runtime, "dashboard.css")


def sync(check: bool) -> bool:
    ok = True
    for name in _files():
        source, target = SOURCE / name, TARGET / name
        if check:
            same = target.is_file() and target.read_bytes() == source.read_bytes()
            ok = ok and same
            if not same:
                print(f"differs: {name}")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())
    return ok


if __name__ == "__main__":
    if not SOURCE.is_dir():
        sys.exit(f"Home Control's frontend is not at {SOURCE}")
    sys.exit(0 if sync("--check" in sys.argv) else 1)
