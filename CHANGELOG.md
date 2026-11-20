# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/). Versions follow [semantic versioning](https://semver.org/).

## [Unreleased]

### Changed
- **The wizards' pages follow the app's screens**: the card starts lower under the blue top, "How should Go to sleep start?" has its two paragraphs and its choices are cards with round icons (as are "When should your lights turn on"), Mimic presence has its first page (a house at night, what it does) and its summary has the round pictures at the end of its rows. The MotionAware room is drawn without outlines and taller.

### Changed
- **Settings and MotionAware compared with the app's screens again**: Devices rows end with a count and an arrow, the rooms of Add devices, the bridge and the entertainment areas have no arrow, the bridge's name has its pencil and its page shows the IP address (the bridge's `ip_address` is in `get_resources`), "Everything is up to date" has the green tick, an entertainment area's Lights is a title with its plus, the MotionAware intro and tips have the cut-away room above their card with the app's smaller text, the room choice has round marks, and the Power on choice has the app's tip and round icons.

### Changed
- **The scene settings page follows the app's screens again**: the colours of the scene are blurred round patches behind the page that fade into the dark, the header and first sections are see-through over them; Dynamic speed is a row ("8 - Fast") that opens a short sheet with the twelve steps, as the app does, instead of a slider on the page; Reset scene stays at the bottom of the screen and Delete scene follows the lights. What is changed on the page is kept while the speed sheet is open. The brightness row no longer has a solid background of its own, so the colours run through it.

### Added
- **The scene settings page has the app's Colors and Reset scene** for a moving scene. A scene from the Hue gallery has a palette of five colours that the bridge gives out to the lights it lists, so a light the scene does not list (the room has more lights than the scene has actions) keeps one static colour. *Colors* gives the palette out again to every light of the room in another order, *Reset scene* in the palette's own order and brightness; both are kept until SAVE. `update_scene` takes `recolor` (shuffle or reset) for it.

### Changed
- **Switch pages compared with the app's screens again**: Smart on/off is only on the Press page (it was also on Switch settings, and the scene cycle page had a switch for it where the app has a row that opens the Smart on/off page); a press that is a scene cycle shows its list of presses on the Press page itself; the name of a switch has its pencil; Selected lights is a title with a pencil; Button controls has the question, the label and the description of Lights; the Press options have the app's round icons; a single scene shows "All Lights". Not yet: the app's Automations choice under Button controls, and the Bright and Last on state suggestions of the scene choice.

## [0.21.0] - 2026-11-20

### Changed
- **Settings rows, wake-up settings and name page follow the Hue app's screens**: rows are 66 px with hairlines and the app's type sizes, the Style row ends with a picture of the sky, Style, Maximum brightness (opens its own short sheet with the slider) and Turn lights off share one card, and the name page has a labelled field with a clear button.
- **The Hue panel's colour screen is Home Control 0.16.0's**: the circle of separated lights and the drops open and close as the app does (measured from a 60 frames a second recording), a tap on a light inside the circle only picks it, joined lights stay where they were dropped, a light that is off opens a black drop (dragging it turns it on), lights without an icon of their own take their group's, a tile is the same colour for every light at the same temperature, and the lights on the white wheel start in a column in the middle. The copy in `lights/` is made again with `scripts/sync_light_popup.py`.
- **Every sheet comes up from the bottom**: the list under the three dots, questions ("Delete this scene?") and the line to write a folder's name in slide up over the dimmed page and slide back down; they only faded in before. (The card a folder opens still opens out of the folder and the Sync cards still rise as they did, as they were copied from the app.)
- **The pencil and the three dots of a scene stand right next to the scene that plays**, in the height of its tile, and come out of that tile: when another scene plays, the old pair goes back into its tile and fades while a new pair comes out of the new one. The tiles after it in its row slide right to make room and slide back when another scene plays (from the second tile playing to the fourth, the third and fourth slide left and the rest stay); they used to be put wherever the grid had room.

- **The lights picker and Edit automation were compared with the app's screens and redrawn**: full-width rows in a group, the expand button a round button that points down when closed and up when open (it pointed left), a partly chosen room with a minus and "10 of 12 lights selected", My entire home dimmed once rooms are chosen, tiles with a darker strip for the check and "Recommended" under gradient lights for wake-up and go-to-sleep, ✕ and DONE in the bar of Edit lights (a popup over a popup closes only itself); Edit automation has the sunrise icon, the time as two wheels, Fade duration as a row that opens a short sheet from the bottom with its slider and START AT, Repeat with its switch and the days from Sunday in one card, and Selected lights with a pencil and a tile with the room's icon and its number of lights. A wake-up can be set not to repeat (it runs once): the bridge takes it without days (tried with a throwaway), so `create_routine` and `update_routine` take `repeat`.
- **Edit automation is one screen**, as in the Hue app: tapping an automation opens its name, time, fade duration, days, lights and settings together with SAVE at the top (it disables itself until something changed, and leaving with changes asks), instead of the wizard's Next, Next, Next. Choices open over it and come back; the lights are the app's picker. A new automation is still asked step by step, as the app asks it.

### Added
- **The lights picker of the Hue app** (Choose your lights, Edit lights): *My entire home*, and rooms and zones as rows that open (a chevron) to show their lights as tiles, each with a round check, so a room is chosen whole or by single lights. The automation wizard uses it for Wake up, Go to sleep, Leaving home, Mimic presence and Smoke alarm (My entire home, several rooms and zones, or single lights; Timer, Lighting schedule and Coming home stay for one room or zone, since their scene belongs to one room), and a dimmer's or switch's *Selected lights* page is this picker with DONE (it was a list of rooms that wrote at once and could not choose single lights).
- `create_routine`, `update_routine` and `set_button_lights` take `targets`: a list of rooms, zones and the whole home, each whole or with chosen lights. Tried on the real bridge with throwaway disabled automations (`docs/bridge-findings.md`). The `rooms` and `zones` the bridge reports list each light with its name and icon type (`light_items`), and a switch's buttons list what they act on as the bridge keeps it (`where`).

### Fixed
- **A switch's brighten and dim buttons** showed "Do nothing" for their long press and could not be saved: the bridge writes such a button with the same action on its short press and on the repeat of a held press and no long press, and it refuses any other shape ("disallowed on_repeat"). The long press now shows what the short press does, and saving writes the shapes the bridge accepts: brightening or dimming sets both presses and removes the long press; anything else removes the repeat and gives the button the long press the Hue app writes.
- **A folder opened to an invisible card** (the pair of buttons beside the playing scene used a helper named like the one that places the card, so the second silently replaced the first and opening any folder failed half way). The invisible card lay over the page, so the next taps landed on a scene under it (a scene played) or on the card's scrim (a tap that did nothing). A test now fails when a function declares two helpers of one name.
- **Mimic presence** could stop on its summary page after a choice had been made on an earlier page: the chosen lights and the choice list shared one name.
- **A light hidden in Home Assistant is still in its room.** A Home Assistant group of lights (the Group helper, which hides its members by default) hid its lights from the Hue panel's room page and colour screen, so lights added to the bridge and put in a group (the Hue Irises) were missing, while the Hue app shows them. A room lists all its lights; only the Hue integration's own twin of a light Hue Plus has made is left out.
- **The panel opens once everything is read.** It showed the Home screen as soon as Home Assistant's lists were in and filled the rest in as the bridge answered, which is why a page could be drawn wrong for a moment (a bulb for a light's icon, a light missing). There is now one loading screen until the lists of Home Assistant, the bridge's rooms, scenes, controls, icon types and lights are read (at most twelve seconds; a reading that fails does not stop it), and then the panel opens.
- A light on the room page had a bulb for its icon until the bridge's list of lights had been read (the first room opened after the panel started, or after a reload): the icon was guessed from the name ("Bed Light" gave a bulb) and the colour screen then showed the right one. The icons on the page are now drawn again when the list arrives.

## [0.18.2] - 2026-11-15

### Fixed
- The Spotify sync's area choice (the Hue Plus panel's Sync screen and Home Control's) listed only entertainment areas of the type "music", so an area made for a monitor, a screen, a room or anything else (for example "Bora's Monitor") was missing. It now lists every entertainment area of the bridge, as the bridge reports them.

## [0.18.1] - 2026-11-14

### Fixed
- Importing a Hue scene (`import_hue_scene`, used by Home Control to import a Hue scene and to tell static scenes from live ones) failed for every scene with "is not a Hue scene": it looked for the core Hue integration's scene entities, which do not exist when Hue Plus runs on its own connection. Hue Plus's scenes are now read through Hue Plus's own entry.
- Adding a bridge that is already set up with a new address no longer makes the flow reload the entry as well as the entry's own update listener (Home Assistant 2026.11 reports it; 2026.12 stops allowing it).

## [0.18.0] - 2026-11-14

### Added
- **Hue settings in Home Control** (Settings, Hue Plus) have what the Hue panel has: a light's **Edit name and type** (the pencil by its name: the name and the bridge's icon type), **Device info** as the Hue app lists it (device type, manufacturer, model, MAC address, hardware version and software, read from the bridge), and a button's **Selected lights** (a room or zone, `set_button_lights`).
- `get_resources` `devices` lists each device's model number, maker, hardware platform, MAC address and lights.

### Changed
- The Hue panel's colour screen picks a light inside a shared marker with Home Control 0.10.0's own code (the copy in `lights/`), and its Orientation setup uses Home Control's orientation choices; the panel's own versions of both are gone.

## [0.17.0] - 2026-11-14

### Added
- **Hue panel, closer to the app:**
  - **Room edit mode** (the room's three dots, Edit): SELECT ALL per section, chosen tiles, REARRANGE (hold and drag the lights; the order is kept on the device and is the same in the room's row and on the colour screen, or back to names with one button), MOVE TO another room, EDIT, DELETE.
  - **My scenes** in two rows that scroll sideways, filled along the top row first; a scene dragged out of a folder card stands on its own, and dropped on a folder goes back in. Folder cards open under the first row, as a two-row strip.
  - **The colour screen**: its row of lights is the room page's row (same tiles, order and sideways position), so the row moves rather than being replaced. A light tapped while it shares a marker with others keeps the marker whole: the marker is picked for that light, its drop shows the light's icon, brightness, colour and effects act on that light, and only dragging takes it out. Closing follows the app frame by frame (about a quarter of a second; the wheel leaves past the top, the background gives way in the second half).
  - **Light settings**: *Edit name and type* (the name and the bridge's icon type), Device info as the app lists it (device type, manufacturer, model, MAC address, hardware version, software); lights are drawn with the icon of their type.
  - **Switch settings**: the Room row opens the room, Button controls and **Selected lights** (a room or zone, new service `set_button_lights`).
  - **Light placement**: a strip or tube is drawn between its real end positions, with **Orientation setup** (lying flat or standing up, parallel or perpendicular, cord at left or right); saving writes every position.
  - The Hue logo in the sidebar; another tab opens at once; pages inside a popup go back with an arrow.
- `get_resources`: entertainment area lights list every `positions` entry; `lights` gives each light's `archetype`. `update_entertainment_area` takes `positions` per light.

### Fixed
- The panel is a full-height column whose lengths follow the browser's zoom (it no longer fills a wide window as a blown-up phone), and the light screen is drawn at the right size in a zoomed Safari.
- Everything the panel needs from the bridge is read when it opens and kept between popups, so the colour wheel and the room's scenes and controls are there at once; the light screen's code comes in one request (it took many seconds through a proxy).
- The Sync screen fits its height; its brightness slider opens inside the panel.
- The colour screen no longer comes back empty when a light is tapped while it closes, and a sheet left open on it no longer reappears.

## [0.16.0] - 2026-11-13

### Added
- **Dashboard module** (off by default; switch it on in Hue Plus's options): a **Hue** panel in Home Assistant's sidebar (administrators only) that is a standalone clone of the Hue app, independent of Home Control and any other dashboard. It keeps nothing in Home Assistant: what it shows is the bridge's and what it changes goes to the bridge. It is as wide as a phone screen (9:16) in the middle of a wide one. Tabs:
  - **Home**: rooms and zones as cards; a room is a full page with its scenes as the app's folders (Lights, Scenes, Defaults; hold and drag to reorder, drop a scene on another to make a folder; a folder opens as a card), its lights and its controls; a scene has its own settings page.
  - **The colour screen** (tap a light): the wheel, white, effects (Hue Plus's calibrated catalogue), brightness and a tile for each light, run from a copy of Home Control's light panel code in a frame of its own (`scripts/sync_light_popup.py`). It opens as the room page turned into it and closes as the exact reverse, moving as the app does.
  - **Automations**: the app's grouped list, with the new-automation wizards.
  - **Sync**: the Spotify screen, coloured from the cover that plays, with Style, Intensity, Color and Brightness, the sync button and the entertainment area it plays on.
  - **Settings**: the app's list (Devices with adding devices and the lists of lights and switches, Bridges and Bridge settings, MotionAware areas, Entertainment areas with their edit page, light placement and brightness balancer, Smart home and linking apps, Software update with the time of day, Applications), the switch pages (buttons, presses, scene cycle) and light settings.
  Pages and popups move as the app's do (a page from the side, a popup from the bottom, each leaving the way it came), the page behind a popup stays alive, and smooth corners use `corner-shape` where the browser has it. Not included: the Hue app's Explore tab and scene gallery (Signify's cloud).
- `get_resources` lists each scene's `colours` and a new `lights` kind with what each light was last set to (the panel places lights that are off on the wheel by their last settings).

## [0.15.0] - 2026-11-12

### Added
- **MotionAware areas, as in the Hue app** (Settings, Hue Plus, MotionAware areas; needs a Bridge Pro): *Create area* walks through the app's pages (advice, the room, three or four devices, *Leave the area*, calibrating, a name, what the area does, which lights, the default times). Calibration is switching the area's motion service on (the bridge reports the area healthy after about 25 seconds). An area's page has its name, on or off, its status, **Control lights** (times that start at a time of day, sunrise or sunset, each with a scene or no lights and an optional switch-off delay), **Motion-sensitive devices** (three or four; the bridge recalibrates), **Motion sensitivity** (Very low to Very high) and **Daylight settings** (Disabled, or Sunrise/Sunset with minutes before or after each), and *Delete* (which also deletes the area's automation). A bridge takes four areas and a device can be in one.
- **Automations, as in the Hue app** (Routines and automations, *New automation*): Wake up (style, maximum brightness, fade, turn lights off after), Go to sleep (at a time or only by the play button; style, fade; ends with lights off, dimmed lights or a warm nightlight), Coming home (always or only at night), Leaving home, Mimic presence (one per bridge; all day or only when dark; ends with do nothing or lights off; rooms that were not chosen are switched off, as the app says), Timer and Lighting schedule (starts at a time, sunrise or sunset; optional end; On, Off or a scene; randomised times). They can be changed with the same pages (*Edit settings*), and wake up, go to sleep, timer and Mimic presence have **Start** and **Stop**, the app's play button.
- **Rooms and zones** (Devices, Rooms and zones): create, rename, choose the devices or lights, delete.
- **Bridges**: change the bridge's name and its Zigbee channel; a **Home location** row gives the bridge Home Assistant's home location (sunrise and sunset, and Coming home at night, need it).
- Remove a light or a switch from the bridge, and delete an entertainment area.
- Services `set_motion_area_lights`, `update_routine`, `trigger_automation` and `set_home_location`; `create_routine` takes `style`, `turn_off_after_minutes`, `end_state`, `mode`, `excluded_lights`, `when_type`, `start_type`, `until_type`, `action`, `until` and `randomize_minutes` and can make a Mimic presence routine; `set_motion_area` takes `lights` and `sensitivity`; `raw_request` accepts every resource the bridge lists. The requests are in `docs/bridge-findings.md`.

### Fixed
- Renaming a MotionAware area did nothing: the bridge wants `name`, not `metadata.name`. Creating one used a request the bridge does not accept.
- Switching a MotionAware area on now switches its motion service on, which is what makes it run.

### Changed
- `create_motion_area` takes `group` (a room or zone) instead of `zone`, and the lights as devices; `update_routine` leaves `enabled` alone unless it is given.
- The MotionAware area's page no longer has a light-level daylight setting (an area has no light sensor).

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
