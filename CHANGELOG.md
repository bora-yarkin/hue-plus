# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/). Versions follow [semantic versioning](https://semver.org/).

## [Unreleased]

## [0.14.1] - 2026-11-10

### Fixed
- *Reconfigure, Use my own connection* (and adding a bridge by its address) said "Could not connect" for a Bridge Pro: the bridge answers plain http with a redirect to https, which the library Hue Plus asked with then followed using Home Assistant's own certificate check, and that fails on the bridge's private certificate. Hue Plus now reads who the bridge is over https directly, without following redirects.
- The Hue scene editor and the new-scene popup showed only the lights of the dashboard page. They now use the room or zone of the bridge and all its lights.
- The all-day scene sent the days as numbers; the bridge wants their names.

### Added
- **Choose a room or zone**, as in the Hue app, for a new Hue scene and for changing one: zones and rooms, each opening into its lights. The bridge only accepts a scene that sets every light of its room or zone (tried on the real bridge: all nine lights are accepted, any fewer is refused), so a scene is always of the whole room or zone: the light popup shows every light and any light can be set to off in it; for only some lights, make a zone. Changing a scene shows its own room. `hue_plus.create_scene` now says so plainly when `lights` leaves some out, and the bridge resources (`get_resources`) list the lights of every room, zone and scene.
- Hue scenes in the scenes section like any other scene (needs Home Control 0.9.7 or later): the new-scene popup has **Hue scene**, with the Hue app's choices: **Custom scene** (set the lights in the dashboard's light popup, press the checkmark, and what they show is written to the bridge as the scene), **Save current settings**, **All-day scene** (scenes by time of day, a smart scene, on the days chosen) and **Color palette from photo** (colours taken from a picture go to the lights, then saved as a scene). In edit mode a Hue scene has a trash that deletes it from the bridge, and its page has *Change the lights* (the scene's lights are set as it has them, you adjust them, the checkmark records the result over the scene), *Rename* and *Delete scene*. Dynamic scenes cannot be made: the Hue app only has them from its cloud gallery.
- `hue_plus.update_scene` takes `record_current: true`: the scene's lights, as they look now, become its actions.

## [0.13.0] - 2026-11-10

### Changed
- Hue Plus no longer needs the Hue integration. It has its own copies of the platforms it used to run from it (lights, light groups, sensors, binary sensors, button and dial events, scenes, motion and contact switches, selects: `custom_components/hue_plus/hue/`, Apache-2.0, copied from Home Assistant 2026.11.0, see `NOTICE.md`), and the manifest names the `aiohue` library itself. Side by side with the Hue integration nothing changes: Hue Plus still rides on its connection when it is set up, and hides or leaves alone its entities as chosen.

### Added
- An entry that uses the Hue integration's connection can get one of its own: *Reconfigure → Use my own connection to the bridge*. Hue Plus registers with the bridge itself (press the link button) and keeps everything it has made: the entry, its entities, devices and names. The Hue integration can then be removed without Hue Plus losing the bridge.

### Fixed
- The bridge showed as two "Hue Bridge" devices: the Hue API also lists the bridge as a device of its own (it carries the firmware and connectivity), and Hue Plus made a second device for it. It is the bridge's device now., and the empty second device an earlier version made is removed when Hue Plus starts.



## [0.12.0] - 2026-11-08

### Added
- Hue's static scenes (the bridge says they do not play by themselves, such as Desk light or Relax) are no longer treated as live scenes. Their popup has no speed, play or freeze, and they are not offered as live scenes to import. They can be imported as classic scenes: the dashboard's *Import a classic scene from Hue* copies what the bridge sets each of the scene's lights to (off, or its brightness and colour or white), not what the lights show now. `hue_plus.import_hue_scene` also returns these settings as `states`.

## [0.11.0] - 2026-11-07

### Changed
- `home_control.json` declares `separate_zones` (`set_style` with the style `segmented`, given the entity of one of a strip's zones): a live scene that plays on a gradient light's zones now plays all five of them, in order, as separate lights next to each other. In Linear and Mirrored the bridge blends two of the five zones, so the scene calls `set_style` first when some zones are unavailable; the light stays in Segmented when the scene stops. Needs Home Control 0.9.0 or later.

## [0.10.0] - 2026-11-07

### Changed
- What was Hue-specific in the dashboard is Hue Plus's own now, brought through the dashboard's plugin API (decision D-26; needs Home Control 0.8.0 or later, install both together): Hue's scenes (their rows, the popup with brightness, speed, play and freeze, the scene tiles of the light panel and *Import as a live scene*), the Spotify sync and the Hue Play HDMI Sync Box (their rows in the Lights section, popups and the lights they play on) and the Style button of a gradient light. They look and behave as before. `menu.js` registers them; the sources are `frontend/src/huescenes.js`, `huesync.js` and `huestyle.js`.
- `home_control.json` declares `"replaces": ["hue"]`: the dashboard shows Hue Plus's entities and leaves out the Hue integration's where Hue Plus has one for it (the dashboard no longer has a rule of its own for this).

## [0.9.1] - 2026-11-07

### Fixed
- `play_effect` with a field left out (it needs `effect`, `xy`, `brightness` and `speed`, as its description says) failed with an internal `TypeError` and an "Unexpected exception" in the log; it is now refused with a normal validation error before anything is sent to the bridge.

## [0.9.0] - 2026-11-07

### Added
- The Hue Plus menu in the dashboard's Settings (the bridge, lights, switches, MotionAware areas, entertainment areas, updates, routines and more), its entertainment areas in the area editor and its texts are Hue Plus's own now, not Home Control's (decision D-25). Hue Plus serves one script, `/hue_plus_static/menu.js` (built by `scripts/build_menu.py` from `frontend/src`, named under `menu` in `home_control.json`), which Home Control loads for administrators; it uses the dashboard only through Home Control's plugin API (`window.HomeControl`, version 1). Hue Plus now depends on `http` for that. The JavaScript tests of the menu moved here and run in CI. The menu shows in the dashboard with Home Control 0.7.0 or later (install both together).
- The effects Hue lights play, their groups (Flames, Sparkly, Wavy, ...), labels, pictures, default brightness and speed, the calibration of the speed (which part of the bridge's speed scale each effect's slider covers) and colour variants are now Hue Plus's: they are in `home_control.json` as a catalogue in the syntax of Home Control's `docs/effects-file.md`, and Home Control shows them (it had its own copy). `set_effect` names the action the effects page calls to start an effect with a colour and a speed.

## [0.8.0]

### Removed
- **Breaking:** the scenes module. Live scenes and areas are played by Home Control, for any light (decision D-25), and the services `scene_start`, `scene_update`, `scene_freeze`, `scene_play`, `scene_stop`, `scene_save`, `scene_delete`, `area_save`, `area_delete`, `locate_light` and `get_library`, the websocket command `hue_plus/library`, the `Live scenes` sensor and the `scenes_sensor` entry of `hue_plus/capabilities` are gone. Use Home Control 0.5.0 or later (`home_control.scene_start` and the others). Nothing else calls them in a stock setup.
- The Hue-only rule for scenes and areas (`hue_only`): Hue Plus no longer plays scenes at all.

### Changed
- Config entries move to version 4: the `scenes` module is dropped from an entry's modules and the `Live scenes` sensor is removed from the entity registry. What the module had saved stays in `.storage/hue_plus.scenes.<bridge>`, which Hue Plus no longer reads or writes; Home Control took its scenes and areas over once (it is safe to delete that file when Home Control has them).
- `import_hue_scene` no longer needs a module: it is always there (it reads the bridge's scenes for Home Control's import).

## [0.7.0]

### Added
- `home_control.json`, the declaration that makes Hue Plus the expansion pack for Hue lights in Home Control (decision D-25): the Hue lights it owns, the bridge's command rate, and the native effects it can play.
- `hue_plus.play_effect`, an action on Hue Plus's lights that plays one of a light's own effects with a chosen colour through the bridge (experimental, as the effects of live scenes were). Home Control's live scenes play Hue effects through it.

## [0.6.2]

### Fixed
- `hue_plus.import_hue_scene` accepts the scenes the dashboard lists. Hue Plus runs the Hue integration's scenes again as its own entities, and the dashboard's "Import as a live scene" sent one of those; the action refused it ("is not a Hue scene") and the dashboard answered "Couldn't read that scene from the Hue bridge". A Hue Plus scene is now read through the Hue integration's scene it copies.

## [0.6.1]

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
