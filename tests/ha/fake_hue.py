# SPDX-License-Identifier: GPL-3.0-or-later
"""A stand-in for the Hue integration's bridge connection, holding a small home: a bridge, three lights (one of them a
gradient light), a room, a scene, a music entertainment area and one automation. It answers like the real bridge: lists,
single items, writes that change what it holds, and the v1 configuration."""

from __future__ import annotations

import copy
import json
from typing import Any

APP_KEY = "test-application-key"
BRIDGE_ID = "c42996c4a182"

BRIDGE_DEVICE = "d0000000-0000-4000-8000-000000000001"
LAMP_DEVICE = "d0000000-0000-4000-8000-000000000002"
TUBE_DEVICE = "d0000000-0000-4000-8000-000000000003"
LAMP = "a0000000-0000-4000-8000-000000000002"
TUBE = "a0000000-0000-4000-8000-000000000003"
ROOM = "b0000000-0000-4000-8000-000000000001"
SCENE = "c0000000-0000-4000-8000-000000000001"
AREA = "e0000000-0000-4000-8000-000000000001"
AUTOMATION = "f0000000-0000-4000-8000-000000000001"
DIMMER_DEVICE = "d0000000-0000-4000-8000-000000000004"
DIMMER_AUTOMATION = "f0000000-0000-4000-8000-000000000002"
BUTTON_ON = "bb000000-0000-4000-8000-000000000001"
BUTTON_UP = "bb000000-0000-4000-8000-000000000002"
MOTION = "ab000000-0000-4000-8000-000000000001"
MOTION_DEVICE = "d0000000-0000-4000-8000-000000000005"

GAMUT = {"red": {"x": 0.6915, "y": 0.3083}, "green": {"x": 0.17, "y": 0.7}, "blue": {"x": 0.1532, "y": 0.0475}}


def home() -> dict[str, list[dict[str, Any]]]:
    light = lambda rid, owner, name: {  # noqa: E731
        "id": rid,
        "owner": {"rid": owner, "rtype": "device"},
        "metadata": {"name": name, "archetype": "sultan_bulb"},
        "on": {"on": True},
        "dimming": {"brightness": 60.0},
        "color": {"xy": {"x": 0.4, "y": 0.4}, "gamut": GAMUT},
        "color_temperature": {"mirek": 300, "mirek_schema": {"mirek_minimum": 153, "mirek_maximum": 500}},
        "powerup": {"preset": "powerfail", "configured": True},
        "effects_v2": {"action": {"effect_values": ["no_effect", "candle", "prism"]}},
    }
    tube = light(TUBE, TUBE_DEVICE, "Bed Light")
    tube["gradient"] = {
        "points": [{"color": {"xy": {"x": 0.2, "y": 0.3}}}, {"color": {"xy": {"x": 0.5, "y": 0.4}}}],
        "points_capable": 5,
        "mode": "interpolated_palette",
        "mode_values": ["interpolated_palette", "interpolated_palette_mirrored", "random_pixelated", "segmented_palette"],
    }
    return {
        "device": [
            {
                "id": BRIDGE_DEVICE,
                "metadata": {"name": "Hue Bridge Pro"},
                "product_data": {"product_name": "Hue Bridge Pro", "software_version": "1976154040"},
                "services": [{"rid": "b1", "rtype": "bridge"}, {"rid": "z1", "rtype": "zigbee_connectivity"}],
            },
            {
                "id": LAMP_DEVICE,
                "metadata": {"name": "Floor Light"},
                "product_data": {"product_name": "Hue color lamp", "software_version": "1.163.1"},
                "services": [{"rid": LAMP, "rtype": "light"}, {"rid": "u1", "rtype": "device_software_update"}],
            },
            {
                "id": DIMMER_DEVICE,
                "metadata": {"name": "Hue dimmer switch 1"},
                "product_data": {"product_name": "Hue dimmer switch", "software_version": "2.1"},
                "services": [],
            },
            {
                "id": MOTION_DEVICE,
                "metadata": {"name": "Hallway sensor"},
                "product_data": {"product_name": "Hue motion sensor", "software_version": "2.1"},
                "services": [],
            },
            {
                "id": TUBE_DEVICE,
                "metadata": {"name": "Bed Light"},
                "product_data": {"product_name": "Play gradient tube", "software_version": "1.2.3"},
                "services": [{"rid": TUBE, "rtype": "light"}],
            },
        ],
        "device_software_update": [{"id": "u1", "owner": {"rid": LAMP_DEVICE, "rtype": "device"}, "state": "no_update", "problems": []}],
        "behavior_instance": [
            {
                "id": AUTOMATION,
                "metadata": {"name": "Wake up"},
                "enabled": True,
                "status": "running",
                "script_id": "s1",
                "last_error": None,
                "configuration": {},
            }
        ],
        "behavior_script": [
            {"id": "s1", "metadata": {"name": "Basic wake up routine", "category": "automation"}, "description": "Wake up"},
            {"id": "s3", "metadata": {"name": "Native Go To Sleep", "category": "automation"}, "description": "Sleep"},
            {"id": "s4", "metadata": {"name": "Timers", "category": "automation"}, "description": "Timer"},
            {"id": "s2", "metadata": {"name": "Hue Accessories", "category": "accessory"}, "description": "Buttons"},
        ],
        "zigbee_device_discovery": [{"id": "zd1", "status": "ready"}],
        "zigbee_connectivity": [
            {
                "id": "z1",
                "owner": {"rid": BRIDGE_DEVICE, "rtype": "device"},
                "status": "connected",
                "channel": {"status": "set", "value": "channel_11"},
            }
        ],
        "light": [light(LAMP, LAMP_DEVICE, "Floor Light"), tube],
        "entertainment": [
            {
                "id": "en1",
                "owner": {"rid": LAMP_DEVICE, "rtype": "device"},
                "segments": {"configurable": False, "max_segments": 1, "segments": []},
            }
        ],
        "entertainment_configuration": [
            {
                "id": AREA,
                "metadata": {"name": "Bedroom"},
                "configuration_type": "music",
                "status": "inactive",
                "active_streamer": None,
                "locations": {"service_locations": []},
                "light_services": [{"rid": LAMP, "rtype": "light"}, {"rid": TUBE, "rtype": "light"}],
            }
        ],
        "room": [
            {
                "id": ROOM,
                "metadata": {"name": "Bedroom", "archetype": "bedroom"},
                "children": [{"rid": LAMP_DEVICE, "rtype": "device"}, {"rid": TUBE_DEVICE, "rtype": "device"}],
                "services": [],
            }
        ],
        "zone": [],
        "scene": [
            {
                "id": SCENE,
                "metadata": {"name": "Relax"},
                "group": {"rid": ROOM, "rtype": "room"},
                "actions": [],
                "status": {"active": "inactive"},
                "speed": 0.5,
                "auto_dynamic": False,
            }
        ],
        "smart_scene": [],
        "matter": [],
        "matter_fabric": [],
        "bridge": [
            {"id": "b1", "owner": {"rid": BRIDGE_DEVICE, "rtype": "device"}, "bridge_id": BRIDGE_ID, "time_zone": {"time_zone": "UTC"}}
        ],
        "grouped_light": [],
        "button": [
            {
                "id": BUTTON_ON,
                "owner": {"rid": DIMMER_DEVICE, "rtype": "device"},
                "metadata": {"control_id": 1},
                "button": {"last_event": "short_release"},
            },
            {
                "id": BUTTON_UP,
                "owner": {"rid": DIMMER_DEVICE, "rtype": "device"},
                "metadata": {"control_id": 2},
                "button": {"last_event": "short_release"},
            },
        ],
        "relative_rotary": [],
        "motion": [
            {
                "id": MOTION,
                "owner": {"rid": MOTION_DEVICE, "rtype": "device"},
                "enabled": True,
                "sensitivity": {"sensitivity": 2, "sensitivity_max": 4},
            }
        ],
        "geofence_client": [{"id": "g1", "name": "phone"}],
        "geolocation": [{"id": "g2", "is_configured": False}],
        "clip": [{"id": "clip1", "resources": ["light", "scene", "motion"]}],
        "motion_area_candidate": [{"id": "ma1", "capabilities": ["sensor"]}],
        "motion_area_configuration": [],
    }


V1_CONFIG = {
    "name": "Hue Bridge Pro",
    "bridgeid": "C42996FFFEC4A182",
    "timezone": "UTC",
    "whitelist": {APP_KEY: {"name": "home-assistant#home", "create date": "2026-01-01T00:00:00", "last use date": "2026-10-28T00:00:00"}},
    "internetservices": {"internet": "connected", "remoteaccess": "connected", "time": "connected", "swupdate": "connected"},
    "swupdate2": {"state": "noupdates", "autoinstall": {"on": True, "updatetime": "T16:00:00"}, "bridge": {"state": "noupdates"}},
    "backup": {"status": "idle"},
}


class _Response:
    def __init__(self, status: int, payload: Any) -> None:
        self.status = status
        self._text = json.dumps(payload)

    async def text(self) -> str:
        return self._text

    async def __aenter__(self) -> _Response:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        return None


class _Lights:
    def __init__(self) -> None:
        self.set_state_calls: list[dict[str, Any]] = []

    def subscribe(self, *_args: Any, **_kwargs: Any):
        return lambda: None

    async def set_state(self, id: str, **kwargs: Any) -> None:
        self.set_state_calls.append({"id": id, **kwargs})


class FakeHueApi:
    """What the Hue integration keeps as ``runtime_data.api``: ``create_request`` (raw) and ``request`` (parsed)."""

    def __init__(self) -> None:
        self.resources = home()
        self.config = copy.deepcopy(V1_CONFIG)
        self.writes: list[tuple[str, str, Any]] = []
        self.lights = _Lights()
        self.devices: list = []  # the device list of a bridge whose data has not loaded; the bridge module does not use it

    def _find(self, resource: str, rid: str) -> dict[str, Any] | None:
        return next((i for i in self.resources.get(resource, []) if i["id"] == rid), None)

    def _answer(self, method: str, path: str, body: Any) -> tuple[int, Any]:
        method = method.upper()
        if path.startswith(f"api/{APP_KEY}/"):
            if method == "PUT":
                self.writes.append((method, path, body))
                return 200, [{"success": {}}]
            return 200, self.config
        assert path.startswith("clip/v2/resource/"), path
        parts = path.removeprefix("clip/v2/resource/").split("/")
        resource, rid = parts[0], (parts[1] if len(parts) > 1 else None)
        if method == "GET":
            if rid is None:
                return 200, {"data": self.resources[resource], "errors": []}
            item = self._find(resource, rid)
            return (200, {"data": [item], "errors": []}) if item else (404, {"data": [], "errors": [{"description": "not found"}]})
        self.writes.append((method, path, body))
        if method == "PUT":
            item = self._find(resource, rid)
            if item is None:
                return 404, {"data": [], "errors": [{"description": "not found"}]}
            for key, value in (body or {}).items():
                item[key] = value
            return 200, {"data": [{"rid": rid, "rtype": resource}], "errors": []}
        if method == "POST":
            return 200, {"data": [{"rid": "new-" + resource, "rtype": resource}], "errors": []}
        if method == "DELETE":
            self.resources[resource] = [i for i in self.resources[resource] if i["id"] != rid]
            return 200, {"data": [{"rid": rid, "rtype": resource}], "errors": []}
        return 400, {"errors": [{"description": "bad request"}]}

    def create_request(self, method: str, path: str, json: Any = None, **_kwargs: Any) -> _Response:
        return _Response(*self._answer(method, path, json))

    async def request(self, method: str, path: str, json: Any = None, **_kwargs: Any) -> Any:
        status, payload = self._answer(method, path, json)
        if status >= 400:
            raise RuntimeError(f"{status} {payload}")
        return payload
