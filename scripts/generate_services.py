# SPDX-License-Identifier: GPL-3.0-or-later
"""Writes services.yaml, strings.json and translations/en.json from the services' specs (custom_components/hue_plus/spec.py).

Run from the repository root with the development environment:  .venv/bin/python scripts/generate_services.py
`tests/test_generated_files.py` fails when the files in the repository are not what this writes.
"""

from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from custom_components.hue_plus import spec  # noqa: E402

FOLDER = ROOT / "custom_components" / "hue_plus"

SELECTORS = {
    "text": lambda d: {"text": None},
    "number": lambda d: {"number": {"mode": "box", "step": "any"}},
    "int": lambda d: {"number": {"mode": "box", "min": d.get("min", 0), "max": d.get("max", 100), "step": 1}},
    "bool": lambda d: {"boolean": None},
    "select": lambda d: {"select": {"options": d["options"]}},
    "select_list": lambda d: {"select": {"options": d["options"], "multiple": True}},
    "list": lambda d: {"object": None},
    "object": lambda d: {"object": None},
    "xy": lambda d: {"object": None},
    "xy_one": lambda d: {"object": None},
    "lights": lambda d: {"object": None},
    "time": lambda d: {"time": None},
}

# The first group is Hue Plus's own entities. The second group has the same keys as the Hue integration's entities, which Hue
# Plus runs again (devices module, lights module): a translation key that Hue Plus does not define falls back to a bare
# "Button", so all four buttons of a dimmer switch would carry one name.
ENTITIES = {
    "sensor": {
        "now_playing": {"name": "Now playing"},
        "zigbee_connectivity": {
            "name": "Zigbee connectivity",
            "state": {
                "connected": "Connected",
                "connectivity_issue": "Connectivity issue",
                "disconnected": "Disconnected",
                "unidirectional_incoming": "Unidirectional incoming",
            },
        },
    },
    "number": {
        "brightness": {"name": "Sync brightness"},
        "light_delay": {"name": "Light delay"},
    },
    "select": {
        "intensity": {"name": "Intensity"},
        "palette": {"name": "Palette"},
        "style": {"name": "Style"},
        "area": {"name": "Area"},
        "active_scene": {"name": "Scene"},
    },
    "binary_sensor": {"entertainment_area": {"name": "Entertainment area {area_name}"}},
    "event": {
        "button": {
            "name": "Button {button_id}",
            "state_attributes": {
                "event_type": {
                    "state": {
                        "double_short_release": "Double press",
                        "initial_press": "Initial press",
                        "long_press": "Long press",
                        "long_release": "Long release",
                        "repeat": "Repeat",
                        "short_release": "Short press",
                    }
                }
            },
        },
        "rotary": {
            "name": "Rotary",
            "state_attributes": {"event_type": {"state": {"clock_wise": "Clockwise", "counter_clock_wise": "Counterclockwise"}}},
        },
    },
    "light": {
        "hue_light": {
            "state_attributes": {
                "effect": {
                    "state": {
                        "candle": "Candle",
                        "cosmos": "Cosmos",
                        "enchant": "Enchant",
                        "fire": "Fire",
                        "glisten": "Glisten",
                        "opal": "Opal",
                        "prism": "Prism",
                        "sparkle": "Sparkle",
                        "sunbeam": "Sunbeam",
                        "sunrise": "Sunrise",
                        "sunset": "Sunset",
                        "underwater": "Underwater",
                    }
                }
            }
        }
    },
    "switch": {
        "light_sensor_enabled": {"name": "Light sensor enabled"},
        "motion_aware": {"name": "MotionAware"},
        "motion_sensor_enabled": {"name": "Motion sensor enabled"},
    },
}

SYNC_ERRORS = {
    "invalid_auth": "The sync service does not accept this token. Check the token and the UUID.",
    "cannot_connect": "The sync service could not be reached.",
}

CONFIG = {
    "step": {
        "user": {
            "title": "Philips Hue Plus",
            "menu_options": {"bridge": "A Hue bridge (through the Hue integration)", "syncbox": "A Hue Play HDMI Sync Box"},
        },
        "bridge": {
            "title": "Philips Hue Plus",
            "description": "Choose the Hue bridge to add Hue Plus to.",
            "data": {"hue_entry_id": "Hue bridge"},
        },
        "takeover": {
            "title": "The Hue integration's entities",
            "description": "Hue Plus makes its own entity for everything the Hue integration shows. What should happen to the Hue integration's entities?",
            "data": {"takeover": "Hue integration's entities"},
        },
        "syncbox": {
            "title": "Hue Play HDMI Sync Box",
            "description": "Enter the address of the sync box (its name on the network or its IP address).",
            "data": {"syncbox_host": "Address"},
        },
        "syncbox_register": {
            "title": "Register with the sync box",
            "description": "Hold the button on the sync box until its light turns green, then submit this form.",
        },
        "syncbox_reauth": {
            "title": "Register with the sync box again",
            "description": "The sync box no longer accepts Hue Plus. Hold the button on the box until its light turns green, then submit this form.",
        },
        "reauth_confirm": {
            "title": "Hue Spotify sync",
            "description": "The sync service no longer accepts the stored token.",
        },
        "reauth_credentials": {
            "title": "Hue Spotify sync credentials",
            "description": "Enter the new token and UUID, or put a file named hue_plus_spotify_token.json with auth and uuid in the Home Assistant configuration folder and submit this form.",
            "data": {"auth": "Token", "uuid": "UUID"},
        },
    },
    "error": {
        **SYNC_ERRORS,
        "wrong_account": "This token belongs to a different Hue account than the stored one.",
        "invalid_host": "That is not a name or an address.",
        "registration_pending": "The box did not register Hue Plus. Hold its button until the light turns green, then submit again.",
    },
    "abort": {
        "no_hue_bridge": "Set up the Hue integration first (it has to use the bridge's v2 API).",
        "already_configured": "Hue Plus is already set up for this bridge.",
        "reauth_successful": "The new credentials are stored.",
        "no_options": "A sync box has no options.",
    },
}

OPTIONS = {
    "step": {
        "init": {
            "title": "Philips Hue Plus",
            "menu_options": {
                "modules": "Choose the modules",
                "credentials": "Spotify sync token (by hand)",
                "streaming": "Local streaming registration",
            },
        },
        "streaming": {
            "title": "Register for local streaming",
            "description": "Press the round link button on the Hue bridge, then submit this form. Hue Plus asks the bridge for its own key, which streaming needs; it shows up in the bridge's list of authorized apps.",
        },
        "modules": {
            "title": "Modules",
            "description": "Switch on what you want. The Spotify sync needs a token from your Hue account, which is asked for next.",
            "data": {"modules": "Modules"},
        },
        "credentials": {
            "title": "Hue Spotify sync credentials",
            "description": "Enter the token and UUID of the Hue app's Spotify sync, or put a file named hue_plus_spotify_token.json with auth and uuid in the Home Assistant configuration folder and submit this form. The file is deleted once the credentials are stored.",
            "data": {"auth": "Token", "uuid": "UUID"},
        },
    },
    "error": {
        **SYNC_ERRORS,
        "link_button_not_pressed": "The bridge did not register Hue Plus. Press its link button, then submit again.",
    },
    "abort": {"no_options": "A sync box has no options."},
}

SELECTOR_TEXTS = {
    "takeover": {
        "options": {
            "alongside": "Leave them alone: nothing is hidden or renamed, so existing dashboards and automations keep working. Hue Plus's entities get the same names ending in _plus.",
            "replace": "Hide and rename them: the Hue integration's entities are hidden and renamed (ending in _hue), and Hue Plus's entities take their names, so existing dashboards and automations use Hue Plus.",
        }
    },
    "modules": {
        "options": {
            "bridge": "Bridge: firmware, apps, automations, scenes, rooms, entertainment areas, Matter, settings",
            "lights": "Lights: Hue Plus's own light entities, next to or in place of the Hue integration's",
            "devices": "Devices: the Hue integration's sensors, buttons, scenes, switches and selects, taken over",
            "zones": "Zones: per-zone control of gradient lights",
            "streaming": "Streaming: send colours straight to an entertainment area (experimental; needs a registration with the bridge)",
            "scenes": "Scenes: live scenes across the lights of an area",
            "sync": "Spotify sync: start, stop and tune Hue's cloud sync",
        }
    },
}


def yaml_services() -> tuple[str, dict]:
    lines: list[str] = []
    strings: dict = {}
    for name in spec.SPEC:
        fields = spec.fields_of(name)
        lines.append(f"{name}:")
        if fields:
            lines.append("  fields:")
        strings[name] = {"name": name.replace("_", " ").capitalize(), "description": spec.SPEC[name]["description"], "fields": {}}
        for field, d in fields.items():
            # Field names are quoted: YAML reads a bare `on` as true, which Home Assistant rejects.
            lines.append(f'    "{field}":')
            if d["required"]:
                lines.append("      required: true")
            if "default" in d:
                lines.append(f"      default: {json.dumps(d['default'])}")
            if "example" in d:
                lines.append(f"      example: {json.dumps(d['example'])}")
            lines.append("      selector:")
            for kind, options in SELECTORS[d["type"]](d).items():
                if options is None:
                    lines.append(f"        {kind}: {{}}")
                else:
                    lines.append(f"        {kind}:")
                    for key, value in options.items():
                        lines.append(f"          {key}: {json.dumps(value)}")
            strings[name]["fields"][field] = {"name": field.replace("_", " ").capitalize(), "description": d["description"]}
        lines.append("")
    return "\n".join(lines), strings


def render() -> dict[str, str]:
    yaml_text, services = yaml_services()
    base = {"config": CONFIG, "options": OPTIONS, "selector": SELECTOR_TEXTS, "entity": ENTITIES, "services": services}
    text = json.dumps(base, indent=2, ensure_ascii=False) + "\n"
    return {"services.yaml": yaml_text, "strings.json": text, "translations/en.json": text}


if __name__ == "__main__":
    for target, content in render().items():
        (FOLDER / target).parent.mkdir(exist_ok=True)
        (FOLDER / target).write_text(content, encoding="utf-8")
    print("services:", len(spec.SPEC))
