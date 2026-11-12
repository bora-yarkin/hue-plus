# Roadmap

Status values: planned, in_progress, blocked, complete. The first incomplete item is the next one.

- HP-0 complete (read-only part), 2026-10-28: entry added on the real bridge; 36 entities, 37 services, all 17 resource
  lists read correctly, no key in any response, no log errors. Findings: D-9 (devices) and D-10 (services.yaml). Not run
  yet, waiting for the owner's approval: identify (flashes a light), timed effects, device search (opens pairing),
  Matter commissioning, press_link_button, firmware install (none waiting), every write action.
- HP-1 complete: design (see architecture.md and decisions.md D-1 to D-12).
- HP-2 complete: bridge module and shared core ported, clean entity and device names, tests carried over.
- HP-3 complete: zones module ported.
- HP-4 complete: scenes module with integration-owned storage, 14 presets, websocket library, Hue scene import.
- HP-5 complete: Spotify sync module (experimental).
- HP-6 in_progress: public readiness. Done: GPL-3.0-or-later, tests (207), CI workflows, community files. Open: README
  screenshots, repository name and URLs in the manifest, first release tag, live verification of every module.
- HP-7 complete, 2026-10-28: cut over on the owner's Home Assistant. Old entries and code removed, Hue Plus added (51 entities),
  `light.bed_light_zones` and `switch.hue_spotify_sync` kept their ids, dashboard v167 deployed, three scenes and one area
  pushed into the integration. Not yet tried live: starting a scene on the real lights, identify, timed effects, device
  search, Matter commissioning, firmware install and the write actions (they need the owner's approval).
- HP-8 planned: scene engine v2 for non-Hue devices, delegating Hue lights to `hue_plus` (separate repository).
- HP-9 in_progress (D-24): Spotify Sync developer OAuth alongside manual token and UUID entry. The developer app
  uses credentials entered in Spotify Sync options and the UUID from the private helper. Acceptance covers browser linking
  to the existing bridge, renewed token persistence, Sync reconnection, reauthentication, and the manual fallback.
  - HP-9.1 complete: config flow, refresh, expiry reconnect, and manual fallback verified in local tests on Home Assistant 2026.10.4.
  - HP-9.2 blocked on owner deployment: verify browser sign-in, clean restart, renewal, and Start/Stop on the box.

Backlog proposal (not scheduled, needs approval and a new dependency): local Entertainment streaming over DTLS.

## Gap features (2026-10-29)

- GF-1 complete: routines (wake-up, go-to-sleep, timer), button actions, daily smart scenes, Home and Away, motion settings.
- GF-2 implemented, EXPERIMENTAL, not verified on a real box (2026-10-29): second kind of entry (D-18), setup by address and button press,
  re-registration, switch (sync on/off), mode, HDMI input, intensity, brightness, HDMI signal. Services for the box are not built.
- GF-3 partly complete: schedule, coming home, leaving home, smoke alarm and relative steps done. Still unknown: Matter pairing request, bridge backup/restore, how a schedule turns lights off.
- GF-6 partly complete, 2026-10-29 (gap analysis against the bridge's own fields): done, read-only: light set-up details, Matter and
  Zigbee details, entertainment area limits, what each area does when a sync ends (`end_state`, seen on the real bridge), scene last
  recall. Done, documented by Signify: `set_motion_area` (on/off, rename), `delete_motion_area`. Done, EXPERIMENTAL (guessed, only
  tried against fakes): `configure_light`, `create_motion_area`, `set_streaming_end_state`. Not done, with the reason:
  Matter pairing code (Signify's documentation has only `has_qr_code` and a destructive `matter_reset`; no request is known, and a
  guessed Matter write could reset the bridge); Contact Sensor and PM scripts (no configuration known; `create_automation` takes any
  configuration); the sync box is done as experimental (GF-2).
- GF-4 implemented, EXPERIMENTAL, 2026-10-29 (owner approved the `ctypes` route; no new package): module `streaming` with its own
  registration (link button, options flow), a DTLS 1.2 pre-shared-key client over the OpenSSL library Python uses (`streaming/dtls.py`),
  the HueStream v2 message (`streaming/protocol.py`), services `stream_colors` and `stop_streaming`. Checked against `openssl s_server`
  (handshake, a wrong key failing, frames arriving); NOT tried on a real bridge (the Spotify sync was running; an area cannot do both).
- GF-5 blocked on hardware: Hue Secure (cameras, contact sensors, alarm).

## HP-11 Own connection (2026-11-05, owner's decision D-23)

- HP-11.1 complete (tested against a fake and real aiohue objects; not tried on a real bridge): direct connection with a pinned certificate, setup, reconfigure, re-registration, removal.
- HP-11.2 complete, 2026-11-10 (owner: "make Hue Plus a complete integration", and it must still work side by side with the Hue integration, riding on its connection and hiding or not hiding its entities, D-28): the platforms are copied into `custom_components/hue_plus/hue/` (Home Assistant 2026.11.0, Apache-2.0, `NOTICE.md`), the manifest drops the `hue` dependency (it keeps `after_dependencies: hue`) and names `aiohue`; tests check that no file imports the Hue integration. An entry on the Hue integration's connection can get its own (*Reconfigure → Use my own connection*), keeping its entities. Not yet tried on the real bridge.
- HP-11.4 complete, 2026-11-05 (tested with fakes; the writes experimental): entertainment areas keep each light's brightness balance and segment positions when positions are written (an earlier version reset them), report and set the balance and the performance mode.
- HP-11.3 planned: bridge facts the code does not use yet (read-only), then the writable ones as experimental (see the 2026-11-05 list in the chat; each write is tried live only with the owner's approval).

## HP-10 Live scenes v2: combined scenes (planned, direction chosen by the owner 2026-10-30; built here, not in `scene-engine`, D-20)

Goal: a live scene is made of parts the owner mixes in the dashboard's one "New scene" creator, and can also switch other devices. Order matters.

Per-light looks (owner, 2026-10-30): inside the creator the owner taps a light and sets its own look with the same light popup used everywhere (colour wheel, brightness, effects): one colour or several that rotate, a brightness, brightness effects, and, on a light that has them, a Hue native effect such as underwater. A light with no look of its own follows the scene's defaults. Example: underwater on one lamp with three colours rotating while it runs, a slow pulse on another.

Finding (checked in `homeassistant/components/hue/v2/light.py` and `aiohue`): a native effect can carry a colour and a speed through the bridge's `effects_v2`, but Home Assistant's own `light.turn_on` clears the colour when an effect is given. So a native effect with rotating colours must be written by Hue Plus through its own bridge connection, one write per light per colour change. Unknown until tried on a real light: whether a colour change restarts the effect's animation. That is part of the live test, not assumed.

- HP-10.1 complete, 2026-10-30 (tested with fake lights and a test Home Assistant; not deployed): effects as a seam, per light. A light's colours come from a colour source and its brightness from any number of brightness effects, behind small pure interfaces; each light uses its own look when it has one, else the scene's (`scenes/effects.py`, ported from `scene-engine` SE-11, which is proven unchanged by a hash comparison). `Library` also gets `restore` (validate what storage returns, copy aside what cannot be kept), as in `scene-engine` SE-10; it matters more with more fields. Acceptance: every command of the palette scenes is identical before and after (hash comparison recorded from Hue Plus before the change; it is also identical to the recording of `scene-engine`, so the two engines were the same); existing saved scenes load unchanged. Built: `scenes/effects.py` (`ColourSource`, `PaletteSource`), `colour_source` in definitions, library and the services, `Library.restore`, the copy of a damaged store at `hue_plus.scenes.<bridge>.damaged`. The per-light look itself (HP-10.6) is not built: the seam already asks the source per light (`colour(entity_id, ...)`), and a source that gives lights their own looks is what HP-10.2 and HP-10.6 add.
- HP-10.2 complete, 2026-10-30 (backend; tested with fake lights; deployed with the dashboard creator): colour sources `palette` (as now) and `rainbow` (the hue goes round the wheel once per loop, each light offset by where it stands). A `solid` source was dropped: a palette of one colour is solid.
- HP-10.3 complete, 2026-10-30 (backend; tested): brightness effects, any combination of up to 4 per scene, each with its own speed and strength: `pulse` (breathing), `flicker` (candle-like wander), `sparkle` (a light now and then brightens), `lightning` (irregular bright flashes, sometimes two). Deterministic for the same seed and time. Each has its own minimum update interval, so a fast effect is not slowed to the engine's 1.5 s for fading lights.
- HP-10.4 complete, 2026-10-30 (backend; tested; owner chose: run at the start only, on/off in the listed domains): scene actions. A live scene can list devices to switch on or off when it starts, for example a light that is not in the scene, or a TV. Stored in the scene, run by Home Assistant (so a scene works without the dashboard), with the context of whoever starts it, so Home Assistant's own permission checks apply. Only the allowed domains and only turn on / turn off; not arbitrary service calls.
- HP-10.5 planned: dashboard, the creator. One "New scene" that asks the kind (normal, live, or combined: live plus device actions) wherever a scene is created (the add-a-scene sheet, Settings, Scenes, quick actions); an editor for the colour source, brightness effects and actions; the live scene editor reachable from there and not only through "Import as a live scene". Verified in the sealed copy first, then on the real panel. Home Control, separate branch.
- HP-10.6 backend complete, 2026-10-30 (`looks`: a light's own colours, brightness, brightness effects and native effect; tested). Dashboard part planned: dashboard, per-light looks. In the creator, tapping a light opens the light popup in a scene mode: the colour wheel (with "add another colour" for a rotating set), brightness, the light's native effects and the brightness effects, all editing that light's look in the scene rather than the light itself. Reuses `lightpanel.js` and the shared components; no second popup. Whether the real light previews each change while editing is an open question (owner).
- HP-10.7 implemented, EXPERIMENTAL, never tried on a real light (backend 2026-10-30; written from aiohue's models, tested against a fake bridge only): native Hue effects in a scene, with the scene's colours rotating through `effects_v2` written by Hue Plus itself (see the finding above).
- Static scenes (fixed device settings run from the browser) stay in the dashboard and are not part of HP-10 (D-21). A live scene's device actions (HP-10.4) are only on/off; richer device settings are what a static scene is for.
- HP-10.0 complete, 2026-10-30 (Home Control v182): the dashboard no longer deletes or overwrites live scenes and areas in Hue Plus (D-21), so what HP-10 saves in Hue Plus survives. Done on a Home Control branch; not deployed.
- Negative requirements for all: an old scene plays exactly as before; a bad definition starts nothing and saves nothing; no effect sends faster than the rate limiter allows; an action cannot run a service other than on/off, nor on a domain outside the allowed list, nor on an entity the starting user may not control.
- Not scheduled: `scene-engine` using this storage when both are installed (recorded in `scene-engine` D-21); needs HP-10.1 to HP-10.4 proven first.

## HP-12 Hue Plus becomes a provider for Home Control (2026-11-07, owner's decision D-25; Home Control P5)
- HP-12.1 in_progress (built and tested; not yet released or checked on the real box) (Home Control P5-A): `home_control.json` declares the Hue lights Hue Plus owns, their command rate, and the native effects; a service `hue_plus.play_effect` plays a light's own effect with a colour through the bridge (what `scenes/hue_native.py` does). AC: the command written to the bridge for a native effect equals what the old engine wrote; a light without a bridge id gets the colour without the effect, as before.
- HP-12.2 planned (Home Control P5-B): the effect catalogue (groups, icons, labels) and the Hue Plus menu script come from Hue Plus (`menu.js` registered to the dashboard's Settings), not from Home Control.
- HP-12.3 in_progress (built and tested; not yet released or checked on the real box) (Home Control P5-C): the scenes package (engine, library, `hue_plus.scene_*`, `area_*`, `locate_light`, `get_library`, the live-scenes sensor and websocket command) is removed; `import_hue_scene` and `activate_scene` stay (they read and play the bridge's own scenes). AC: nothing in Hue Plus refers to live scenes or areas; the Hue Plus tests that covered them moved to Home Control first.


## HP-13 The Hue app in the dashboard (owner's requirements, 2026-11-10, D-29)

Goal: reproduce the Hue app's behaviour as closely as possible, written to the bridge, with all Hue-specific dashboard code in Hue Plus (plugin API; nothing Hue in Home Control). Reference screens: `hue new images/` (IMG_0471 to IMG_0506: Automations list and wizards, the "Add a scene" screen, the MotionAware area wizard and its Edit area page) and `hue-app-images/` (bridge settings, accessories, button programming).

Requirements (owner):
- R1 Every Hue scene (static and dynamic) is a dashboard scene like any other (rows in sections, run together with other devices like classic scenes), keeping the Hue icon as the mark of its origin.
- R2 Scenes are made and edited from the scenes section only: the new-scene popup gets Hue's kinds (custom scene, save current settings, all-day scene, colour palette from a photo; the cloud gallery cannot be reproduced) and a Hue scene is edited with the dashboard's light popup in scene mode, the way the Hue app edits a scene. Saving writes to the bridge.
- R3 Automations (Wake up, Go to sleep, Coming home, Leaving home, Mimic presence, Timer, Lighting schedule) and MotionAware areas (create, calibrate, edit: nightlight schedule, motion-sensitive devices, sensitivity, daylight settings) are in the Hue Plus menu, built as the app's wizards, and written to the bridge.
- R4 Gap work: what Hue Plus has but the dashboard does not show, and what the bridge exposes that is not built (list below, from `analysis/gap-analysis.md`, 2026-10-29, and the 2026-11-10 check).
- R5 The UI is as close to the Hue app as possible.

Order: (1) Hue scenes as dashboard scenes; (2) Hue scene creation and editing; (3) Automations; (4) MotionAware; (5) gaps. Each step is deployed to the owner's box for testing before anything is released (owner's rule), and ships its dashboard side in the same piece of work.

### HP-13 status (updated 2026-11-12, branch `hue-app-wizards`; dashboard checked in the sealed harness, bridge shapes checked on the real bridge)

Status words: done = a page in the menu that writes to the bridge; missing = no page. "Bridge" says what was tried on the owner's Hue Bridge Pro: *request proven* = the exact request was sent with `raw_request` and accepted (throwaway objects, deleted afterwards); *service not tried* = the Hue Plus service that sends it has only run against fakes until the box is restarted onto this code. Details: `docs/bridge-findings.md`.

| Step | What | Menu | Bridge |
|---|---|---|---|
| 1 | Hue scenes as dashboard scenes | done (0.14.1) | live |
| 2 | Create / edit / rename / delete Hue scenes | done (`huenewscene.js`) | not recorded |
| 3 | Automations: list, on/off, delete | done | live (existing) |
| 3 | Wake up, Go to sleep, Timer, Lighting schedule, Coming home, Leaving home: create and edit (`huewizard.js`) | done | `create_routine` and `update_routine` tried on the real bridge for wake up, go to sleep, timer, schedule, coming home and leaving home (disabled, read back as sent, deleted) |
| 3 | Mimic presence (`PM` template, one per bridge: where, all day or only when dark, end with) | done | request proven (as a disabled throwaway); service not tried |
| 3 | Go to sleep: "At a certain time" or "With a button press", End with lights off / dimmed lights / warm nightlight | done | requests proven; the play button is `trigger_automation` (start / stop), tried on a throwaway routine for the bathroom light |
| 3 | Play and stop for wake up, go to sleep, timer and Mimic presence | done | request proven |
| 3 | Lighting schedule: start at a time, sunrise or sunset, optional end, on / off / scene | done | `create_routine` tried for time, sunset to sunrise, on and off, and a scene |
| 3 | Coming home: always or at night | done | `always` and `nighttime` tried (the bridge's home location is now set) |
| 4 | MotionAware: list, create (the app's pages, with calibration, four areas at most, a device in one area), name, on/off, devices (3 or 4), sensitivity (Very low to Very high), times (a time, sunrise or sunset) and scenes or no lights ("Control lights"), daylight (sunrise/sunset), delete (`humotion.js`) | done | create, rename, devices, sensitivity, "Control lights" and delete tried through the services; calibration: request proven (enable the area's motion service), wizard step not tried on the real bridge |
| 4 | MotionAware: "Area activity" (high / low) and the algorithm mode (`mimic_pir` / `mimic_radar`) | not built: no writable field found for activity, and which mode it means is a guess | read only |
| 4 | MotionAware: "Group with other sensors", "Send alerts" | not built: a sensor group needs other sensors; alerts are a Signify subscription | no |
| 5 | Rooms and zones: create, rename, devices, delete (`huerooms.js`) | done | clicked through in the real dashboard (a zone: create, rename, change lights, delete) |
| 5 | Bridge home location: a row on the Bridges page, "Set the bridge's home location to Home Assistant's" (`set_home_location`) | done | the request was proven earlier; the button's service loads at the next restart |
| 5 | Bridge: name, Zigbee channel | done | service not tried |
| 5 | Remove a light or switch; delete an entertainment area | done | not tried (destructive) |
| 5 | Sensors: sensitivity, `configure_sensor` | not built into a page | no motion sensor on the bridge |

Known limits: the scene gallery, Coming home / Leaving home (geofence by the phone and Hue's cloud), Custom AI behaviours and Security alerts (subscription) are Signify cloud features; the bridge's local API has no counterpart. Where the local API has part of one (the bridge's `geofence_client`, `behavior_instance` of those templates), Hue Plus shows and edits that part.

2026-11-10 check: 54 services; 19 are used by the dashboard menu. Not on the dashboard yet: create/update/delete scene, smart scene (create, set), room and zone create/update/delete, create automation and routine, create daily smart scene, motion area create, bridge settings (set name, auto update, check for update, install bridge update, Zigbee channel, link button, search for devices, remove device), entertainment area delete and control, identify signal, power-on behaviour, light step, sensor configure, raw request, effect and gradient setters. The bridge-side gaps are the 11 rows of `analysis/gap-analysis.md` (after-streaming behaviour, gradient orientation and order, light function, minimum dim level and gamut, battery state, scene last recall, Matter pairing code, Zigbee diagnostics, motion area candidates, Contact Sensor and PM scripts).
