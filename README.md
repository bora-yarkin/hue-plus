# Philips Hue Plus

An unofficial Home Assistant integration that adds what the built-in Hue integration does not show. It uses the connection
the Hue integration already has to your bridge, so there is no second login. Not affiliated with or endorsed by Signify.

Needs Home Assistant 2026.10 or newer and the Hue integration set up with a v2 bridge (Bridge Pro or Bridge v2); Hue Plus uses its connection.

## It does not break what you have

When you add Hue Plus, the setup screen asks what to do with the Hue integration's own entities:

- **Leave them alone** (the default). Nothing is hidden, renamed or removed: your dashboards, automations and groups keep working as they are.
  Hue Plus's entity for each Hue entity has the same name ending in `_plus` (`light.floor_light` and `light.floor_light_plus`), and it follows the Hue entity: its area, name, icon, labels and whether you hid it, and its device's area and name, are copied from the Hue entity and Hue device whenever they change and when Home Assistant starts. The copying goes one way (Hue to Hue Plus), so a setting changed on a `_plus` entity itself is put back.
  In this mode live scenes, areas and locating a light only work on Hue lights; Hue Plus never touches your other lights.
- **Hide and rename them.** The Hue integration's entities are hidden and renamed (`light.floor_light` becomes `light.floor_light_hue`) and Hue Plus's take their names, so existing dashboards and automations use Hue Plus. Removing Hue Plus gives the names back.

The choice is made once, when Hue Plus is added. To change it, remove Hue Plus and add it again.

## Modules

Each module is switched on or off per bridge in the integration's options.

| Module | What it adds |
|---|---|
| **Bridge** | Firmware state and install for the bridge and every device; the apps allowed on the bridge; the bridge's own automations as switches; automatic update time; Zigbee channel; internet and remote-access state; per-light power-on behaviour, identify, timed effects, signals; search for new devices. Services for scenes, smart scenes, rooms, zones, entertainment areas, automations, Matter sharing (removing a fabric), bridge settings and raw requests. Actions that cannot be undone need `confirm: true`; every service is for administrators only. |
| **Bridge, more** | Routines for a room or zone made from the bridge's own templates (wake-up, go-to-sleep, timer); what each press of a dimmer, smart button or tap switch does; smart scenes that change through the day; motion sensor on/off and sensitivity (experimental); Home and Away state. |
| **Lights** | Hue Plus's own light entities, next to or in place of the Hue integration's (see above): every light, room and zone, with brightness, colour, white, transitions, flash and each light's effects. In *hide and rename* mode the Hue integration's entities are hidden and renamed (`light.floor_light` becomes `light.floor_light_hue`) and Hue Plus's take the name they had, so automations and dashboards keep working. Switching the module off, or removing Hue Plus, gives them back. For now Hue Plus still uses the Hue integration's connection to the bridge. |
| **Devices** | The Hue integration's other entities, on Hue Plus's devices: motion, temperature, light-level and contact sensors, batteries, buttons and dials (as event entities), the bridge's scenes and smart scenes, motion-aware switches and selects. Like the lights, in *hide and rename* mode the Hue integration's own are hidden and renamed and Hue Plus's take their names. The bridge's automations show as switches here, so the bridge module does not add its own. |
| **Zones** | A light for each colour zone of a gradient light (the gradient light itself is the main light, named like the device, with its zones listed in its attributes). Styles (linear, mirrored, scattered, segmented), flip, colour effects with a colour and speed of your choice, raw gradient points. |
| **Scenes** | Live scenes: a palette that moves across the lights of an area, using bridge-side fades. Fourteen presets ship with it. Scenes and areas are saved inside the integration; a websocket call (`hue_plus/library`) lets a screen read them. Import a Hue scene as a live scene. |
| **Streaming** | **Experimental.** `stream_colors` sends colours straight to the lights of an entertainment area for a while, and `stop_streaming` ends it. Needs its own registration with the bridge (press the link button when asked). Off by default. |
| **Spotify sync** | Start and stop Hue's cloud Spotify sync and set its brightness, delay, intensity, palette, style and area. **Experimental**: it uses a private Signify service that can change without notice, and needs a token and UUID from your Hue account, which you obtain yourself and enter in the options. Off by default. |

## Experimental parts

Some code is written for hardware the author does not own, from Signify's documentation and the bridge's own error messages,
and tested only against fakes. It is marked *experimental* where it appears and listed in `docs/testing.md`. If you own the
hardware, please try it and send a fix: the `configure_sensor` service, the Hue Play HDMI Sync Box entry (`syncbox/`), and anything about Hue Secure.

## Hue Play HDMI Sync Box (experimental)

*Add integration → Philips Hue Plus → A Hue Play HDMI Sync Box*: enter the box's address, hold the button on the box until its light
turns green, submit. The box gets a device with a sync switch, mode, HDMI input, intensity, brightness and an HDMI signal sensor. Not
tried on a real box by the author.

## Install

With HACS (this repository is not in the default list, so add it yourself): in HACS open the three-dot menu, *Custom repositories*,
enter `https://github.com/bora-yarkin/hue-plus` with the category *Integration*, then download *Philips Hue Plus* and restart Home Assistant.
Then *Settings → Devices & services → Add integration → Philips Hue Plus → A Hue bridge*, and choose what happens to the Hue integration's
entities (see above; the default changes nothing).

Without HACS, copy `custom_components/hue_plus` into your configuration folder and restart.

Devices: Home Assistant gives a device to one integration only, so Hue Plus makes its own devices (the bridge, and each
light or accessory it has an entity for), named like the Hue ones and linked to the bridge.

## Services

The full list with every field is in `custom_components/hue_plus/services.yaml` and shows in *Developer tools → Actions*.
Examples:

```yaml
action: hue_plus.scene_start
data: {scene_id: now, preset: candle, lights: [{entity_id: light.floor_light, x: -1}, {entity_id: light.bed_light_zones, x: 1}]}
```

```yaml
action: hue_plus.delete_scene
data: {scene: Relax, confirm: true}
```

## Other dashboards

Hue Plus works with any dashboard: see `docs/other-dashboards.md` for the entities, services and the two websocket commands (`hue_plus/capabilities`, `hue_plus/library`) a screen can use.

## Licence

GPL-3.0-or-later. See `LICENSE`. Contributions are welcome: see `.github/CONTRIBUTING.md`.
