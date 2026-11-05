# SPDX-License-Identifier: GPL-3.0-or-later
"""The request bodies for everything this integration writes to the bridge.

They are built here, from plain values, and checked as far as is certain (required fields, ranges). What the bridge knows better,
such as which room types exist, is left to the bridge, whose answer is shown to the user as it is. No Home Assistant imports.
"""

from __future__ import annotations

from datetime import time
from typing import Any

ENTERTAINMENT_TYPES = ("screen", "monitor", "music", "3dspace", "other")
SIGNALS = ("no_signal", "on_off", "on_off_color", "alternating")
TIMED_EFFECTS = ("no_effect", "sunrise", "sunset")
ZIGBEE_CHANNELS = tuple(range(11, 27))


def _ref(rid: str, rtype: str) -> dict[str, str]:
    return {"rid": rid, "rtype": rtype}


def _fraction(value: float, name: str) -> float:
    if not 0 <= value <= 1:
        raise ValueError(f"{name} must be between 0 and 1")
    return value


def _xy(point: tuple[float, float]) -> dict[str, dict[str, float]]:
    return {"xy": {"x": _fraction(point[0], "x"), "y": _fraction(point[1], "y")}}


# ---- scenes ----


def scene_actions_from_lights(lights: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The look the given lights have right now as the actions of a scene: on or off, brightness, and the colour or white."""
    actions = []
    for light in lights:
        action: dict[str, Any] = {"on": {"on": bool((light.get("on") or {}).get("on"))}}
        if "brightness" in (light.get("dimming") or {}):
            action["dimming"] = {"brightness": light["dimming"]["brightness"]}
        temperature = light.get("color_temperature") or {}
        if temperature.get("mirek_valid") and temperature.get("mirek"):
            action["color_temperature"] = {"mirek": temperature["mirek"]}
        elif (light.get("color") or {}).get("xy"):
            action["color"] = {"xy": light["color"]["xy"]}
        actions.append({"target": _ref(light["id"], "light"), "action": action})
    return actions


def scene_post(
    name: str, group_id: str, group_type: str, actions: list[dict[str, Any]], speed: float | None, auto_dynamic: bool | None
) -> dict[str, Any]:
    if group_type not in ("room", "zone"):
        raise ValueError("A scene belongs to a room or a zone")
    if not actions:
        raise ValueError("A scene needs at least one light")
    body: dict[str, Any] = {"type": "scene", "metadata": {"name": name}, "group": _ref(group_id, group_type), "actions": actions}
    if speed is not None:
        body["speed"] = _fraction(speed, "speed")
    if auto_dynamic is not None:
        body["auto_dynamic"] = auto_dynamic
    return body


def scene_put(name: str | None, speed: float | None, auto_dynamic: bool | None, actions: list[dict[str, Any]] | None) -> dict[str, Any]:
    body: dict[str, Any] = {}
    if name is not None:
        body["metadata"] = {"name": name}
    if speed is not None:
        body["speed"] = _fraction(speed, "speed")
    if auto_dynamic is not None:
        body["auto_dynamic"] = auto_dynamic
    if actions is not None:
        body["actions"] = actions
    if not body:
        raise ValueError("Nothing to change")
    return body


def recall_put(action: str) -> dict[str, Any]:
    """Activates or deactivates a smart scene."""
    if action not in ("activate", "deactivate"):
        raise ValueError("The action is activate or deactivate")
    return {"recall": {"action": action}}


# ---- rooms and zones ----


def group_post(kind: str, name: str, archetype: str | None, children: list[str]) -> dict[str, Any]:
    """A room holds devices, a zone holds lights."""
    child_type = {"room": "device", "zone": "light"}[kind]
    # The bridge refuses a room or zone without an archetype (found on a real bridge); "other" is the plain one.
    metadata = {"name": name, "archetype": archetype or "other"}
    return {"type": kind, "metadata": metadata, "children": [_ref(c, child_type) for c in children]}


def group_put(kind: str, name: str | None, archetype: str | None, children: list[str] | None) -> dict[str, Any]:
    child_type = {"room": "device", "zone": "light"}[kind]
    body: dict[str, Any] = {}
    metadata = {k: v for k, v in (("name", name), ("archetype", archetype)) if v}
    if metadata:
        body["metadata"] = metadata
    if children is not None:
        body["children"] = [_ref(c, child_type) for c in children]
    if not body:
        raise ValueError("Nothing to change")
    return body


# ---- entertainment areas ----

# (entertainment service id, x, y, z, brightness balance or None), each position from -1 to 1. ``None`` keeps the balance the light has in the area.
Placement = tuple[str, float, float, float, float | None]

PERFORMANCE_MODES = ("auto", "manual")


def _location_of(existing: list[dict[str, Any]], service_id: str) -> dict[str, Any]:
    return next((loc for loc in existing if (loc.get("service") or {}).get("rid") == service_id), {})


def _positions(old: list[dict[str, Any]], x: float, y: float, z: float) -> list[dict[str, float]]:
    """The positions of a light after it moved to (x, y, z): its first position is the new one, and the others (the segments of a
    light that has several) keep their place relative to it. A light that is new, or has one position, gets just the new one."""
    first = old[0] if old else None
    out = [{"x": x, "y": y, "z": z}]
    if first is None:
        return out
    delta = (x - first.get("x", x), y - first.get("y", y), z - first.get("z", z))
    for other in old[1:]:
        out.append({axis: max(-1.0, min(1.0, other.get(axis, 0) + d)) for axis, d in zip("xyz", delta, strict=True)})
    return out


def _locations(placements: list[Placement], existing: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """The area's lights with their places. What the bridge already holds for a light that stays (its brightness balance, the other
    positions of a light with segments) is kept, so moving a light never resets the rest."""
    if not placements:
        raise ValueError("An entertainment area needs at least one light")
    service_locations = []
    for service_id, x, y, z, balance in placements:
        for axis, value in (("x", x), ("y", y), ("z", z)):
            if not -1 <= value <= 1:
                raise ValueError(f"The {axis} position must be between -1 and 1")
        if balance is not None and not balance > 0:
            raise ValueError("The brightness balance must be more than 0")
        old = _location_of(existing or [], service_id)
        service_locations.append(
            {
                "service": _ref(service_id, "entertainment"),
                "positions": _positions(old.get("positions") or [], x, y, z),
                "equalization_factor": balance if balance is not None else old.get("equalization_factor", 1),
            }
        )
    return {"service_locations": service_locations}


def _stream_proxy(mode: str, service_id: str | None) -> dict[str, Any]:
    """Which part of the area streams: the bridge picks (auto), or one light does (manual)."""
    if mode not in PERFORMANCE_MODES:
        raise ValueError(f"The performance is one of {', '.join(PERFORMANCE_MODES)}")
    if mode == "auto":
        return {"mode": "auto"}
    if not service_id:
        raise ValueError("Manual performance needs the light that streams")
    return {"mode": "manual", "node": _ref(service_id, "entertainment")}


def entertainment_post(name: str, area_type: str, placements: list[Placement]) -> dict[str, Any]:
    if area_type not in ENTERTAINMENT_TYPES:
        raise ValueError(f"The type is one of {', '.join(ENTERTAINMENT_TYPES)}")
    return {
        "type": "entertainment_configuration",
        "metadata": {"name": name},
        "configuration_type": area_type,
        "locations": _locations(placements),
    }


def entertainment_put(
    name: str | None,
    area_type: str | None,
    placements: list[Placement] | None,
    existing: list[dict[str, Any]] | None = None,
    performance: tuple[str, str | None] | None = None,
) -> dict[str, Any]:
    body: dict[str, Any] = {}
    if name is not None:
        body["metadata"] = {"name": name}
    if area_type is not None:
        if area_type not in ENTERTAINMENT_TYPES:
            raise ValueError(f"The type is one of {', '.join(ENTERTAINMENT_TYPES)}")
        body["configuration_type"] = area_type
    if placements is not None:
        body["locations"] = _locations(placements, existing)
    if performance is not None:
        body["stream_proxy"] = _stream_proxy(*performance)
    if not body:
        raise ValueError("Nothing to change")
    return body


def entertainment_action(action: str) -> dict[str, Any]:
    if action not in ("start", "stop"):
        raise ValueError("The action is start or stop")
    return {"action": action}


# ---- lights ----


def timed_effect_put(effect: str, duration_s: float | None) -> dict[str, Any]:
    """The sunrise or sunset effect: the light fades over the duration."""
    if effect not in TIMED_EFFECTS:
        raise ValueError(f"The effect is one of {', '.join(TIMED_EFFECTS)}")
    body: dict[str, Any] = {"effect": effect}
    if effect != "no_effect":
        if duration_s is None or duration_s <= 0:
            raise ValueError("The duration must be more than 0 seconds")
        body["duration"] = int(duration_s * 1000)
    return {"timed_effects": body}


def signal_put(signal: str, duration_s: float, colors: list[tuple[float, float]] | None) -> dict[str, Any]:
    if signal not in SIGNALS:
        raise ValueError(f"The signal is one of {', '.join(SIGNALS)}")
    body: dict[str, Any] = {"signal": signal}
    if signal == "no_signal":
        body["duration"] = 0  # the bridge wants a duration even to end a signal (found on a real bridge)
    else:
        if duration_s <= 0:
            raise ValueError("The duration must be more than 0 seconds")
        body["duration"] = int(duration_s * 1000)
    if signal in ("on_off_color", "alternating"):
        if not colors or len(colors) > 2:
            raise ValueError("This signal needs one or two colours")
        body["colors"] = [_xy(c) for c in colors]
    return {"signaling": body}


def powerup_put(preset: str, on: str | None, brightness: float | None, mirek: int | None, xy: tuple[float, float] | None) -> dict[str, Any]:
    """What a light does when it gets power. ``custom`` takes the state to switch on with; the others take nothing."""
    if preset not in ("safety", "powerfail", "last_on_state", "custom"):
        raise ValueError("The preset is safety, powerfail, last_on_state or custom")
    body: dict[str, Any] = {"preset": preset}
    if preset == "custom":
        if on not in ("on", "toggle", "previous"):
            raise ValueError("Custom needs on: on, toggle or previous")
        body["on"] = {"mode": on} if on != "on" else {"mode": "on", "on": {"on": True}}
        if brightness is not None:
            if not 0 < brightness <= 100:
                raise ValueError("The brightness must be between 0 and 100")
            body["dimming"] = {"mode": "dimming", "dimming": {"brightness": brightness}}
        else:
            body["dimming"] = {"mode": "previous"}
        if mirek is not None:
            body["color"] = {"mode": "color_temperature", "color_temperature": {"mirek": mirek}}
        elif xy is not None:
            body["color"] = {"mode": "color", "color": _xy(xy)}
        else:
            body["color"] = {"mode": "previous"}
    return {"powerup": body}


def metadata_put(name: str | None, archetype: str | None) -> dict[str, Any]:
    metadata = {k: v for k, v in (("name", name), ("archetype", archetype)) if v}
    if not metadata:
        raise ValueError("Nothing to change")
    return {"metadata": metadata}


LIGHT_FUNCTIONS = ("decorative", "functional", "mixed")
GRADIENT_ORIENTATIONS = ("horizontal", "vertical")
GRADIENT_ORDERS = ("forward", "reversed")


def light_setup_put(function: str | None, orientation: str | None, order: str | None) -> dict[str, Any]:
    """How a light is set up: what it is for (the Hue app's "light function") and, for a gradient light, which way it is mounted."""
    body: dict[str, Any] = {}
    if function is not None:
        if function not in LIGHT_FUNCTIONS:
            raise ValueError("The function is decorative, functional or mixed")
        body["metadata"] = {"function": function}
    content: dict[str, Any] = {}
    if orientation is not None:
        if orientation not in GRADIENT_ORIENTATIONS:
            raise ValueError("The orientation is horizontal or vertical")
        content["orientation"] = {"orientation": orientation}
    if order is not None:
        if order not in GRADIENT_ORDERS:
            raise ValueError("The order is forward or reversed")
        content["order"] = {"order": order}
    if content:
        body["content_configuration"] = content
    if not body:
        raise ValueError("Nothing to change")
    return body


def identify_put() -> dict[str, Any]:
    return {"identify": {"action": "identify"}}


# ---- automations ----


def automation_post(script_id: str, name: str, configuration: dict[str, Any], enabled: bool) -> dict[str, Any]:
    return {
        "type": "behavior_instance",
        "script_id": script_id,
        "enabled": enabled,
        "metadata": {"name": name},
        "configuration": configuration,
    }


def automation_put(name: str | None, configuration: dict[str, Any] | None, enabled: bool | None) -> dict[str, Any]:
    body: dict[str, Any] = {}
    if name is not None:
        body["metadata"] = {"name": name}
    if configuration is not None:
        body["configuration"] = configuration
    if enabled is not None:
        body["enabled"] = enabled
    if not body:
        raise ValueError("Nothing to change")
    return body


# ---- the bridge itself (v1 configuration) ----


def auto_install_time(value: time) -> str:
    return f"T{value:%H:%M:%S}"


def parse_auto_install_time(value: Any) -> time | None:
    """The bridge writes the daily update time as ``T16:00:00``."""
    if not isinstance(value, str) or not value.startswith("T"):
        return None
    try:
        return time.fromisoformat(value[1:])
    except ValueError:
        return None


def zigbee_channel_put(channel: int) -> dict[str, Any]:
    if channel not in ZIGBEE_CHANNELS:
        raise ValueError("The Zigbee channel is a number from 11 to 26")
    return {"zigbeechannel": channel}


def config_put(name: str | None, time_zone: str | None) -> dict[str, Any]:
    body = {k: v for k, v in (("name", name), ("timezone", time_zone)) if v}
    if not body:
        raise ValueError("Nothing to change")
    return body


def auto_update_put(on: bool | None, at: time | None) -> dict[str, Any]:
    auto: dict[str, Any] = {}
    if on is not None:
        auto["on"] = on
    if at is not None:
        auto["updatetime"] = auto_install_time(at)
    if not auto:
        raise ValueError("Nothing to change")
    return {"swupdate2": {"autoinstall": auto}}


CHECK_FOR_UPDATE = {"swupdate2": {"checkforupdate": True}}
INSTALL_BRIDGE_UPDATE = {"swupdate2": {"install": True}}
PRESS_LINK_BUTTON = {"linkbutton": True}


# ---- routines: the bridge's own automations, made from its templates ----

WEEKDAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
# The template of each routine, by the name the bridge gives it.
ROUTINE_TEMPLATES = {
    "wake_up": "Basic wake up routine",
    "go_to_sleep": "Native Go To Sleep",
    "timer": "Timers",
    "schedule": "Schedule",
    "coming_home": "Coming home",
    "leaving_home": "Leaving home",
    "smoke_alarm": "Smoke alarm",
}


def _days(days: list[str] | None) -> list[str]:
    chosen = list(days) if days else list(WEEKDAYS)
    unknown = [d for d in chosen if d not in WEEKDAYS]
    if unknown:
        raise ValueError(f"The days are {', '.join(WEEKDAYS)}")
    return chosen


def _when(at: time, days: list[str] | None) -> dict[str, Any]:
    return {"time_point": {"type": "time", "time": {"hour": at.hour, "minute": at.minute}}, "recurrence_days": _days(days)}


def _recall(where: list[dict[str, Any]], scene_id: str | None) -> list[dict[str, Any]]:
    """What a routine does when it fires: recall a scene on the routine's group."""
    if not scene_id:
        raise ValueError("Give the scene to recall")
    return [{"group": where[0]["group"], "recall": {"rid": scene_id, "rtype": "scene"}}]


def _schedule_routine(where: list[dict[str, Any]], scene_id: str | None, at: time | None, days: list[str] | None) -> dict[str, Any]:
    what = _recall(where, scene_id)
    if at is None:
        raise ValueError("Give the time of day")
    start = {"time_point": {"type": "time", "time": {"hour": at.hour, "minute": at.minute}}}
    return {"when_extended": {"start_at": start, "recurrence_days": _days(days)}, "what": what, "where": where}


def _coming_home_routine(where: list[dict[str, Any]], scene_id: str | None, at: time | None, until: time | None) -> dict[str, Any]:
    what = _recall(where, scene_id)
    if (at is None) != (until is None):
        raise ValueError("Give both the time it starts and the time it ends, or neither")
    when = (
        {"type": "always"}
        if at is None
        else {"type": "between", "start": {"hour": at.hour, "minute": at.minute}, "end": {"hour": until.hour, "minute": until.minute}}
    )
    return {"when_constrained": when, "what": what, "where": where}


def _timer_routine(where: list[dict[str, Any]], scene_id: str | None, minutes: float | None) -> dict[str, Any]:
    if not minutes or minutes < 1 or not scene_id:
        raise ValueError("A timer needs a duration of at least one minute and a scene to recall when it ends")
    return {"duration": {"minutes": int(minutes)}, "what": _recall(where, scene_id), "where": where}


def _wake_up_routine(
    where: list[dict[str, Any]], at: time, days: list[str] | None, minutes: float | None, end_brightness: float | None
) -> dict[str, Any]:
    brightness = 100.0 if end_brightness is None else _percent(end_brightness, "end_brightness")
    return {"fade_in_duration": {"seconds": _seconds(minutes, 15)}, "end_brightness": brightness, "when": _when(at, days), "where": where}


def _go_to_sleep_routine(where: list[dict[str, Any]], at: time, days: list[str] | None, minutes: float | None) -> dict[str, Any]:
    return {"fade_out_duration": {"seconds": _seconds(minutes, 30)}, "end_state": "turn_off", "when": _when(at, days), "where": where}


def routine_configuration(
    kind: str,
    *,
    group_id: str,
    group_type: str,
    at: time | None,
    days: list[str] | None,
    minutes: float | None,
    end_brightness: float | None,
    scene_id: str | None,
    until: time | None = None,
) -> dict[str, Any]:
    """The configuration of a routine for a room or zone. Every shape here was accepted by a real bridge (as a disabled routine).

    Wake-up and go-to-sleep fade; a timer, a schedule and coming home recall a scene; leaving home and the smoke alarm only
    say which lights they are for (what they do is the template's)."""
    if kind not in ROUTINE_TEMPLATES:
        raise ValueError(f"The routine is one of {', '.join(ROUTINE_TEMPLATES)}")
    where = [{"group": {"rid": group_id, "rtype": group_type}}]
    if kind in ("leaving_home", "smoke_alarm"):
        return {"where": where}
    if kind == "schedule":
        return _schedule_routine(where, scene_id, at, days)
    if kind == "coming_home":
        return _coming_home_routine(where, scene_id, at, until)
    if kind == "timer":
        return _timer_routine(where, scene_id, minutes)
    if at is None:
        raise ValueError("Give the time of day")
    if kind == "wake_up":
        return _wake_up_routine(where, at, days, minutes, end_brightness)
    return _go_to_sleep_routine(where, at, days, minutes)


def _seconds(minutes: float | None, default: float) -> int:
    value = default if minutes is None else minutes
    if not 0 < value <= 120:
        raise ValueError("The fade takes more than 0 and at most 120 minutes")
    return int(value * 60)


def _percent(value: float, what: str) -> float:
    if not 1 <= value <= 100:
        raise ValueError(f"{what} is from 1 to 100")
    return float(value)


def routine_post(script_id: str, name: str, configuration: dict[str, Any], enabled: bool) -> dict[str, Any]:
    return {
        "type": "behavior_instance",
        "script_id": script_id,
        "enabled": enabled,
        "metadata": {"name": name},
        "configuration": configuration,
    }


# ---- accessories: what a button does ----

BUTTON_PRESSES = {"short": "on_short_release", "long": "on_long_press", "repeat": "on_repeat"}
BUTTON_ACTIONS = ("dim_up", "dim_down", "all_off", "home_off", "do_nothing", "scene", "scene_cycle", "time_based")
# What the Hue app lets a button cycle through: the bridge held seven scenes on a real dimmer. The smallest cycle is two, since one is a single scene.
CYCLE_SCENES = (2, 10)
CYCLE_TIMEOUT_S = (1, 10)


def _timeout(seconds: float) -> float:
    if not CYCLE_TIMEOUT_S[0] <= seconds <= CYCLE_TIMEOUT_S[1]:
        raise ValueError(f"The time between presses is {CYCLE_TIMEOUT_S[0]} to {CYCLE_TIMEOUT_S[1]} seconds")
    return seconds


def _scene_slot(scene_id: str) -> dict[str, Any]:
    return {"action": {"recall": {"rid": scene_id, "rtype": "scene"}}}


TIME_SLOTS = (2, 10)
# The schedule the Hue app starts a Time-based light with, read from a real bridge: the scenes of the button's room, by name.
DEFAULT_TIME_SLOTS = (
    (time(7, 0), "Energize"),
    (time(10, 0), "Concentrate"),
    (time(17, 0), "Read"),
    (time(20, 0), "Relax"),
    (time(23, 0), "Nightlight"),
)


def button_action(
    action: str,
    scene_id: str | None,
    with_off: bool,
    cycle_ids: list[str] | None = None,
    repeat_timeout: float | None = None,
    time_slots: list[tuple[time, str]] | None = None,
) -> dict[str, Any]:
    """What a press does, in the shapes the Hue app writes (all read from a real bridge): a plain ``action``, a single scene
    (``recall_single_extended``), or a cycle through scenes (``scene_cycle_extended``), with or without the second press that turns the lights off."""
    if action not in BUTTON_ACTIONS:
        raise ValueError(f"The action is one of {', '.join(BUTTON_ACTIONS)}")
    if action == "scene":
        if not scene_id:
            raise ValueError("Give the scene to recall")
        return {"recall_single_extended": {"actions": [_scene_slot(scene_id)], "with_off": {"enabled": with_off}}}
    if action == "time_based":
        low, high = TIME_SLOTS
        if not time_slots or not low <= len(time_slots) <= high:
            raise ValueError(f"A time-based light has {low} to {high} times, each with a scene")
        ordered = sorted(time_slots, key=lambda slot: (slot[0].hour, slot[0].minute))
        if len({(t.hour, t.minute) for t, _ in ordered}) != len(ordered):
            raise ValueError("Two times of a time-based light cannot be the same")
        return {
            "time_based_extended": {
                "repeat_timeout": {"seconds": int(3 if repeat_timeout is None else _timeout(repeat_timeout))},
                "slots": [{"actions": [_scene_slot(scene)], "start_time": {"hour": t.hour, "minute": t.minute}} for t, scene in ordered],
                "with_off": {"enabled": with_off},
            }
        }
    if action == "scene_cycle":
        low, high = CYCLE_SCENES
        if not cycle_ids or not low <= len(cycle_ids) <= high:
            raise ValueError(f"A cycle goes through {low} to {high} scenes")
        seconds = 3 if repeat_timeout is None else _timeout(repeat_timeout)
        return {
            "scene_cycle_extended": {
                "repeat_timeout": {"seconds": int(seconds)},
                "slots": [[_scene_slot(scene)] for scene in cycle_ids],
                "with_off": {"enabled": with_off},
            }
        }
    return {"action": action}


def button_configuration(configuration: dict[str, Any], button_id: str, press: str, what: dict[str, Any]) -> dict[str, Any]:
    """The automation's configuration with one press of one button changed and everything else as it was."""
    if press not in BUTTON_PRESSES:
        raise ValueError(f"The press is one of {', '.join(BUTTON_PRESSES)}")
    buttons = configuration.get("buttons") or {}
    if button_id not in buttons:
        raise ValueError("This button has no action set up yet: set it up in the Hue app first")
    updated = {**configuration, "buttons": {**buttons, button_id: {**buttons[button_id], BUTTON_PRESSES[press]: what}}}
    return updated


# ---- smart scenes that change through the day ----


def daily_timeslots(slots: list[tuple[time, str]], days: list[str] | None) -> list[dict[str, Any]]:
    """``week_timeslots`` of a smart scene: the same scenes at the same times on the chosen days."""
    if not slots:
        raise ValueError("Give at least one time with a scene")
    ordered = sorted(slots, key=lambda slot: slot[0])
    return [
        {
            "timeslots": [
                {
                    "start_time": {"kind": "time", "time": {"hour": at.hour, "minute": at.minute, "second": 0}},
                    "target": {"rid": scene_id, "rtype": "scene"},
                }
                for at, scene_id in ordered
            ],
            "recurrence": _days(days),
        }
    ]


# ---- sensors ----


def motion_put(enabled: bool | None, sensitivity: int | None) -> dict[str, Any]:
    body: dict[str, Any] = {}
    if enabled is not None:
        body["enabled"] = enabled
    if sensitivity is not None:
        if sensitivity < 0:
            raise ValueError("The sensitivity cannot be negative")
        body["sensitivity"] = {"sensitivity": int(sensitivity)}
    if not body:
        raise ValueError("Nothing to change")
    return body


# ---- relative steps ----


def light_step(brightness_step: float | None, mirek_step: int | None) -> dict[str, Any]:
    """A change relative to what the light is now, done by the bridge itself (smoother than reading the light and writing a new value)."""
    body: dict[str, Any] = {}
    if brightness_step:
        if not -100 <= brightness_step <= 100:
            raise ValueError("The brightness step is from -100 to 100 percent")
        body["dimming_delta"] = {"action": "up" if brightness_step > 0 else "down", "brightness_delta": abs(float(brightness_step))}
    if mirek_step:
        if not -347 <= mirek_step <= 347:
            raise ValueError("The colour temperature step is from -347 to 347 mirek (347 is the whole range)")
        body["color_temperature_delta"] = {"action": "up" if mirek_step > 0 else "down", "mirek_delta": abs(int(mirek_step))}
    if not body:
        raise ValueError("Give a brightness step or a colour temperature step that is not zero")
    return body


# ---- motion areas and what the lights do when a sync ends ----


def motion_area_put(name: str | None, enabled: bool | None) -> dict[str, Any]:
    body: dict[str, Any] = {}
    if name is not None:
        body["metadata"] = {"name": name}
    if enabled is not None:
        body["enabled"] = enabled
    if not body:
        raise ValueError("Nothing to change")
    return body


def motion_area_post(name: str, zone_id: str, sensor_ids: list[str]) -> dict[str, Any]:
    """Experimental: the bridge's documentation lists motion areas but gives no way to create one, so this is the shape of what
    the bridge reports for an existing area (a name, the group, and the motion sensors)."""
    if len(sensor_ids) < 3:
        raise ValueError("A motion area needs at least three lights")
    return {
        "type": "motion_area_configuration",
        "metadata": {"name": name},
        "group": {"rid": zone_id, "rtype": "zone"},
        "motion_sensors": [{"rid": sensor_id, "rtype": "motion_area_candidate"} for sensor_id in sensor_ids],
    }


STREAMING_END_STATES = ("last_state", "off", "pause", "scene")


def streaming_end_configuration(area_id: str, end_state: str, scene_id: str | None) -> dict[str, Any]:
    """Experimental: only ``last_state`` has been seen on a real bridge. ``off``, ``pause`` and ``scene`` are the app's choices
    (off, pause on the last light, a scene) under guessed names."""
    if end_state not in STREAMING_END_STATES:
        raise ValueError("The end state is last_state, off, pause or scene")
    if (end_state == "scene") != (scene_id is not None):
        raise ValueError("Give a scene when, and only when, the end state is scene")
    configuration: dict[str, Any] = {
        "end_state": end_state,
        "where": [{"group": {"rid": area_id, "rtype": "entertainment_configuration"}}],
    }
    if scene_id is not None:
        configuration["scene"] = {"rid": scene_id, "rtype": "scene"}
    return configuration
