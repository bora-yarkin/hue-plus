# SPDX-License-Identifier: GPL-3.0-or-later
"""Hue Plus runs without the Hue integration's code: it has its own copies of the platforms it ran, and says it needs no `hue`."""

import ast
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PACKAGE = ROOT / "custom_components" / "hue_plus"


def test_no_file_imports_the_hue_integration():
    offenders = []
    for path in PACKAGE.rglob("*.py"):
        for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
            names = (
                [a.name for a in node.names]
                if isinstance(node, ast.Import)
                else [node.module or ""]
                if isinstance(node, ast.ImportFrom)
                else []
            )
            offenders += [
                f"{path.relative_to(ROOT)}: {n}"
                for n in names
                if n == "homeassistant.components.hue" or n.startswith("homeassistant.components.hue.")
            ]
        text = path.read_text(encoding="utf-8")
        if "import_module(" in text and "homeassistant.components.hue" in text:
            offenders.append(f"{path.relative_to(ROOT)}: imports it by name")
    assert not offenders, offenders


def test_loading_every_platform_does_not_load_the_hue_integration():
    code = (
        "import importlib, sys\n"
        "for name in ('light','sensor','binary_sensor','event','scene','select','switch','button','number','time','update'):\n"
        "    importlib.import_module(f'custom_components.hue_plus.{name}')\n"
        "for name in ('light','sensor','binary_sensor','event','scene','select','switch'):\n"
        "    importlib.import_module(f'custom_components.hue_plus.hue.{name}')\n"
        "bad = sorted(m for m in sys.modules if m == 'homeassistant.components.hue' or m.startswith('homeassistant.components.hue.'))\n"
        "assert not bad, bad\n"
    )
    result = subprocess.run([sys.executable, "-c", code], cwd=ROOT, capture_output=True, text=True, timeout=120)
    assert result.returncode == 0, result.stderr[-2000:]


def test_the_manifest_needs_no_hue_integration_and_the_library_it_needs():
    manifest = json.loads((PACKAGE / "manifest.json").read_text(encoding="utf-8"))
    assert "hue" not in manifest["dependencies"]
    assert "hue" in manifest["after_dependencies"], "set up after the Hue integration when there is one (Hue Plus rides on it then)"
    assert any(r.startswith("aiohue==") for r in manifest["requirements"])


def test_every_copied_file_says_where_it_comes_from():
    for path in (PACKAGE / "hue").rglob("*.py"):
        if path.name in ("__init__.py", "bridge.py"):
            continue
        assert "Apache-2.0" in path.read_text(encoding="utf-8").splitlines()[0] + path.read_text(encoding="utf-8").splitlines()[1], path
