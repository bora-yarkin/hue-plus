# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/). Versions follow [semantic versioning](https://semver.org/).

## [Unreleased]

## [0.2.0]

First public version.

### Added
- The setup screen asks whether to leave the Hue integration's entities alone (the default: nothing is hidden or renamed, Hue Plus's entities end in `_plus` and start in the same area) or to hide and rename them. Entries made before the choice keep hiding and renaming.
- Next to the Hue integration, live scenes, areas and locating a light accept Hue lights only.

### Removed
- The Hue sign-in for the Spotify sync (HP-9) and the Hue app identifiers it used. The sync takes a token and UUID entered by hand, and asks for a new one when the service refuses it (decision D-17).

### Earlier work in this version

### Fixed
- The entities Hue Plus runs from the Hue integration now have the Hue integration's names: the buttons of a switch are "Button 1" to "Button 4" (they were all just "Button", so their entity ids could not tell them apart), and the zigbee connectivity, scene selector, rotary, entertainment area and switch entities and the light effect names have theirs too.
- Hue Plus's devices follow a rename made on the bridge while Home Assistant runs (a name set in Home Assistant is kept), and the Hue integration's entities of an accessory added while Hue Plus runs are hidden like the others, so a new dimmer switch no longer shows twice.

### Added
- Live scenes v2 (backend): a `rainbow` colour source; brightness `effects` (pulse, flicker, sparkle, lightning) on a scene or a single light; per-light `looks` (own colours, brightness, effects, and a Hue light's own effect such as underwater played with chosen colours, experimental); `actions` that switch devices on or off when a scene starts (a short list of domains only, with the starting user's permissions).
- Scenes: the colours of a scene come from a colour source (`colour_source`, only the moving `palette` so far; unchanged output, proven by a hash comparison of 116 scenarios). Saved scenes and areas are validated when loaded; what cannot be kept is logged and copied to a `.damaged` storage file first.
- Routines: schedule, coming home (always or between two times), leaving home and the smoke alarm template; `light_step` (relative brightness and colour temperature steps done by the bridge); `get_resources` lists `motion_areas` and `supported_resources`.
- Devices module: the Hue integration's sensors, buttons, scenes, switches and selects run again on Hue Plus's devices (they take over the names of the Hue integration's, which are hidden); the motion switch and sensitivity entities of Hue Plus are dropped, the Hue integration has them.
- Lights module: Hue Plus's own light entities replace the Hue integration's (hidden, renamed with `_hue`, given back when the module is off or Hue Plus is removed). A gradient light is one main light named like its device; the old separate "Zones" light is gone.
- Bridge module: firmware and updates, authorized apps, bridge automations, Zigbee channel, internet state, power-on
  behaviour, identify, timed effects, search, and 37 services for scenes, rooms, zones, entertainment areas, automations,
  Matter and bridge settings.
- Zones module: a light per colour zone of gradient lights, styles, colour effects, raw gradient points.
- Scenes module: live scenes with saved scenes and areas, 14 presets, websocket library, Hue scene import.
- Spotify sync module (experimental).
- `create_routine` (wake-up, go-to-sleep, timer), `configure_button`, `create_daily_smart_scene`, `configure_sensor`; motion
  switch and sensitivity entities; Home and Away sensor; accessory, home-and-away and motion lists in `get_resources`.
- Experimental client of the Hue Play HDMI Sync Box API (`syncbox/`).
- Websocket command `hue_plus/capabilities`, and documentation for use from any dashboard.
