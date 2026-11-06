# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/). Versions follow [semantic versioning](https://semver.org/).

## [Unreleased]

### Fixed
- `hue_plus.activate_scene` exists again on Home Assistant 2026.11 and later. The dashboard starts a Hue scene live with it (speed, brightness, fade) and answered "Action hue_plus.activate_scene not found" there: the Hue integration now registers its action of that name for its own scene entities only, and no longer from the scene platform that Hue Plus runs. Hue Plus now registers it for its own scenes, with the same options (`dynamic`, `speed`, `transition`, `brightness`); where the Hue integration still registers it from the platform, nothing changes.

## [0.6.0]

### Added
- `configure_button` can set a press to do nothing, to turn the entire home off (`home_off`), to cycle through 2 to 10 scenes (`scene_cycle`, with `scenes`, `repeat_timeout` and the smart on/off `with_off`) or to a time-based light (`time_based`, with `slots`, or the Hue app's own schedule of the room's scenes when they are left out), written the way the Hue app writes them (read from a real dimmer). Accessories also report the room or zone each button acts on (`targets`). Experimental: not tried on a real dimmer.

## [0.5.1]

### Fixed
- `update_entertainment_area` no longer resets every light's brightness balance to 1 and drops the other positions of a light with segments when it writes the lights' places: what the bridge holds for a light that stays is kept.

### Added
- Entertainment areas report each light's `balance` (the Hue app's brightness balancer) and the area's `performance` (auto, or manual with the light that streams). `update_entertainment_area` takes `balance` for a light and `performance` / `performance_light` for the area. Experimental: the ranges and the manual mode are written from the bridge's own fields and have not been tried on a real bridge.

## [0.5.0]

### Added
- The Spotify sync can sign in with the user's own Hue developer app (OAuth through Home Assistant): the app ID, client ID, client secret and UUID are entered in one form, from the Spotify sync options or Reconfigure, and kept in the bridge entry. The token and UUID form is still there.

## [0.4.1]

### Changed
- Cleanup, no change in behaviour: removed code nothing used (`ROOM_TYPES`, `scenes_using`, the sync box `summary`, two attributes), the failures that were swallowed silently in the zones module are now logged at debug level, and the longest functions (scene validation, the scene engine's step, effect and zone writes, routine configurations, following the Hue integration) are split into named steps.

## [0.4.0]

### Added
- Hue Plus can connect to a bridge itself, without the Hue integration (*A Hue bridge, connected directly*): registration with the link button, the bridge's certificate pinned, reconfigure for a new address, re-registration when the bridge refuses Hue Plus or shows another certificate, and the registration is removed from the bridge with the entry. Lights, devices, the bridge module, zones, scenes, the Spotify sync and streaming all work over it. Streaming needs no second registration on such a bridge.

### Removed
- The Spotify sync no longer reads a `hue_plus_spotify_token.json` file from the configuration folder. The token and UUID are entered on the configuration screen only.

## [0.3.1]

- Installation notes now describe the Marketplace that replaces HACS in Home Assistant 2026.11. No change in behaviour.

## [0.3.0]

### Added
- Next to the Hue integration, Hue Plus's `_plus` entities and devices follow the Hue ones: area, name, icon, labels, being hidden by the user, and the device's area and name are copied from the Hue entity and device whenever they change and when Home Assistant starts. One way only (Hue to Hue Plus).

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
