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
- HP-9 dropped (2026-11-03, owner's decision D-17): signing in to Hue for the Spotify sync is not part of this repository; the sync keeps the entered token.

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
