# SPDX-License-Identifier: GPL-3.0-or-later
"""Everything the services do, as plain async functions over the bridge API and the last read of the bridge.

Home Assistant only checks who may call (administrators), turns Home Assistant entity ids into bridge ids, and calls ``run``.
Destructive actions refuse to run unless ``confirm`` is true. No Home Assistant imports.
"""

from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import time
from typing import Any

from . import models, payloads
from .api import BridgeApi

Handler = Callable[[BridgeApi, models.Snapshot, dict[str, Any]], Awaitable[dict[str, Any] | None]]


@dataclass(frozen=True)
class Action:
    handler: Handler
    destructive: bool = False  # needs confirm: true
    response: bool = False  # returns data to the caller


ACTIONS: dict[str, Action] = {}


def action(name: str, *, destructive: bool = False, response: bool = False) -> Callable[[Handler], Handler]:
    def register(handler: Handler) -> Handler:
        ACTIONS[name] = Action(handler, destructive, response)
        return handler

    return register


async def run(name: str, api: BridgeApi, snap: models.Snapshot, data: dict[str, Any]) -> dict[str, Any] | None:
    """Runs one action. Raises ValueError for a request that cannot be right, BridgeError when the bridge refuses."""
    spec = ACTIONS[name]
    if spec.destructive and data.get("confirm") is not True:
        raise ValueError("This cannot be undone: call it again with confirm set to true")
    return await spec.handler(api, snap, data)


# ---- finding things by id or by name ----


def resolve(items: list[dict[str, Any]], ref: str, what: str, name_of: Callable[[dict[str, Any]], str] = models._name) -> dict[str, Any]:
    """The item whose id is ``ref``, or the only one whose name is (ignoring case)."""
    for item in items:
        if item["id"] == ref:
            return item
    named = [i for i in items if name_of(i).casefold() == str(ref).casefold()]
    if len(named) == 1:
        return named[0]
    if not named:
        raise ValueError(f"No {what} called {ref!r}")
    raise ValueError(f"More than one {what} is called {ref!r}: use its id ({', '.join(i['id'] for i in named)})")


def _light(snap: models.Snapshot, ref: str) -> dict[str, Any]:
    """A light by its id, or by the name of its device."""
    names = models.device_names(snap)
    return resolve(snap.light, ref, "light", lambda item: names.get((item.get("owner") or {}).get("rid"), ""))


def _device(snap: models.Snapshot, ref: str) -> dict[str, Any]:
    return resolve(snap.device, ref, "device")


def _group(snap: models.Snapshot, kind: str, ref: str) -> dict[str, Any]:
    return resolve(getattr(snap, kind), ref, kind)


def _entertainment_service(snap: models.Snapshot, light: dict[str, Any]) -> str:
    owner = (light.get("owner") or {}).get("rid")
    service = next((e for e in snap.entertainment if (e.get("owner") or {}).get("rid") == owner), None)
    if service is None:
        raise ValueError(f"{models.device_names(snap).get(owner, owner)} cannot be part of an entertainment area")
    return service["id"]


def _placements(snap: models.Snapshot, lights: list[dict[str, Any]]) -> list[payloads.Placement]:
    out = []
    for entry in lights:
        if not isinstance(entry, dict) or "light" not in entry:
            raise ValueError("Each light needs a light and a position, for example {light: Bed Light, x: 0, y: 1, z: 0}")
        every = entry.get("positions")
        if every is not None and not (isinstance(every, list) and every and all(isinstance(p, dict) for p in every)):
            raise ValueError("positions is a list of {x, y, z}")
        out.append(
            (
                _entertainment_service(snap, _light(snap, str(entry["light"]))),
                float(entry.get("x", 0)),
                float(entry.get("y", 0)),
                float(entry.get("z", 0)),
                float(entry["balance"]) if entry.get("balance") is not None else None,
                [{axis: float(p.get(axis, 0)) for axis in "xyz"} for p in every] if every else None,
            )
        )
    return out


def _json(value: Any, what: str) -> Any:
    """A value that may arrive as a JSON text (from the UI) or already as data."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except ValueError as err:
            raise ValueError(f"{what} is not valid JSON: {err}") from err
    return value


def _kelvin_to_mirek(kelvin: float) -> int:
    return round(1_000_000 / kelvin)


# ---- information ----

KINDS = (
    "apps",
    "automations",
    "automation_templates",
    "rooms",
    "zones",
    "scenes",
    "lights",
    "smart_scenes",
    "entertainment_areas",
    "matter_fabrics",
    "accessories",
    "home_and_away",
    "motion_sensors",
    "motion_areas",
    "supported_resources",
    "devices",
    "firmware",
    "bridge",
)


@action("get_resources", response=True)
async def get_resources(api: BridgeApi, snap: models.Snapshot, data: dict[str, Any]) -> dict[str, Any]:
    kinds = data.get("kinds") or list(KINDS)
    unknown = [k for k in kinds if k not in KINDS]
    if unknown:
        raise ValueError(f"Unknown kinds {unknown}; the kinds are {', '.join(KINDS)}")
    sources: dict[str, Callable[[], Any]] = {
        "apps": lambda: models.authorized_apps(snap.config),
        "automations": lambda: models.automations(snap),
        "automation_templates": lambda: [
            {
                "id": s["id"],
                "name": models._name(s),
                "description": s.get("description"),
                "category": (s.get("metadata") or {}).get("category"),
                "configuration_schema": s.get("configuration_schema"),
            }
            for s in snap.behavior_script
        ],
        "rooms": lambda: models.groups(snap, "room"),
        "zones": lambda: models.groups(snap, "zone"),
        "scenes": lambda: models.scenes(snap),
        "lights": lambda: models.light_states(snap),
        "smart_scenes": lambda: [
            {"id": s["id"], "name": models._name(s), "state": s.get("state"), "group": s.get("group")} for s in snap.smart_scene
        ],
        "entertainment_areas": lambda: models.entertainment_areas(snap),
        "matter_fabrics": lambda: models.matter_fabrics(snap),
        "accessories": lambda: models.accessories(snap),
        "home_and_away": lambda: models.home_and_away(snap),
        "motion_sensors": lambda: models.motion_sensors(snap),
        "devices": lambda: models.device_details(snap),
        "firmware": lambda: models.firmware_items(snap),
        "bridge": lambda: {
            **models.bridge_update(snap),
            "zigbee_channel": models.bridge_zigbee_channel(snap),
            "time_zone": snap.config.get("timezone"),
            "name": snap.config.get("name"),
            "internet": snap.config.get("internetservices"),
            "backup": snap.config.get("backup"),
        },
    }
    result = {kind: sources[kind]() for kind in kinds if kind in sources}
    # These two are not in the periodic read: the bridge is asked now.
    if "motion_areas" in kinds:
        result["motion_areas"] = {
            "candidates": await api.list("motion_area_candidate"),
            "areas": await api.list("motion_area_configuration"),
            "services": await api.list("convenience_area_motion"),
        }
    if "supported_resources" in kinds:
        result["supported_resources"] = ((await api.list("clip")) or [{}])[0].get("resources", [])
    return result


# ---- lights ----


@action("timed_effect")
async def timed_effect(api, snap, data):
    light = _light(snap, data["light"])
    await api.put("light", light["id"], payloads.timed_effect_put(data["effect"], data.get("duration")))


@action("signal")
async def signal(api, snap, data):
    light = _light(snap, data["light"])
    colors = [tuple(c) for c in data.get("colors_xy") or []]
    await api.put("light", light["id"], payloads.signal_put(data["signal"], data.get("duration", 5), colors or None))


@action("set_power_on")
async def set_power_on(api, snap, data):
    light = _light(snap, data["light"])
    kelvin = data.get("color_temperature_kelvin")
    xy = tuple(data["color_xy"]) if data.get("color_xy") else None
    await api.put(
        "light",
        light["id"],
        payloads.powerup_put(data["preset"], data.get("on"), data.get("brightness"), _kelvin_to_mirek(kelvin) if kelvin else None, xy),
    )


@action("configure_light")
async def configure_light(api, snap, data):
    """Experimental: written from the field names the bridge reports, not yet tried on a real bridge."""
    light = _light(snap, data["light"])
    content = light.get("content_configuration") or {}
    for key, name in (("gradient_orientation", "orientation"), ("gradient_order", "order")):
        if data.get(key) is not None and not (content.get(name) or {}).get("configurable"):
            raise ValueError(f"The {name} of this light cannot be changed")
    await api.put(
        "light", light["id"], payloads.light_setup_put(data.get("function"), data.get("gradient_orientation"), data.get("gradient_order"))
    )


def _motion_area(areas: list[dict[str, Any]], ref: str) -> dict[str, Any]:
    return resolve(areas, ref, "motion area")


def _area_service(area: dict[str, Any], rtype: str) -> str | None:
    return next((s["rid"] for s in area.get("services") or [] if s.get("rtype") == rtype), None)


async def _candidates(api: BridgeApi, snap: models.Snapshot, refs: list[str]) -> list[str]:
    """The ``motion_area_candidate`` of each light (given as a light, the name of its device, or its device id)."""
    by_owner = {(c.get("owner") or {}).get("rid"): c["id"] for c in await api.list("motion_area_candidate")}
    candidates = []
    for ref in refs:
        owner = ref if ref in by_owner else _light(snap, ref).get("owner", {}).get("rid")
        if owner not in by_owner:
            raise ValueError(f"{ref!r} cannot take part in a motion area")
        candidates.append(by_owner[owner])
    return candidates


@action("set_motion_area")
async def set_motion_area(api, snap, data):
    """Switches a MotionAware area on or off, renames it, changes its devices, or sets how sensitive it is.

    An area only senses motion while its convenience service is on: switching that on is also what calibrates a new area (the bridge reports the
    area ``healthy`` after about 25 seconds), so ``enabled`` is written to both the area and that service."""
    area = _motion_area(await api.list("motion_area_configuration"), data["area"])
    candidates = await _candidates(api, snap, data["lights"]) if data.get("lights") is not None else None
    service = _area_service(area, "convenience_area_motion")
    if (data.get("sensitivity") is not None or data.get("enabled") is not None) and service is None:
        raise ValueError("This area has no motion service")
    if data.get("name") is not None or data.get("enabled") is not None or candidates is not None:
        await api.put("motion_area_configuration", area["id"], payloads.motion_area_put(data.get("name"), data.get("enabled"), candidates))
    if data.get("enabled") is not None:
        await api.put("convenience_area_motion", service, {"enabled": bool(data["enabled"])})
    if data.get("sensitivity") is not None:
        await api.put("convenience_area_motion", service, payloads.motion_sensitivity_put(int(data["sensitivity"])))


@action("create_motion_area")
async def create_motion_area(api, snap, data):
    """A MotionAware area from three or four lights of a room or zone (each given as a light, the name of its device, or its device id)."""
    group_type = data.get("group_type", "room")
    group = _group(snap, group_type, data["group"])
    candidates = await _candidates(api, snap, data["lights"])
    return {"id": await api.post("motion_area_configuration", payloads.motion_area_post(data["name"], group["id"], group_type, candidates))}


async def _area_automations(api: BridgeApi, area_id: str) -> list[dict[str, Any]]:
    """The automations that use a MotionAware area as their motion source, read from the bridge now (not from the periodic read)."""
    return [a for a in await api.list("behavior_instance") if ((a.get("configuration") or {}).get("source") or {}).get("rid") == area_id]


def _motion_slot(snap: models.Snapshot, slot: dict[str, Any]) -> dict[str, Any]:
    """One time of an area: ``{"time": "07:00"}`` or ``{"sun": "sunset", "offset_minutes": -30}``, a ``scene`` (none leaves the lights alone)."""
    if not isinstance(slot, dict) or ("time" in slot) == ("sun" in slot):
        raise ValueError('Each time is {"time": "07:00"} or {"sun": "sunset"}, with a scene and optionally off_after_minutes')
    return {
        "at": time.fromisoformat(str(slot["time"])) if "time" in slot else None,
        "sun": slot.get("sun"),
        "offset_minutes": slot.get("offset_minutes"),
        "scene": resolve(snap.scene, slot["scene"], "scene")["id"] if slot.get("scene") else None,
        "off_after_minutes": slot.get("off_after_minutes"),
    }


@action("set_motion_area_lights")
async def set_motion_area_lights(api, snap, data):
    """What a MotionAware area does when it senses motion: the scenes by time of day, when the lights go off again, and in which rooms.
    Replaces the area's automation, or makes it."""
    area = _motion_area(await api.list("motion_area_configuration"), data["area"])
    groups = []
    for ref in data["groups"]:
        kind = "zone" if any(z["id"] == ref or models._name(z).casefold() == str(ref).casefold() for z in snap.zone) else "room"
        groups.append((_group(snap, kind, ref)["id"], kind))
    slots = [_motion_slot(snap, slot) for slot in data["slots"]]
    configuration = payloads.motion_area_configuration(area["id"], groups, slots, data.get("dark_threshold"))
    existing = await _area_automations(api, area["id"])
    if existing:
        await api.put("behavior_instance", existing[0]["id"], payloads.automation_put(None, configuration, data.get("enabled")))
        return
    script = next((x for x in snap.behavior_script if models._name(x) == payloads.MOTION_SENSOR_SCRIPT), None)
    if script is None:
        raise ValueError(f"This bridge has no {payloads.MOTION_SENSOR_SCRIPT!r} template")
    await api.post(
        "behavior_instance",
        payloads.automation_post(script["id"], f"{models._name(area)} lights", configuration, data.get("enabled", True)),
    )


@action("delete_motion_area", destructive=True)
async def delete_motion_area(api, snap, data):
    """Deletes the area and the automation that uses it as its motion source (the bridge keeps the automation otherwise)."""
    area = _motion_area(await api.list("motion_area_configuration"), data["area"])
    for automation in await _area_automations(api, area["id"]):
        await api.delete("behavior_instance", automation["id"])
    await api.delete("motion_area_configuration", area["id"])


@action("set_streaming_end_state")
async def set_streaming_end_state(api, snap, data):
    """Experimental: what the lights of an entertainment area do when a sync ends. Changes the area's existing automation, or adds one."""
    area = resolve(snap.entertainment_configuration, data["area"], "entertainment area")
    scene_id = resolve(snap.scene, data["scene"], "scene")["id"] if data.get("scene") else None
    configuration = payloads.streaming_end_configuration(area["id"], data["end_state"], scene_id)
    existing = models.streaming_end_instance(snap, area["id"])
    if existing is not None:
        await api.put("behavior_instance", existing["id"], payloads.automation_put(None, configuration, None))
        return
    script = next((s for s in snap.behavior_script if models._name(s) == models.STREAMING_END_SCRIPT), None)
    if script is None:
        raise ValueError("This bridge has no 'Light state after streaming' script")
    await api.post("behavior_instance", payloads.automation_post(script["id"], "state_after_streaming", configuration, True))


@action("identify")
async def identify(api, snap, data):
    light = _light(snap, data["light"])
    await api.put("light", light["id"], payloads.identify_put())


@action("set_name")
async def set_name(api, snap, data):
    """Renames a light, device, room, zone, scene, entertainment area or automation, and may set the icon type of a light, room or zone."""
    kind = data["resource"]
    ref = data["id"]
    name, archetype = data.get("name"), data.get("archetype")
    if kind == "light":
        await api.put("light", _light(snap, ref)["id"], payloads.metadata_put(name, archetype))
    elif kind == "device":
        await api.put("device", _device(snap, ref)["id"], payloads.metadata_put(name, archetype))
    elif kind in ("room", "zone"):
        await api.put(kind, _group(snap, kind, ref)["id"], payloads.group_put(kind, name, archetype, None))
    elif kind == "scene":
        await api.put("scene", resolve(snap.scene, ref, "scene")["id"], payloads.scene_put(name, None, None, None))
    elif kind == "entertainment_area":
        await api.put(
            "entertainment_configuration",
            resolve(snap.entertainment_configuration, ref, "entertainment area")["id"],
            payloads.entertainment_put(name, None, None),
        )
    elif kind == "automation":
        await api.put(
            "behavior_instance", resolve(snap.behavior_instance, ref, "automation")["id"], payloads.automation_put(name, None, None)
        )
    else:
        raise ValueError("The resource is light, device, room, zone, scene, entertainment_area or automation")


# ---- scenes ----


def _whole_group(group_lights: list[dict[str, Any]], wanted: set[str], kind: str) -> None:
    """The bridge refuses a scene that does not set every light of its room or zone, so say so instead of passing its short answer on."""
    missing = {item["id"] for item in group_lights} - wanted
    if missing or not wanted <= {item["id"] for item in group_lights}:
        raise ValueError(
            f"A scene of a {kind} sets every light of it: the bridge refuses one that leaves lights out. "
            "Set the lights you do not want lit to off in the scene, or make a zone of only the lights you want."
        )


@action("create_scene", response=True)
async def create_scene(api, snap, data):
    """A scene for a room or zone. Without ``lights`` it records the look the group's lights have right now."""
    group_type = data.get("group_type", "room")
    group = _group(snap, group_type, data["group"])
    if data.get("actions") is not None:
        actions = _json(data["actions"], "actions")
    else:
        ids = {c["rid"] for c in group.get("children") or []}
        owner_ids = ids if group_type == "room" else set()
        lights = [item for item in snap.light if item["id"] in ids or (item.get("owner") or {}).get("rid") in owner_ids]
        if data.get("lights"):
            wanted = {_light(snap, str(x))["id"] for x in data["lights"]}
            _whole_group(lights, wanted, group_type)
            lights = [item for item in lights if item["id"] in wanted]
        actions = payloads.scene_actions_from_lights(lights)
    rid = await api.post(
        "scene", payloads.scene_post(data["name"], group["id"], group_type, actions, data.get("speed"), data.get("auto_dynamic"))
    )
    return {"id": rid}


@action("update_scene")
async def update_scene(api, snap, data):
    scene = resolve(snap.scene, data["scene"], "scene")
    if data.get("record_current") and data.get("actions") is not None:
        raise ValueError("Give either actions or record_current, not both")
    if data.get("record_current"):
        # The look of the scene's own lights as they are now (after being adjusted): the same recording create_scene makes.
        wanted = {(a.get("target") or {}).get("rid") for a in scene.get("actions") or []}
        actions = payloads.scene_actions_from_lights([light for light in snap.light if light["id"] in wanted])
        if not actions:
            raise ValueError("This scene has no light to record")
    else:
        actions = _json(data["actions"], "actions") if data.get("actions") is not None else None
    await api.put("scene", scene["id"], payloads.scene_put(data.get("name"), data.get("speed"), data.get("auto_dynamic"), actions))


@action("delete_scene", destructive=True)
async def delete_scene(api, snap, data):
    await api.delete("scene", resolve(snap.scene, data["scene"], "scene")["id"])


@action("set_smart_scene")
async def set_smart_scene(api, snap, data):
    await api.put("smart_scene", resolve(snap.smart_scene, data["smart_scene"], "smart scene")["id"], payloads.recall_put(data["action"]))


@action("create_smart_scene", response=True)
async def create_smart_scene(api, snap, data):
    """A smart scene (a scene that changes with the time of day). ``week_timeslots`` is passed to the bridge as it is."""
    group = _group(snap, data.get("group_type", "room"), data["group"])
    body = {
        "type": "smart_scene",
        "metadata": {"name": data["name"]},
        "group": {"rid": group["id"], "rtype": data.get("group_type", "room")},
        "week_timeslots": _json(data["week_timeslots"], "week_timeslots"),
    }
    return {"id": await api.post("smart_scene", body)}


@action("delete_smart_scene", destructive=True)
async def delete_smart_scene(api, snap, data):
    await api.delete("smart_scene", resolve(snap.smart_scene, data["smart_scene"], "smart scene")["id"])


# ---- rooms and zones ----


def _children(snap: models.Snapshot, kind: str, refs: list[str]) -> list[str]:
    """Rooms hold devices, zones hold lights; each may be given by id or name."""
    return [(_device(snap, str(r)) if kind == "room" else _light(snap, str(r)))["id"] for r in refs]


for _kind in ("room", "zone"):

    def _make(kind: str) -> None:
        @action(f"create_{kind}", response=True)
        async def create(api, snap, data):
            rid = await api.post(
                kind, payloads.group_post(kind, data["name"], data.get("archetype"), _children(snap, kind, data.get("members") or []))
            )
            return {"id": rid}

        @action(f"update_{kind}")
        async def update(api, snap, data):
            group = _group(snap, kind, data[kind])
            members = _children(snap, kind, data["members"]) if data.get("members") is not None else None
            await api.put(kind, group["id"], payloads.group_put(kind, data.get("name"), data.get("archetype"), members))

        @action(f"delete_{kind}", destructive=True)
        async def delete(api, snap, data):
            await api.delete(kind, _group(snap, kind, data[kind])["id"])

    _make(_kind)


# ---- entertainment areas ----


@action("create_entertainment_area", response=True)
async def create_entertainment_area(api, snap, data):
    rid = await api.post(
        "entertainment_configuration", payloads.entertainment_post(data["name"], data["area_type"], _placements(snap, data["lights"]))
    )
    return {"id": rid}


@action("update_entertainment_area")
async def update_entertainment_area(api, snap, data):
    area = resolve(snap.entertainment_configuration, data["area"], "entertainment area")
    placements = _placements(snap, data["lights"]) if data.get("lights") is not None else None
    performance = None
    if data.get("performance") is not None:
        streamer = _entertainment_service(snap, _light(snap, str(data["performance_light"]))) if data.get("performance_light") else None
        performance = (data["performance"], streamer)
    existing = (area.get("locations") or {}).get("service_locations") or []
    await api.put(
        "entertainment_configuration",
        area["id"],
        payloads.entertainment_put(data.get("name"), data.get("area_type"), placements, existing, performance),
    )


@action("delete_entertainment_area", destructive=True)
async def delete_entertainment_area(api, snap, data):
    await api.delete("entertainment_configuration", resolve(snap.entertainment_configuration, data["area"], "entertainment area")["id"])


@action("control_entertainment_area")
async def control_entertainment_area(api, snap, data):
    area = resolve(snap.entertainment_configuration, data["area"], "entertainment area")
    await api.put("entertainment_configuration", area["id"], payloads.entertainment_action(data["action"]))


# ---- automations ----


@action("create_automation", response=True)
async def create_automation(api, snap, data):
    script = resolve(snap.behavior_script, data["template"], "automation template")
    configuration = _json(data["configuration"], "configuration")
    return {
        "id": await api.post(
            "behavior_instance", payloads.automation_post(script["id"], data["name"], configuration, data.get("enabled", True))
        )
    }


@action("update_automation")
async def update_automation(api, snap, data):
    instance = resolve(snap.behavior_instance, data["automation"], "automation")
    configuration = _json(data["configuration"], "configuration") if data.get("configuration") is not None else None
    await api.put("behavior_instance", instance["id"], payloads.automation_put(data.get("name"), configuration, data.get("enabled")))


@action("trigger_automation")
async def trigger_automation(api, snap, data):
    """The play button of the Hue app: starts or stops a wake up, go to sleep, timer or mimic presence automation, whether or not it is switched on."""
    if data["action"] not in ("start", "stop"):
        raise ValueError("The action is start or stop")
    instance = resolve(snap.behavior_instance, data["automation"], "automation")
    await api.put("behavior_instance", instance["id"], {"trigger": {data["action"]: True}})


@action("delete_automation", destructive=True)
async def delete_automation(api, snap, data):
    await api.delete("behavior_instance", resolve(snap.behavior_instance, data["automation"], "automation")["id"])


# ---- the bridge: apps, updates, network, pairing ----


@action("revoke_app", destructive=True)
async def revoke_app(api, snap, data):
    """Takes an app's key away. The key the Hue integration itself uses cannot be revoked here, or Home Assistant would lock itself out."""
    key = models.app_key_for(snap.config, data["app"])
    if key is None:
        raise ValueError("No app with that id: ask get_resources for the apps")
    if api.is_own_key(key):
        raise ValueError("That is the key Home Assistant uses to talk to the bridge; revoking it would lock Home Assistant out")
    await api.revoke_app(key)


@action("configure_bridge")
async def configure_bridge(api, snap, data):
    await api.put_config(payloads.config_put(data.get("name"), data.get("time_zone")))


@action("set_auto_update")
async def set_auto_update(api, snap, data):
    await api.put_config(payloads.auto_update_put(data.get("enabled"), data.get("time")))


@action("check_for_update")
async def check_for_update(api, snap, data):
    await api.put_config(payloads.CHECK_FOR_UPDATE)


@action("install_bridge_update", destructive=True)
async def install_bridge_update(api, snap, data):
    await api.put_config(payloads.INSTALL_BRIDGE_UPDATE)


@action("set_home_location")
async def set_home_location(api, snap, data):
    """Tells the bridge where home is. Sunrise and sunset, Coming home at night and the other location-based automations need it."""
    latitude, longitude = float(data["latitude"]), float(data["longitude"])
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise ValueError("The latitude is from -90 to 90 and the longitude from -180 to 180")
    places = await api.list("geolocation")
    if not places:
        raise ValueError("This bridge has no location setting")
    await api.put("geolocation", places[0]["id"], {"latitude": latitude, "longitude": longitude})


@action("set_zigbee_channel", destructive=True)
async def set_zigbee_channel(api, snap, data):
    """Changing the channel makes every light and accessory find the bridge again, and some may not."""
    await api.put_config(payloads.zigbee_channel_put(int(data["channel"])))


@action("press_link_button", destructive=True)
async def press_link_button(api, snap, data):
    """Opens the bridge for new apps for about 30 seconds, as pressing its button does."""
    await api.put_config(payloads.PRESS_LINK_BUTTON)


@action("search_for_devices")
async def search_for_devices(api, snap, data):
    discovery = next(iter(snap.zigbee_device_discovery), None)
    if discovery is None:
        raise ValueError("This bridge cannot search for new devices")
    kind = "search_allow_default_link_key" if data.get("allow_default_link_key") else "search"
    await api.put("zigbee_device_discovery", discovery["id"], {"action": {"action_type": kind}})


@action("remove_device", destructive=True)
async def remove_device(api, snap, data):
    """Removes a light or accessory from the bridge. It has to be reset before it can be added again."""
    await api.delete("device", _device(snap, data["device"])["id"])


@action("remove_matter_fabric", destructive=True)
async def remove_matter_fabric(api, snap, data):
    fabric = resolve(snap.matter_fabric, data["fabric"], "Matter fabric", lambda f: str((f.get("fabric_data") or {}).get("label", "")))
    await api.delete("matter_fabric", fabric["id"])


# ---- anything else the bridge can do ----

RAW_RESOURCES = (
    "behavior_instance",
    "behavior_script",
    "behavior_script_formula",
    "bell_button",
    "bridge",
    "bridge_home",
    "button",
    "camera_motion",
    "clip",
    "contact",
    "convenience_area_motion",
    "device",
    "device_power",
    "device_software_update",
    "entertainment",
    "entertainment_configuration",
    "geofence_client",
    "geolocation",
    "grouped_light",
    "grouped_light_level",
    "grouped_motion",
    "light",
    "light_level",
    "matter",
    "matter_fabric",
    "motion",
    "motion_area_candidate",
    "motion_area_configuration",
    "power_output_configuration",
    "private_group",
    "private_scene",
    "relative_rotary",
    "room",
    "scene",
    "security_area_motion",
    "service_group",
    "smart_scene",
    "sonos",
    "sonos_connectivity",
    "speaker",
    "switch_input_configuration",
    "tamper",
    "temperature",
    "zgp_connectivity",
    "zigbee_connectivity",
    "zigbee_device_discovery",
    "zone",
)


@action("raw_request", response=True)
async def raw_request(api, snap, data):
    """A request to the bridge's v2 API as it is, for what has no service of its own. Changes need confirm: true."""
    method = str(data.get("method", "GET")).upper()
    resource = data["resource"]
    if resource not in RAW_RESOURCES:
        raise ValueError(f"The resource is one of {', '.join(RAW_RESOURCES)}")
    if method not in ("GET", "PUT", "POST", "DELETE"):
        raise ValueError("The method is GET, PUT, POST or DELETE")
    if method != "GET" and data.get("confirm") is not True:
        raise ValueError("A change to the bridge needs confirm set to true")
    path = f"{resource}/{data['id']}" if data.get("id") else resource
    body = _json(data.get("body"), "body") if data.get("body") is not None else None
    result = await api.request(method, path, body)
    return {"data": result}


# ---- routines, accessories, daily smart scenes, sensors ----


def _template(snap: models.Snapshot, kind: str) -> dict[str, Any]:
    wanted = payloads.ROUTINE_TEMPLATES.get(kind)
    found = [s for s in snap.behavior_script if models._name(s) == wanted]
    if not found:
        raise ValueError(f"This bridge has no {wanted!r} template, so it cannot make a {kind.replace('_', ' ')} routine")
    return found[0]


def _group_light_ids(snap: models.Snapshot, kind: str, group_id: str) -> list[str]:
    """The lights of a room (the lights of its devices) or zone."""
    return next((g["lights"] for g in models.groups(snap, kind) if g["id"] == group_id), [])


def _routine_configuration(snap: models.Snapshot, kind: str, data: dict[str, Any]) -> dict[str, Any]:
    group_type = data.get("group_type", "room")
    group = _group(snap, group_type, data["group"])
    scene = resolve(snap.scene, data["scene"], "scene")["id"] if data.get("scene") else None
    return payloads.routine_configuration(
        kind,
        group_id=group["id"],
        group_type=group_type,
        at=data.get("time"),
        days=data.get("days"),
        minutes=data.get("minutes"),
        end_brightness=data.get("end_brightness"),
        scene_id=scene,
        until=data.get("until"),
        style=data.get("style"),
        turn_off_after_minutes=data.get("turn_off_after_minutes"),
        randomize_minutes=data.get("randomize_minutes"),
        end_state=data.get("end_state"),
        mode=data.get("mode"),
        excluded_lights=data.get("excluded_lights"),
        when_type=data.get("when_type"),
        start_type=data.get("start_type") or "time",
        until_type=data.get("until_type") or "time",
        action=data.get("action") or "scene",
        light_ids=_group_light_ids(snap, group_type, group["id"]),
    )


@action("create_routine", response=True)
async def create_routine(api, snap, data):
    """A wake-up, go-to-sleep, timer, lighting schedule or home routine for a room or zone, made from the bridge's own template."""
    kind = data["routine"]
    body = payloads.routine_post(
        _template(snap, kind)["id"], data["name"], _routine_configuration(snap, kind, data), data.get("enabled", True)
    )
    return {"id": await api.post("behavior_instance", body)}


@action("update_routine")
async def update_routine(api, snap, data):
    """Changes a routine made from one of the bridge's templates: the settings are written again as the template wants them."""
    instance = resolve(snap.behavior_instance, data["automation"], "automation")
    kinds = {name: kind for kind, name in payloads.ROUTINE_TEMPLATES.items()}
    script = next((x for x in snap.behavior_script if x["id"] == instance.get("script_id")), None)
    kind = kinds.get(models._name(script or {}))
    if kind is None:
        raise ValueError("Only a routine made from a wake-up, go-to-sleep, timer, schedule or home template can be changed this way")
    configuration = _routine_configuration(snap, kind, data)
    await api.put("behavior_instance", instance["id"], payloads.automation_put(data.get("name"), configuration, data.get("enabled")))


def _time_slots(snap: models.Snapshot, given: Any, groups: list[str]) -> list[tuple[time, str]]:
    """The times of a time-based light with their scenes: what was given ({time, scene} items), or the Hue app's own schedule made of
    the scenes of the room the button acts on."""
    if given is not None:
        out = []
        for slot in _json(given, "slots"):
            if not isinstance(slot, dict) or "time" not in slot or "scene" not in slot:
                raise ValueError('Each time is {"time": "07:00", "scene": "<scene name or id>"}')
            out.append((time.fromisoformat(str(slot["time"])), resolve(snap.scene, str(slot["scene"]), "scene")["id"]))
        return out
    wanted = {name.casefold(): at for at, name in payloads.DEFAULT_TIME_SLOTS}
    here = [s for s in snap.scene if not groups or (s.get("group") or {}).get("rid") in groups]
    found = {models._name(s).casefold(): s["id"] for s in here}
    missing = [name for _at, name in payloads.DEFAULT_TIME_SLOTS if name.casefold() not in found]
    if missing:
        raise ValueError(f"The room has no scene called {', '.join(missing)}, so give the times and scenes yourself")
    return [(wanted[name], found[name]) for name in wanted]


@action("configure_button")
async def configure_button(api, snap, data):
    """Sets what one press of one button of an accessory does. The button must already have an action from the Hue app."""
    accessory = resolve(models.accessories(snap), data["accessory"], "accessory")
    number = int(data["button"])
    button = next((b for b in accessory["buttons"] if b["number"] == number), None)
    if button is None:
        raise ValueError(f"{accessory['name']} has buttons {', '.join(str(b['number']) for b in accessory['buttons'])}")
    if accessory["automation_id"] is None:
        raise ValueError(f"{accessory['name']} has no automation yet: set it up in the Hue app first")
    instance = next(a for a in snap.behavior_instance if a["id"] == accessory["automation_id"])
    scene = resolve(snap.scene, data["scene"], "scene")["id"] if data.get("scene") else None
    cycle = [resolve(snap.scene, str(ref), "scene")["id"] for ref in data.get("scenes") or []]
    slots = _time_slots(snap, data.get("slots"), accessory["targets"].get(button["id"], [])) if data["action"] == "time_based" else None
    what = payloads.button_action(data["action"], scene, data.get("with_off", False), cycle, data.get("repeat_timeout"), slots)
    configuration = payloads.button_configuration(instance["configuration"], button["id"], data["press"], what)
    await api.put("behavior_instance", instance["id"], {"configuration": configuration})


@action("set_button_lights")
async def set_button_lights(api, snap, data):
    """Sets the room or zone one button of an accessory acts on (the Hue app's "Selected lights"). Not tried on a real switch."""
    accessory = resolve(models.accessories(snap), data["accessory"], "accessory")
    number = int(data["button"])
    button = next((b for b in accessory["buttons"] if b["number"] == number), None)
    if button is None:
        raise ValueError(f"{accessory['name']} has buttons {', '.join(str(b['number']) for b in accessory['buttons'])}")
    if accessory["automation_id"] is None:
        raise ValueError(f"{accessory['name']} has no automation yet: set it up in the Hue app first")
    group_type = data.get("group_type", "room")
    group = _group(snap, group_type, data["group"])
    instance = next(a for a in snap.behavior_instance if a["id"] == accessory["automation_id"])
    configuration = payloads.button_where(instance["configuration"], button["id"], group["id"], group_type)
    await api.put("behavior_instance", instance["id"], {"configuration": configuration})


@action("create_daily_smart_scene", response=True)
async def create_daily_smart_scene(api, snap, data):
    """A smart scene that changes through the day: ``slots`` is a list of {time, scene}, the same on the chosen days."""
    group_type = data.get("group_type", "room")
    group = _group(snap, group_type, data["group"])
    slots = []
    for slot in _json(data["slots"], "slots"):
        if not isinstance(slot, dict) or "time" not in slot or "scene" not in slot:
            raise ValueError('Each slot is {"time": "07:00", "scene": "<scene name or id>"}')
        slots.append((time.fromisoformat(str(slot["time"])), resolve(snap.scene, str(slot["scene"]), "scene")["id"]))
    body = {
        "type": "smart_scene",
        "metadata": {"name": data["name"]},
        "group": {"rid": group["id"], "rtype": group_type},
        "week_timeslots": payloads.daily_timeslots(slots, data.get("days")),
    }
    return {"id": await api.post("smart_scene", body)}


@action("configure_sensor")
async def configure_sensor(api, snap, data):
    """Turns a motion sensor on or off and sets how sensitive it is. Not tried on a real sensor."""
    sensor = resolve(models.motion_sensors(snap), data["sensor"], "motion sensor", lambda m: m["name"])
    await api.put("motion", sensor["id"], payloads.motion_put(data.get("enabled"), data.get("sensitivity")))


@action("light_step")
async def light_step(api, snap, data):
    """Makes lights brighter or dimmer, warmer or cooler, by a step. The bridge does the arithmetic."""
    body = payloads.light_step(data.get("brightness_step"), data.get("mirek_step"))
    lights = [_light(snap, str(x)) for x in data["lights"]]
    if not lights:
        raise ValueError("Give at least one light")
    for light in lights:
        await api.put("light", light["id"], body)
