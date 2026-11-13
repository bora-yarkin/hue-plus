# SPDX-License-Identifier: GPL-3.0-or-later
"""What one read of the bridge contains, and plain functions that reduce it to what the entities and services show.

No Home Assistant imports, so everything here is tested on its own against data shaped like the bridge's answers.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .api import app_id

# The v2 resources one read lists. Each becomes an attribute of Snapshot of the same name.
RESOURCES = (
    "device",
    "device_software_update",
    "behavior_instance",
    "behavior_script",
    "zigbee_device_discovery",
    "zigbee_connectivity",
    "light",
    "entertainment",
    "entertainment_configuration",
    "room",
    "zone",
    "scene",
    "smart_scene",
    "matter",
    "matter_fabric",
    "bridge",
    "grouped_light",
    "button",
    "relative_rotary",
    "motion",
    "geofence_client",
    "geolocation",
)

# Matter vendor ids the bridge reports for the ecosystems it is shared with.
MATTER_VENDORS = {4937: "Apple", 24582: "Google", 4631: "Amazon", 4362: "Samsung SmartThings"}

POWERUP_PRESETS = ("safety", "powerfail", "last_on_state", "custom")


@dataclass
class Snapshot:
    """Every list one read of the bridge returned, and its v1 configuration."""

    config: dict[str, Any] = field(default_factory=dict)
    device: list[dict[str, Any]] = field(default_factory=list)
    device_software_update: list[dict[str, Any]] = field(default_factory=list)
    behavior_instance: list[dict[str, Any]] = field(default_factory=list)
    behavior_script: list[dict[str, Any]] = field(default_factory=list)
    zigbee_device_discovery: list[dict[str, Any]] = field(default_factory=list)
    zigbee_connectivity: list[dict[str, Any]] = field(default_factory=list)
    light: list[dict[str, Any]] = field(default_factory=list)
    entertainment: list[dict[str, Any]] = field(default_factory=list)
    entertainment_configuration: list[dict[str, Any]] = field(default_factory=list)
    room: list[dict[str, Any]] = field(default_factory=list)
    zone: list[dict[str, Any]] = field(default_factory=list)
    scene: list[dict[str, Any]] = field(default_factory=list)
    smart_scene: list[dict[str, Any]] = field(default_factory=list)
    matter: list[dict[str, Any]] = field(default_factory=list)
    matter_fabric: list[dict[str, Any]] = field(default_factory=list)
    bridge: list[dict[str, Any]] = field(default_factory=list)
    grouped_light: list[dict[str, Any]] = field(default_factory=list)
    button: list[dict[str, Any]] = field(default_factory=list)
    relative_rotary: list[dict[str, Any]] = field(default_factory=list)
    motion: list[dict[str, Any]] = field(default_factory=list)
    geofence_client: list[dict[str, Any]] = field(default_factory=list)
    geolocation: list[dict[str, Any]] = field(default_factory=list)


def _name(resource: dict[str, Any]) -> str:
    return (resource.get("metadata") or {}).get("name") or resource.get("name") or resource.get("id", "")


def device_names(snap: Snapshot) -> dict[str, str]:
    return {d["id"]: _name(d) for d in snap.device}


def bridge_device(snap: Snapshot) -> dict[str, Any] | None:
    """The device of the bridge itself: the one that has a ``bridge`` service."""
    return next((d for d in snap.device if any(s.get("rtype") == "bridge" for s in d.get("services") or [])), None)


def bridge_id(snap: Snapshot) -> str | None:
    """The 16-character id the Hue integration names the bridge device by (lower case)."""
    value = snap.config.get("bridgeid")
    return value.lower() if isinstance(value, str) else None


def bridge_zigbee_channel(snap: Snapshot) -> int | None:
    bridge = bridge_device(snap)
    for item in snap.zigbee_connectivity:
        value = ((item.get("channel") or {}).get("value")) if bridge and (item.get("owner") or {}).get("rid") == bridge["id"] else None
        if isinstance(value, str) and value.startswith("channel_") and value[8:].isdigit():
            return int(value[8:])
    return None


def firmware_items(snap: Snapshot) -> list[dict[str, Any]]:
    """One entry for each device that reports its firmware: the update resource, the device and its installed version."""
    devices = {d["id"]: d for d in snap.device}
    out = []
    for update in snap.device_software_update:
        owner = devices.get((update.get("owner") or {}).get("rid"))
        if owner is None:
            continue
        product = owner.get("product_data") or {}
        out.append(
            {
                "id": update["id"],
                "device_id": owner["id"],
                "name": _name(owner),
                "model": product.get("product_name") or product.get("model_id"),
                "installed": product.get("software_version"),
                "state": update.get("state"),
                "problems": update.get("problems") or [],
            }
        )
    return out


def bridge_update(snap: Snapshot) -> dict[str, Any]:
    update = snap.config.get("swupdate2") or {}
    auto = update.get("autoinstall") or {}
    device = bridge_device(snap) or {}
    return {
        "installed": (device.get("product_data") or {}).get("software_version"),
        "state": (update.get("bridge") or {}).get("state"),
        "overall_state": update.get("state"),
        "auto_install": auto.get("on"),
        "auto_install_time": auto.get("updatetime"),
    }


def authorized_apps(config: dict[str, Any]) -> list[dict[str, Any]]:
    """The apps that have a key on the bridge, most recently used first. The keys themselves are not in the result."""
    whitelist = config.get("whitelist") or {}
    apps = [
        {
            "id": app_id(key),
            "name": entry.get("name"),
            "created": entry.get("create date"),
            "last_used": entry.get("last use date"),
        }
        for key, entry in whitelist.items()
        if isinstance(entry, dict)
    ]
    return sorted(apps, key=lambda a: a["last_used"] or "", reverse=True)


def app_key_for(config: dict[str, Any], wanted: str) -> str | None:
    """The key of the app with that public id, or None."""
    return next((key for key in (config.get("whitelist") or {}) if app_id(key) == wanted), None)


def matter_info(snap: Snapshot) -> dict[str, Any]:
    """The bridge's Matter service: how many ecosystems may be connected, whether it has a pairing QR code, its software version."""
    matter = (snap.matter or [{}])[0]
    info = {
        "max_fabrics": matter.get("max_fabrics"),
        "has_qr_code": matter.get("has_qr_code"),
        "software_version": matter.get("software_version_string"),
    }
    return {key: value for key, value in info.items() if value is not None}


def zigbee_network(snap: Snapshot) -> dict[str, Any]:
    """The Zigbee network's extended PAN id (shared by every device) and how many devices are connected or not."""
    states: dict[str, int] = {}
    pan_id = None
    for item in snap.zigbee_connectivity:
        status = item.get("status")
        if status:
            states[status] = states.get(status, 0) + 1
        pan_id = pan_id or item.get("extended_pan_id")
    return {"extended_pan_id": pan_id, "devices": states} if pan_id or states else {}


def matter_fabrics(snap: Snapshot) -> list[dict[str, Any]]:
    out = []
    for fabric in snap.matter_fabric:
        data = fabric.get("fabric_data") or {}
        vendor = data.get("vendor_id")
        out.append(
            {
                "id": fabric["id"],
                "label": data.get("label"),
                "vendor_id": vendor,
                "vendor": MATTER_VENDORS.get(vendor),
                "status": fabric.get("status"),
                "created": fabric.get("creation_time"),
            }
        )
    return out


def automations(snap: Snapshot) -> list[dict[str, Any]]:
    scripts = {s["id"]: s for s in snap.behavior_script}
    return [
        {
            "id": a["id"],
            "name": _name(a),
            "enabled": bool(a.get("enabled")),
            "status": a.get("status"),
            "script_id": a.get("script_id"),
            "script": _name(scripts.get(a.get("script_id"), {})) if a.get("script_id") in scripts else None,
            "last_error": a.get("last_error") or None,
            "state": a.get("state"),
            "configuration": a.get("configuration"),
        }
        for a in snap.behavior_instance
    ]


def light_powerup(light: dict[str, Any]) -> str | None:
    preset = (light.get("powerup") or {}).get("preset")
    return preset if preset in POWERUP_PRESETS else None


def light_setup(light: dict[str, Any]) -> dict[str, Any]:
    """How the light is set up on the bridge, without the empty entries: its function, lowest brightness, colour gamut and, for
    a gradient light, the orientation and order of its segments (``*_configurable`` says whether they can be changed)."""
    content = light.get("content_configuration") or {}
    orientation, order = content.get("orientation") or {}, content.get("order") or {}
    gradient = light.get("gradient") or {}
    setup = {
        "function": (light.get("metadata") or {}).get("function"),
        "min_brightness": (light.get("dimming") or {}).get("min_dim_level"),
        "gamut": (light.get("color") or {}).get("gamut_type"),
        "gradient_pixel_count": gradient.get("pixel_count"),
        "gradient_orientation": orientation.get("orientation"),
        "gradient_orientation_configurable": orientation.get("configurable"),
        "gradient_order": order.get("order"),
        "gradient_order_configurable": order.get("configurable"),
    }
    return {key: value for key, value in setup.items() if value is not None}


def light_features(light: dict[str, Any]) -> dict[str, Any]:
    """What one light can do, as the bridge reports it, in a form a screen can use without knowing the bridge's API."""
    gradient = light.get("gradient")
    return {
        "hue_id": light["id"],
        "setup": light_setup(light),
        "name": (light.get("metadata") or {}).get("name", ""),
        "colour": "color" in light,
        "white": "color_temperature" in light,
        "effects": [e for e in ((light.get("effects_v2") or {}).get("action") or {}).get("effect_values") or [] if e != "no_effect"],
        "timed_effects": [e for e in (light.get("timed_effects") or {}).get("effect_values") or [] if e != "no_effect"],
        "signals": [x for x in (light.get("signaling") or {}).get("signal_values") or [] if x != "no_signal"],
        "gradient": {
            "points_capable": gradient.get("points_capable", 0),
            "modes": list(gradient.get("mode_values") or []),
            "mode": gradient.get("mode"),
        }
        if isinstance(gradient, dict)
        else None,
        "power_on": light_powerup(light),
    }


STREAMING_END_SCRIPT = "Light state after streaming"


def streaming_end_instance(snap: Snapshot, area_id: str) -> dict[str, Any] | None:
    """The bridge automation that says what the lights of an entertainment area do when a sync ends, if the area has one."""
    scripts = {s["id"] for s in snap.behavior_script if _name(s) == STREAMING_END_SCRIPT}
    for instance in snap.behavior_instance:
        if instance.get("script_id") not in scripts:
            continue
        for place in (instance.get("configuration") or {}).get("where") or []:
            if (place.get("group") or {}).get("rid") == area_id:
                return instance
    return None


def _streaming_light(area: dict[str, Any], services: dict[str, dict[str, Any]], lights_by_owner: dict[Any, dict[str, Any]]) -> str | None:
    """The light that streams for a manual area (the one whose entertainment service is the area's stream proxy node)."""
    node = (area.get("stream_proxy") or {}).get("node") or {}
    owner = (services.get(node.get("rid")) or {}).get("owner", {}).get("rid")
    return (lights_by_owner.get(owner) or {}).get("id")


def entertainment_areas(snap: Snapshot) -> list[dict[str, Any]]:
    """Each entertainment area with the lights in it and where they stand (x, y, z from -1 to 1)."""
    lights_by_owner = {item.get("owner", {}).get("rid"): item for item in snap.light}
    services = {e["id"]: e for e in snap.entertainment}
    names = device_names(snap)
    out = []
    for area in snap.entertainment_configuration:
        lights = []
        for loc in (area.get("locations") or {}).get("service_locations") or []:
            service = services.get((loc.get("service") or {}).get("rid"))
            owner = (service or {}).get("owner", {}).get("rid")
            light = lights_by_owner.get(owner)
            position = (loc.get("positions") or [{}])[0]
            segments = (service or {}).get("segments") or {}
            lights.append(
                {
                    "segments_configurable": segments.get("configurable"),
                    "max_segments": segments.get("max_segments"),
                    "light_id": (light or {}).get("id"),
                    "name": names.get(owner),
                    "balance": loc.get("equalization_factor"),
                    "x": position.get("x"),
                    "y": position.get("y"),
                    "z": position.get("z"),
                    # Every position the bridge holds for the light: one for a lamp, the ends (or more) of a strip or tube.
                    "positions": [{axis: p.get(axis) for axis in "xyz"} for p in loc.get("positions") or []],
                }
            )
        streamer = area.get("active_streamer")
        streams = [
            services[(loc.get("service") or {}).get("rid")].get("max_streams")
            for loc in (area.get("locations") or {}).get("service_locations") or []
            if (loc.get("service") or {}).get("rid") in services
        ]
        ending = streaming_end_instance(snap, area["id"])
        out.append(
            {
                "id": area["id"],
                "end_state": ((ending or {}).get("configuration") or {}).get("end_state"),
                "channels": len(area.get("channels") or []),
                "performance": (area.get("stream_proxy") or {}).get("mode"),
                "performance_light": _streaming_light(area, services, lights_by_owner),
                "max_streams": min((n for n in streams if isinstance(n, int)), default=None),
                "name": _name(area),
                "type": area.get("configuration_type"),
                "status": area.get("status"),
                "active_streamer": (streamer or {}).get("rid") if isinstance(streamer, dict) else None,
                "lights": lights,
            }
        )
    return out


def groups(snap: Snapshot, kind: str) -> list[dict[str, Any]]:
    """Rooms (their children are devices) or zones (their children are lights)."""
    names = device_names(snap)
    light_names = {item["id"]: names.get((item.get("owner") or {}).get("rid"), item["id"]) for item in snap.light}
    out = []
    for group in getattr(snap, kind):
        children = [c.get("rid") for c in group.get("children") or []]
        # The lights of the group: a zone's children are lights, a room's are devices, and a device's light is the one it owns.
        lights = children if kind == "zone" else [item["id"] for item in snap.light if (item.get("owner") or {}).get("rid") in children]
        out.append(
            {
                "id": group["id"],
                "name": _name(group),
                "archetype": (group.get("metadata") or {}).get("archetype"),
                "children": [{"id": c, "name": (light_names if kind == "zone" else names).get(c, c)} for c in children],
                "lights": lights,
            }
        )
    return out


def _scene_colours(scene: dict[str, Any]) -> list[dict[str, Any]]:
    """The colours the app draws a scene with: a moving scene's palette, else what its lights are set to (at most six, each once)."""
    out: list[dict[str, Any]] = []

    def add(colour: dict[str, Any] | None) -> None:
        if colour and colour not in out and len(out) < 6:
            out.append(colour)

    def of(body: dict[str, Any]) -> dict[str, Any] | None:
        xy = (body.get("color") or {}).get("xy") or {}
        if "x" in xy and "y" in xy:
            return {"xy": [round(xy["x"], 4), round(xy["y"], 4)]}
        mirek = (body.get("color_temperature") or {}).get("mirek")
        return {"mirek": mirek} if mirek else None

    palette = scene.get("palette") or {}
    for entry in palette.get("color") or []:
        add(of(entry))
    for entry in palette.get("color_temperature") or []:
        add(of({"color_temperature": entry.get("color_temperature")}))
    if not out:
        for action in scene.get("actions") or []:
            add(of(action.get("action") or {}))
    return out


def scenes(snap: Snapshot) -> list[dict[str, Any]]:
    return [
        {
            "id": s["id"],
            "name": _name(s),
            "group_id": (s.get("group") or {}).get("rid"),
            "group_type": (s.get("group") or {}).get("rtype"),
            "lights": [
                (a.get("target") or {}).get("rid") for a in s.get("actions") or [] if (a.get("target") or {}).get("rtype") == "light"
            ],
            "speed": s.get("speed"),
            "auto_dynamic": s.get("auto_dynamic"),
            "active": ((s.get("status") or {}).get("active")),
            "last_recall": ((s.get("status") or {}).get("last_recall")),
            "colours": _scene_colours(s),
        }
        for s in snap.scene
    ]


def light_states(snap: Snapshot) -> list[dict[str, Any]]:
    """What every light was last set to, which the bridge keeps while it is off: the app shows an off light at those settings."""
    out = []
    for light in snap.light:
        xy = (light.get("color") or {}).get("xy") or {}
        temperature = light.get("color_temperature") or {}
        out.append(
            {
                "id": light["id"],
                "on": bool((light.get("on") or {}).get("on")),
                "brightness": (light.get("dimming") or {}).get("brightness"),
                "xy": [round(xy["x"], 4), round(xy["y"], 4)] if "x" in xy and "y" in xy else None,
                "mirek": temperature.get("mirek") if temperature.get("mirek_valid") else None,
                # The light's icon type, which the app draws the light with and lets the person change.
                "archetype": (light.get("metadata") or {}).get("archetype"),
            }
        )
    return out


def search_status(snap: Snapshot) -> str | None:
    return next((d.get("status") for d in snap.zigbee_device_discovery), None)


def accessories(snap: Snapshot) -> list[dict[str, Any]]:
    """Every device with buttons or a dial: its buttons (in the order of their numbers) and the bridge automation that says what they do."""
    names = device_names(snap)
    out = []
    for device_id in sorted({(b.get("owner") or {}).get("rid") for b in (*snap.button, *snap.relative_rotary)} - {None}):
        buttons = sorted(
            (b for b in snap.button if (b.get("owner") or {}).get("rid") == device_id),
            key=lambda b: (b.get("metadata") or {}).get("control_id", 0),
        )
        rotary = [r for r in snap.relative_rotary if (r.get("owner") or {}).get("rid") == device_id]
        automation = next(
            (
                a
                for a in snap.behavior_instance
                if {button["id"] for button in buttons} & set((a.get("configuration") or {}).get("buttons") or {})
            ),
            None,
        )
        out.append(
            {
                "id": device_id,
                "name": names.get(device_id, device_id),
                "buttons": [
                    {
                        "id": b["id"],
                        "number": (b.get("metadata") or {}).get("control_id"),
                        "last_event": (b.get("button") or {}).get("last_event"),
                    }
                    for b in buttons
                ],
                "dials": len(rotary),
                "automation_id": automation["id"] if automation else None,
                "actions": {
                    bid: {press: spec for press, spec in config.items() if press.startswith("on_")}
                    for bid, config in ((automation or {}).get("configuration") or {}).get("buttons", {}).items()
                },
                # The room, zone or home each button acts on (what the Hue app calls its selected lights).
                "targets": {
                    bid: [(w.get("group") or {}).get("rid") for w in config.get("where") or [] if (w.get("group") or {}).get("rid")]
                    for bid, config in ((automation or {}).get("configuration") or {}).get("buttons", {}).items()
                },
            }
        )
    return out


def home_and_away(snap: Snapshot) -> dict[str, Any]:
    """Whether the bridge's Home and Away is set up, and the phones (Hue app installations) it tracks."""
    return {"configured": any(g.get("is_configured") for g in snap.geolocation), "clients": [_name(c) for c in snap.geofence_client]}


def motion_sensors(snap: Snapshot) -> list[dict[str, Any]]:
    """Motion sensors with their on/off and sensitivity (where the sensor has a sensitivity)."""
    names = device_names(snap)
    return [
        {
            "id": m["id"],
            "name": names.get((m.get("owner") or {}).get("rid"), m["id"]),
            "enabled": m.get("enabled"),
            "sensitivity": (m.get("sensitivity") or {}).get("sensitivity"),
            "sensitivity_max": (m.get("sensitivity") or {}).get("sensitivity_max"),
        }
        for m in snap.motion
    ]
