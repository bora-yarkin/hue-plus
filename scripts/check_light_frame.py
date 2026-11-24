# SPDX-License-Identifier: GPL-3.0-or-later
"""Checks that the light frame (frontend/popup.html) only names what the code it runs defines.

The frame opens Home Control's light panel and reaches into its global names (`lightPanel`, `LMASTER`, ...). When Home Control renames or removes one of them, the frame's own code still names it and fails
when the wheel is opened (`LWHEEL` was removed in Home Control 0.19.0 and the wheel stayed empty). This lists every name the frame's script uses that nothing it runs defines, so the break shows
when Home Control's code is copied (scripts/sync_light_popup.py) and in the tests, not in the panel.

    python3 scripts/check_light_frame.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "custom_components" / "hue_plus" / "frontend"

# What the page itself provides, and words of the language.
KNOWN = {
    "break",
    "case",
    "catch",
    "continue",
    "default",
    "delete",
    "do",
    "else",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "in",
    "instanceof",
    "new",
    "null",
    "return",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "let",
    "const",
    "undefined",
    "NaN",
    "Infinity",
    "of",
    "window",
    "document",
    "console",
    "Promise",
    "URL",
    "URLSearchParams",
    "fetch",
    "Object",
    "Array",
    "JSON",
    "Math",
    "Date",
    "Number",
    "String",
    "Error",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "requestAnimationFrame",
    "location",
    "parseFloat",
    "parseInt",
    "isNaN",
    "encodeURIComponent",
    "getComputedStyle",
}


def _strip(text: str) -> str:
    """The code without comments and the contents of strings."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?<!:)//[^\n]*", "", text)
    text = re.sub(r"`(?:\\.|[^`\\])*`", '""', text, flags=re.S)
    text = re.sub(r'"(?:\\.|[^"\\\n])*"', '""', text)
    return re.sub(r"'(?:\\.|[^'\\\n])*'", "''", text)


def _declared(code: str) -> set[str]:
    names = set(re.findall(r"\bfunction\s+([A-Za-z_$][\w$]*)", code))
    names |= set(re.findall(r"\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)", code))
    names |= set(re.findall(r",\s*([A-Za-z_$][\w$]*)\s*=(?!=)", code))
    names |= set(re.findall(r"window\.([A-Za-z_$][\w$]*)\s*=", code))
    for group in re.findall(r"function\s*[\w$]*\(([^)]*)\)", code):
        names |= {part.strip().split("=")[0].strip() for part in group.split(",")}
    names |= set(re.findall(r"catch\s*\(\s*([A-Za-z_$][\w$]*)", code))
    for group in re.findall(r"\(([A-Za-z_$][\w$, ]*)\)\s*=>", code):
        names |= {part.strip() for part in group.split(",")}
    names |= set(re.findall(r"\b([A-Za-z_$][\w$]*)\s*=>", code))
    return names


def undefined_names() -> list[str]:
    """Names the frame's script uses that none of the code it runs (Home Control's copy, Hue Plus's menu) defines, apart from the known words. A word followed by a colon is an object key and is not a name; the check reads the text, it does not run it."""
    html = (FRONTEND / "popup.html").read_text(encoding="utf-8")
    match = re.search(r"<script>\n\(function \(\) \{(.*?)\n\}\)\(\);\n</script>", html, flags=re.S)
    if not match:
        raise SystemExit("popup.html: the frame's script was not found")
    code = _strip(match.group(1))
    defined = _declared(code)
    for path in [*(FRONTEND / "lights").rglob("*.js"), FRONTEND / "menu.js"]:
        defined |= _declared(_strip(path.read_text(encoding="utf-8")))
    used = set(re.findall(r"(?<![\w$.])([A-Za-z_$][\w$]*)(?![\w$])(?!\s*:(?!:))", code))
    return sorted(name for name in used if name not in KNOWN | defined)


if __name__ == "__main__":
    missing = undefined_names()
    if missing:
        print("The light frame names what nothing it runs defines: " + ", ".join(missing))
        print(
            "Home Control probably renamed or removed it: change frontend/popup.html (or frontend/src) to match, then run scripts/build_menu.py."
        )
        sys.exit(1)
    print("The light frame names only what it runs.")
