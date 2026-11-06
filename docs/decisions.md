# Decisions

Confirmed by the owner on 2026-10-28.

- D-1 Name: "Philips Hue Plus", domain `hue_plus`, unofficial. One integration with modules Bridge, Zones, Scenes and
  Spotify sync, each switchable.
- D-2 Entity ids and service names are new and clean. The old ids (`hue_bridge_tools`, `hue_gradient_zones`,
  `hue_spotify_sync`, `scene_engine`) are not preserved. A mapping table old to new is produced for the dashboard cutover.
- D-3 Old integrations stay installed and disabled until the dashboard cutover; the owner decides when they are removed.
- D-4 Live scenes and areas are stored inside the integration (Home Assistant storage), managed through services and a
  websocket API, so it works without the owner's dashboard. A set of default effects and palettes ships with the
  integration (the common Hue effects with their usual settings). The owner's existing scenes and areas are migrated once.
- D-5 The scene engine is split: the Hue part lives here (Scenes module); a later separate integration serves non-Hue
  devices and delegates Hue lights to `hue_plus` through a service that applies a batch of light states to the bridge in
  one request with bridge-side transitions. `hue_plus` also works alone.
- D-6 The Spotify sync uses Hue's private cloud WebSocket and is experimental. It works with a token the user
  obtains and enters by hand, or with an OAuth token for the user's registered Hue developer app (D-24).
  The APK helper is a separate private project.
- D-7 HomeKit is out of scope for now.
- D-8 Tests: stdlib tests for the HA-free core, `pytest-homeassistant-custom-component` in a local virtual environment for
  the Home Assistant layer. Licence and repository name are decided at HP-6.
- D-9 Devices (found in HP-0 on Home Assistant 2026.10.4): a device belongs to exactly one config entry and identifiers are
  scoped per entry, so entities cannot join the core Hue integration's devices. `hue_plus` creates its own devices
  (named after the light or accessory, manufacturer Signify, model from the bridge, `via_device` the bridge's device) and
  its own bridge device. Entities that merely duplicate a core Hue entity are not created.
- D-10 Generated `services.yaml` must quote every field key (`on` is read as boolean `True` by YAML 1.1; Home Assistant
  rejected `set_power_on`).
- D-11 Licence: GPL-3.0-or-later for this and every other repository of the owner's Home Assistant work.
- D-12 One config entry per bridge; modules are options of the entry. Changing modules or the sync credentials is a single
  entry update (two updates reload twice and the second can land while nothing listens).
- D-13 The dashboard keeps sending full scene definitions when it starts a scene; it also saves scenes and areas into the
  integration so automations can start them by id.
- D-14 Hue Plus replaces the Hue integration's light entities (module `lights`): they are hidden and renamed, never deleted, so the
  replacement is reversible. The connection stays the Hue integration's for now; cloning its features and connection is the long-term aim.
- D-15 A gradient light is one main light named like its device (it carries the lights' effects and lists its zones); the separate
  "Zones" light is removed.
- D-16 The `devices` module reuses the Hue integration's platforms through a proxy entry instead of copying them: less code, every feature, and the same
  long-term aim as D-14 (copy them out when Hue Plus has its own connection).
- D-17 (owner's decision, 2026-11-03; developer sign-in superseded by D-24) Hue Plus does not sign in to Hue on the user's behalf. The Spotify sync takes a token and
  UUID the user enters on the configuration screen (no file is read); when the service refuses the token,
  Home Assistant asks for a new one (reauthentication). Reusing the Hue app's own identifiers is not part of this repository.
- D-18 (2026-10-29, owner's choice) A Hue Play HDMI Sync Box is a second kind of config entry of this integration, not a separate
  integration. It is told apart by `syncbox_host` in the entry's data, has no modules, and its `Runtime` is a `SyncBoxRuntime` whose
  `modules` is `{"syncbox"}`; because every platform file goes through `platform.forward`, the bridge's modules are simply not set
  up for it. The websocket call lists bridges only.
  Consequences: one HACS install covers bridge and box; the options flow of a box says it has none; removing the entry asks the box
  to forget the registration. Experimental: written from the box's published API without a box (see testing.md).
- D-19 (2026-10-29, owner's choice) Local entertainment streaming uses OpenSSL through `ctypes` instead of a package. The only Python
  DTLS-PSK package (`python-mbedtls`) has no wheel for Python 3.14 or Alpine, and Python's `ssl` has no DTLS. The module implements
  no cryptography: it calls OpenSSL's DTLS 1.2 client with the PSK callback (`TLS_PSK_WITH_AES_128_GCM_SHA256`, the suite Hue uses).
  Streaming needs a key only a new registration can create (`generateclientkey`), so the module asks for a link-button press and keeps
  its own app key, client key and application id in the config entry. A stream's whole life (start the area, connect, send, stop the
  area) is one task; a new stream to an area replaces the old one; unloading stops all. Risks: ctypes mistakes are memory errors
  (the callback checks buffer sizes, tested); the libssl found by name may differ from the one Python uses (untested on the box).
- D-20 (2026-10-30, owner's choice) Combined live scenes are built in Hue Plus, not in `scene-engine` (which is paused). A scene has a colour source and any number of brightness effects (HP-10.1 to HP-10.3), and may switch other devices on or off when it starts (HP-10.4). The dashboard has one "New scene" creator for normal, live and combined scenes (HP-10.5). Each light in a scene may have its own look (colours, brightness, brightness effects, a Hue native effect), set from the light popup (HP-10.6). Supersedes the idea that `scene-engine` carries the effects (`scene-engine` D-16 and D-17). When both integrations are installed `scene-engine` may later use Hue Plus's storage (`scene-engine` D-21); that is not built.
- D-21 (2026-10-30, owner's choice) Who owns what. Hue Plus owns live scenes, areas, effects and a live scene's device actions, with their storage and playback, for any light. The dashboard owns its screens and **static scenes** (fixed settings of lights, AC, TV and so on, run from the browser); static scenes stay there. The dashboard keeps no live scene or area content of its own. Staged: step 1 (2026-10-30, Home Control v182) stops the dashboard deleting or overwriting what Hue Plus holds; the dashboard's own copy of its live scenes stays until HP-10.5 and HP-10.6, when the new creator reads and writes Hue Plus directly. Until then a live scene deleted through Hue Plus services is re-created from the dashboard's copy when an administrator opens the dashboard. `scenes/` must stay separable (D-20 and `scene-engine` D-21): its pure modules import nothing from the rest of Hue Plus.
- D-23 (owner's decision, 2026-11-05) Hue Plus can connect to a bridge itself, without the Hue integration. It registers with the bridge (link button; the same
  registration also makes the streaming keys), keeps the app key in its config entry and uses aiohue's client, so connecting, reconnecting and the event stream
  are aiohue's (`direct.py`). Next to a Hue integration entry for the same bridge Hue Plus keeps riding on the Hue integration's connection; a bridge the Hue
  integration has is refused as a direct entry. aiohue and the Hue integration switch the certificate check off (the bridge's certificate has no public chain),
  so a direct connection pins instead: the fingerprint read while registering (a person is at the link button) must be shown on every later connection, requests
  and event stream alike; a bridge that shows another one is refused and re-registering (link button) learns the new one. No `requirements` entry: the `hue`
  dependency already brings aiohue at the version Home Assistant runs, and a pin of Hue Plus's own could clash with it. The Hue integration's platforms are still
  the ones Hue Plus runs for lights and devices (D-14, D-16); copying them out, to drop the dependency, is not done.
- D-22 (owner's decision, 2026-11-03) The Hue integration's entities are hidden and renamed only when the user chooses so on the setup screen. The default is to leave them alone: Hue Plus's entities then end in `_plus` and follow the Hue entity they copy (matched by unique id) one way, for good: area, name, icon, labels, hidden by the user, and the device's area and name (`lights/alongside.py`, `async_follow_hue_settings`). An entry made before the choice existed has none stored and keeps hiding and renaming. In the leave-alone mode live scenes, areas and locating a light accept Hue lights only (`scenes/hue_only.py`). Consequences: both sets of entities exist; a dashboard that wants one set filters by platform and unique id.
- D-24 (owner's decision, 2026-11-05) Hue Plus supports OAuth only with a user's own registered Remote Hue API app.
  The Spotify Sync options dialog hands off to the native OAuth config flow. The bridge entry stores the entered
  developer Client ID and Client Secret, linked Spotify Sync UUID, and issued token pair after verification. Entries
  linked through Application Credentials in the first beta continue to use those credentials. The Sync connection renews before
  expiry and reconnects with the new access token. A manual token can still be entered in options. The private APK helper supplies a one-time UUID or
  manual token export. The integration uses neither the official app's credentials nor its login implementation.
- D-25 (owner's decision, 2026-11-07) Hue Plus is Hue only and hyper optimised for Hue, and it is independent of the dashboard. It owns everything that talks to the bridge itself: entertainment areas, Spotify sync, gradient zones, other bridge, Hue cloud, bridge scenes and their import, the calibrated native effects and the bridge's command pacing. Live scenes, areas and their playing move to Home Control (Home Control D-12); Hue Plus stays an expansion pack for them: it declares itself to Home Control in `home_control.json` (the lights it owns, its effects with groups and icons, its settings menu script) and plays its lights through its own services (Home Control D-13). Supersedes the "for any light" ownership in D-21. Hue Plus stays installed and important: with it the dashboard plays Hue lights through the bridge as before; without it Home Control still plays them through `light.turn_on` and the effects Home Assistant reports.

