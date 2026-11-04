# Testing

Set up once (Python 3.14):

```bash
uv venv --python 3.14 .venv && uv pip install --python .venv/bin/python pytest-homeassistant-custom-component aiohue ruff
```

Run: `.venv/bin/python -m pytest -q`, `.venv/bin/ruff check .`, `.venv/bin/ruff format --check .`.

- `tests/bridge`, `tests/zones`, `tests/scenes`, `tests/sync`: the Home-Assistant-free modules, against fakes (a fake bridge
  server, fake lights and virtual clocks, a fake sync service).
- `tests/ha`: the integration inside a real Home Assistant test instance, against `FakeHueApi`, a small stateful home.
- `tests/test_spec.py`: the service description is complete and the generated files are current.

Checked on a real Hue Bridge Pro (2026-10-28, six lights, one gradient light), in addition to the tests:
timed effects, signals, identify, power-on behaviour, automatic update switch and time, scene create/rename/delete, zone
create/rename/delete, entertainment area create/rename/delete/start/stop, device search, the zones styles and zone colours and
gradient points, light effects, live scenes (start, update, freeze, play, stop, locate), Hue scene import, and every Spotify
sync setting. Three bugs only a real bridge showed were fixed (a signal needs a duration even to end it, a zone needs an
archetype, the data an action looks names up in must be read after the previous write).

Verified on the real bridge with throwaway items (created disabled, then deleted): the wake-up, go-to-sleep and timer
routine configurations (shapes found from the bridge's own error messages). `configure_button` builds on the configuration
the Hue app wrote for a real dimmer switch. Home and Away is read from the bridge.

Also verified on the real bridge (2026-10-29, with disabled throwaway routines, deleted afterwards): the configuration shapes of
the Schedule, Coming home (`always` and `between`), Leaving home and Smoke alarm templates, and the relative brightness and
colour temperature steps (brightness 30 to 50 to 40, mirek 370 to 420 and back). A schedule can only recall a scene: the way a
schedule turns lights off was not found (use go-to-sleep). Home and Away must be set up in the Hue app before coming home or
leaving home do anything. The bridge's `sonos` resource is an empty stub, and MotionAware zones can be listed but not created
(there is no motion sensor on the author's bridge).

The streaming module (`tests/streaming`) runs a real DTLS-PSK server, `openssl s_server`, and skips itself where that openssl cannot (the macOS system one cannot; Homebrew's and Linux's can). Experimental, not tried on a bridge: the whole streaming module, with the same
limit as the others below. Also experimental, tested only against fakes: `create_motion_area` (Signify's documentation does not describe creating one; the request copies the shape of an existing area), `set_streaming_end_state` (only `last_state` has been seen; `off`, `pause` and `scene` are guessed names), `configure_light` (the values `forward`/`reversed` and `horizontal`/`vertical` are assumed; only `forward` and `horizontal` have been seen), `configure_sensor` and the motion switch and sensitivity entities (no motion sensor
at hand), `create_daily_smart_scene` (the timeslot shape follows Signify's description; the bridge was not asked), and the
whole Hue Play HDMI Sync Box part (`syncbox/`: client, setup flow, re-registration, entities; written from the box's published API, never tried on a box). Its HA-level tests replace the client with a stand-in (`tests/ha/test_syncbox.py`); the client has its own tests against a fake HTTP box.

Not built because the request is unknown: Matter pairing and bridge backup/restore. Not built because it needs a new
dependency: local entertainment streaming (DTLS). A routine from the bridge's "Schedule" template is not offered: its shape
was not found.

Not verified: firmware install of a device (none was waiting), smart scene and automation creation, `press_link_button`,
`set_zigbee_channel`, `remove_device`, `revoke_app` and `install_bridge_update` (they change who or what is on the network).
Starting Matter pairing was removed: the bridge refused the guessed request and no working one is known.

2026-10-30 (HP-10.1): `tests/scenes/test_palette_unchanged.py` compares every command of 116 palette scenarios (spreads, ranges, speeds, palettes, three kinds of light, a retune, a freeze) by SHA-256 with a recording made before the change; it passes, and the recording is byte-identical to `scene-engine`'s. Thirteen deliberate breakages of the seam, `Library.restore` and the damaged-store copy are each caught.

2026-10-30 (HP-10.2 to HP-10.4, HP-10.6, HP-10.7 backend): 383 tests pass. Colour sources, the four brightness effects (bounds, repeatability, strength, per-light courses, the flash timing of lightning), per-light looks, actions (allowed domains, the starting user's context, one failure not stopping the rest, only at the start) and native effects (the bridge call with colour, brightness scale and speed; fall back when the light has no bridge id or does not offer the effect; leave when switched off; no more than one write per light every 3 s) are tested against fake lights, a fake bridge and a test Home Assistant. Eighteen deliberate breakages of them are each caught. Not tested: any of it on a real light. The effects' look (how smooth flicker, sparkle and lightning are on Matter bulbs over Thread, how the bridge reacts to a colour change during a native effect) can only be judged on the real lights.

2026-10-31 (first run on real lights, the owner's bedroom, Hue lights): plain palette, rainbow, pulse, flicker, per-light looks (own colours and brightness, no effects), a device action (a light switched off) and a native effect (underwater) with rotating colours all worked. Found and fixed: sparkle and lightning made the engine take the lights for ones a person had changed (the brightness swings further than the limit), so lights left the scene and it went still; a light with brightness effects now leaves only when switched off or given another colour. Not yet judged: how smooth the effects look to the eye, and flicker/sparkle/lightning on the Matter bulbs.


## Spotify developer OAuth acceptance (HP-9)

The full local suite passed 434 tests on Home Assistant 2026.10.4. OAuth tests use Home Assistant's HTTP callback,
signed state, and app credential storage with simulated token responses and a local WebSocket service. They cover switching from OAuth to manual, rejected UUIDs, malformed callbacks, saved rotation
across reload, renewal without a bridge reload, WebSocket reconnect and Start/Stop after renewal, and redirect rejection.

After owner deployment, use the UUID handoff and your own Hue Remote API app. Register the exact callback shown in the
Reconfigure flow, complete browser sign-in, and verify Spotify Sync state and Start/Stop. Restart Home Assistant to
check that the OAuth session reconnects. At renewal, verify the Sync connection returns and the bridge stays loaded.
Check the manual token option separately. Before rolling back to a version without developer OAuth, switch the entry
to manual credentials or turn off its Sync module.
