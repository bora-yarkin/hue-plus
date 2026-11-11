# SPDX-License-Identifier: GPL-3.0-or-later
"""One description of every service: its fields and their help texts. The voluptuous schemas, services.yaml and the translations
are all built from this, so they cannot disagree. No Home Assistant imports."""

from __future__ import annotations

from typing import Any

from ..fieldspec import f
from . import actions as _actions

LIGHT = f("text", "The light: its Hue id, the name of its device, or its Home Assistant entity.", True, example="Floor Light L")

ROUTINE_FIELDS: dict[str, Any] = {
    "group": f("text", "The room or zone (id or name).", True),
    "group_type": f("select", "Room or zone.", default="room", options=["room", "zone"]),
    "time": f("time", "The time of day (wake-up, go-to-sleep and schedule), or the time coming home starts."),
    "until": f("time", "Schedule: the time it ends. Coming home: the time it stops (give both or neither)."),
    "days": f(
        "select_list",
        "The days. Every day when empty.",
        options=["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    ),
    "minutes": f("number", "How long the fade or the timer takes, in minutes (a fade: 15 for wake-up and 30 for go-to-sleep when empty)."),
    "end_brightness": f("number", "Wake-up: the brightness it ends on, 1 to 100.", default=100),
    "style": f("select", "Wake-up: sunrise or basic (a plain fade). Go-to-sleep: sunset or basic.", options=["sunrise", "sunset", "basic"]),
    "turn_off_after_minutes": f("int", "Wake-up: switch the lights off this many minutes after it ends.", min=1, max=240),
    "randomize_minutes": f("int", "Schedule: shift the times by up to this many minutes.", min=1, max=120),
    "scene": f("text", "Timer, schedule and coming home: the scene to recall (id or name)."),
    "end_state": f(
        "select",
        "Go to sleep: what the lights end on (turn_off, minimum_brightness, nightlight). Mimic presence: do_nothing or turn_off.",
        options=["turn_off", "minimum_brightness", "nightlight", "do_nothing"],
    ),
    "mode": f("select", "Mimic presence: 24h is all day, nighttime only when it is dark.", options=["24h", "nighttime"]),
    "excluded_lights": f(
        "select", "Mimic presence: what happens to the lights of the rooms that are not chosen.", options=["do_nothing", "turn_off"]
    ),
    "when_type": f("select", "Coming home: always, or only at night (needs the bridge's home location).", options=["always", "nighttime"]),
    "start_type": f(
        "select",
        "Schedule: start at a time of day, at sunrise or at sunset (those need the bridge's home location).",
        options=["time", "sunrise", "sunset"],
    ),
    "until_type": f("select", "Schedule: end at a time of day, at sunrise or at sunset.", options=["time", "sunrise", "sunset"]),
    "action": f("select", "Schedule: recall a scene, or switch the lights on or off.", options=["scene", "on", "off"], default="scene"),
    "enabled": f("bool", "Whether it runs.", default=True),
}

SPEC: dict[str, dict[str, Any]] = {
    "get_resources": {
        "description": "Returns what the bridge holds: authorized apps, automations and their templates, rooms, zones, scenes, smart scenes, entertainment areas, Matter fabrics, devices, firmware and bridge status.",
        "fields": {"kinds": f("select_list", "What to return. Everything when empty.", options=list(_actions.KINDS))},
    },
    # lights
    "timed_effect": {
        "description": "Starts a sunrise or sunset on a light: it fades over the duration. Use no_effect to stop one.",
        "fields": {
            "light": LIGHT,
            "effect": f("select", "The effect.", True, options=["sunrise", "sunset", "no_effect"]),
            "duration": f("number", "How long it takes, in seconds (not needed for no_effect).", example=900),
        },
    },
    "signal": {
        "description": "Makes a light signal: it blinks for a while and then goes back to what it was doing.",
        "fields": {
            "light": LIGHT,
            "signal": f("select", "The kind of signal.", True, options=["on_off", "on_off_color", "alternating", "no_signal"]),
            "duration": f("number", "How long, in seconds.", default=5),
            "colors_xy": f(
                "xy", "One or two colours as [x, y] pairs, for the signals that use colours.", example="[[0.7, 0.3], [0.2, 0.2]]"
            ),
        },
    },
    "set_power_on": {
        "description": "Sets what a light does when it gets power: safety (a warm white), powerfail (back to how it was), last_on_state, or custom with the state to switch on with.",
        "fields": {
            "light": LIGHT,
            "preset": f("select", "The behaviour.", True, options=["safety", "powerfail", "last_on_state", "custom"]),
            "on": f("select", "For custom: switch on, toggle, or keep the previous state.", options=["on", "toggle", "previous"]),
            "brightness": f("number", "For custom: the brightness in percent."),
            "color_temperature_kelvin": f("number", "For custom: a white temperature in kelvin."),
            "color_xy": f("xy_one", "For custom: a colour as an [x, y] pair."),
        },
    },
    "set_motion_area": {
        "description": "Switches a MotionAware area on or off, renames it, or sets how sensitive it is. A MotionAware area uses the lights themselves as a motion sensor (Bridge Pro).",
        "fields": {
            "area": f("text", "The motion area (id or name).", True),
            "enabled": f("bool", "On or off."),
            "name": f("text", "A new name."),
            "lights": f("list", "The devices that sense motion from now on (three or four; names, ids or device ids).", False),
            "sensitivity": f(
                "int", "How sensitive it is, from 0 (the least) to the area's own maximum (4 on the bridge it was tried on).", min=0, max=4
            ),
        },
    },
    "create_motion_area": {
        "description": "Creates a MotionAware area from three or four lights of a room or zone. A new area still has to be calibrated before it senses motion (see the Hue app).",
        "fields": {
            "name": f("text", "The name.", True),
            "group": f("text", "The room or zone (id or name).", True),
            "group_type": f("select", "Room or zone.", default="room", options=["room", "zone"]),
            "lights": f("list", "The lights (names, ids or device ids), three or four.", True),
        },
    },
    "set_motion_area_lights": {
        "description": "Sets what a MotionAware area does when it senses motion: from each time, motion recalls a scene and, after some minutes without motion, the lights go off. Replaces what was set before.",
        "fields": {
            "area": f("text", "The motion area (id or name).", True),
            "groups": f("list", "The rooms (up to three) or the one zone whose lights it controls (ids or names).", True),
            "slots": f(
                "object",
                'The times: a list of {"time": "07:00", "scene": "<scene name or id>", "off_after_minutes": 10}, or {"sun": "sunset", "offset_minutes": -30, ...} to start at sunrise or sunset. Leave off_after_minutes out to leave the lights on, and scene out to leave them alone.',
                True,
            ),
            "dark_threshold": f(
                "int", "Act only when it is darker than this light level (0 to 65534). Leave out to act in daylight too.", min=0, max=65534
            ),
            "enabled": f("bool", "Whether it runs."),
        },
    },
    "delete_motion_area": {"description": "Deletes a motion area.", "fields": {"area": f("text", "The motion area (id or name).", True)}},
    "set_streaming_end_state": {
        "description": "Experimental. Sets what the lights of an entertainment area do when a sync stops: back to the last state, off, stay as they are (pause), or a scene. Only last_state has been seen on a real bridge; the other names are guesses.",
        "fields": {
            "area": f("text", "The entertainment area (id or name).", True),
            "end_state": f("select", "What happens.", True, options=["last_state", "off", "pause", "scene"]),
            "scene": f("text", "For scene: the scene (id or name)."),
        },
    },
    "configure_light": {
        "description": "Experimental. Sets what a light is for (decorative, functional or mixed, as in the Hue app) and, for a gradient light, which way it is mounted. Not yet tried on a real bridge.",
        "fields": {
            "light": LIGHT,
            "function": f("select", "What the light is for.", options=["decorative", "functional", "mixed"]),
            "gradient_orientation": f("select", "A gradient light's mounting direction.", options=["horizontal", "vertical"]),
            "gradient_order": f("select", "A gradient light's segment order.", options=["forward", "reversed"]),
        },
    },
    "identify": {"description": "Makes a light flash briefly so you can see which one it is.", "fields": {"light": LIGHT}},
    "set_name": {
        "description": "Renames a light, device, room, zone, scene, entertainment area or automation. For a light, room or zone it can also set the icon type.",
        "fields": {
            "resource": f(
                "select", "What to rename.", True, options=["light", "device", "room", "zone", "scene", "entertainment_area", "automation"]
            ),
            "id": f("text", "Its id or name.", True),
            "name": f("text", "The new name."),
            "archetype": f("text", "The icon type, for example bedroom or floor_shade."),
        },
    },
    # scenes
    "create_scene": {
        "description": "Creates a scene for a room or zone. Without actions it records how the lights in it look right now.",
        "fields": {
            "name": f("text", "The scene's name.", True),
            "group": f("text", "The room or zone (id or name).", True),
            "group_type": f("select", "Room or zone.", default="room", options=["room", "zone"]),
            "lights": f("list", "Only these lights (names or ids). All lights of the group when empty."),
            "actions": f("object", "The scene's actions as the bridge writes them, instead of recording the current look."),
            "speed": f("number", "How fast a dynamic scene moves, from 0 to 1."),
            "auto_dynamic": f("bool", "Whether it starts moving when recalled."),
        },
    },
    "update_scene": {
        "description": "Changes a scene: its name, speed, whether it starts moving, or its actions.",
        "fields": {
            "scene": f("text", "The scene (id or name).", True),
            "name": f("text", "A new name."),
            "speed": f("number", "From 0 to 1."),
            "auto_dynamic": f("bool", "Whether it starts moving when recalled."),
            "actions": f("object", "New actions as the bridge writes them."),
            "record_current": f(
                "bool", "Records how the scene's lights look right now as its actions (after adjusting them), instead of giving actions."
            ),
        },
    },
    "delete_scene": {"description": "Deletes a scene from the bridge.", "fields": {"scene": f("text", "The scene (id or name).", True)}},
    "set_smart_scene": {
        "description": "Turns a smart scene (a scene that changes with the time of day) on or off.",
        "fields": {
            "smart_scene": f("text", "The smart scene (id or name).", True),
            "action": f("select", "Activate or deactivate.", True, options=["activate", "deactivate"]),
        },
    },
    "create_smart_scene": {
        "description": "Creates a smart scene. The week's time slots are passed to the bridge as they are.",
        "fields": {
            "name": f("text", "The name.", True),
            "group": f("text", "The room or zone.", True),
            "group_type": f("select", "Room or zone.", default="room", options=["room", "zone"]),
            "week_timeslots": f("object", "The time slots as the bridge writes them.", True),
        },
    },
    "delete_smart_scene": {
        "description": "Deletes a smart scene.",
        "fields": {"smart_scene": f("text", "The smart scene (id or name).", True)},
    },
    # rooms and zones
    "create_room": {
        "description": "Creates a room. A room holds devices; a device can be in one room only.",
        "fields": {
            "name": f("text", "The name.", True),
            "archetype": f("text", "The icon type, for example bedroom."),
            "members": f("list", "The devices (names or ids)."),
        },
    },
    "update_room": {
        "description": "Renames a room, changes its icon type, or replaces the devices in it.",
        "fields": {
            "room": f("text", "The room (id or name).", True),
            "name": f("text", "A new name."),
            "archetype": f("text", "A new icon type."),
            "members": f("list", "The devices in it from now on (names or ids)."),
        },
    },
    "delete_room": {
        "description": "Deletes a room. Its lights stay on the bridge, unassigned.",
        "fields": {"room": f("text", "The room (id or name).", True)},
    },
    "create_zone": {
        "description": "Creates a zone. A zone holds lights, and a light can be in several zones.",
        "fields": {
            "name": f("text", "The name.", True),
            "archetype": f("text", "The icon type."),
            "members": f("list", "The lights (names or ids)."),
        },
    },
    "update_zone": {
        "description": "Renames a zone, changes its icon type, or replaces the lights in it.",
        "fields": {
            "zone": f("text", "The zone (id or name).", True),
            "name": f("text", "A new name."),
            "archetype": f("text", "A new icon type."),
            "members": f("list", "The lights in it from now on (names or ids)."),
        },
    },
    "delete_zone": {"description": "Deletes a zone.", "fields": {"zone": f("text", "The zone (id or name).", True)}},
    # entertainment areas
    "create_entertainment_area": {
        "description": "Creates an entertainment area: the lights that take part in music, screen or game sync and where they stand.",
        "fields": {
            "name": f("text", "The name.", True),
            "area_type": f("select", "What it is for.", True, options=["music", "screen", "monitor", "3dspace", "other"]),
            "lights": f(
                "lights",
                "The lights with their positions from -1 to 1, as a list of items with light, x, y and z.",
                True,
                example="[{light: Bed Light, x: 0, y: 1, z: 0}]",
            ),
        },
    },
    "update_entertainment_area": {
        "description": "Renames an entertainment area, changes its type, or replaces its lights and positions.",
        "fields": {
            "area": f("text", "The area (id or name).", True),
            "name": f("text", "A new name."),
            "area_type": f("select", "A new type.", options=["music", "screen", "monitor", "3dspace", "other"]),
            "lights": f(
                "lights",
                "The lights with their positions, as a list of items with light, x, y and z (and balance, the brightness balance, more than 0; "
                "it stays as it is when left out). A light that stays keeps its balance and the other positions of its segments.",
            ),
            "performance": f(
                "select", "Who streams: the bridge picks (auto) or one light does (manual). Experimental.", options=["auto", "manual"]
            ),
            "performance_light": f("text", "The light that streams, for manual performance."),
        },
    },
    "delete_entertainment_area": {
        "description": "Deletes an entertainment area.",
        "fields": {"area": f("text", "The area (id or name).", True)},
    },
    "control_entertainment_area": {
        "description": "Starts or stops streaming to an entertainment area from Home Assistant's own connection.",
        "fields": {
            "area": f("text", "The area (id or name).", True),
            "action": f("select", "Start or stop.", True, options=["start", "stop"]),
        },
    },
    # automations
    "create_automation": {
        "description": "Creates a Hue automation on the bridge from a template (see automation_templates in get_resources).",
        "fields": {
            "template": f("text", "The template (id or name).", True),
            "name": f("text", "The automation's name.", True),
            "configuration": f("object", "Its configuration, as the template's schema describes.", True),
            "enabled": f("bool", "Whether it is on.", default=True),
        },
    },
    "update_automation": {
        "description": "Changes a Hue automation: name, configuration or whether it is on.",
        "fields": {
            "automation": f("text", "The automation (id or name).", True),
            "name": f("text", "A new name."),
            "configuration": f("object", "A new configuration."),
            "enabled": f("bool", "Turn it on or off."),
        },
    },
    "trigger_automation": {
        "description": "The play button of the Hue app: starts or stops a wake up, go to sleep, timer or mimic presence automation. It works whether or not the automation is switched on, which is how a Go to sleep or a timer that only starts by hand is used.",
        "fields": {
            "automation": f("text", "The automation (id or name).", True),
            "action": f("select", "Start or stop it.", True, options=["start", "stop"]),
        },
    },
    "delete_automation": {
        "description": "Deletes a Hue automation from the bridge.",
        "fields": {"automation": f("text", "The automation (id or name).", True)},
    },
    # the bridge
    "revoke_app": {
        "description": "Takes an authorized app's key away so it can no longer use the bridge. Find the id in the apps of get_resources. Home Assistant's own key cannot be revoked here.",
        "fields": {"app": f("text", "The app's id from get_resources.", True)},
    },
    "configure_bridge": {
        "description": "Changes the bridge's name or time zone.",
        "fields": {"name": f("text", "A new name."), "time_zone": f("text", "A time zone such as Europe/Istanbul.")},
    },
    "set_auto_update": {
        "description": "Sets whether the bridge installs updates by itself, and at what time of day.",
        "fields": {"enabled": f("bool", "Install updates automatically."), "time": f("time", "The time of day.")},
    },
    "check_for_update": {"description": "Makes the bridge check for a new firmware version now.", "fields": {}},
    "install_bridge_update": {
        "description": "Installs a bridge firmware update that is ready. The bridge restarts, and lights stay as they are.",
        "fields": {},
    },
    "set_home_location": {
        "description": "Sets the bridge's home location. Sunrise and sunset, Coming home at night and the bridge's other location-based automations need it. The menu's button gives it Home Assistant's own home location.",
        "fields": {
            "latitude": f("number", "Degrees north, from -90 to 90.", True),
            "longitude": f("number", "Degrees east, from -180 to 180.", True),
        },
    },
    "set_zigbee_channel": {
        "description": "Changes the Zigbee channel of the bridge. Every light and accessory has to find the bridge again, and some may not.",
        "fields": {"channel": f("int", "A channel from 11 to 26 (11, 15, 20 and 25 are the ones that avoid Wi-Fi).", True)},
    },
    "press_link_button": {"description": "Opens the bridge for new apps for about 30 seconds, as pressing its button does.", "fields": {}},
    "search_for_devices": {
        "description": "Makes the bridge search for new lights and accessories for about 40 seconds.",
        "fields": {"allow_default_link_key": f("bool", "Also accept devices that use the default Zigbee key (older lights).")},
    },
    "remove_device": {
        "description": "Removes a light or accessory from the bridge. It has to be reset before it can be added again.",
        "fields": {"device": f("text", "The device (id or name).", True)},
    },
    # routines and accessories
    "create_routine": {
        "description": "Makes a routine for a room or zone from the bridge's own template. Wake-up fades the lights up, go-to-sleep fades them out and turns them off, a timer recalls a scene after a while, a schedule recalls a scene at a time (optionally until another time, optionally at randomised times), coming home recalls a scene when you arrive (optionally only between two times; needs Home and Away), leaving home turns the lights off when everyone leaves, the smoke alarm template lights the room when a smoke alarm sounds.",
        "fields": {
            "routine": f(
                "select",
                "The kind of routine.",
                True,
                options=["wake_up", "go_to_sleep", "timer", "schedule", "coming_home", "leaving_home", "smoke_alarm", "mimic_presence"],
            ),
            "name": f("text", "The routine's name.", True),
            **ROUTINE_FIELDS,
        },
    },
    "update_routine": {
        "description": "Changes a routine made from the bridge's wake-up, go-to-sleep, timer, schedule, coming home, leaving home or smoke alarm template. The settings are written again, so give all of them.",
        "fields": {
            "automation": f("text", "The routine (id or name).", True),
            "name": f("text", "A new name."),
            # No defaults when changing: a routine that is off stays off unless it is switched on here.
            **{
                k: {a: b for a, b in v.items() if a != "default"} if k in ("enabled", "end_brightness") else v
                for k, v in ROUTINE_FIELDS.items()
            },
        },
    },
    "configure_button": {
        "description": "Sets what one press of one button of a dimmer, smart button or tap switch does. The button must already have an action set up in the Hue app.",
        "fields": {
            "accessory": f("text", "The accessory (id or name).", True, example="Hue dimmer switch 1"),
            "button": f("int", "The button's number on the accessory.", True, min=1, max=8),
            "press": f("select", "Which press.", True, options=["short", "long", "repeat"]),
            "action": f(
                "select",
                "What it does: dim up or down, turn the lights off (all_off) or the entire home off (home_off), do nothing, recall one scene, cycle through several scenes, or a time-based light.",
                True,
                options=["dim_up", "dim_down", "all_off", "home_off", "do_nothing", "scene", "scene_cycle", "time_based"],
            ),
            "scene": f("text", "For scene: the scene to recall (id or name)."),
            "scenes": f("object", "For scene_cycle: the scenes in the order of the presses, as a list of ids or names (2 to 10)."),
            "slots": f(
                "object",
                'For time_based: the times and scenes, as a list of items with "time" (for example 07:00) and "scene". Left out: the Hue app\'s own schedule '
                "(07:00 Energize, 10:00 Concentrate, 17:00 Read, 20:00 Relax, 23:00 Nightlight) from the scenes of the button's room.",
            ),
            "repeat_timeout": f(
                "int", "For scene_cycle and time_based: seconds after which the next press starts again (1 to 10).", min=1, max=10
            ),
            "with_off": f(
                "bool",
                "For scene, scene_cycle and time_based: smart on/off, the next press after the last turns the lights off.",
                default=False,
            ),
        },
    },
    "create_daily_smart_scene": {
        "description": "Makes a smart scene that changes through the day, for example a bright scene in the morning and a warm one in the evening, the same on the days you choose. Not yet tried on a real bridge.",
        "fields": {
            "name": f("text", "The smart scene's name.", True),
            "group": f("text", "The room or zone (id or name).", True),
            "group_type": f("select", "Room or zone.", default="room", options=["room", "zone"]),
            "slots": f(
                "object",
                'The times and scenes: a list of items, each with "time" (for example 07:00) and "scene" (a scene name or id).',
                True,
            ),
            "days": f(
                "select_list",
                "The days. Every day when empty.",
                options=["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            ),
        },
    },
    "light_step": {
        "description": "Makes lights brighter or dimmer, warmer or cooler, by a step from where they are now. The bridge does the arithmetic, so it is smooth and several presses in a row add up.",
        "fields": {
            "lights": f("list", "The lights (ids, names or entities).", True),
            "brightness_step": f("number", "Percent brighter (positive) or dimmer (negative), from -100 to 100."),
            "mirek_step": f(
                "int",
                "Warmer (positive) or cooler (negative) in mirek, up to 347 (the whole range). A higher mirek is a warmer white.",
                min=-347,
                max=347,
            ),
        },
    },
    "configure_sensor": {
        "description": "Turns a motion sensor on or off and sets how sensitive it is. Experimental: not tried on a real sensor.",
        "fields": {
            "sensor": f("text", "The motion sensor (id or the name of its device).", True),
            "enabled": f("bool", "On or off."),
            "sensitivity": f("int", "How sensitive, from 0 up to the sensor's maximum.", min=0, max=10),
        },
    },
    "remove_matter_fabric": {
        "description": "Disconnects a Matter ecosystem (see matter_fabrics in get_resources).",
        "fields": {"fabric": f("text", "The fabric (id or label).", True)},
    },
    "raw_request": {
        "description": "A request to the bridge's v2 API as it is, for what has no service of its own. Anything but GET needs confirm.",
        "fields": {
            "resource": f("select", "The resource.", True, options=list(_actions.RAW_RESOURCES)),
            "id": f("text", "The resource's id."),
            "method": f("select", "The method.", default="GET", options=["GET", "PUT", "POST", "DELETE"]),
            "body": f("object", "The request body."),
        },
    },
}

CONFIRM = f("bool", "Must be true: this cannot be undone.", True)


def fields_of(name: str) -> dict[str, dict[str, Any]]:
    """The fields of a service, with ``confirm`` added where the action is destructive (and for raw requests that change something)."""
    fields = dict(SPEC[name]["fields"])
    if _actions.ACTIONS[name].destructive:
        fields["confirm"] = CONFIRM
    elif name == "raw_request":
        fields["confirm"] = f("bool", "Must be true for anything but GET.")
    return fields


def check_spec() -> list[str]:
    """Problems in the description: a service without an action, or an action without a service."""
    problems = [f"{n} has no action" for n in SPEC if n not in _actions.ACTIONS]
    problems += [f"{n} has no description" for n in _actions.ACTIONS if n not in SPEC]
    return problems
