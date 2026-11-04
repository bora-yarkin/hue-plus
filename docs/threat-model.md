# Threat model

**Assets.** The bridge (can switch lights, remove devices, change who may use it), the Hue application key (held by the Hue
integration; for a bridge Hue Plus connects to itself, by Hue Plus in the config entry, as is the pinned certificate fingerprint), the Spotify sync token (in the config entry).

**Actors.** Home Assistant administrators; other Home Assistant users; anything that can call a service (automations, other
integrations); the bridge and the Signify sync service (trusted to answer, not to be well-formed).

**Controls.**
- A direct connection (D-23) only talks to a server showing the certificate pinned when Hue Plus registered, on every request and on the event
  stream (`direct.py`, tested against a real TLS server). The pin is learned at registration, which needs a person at the bridge's link button; a
  look-alike answering that very moment is the one gap (an attacker on the local network at the moment of setup). The Hue integration and aiohue
  do not check the certificate at all, so riding on their connection is the weaker of the two. A changed certificate asks for the link button
  again instead of being accepted. Removing the entry asks the bridge to forget the registration.
- Bridge services are administrator-only; a call with no user (an automation an administrator wrote) is allowed.
- Twelve destructive actions need `confirm: true`; revoking the key Hue Plus itself uses is refused.
- `raw_request` is limited to a list of resources; anything but GET needs `confirm`.
- No key or token appears in a log line, an error, a service response or a state attribute (tests check this).
- Scene input is validated whole (`definitions.py`) with fixed limits (sessions, lights, palette size, stored scenes and
  areas, `ui` size); a bad request changes nothing.
- A light changed by a person leaves its scene; stopping a scene never changes lights; the locate helper always restores.
- A scene can switch other devices when it starts (HP-10.4): only on or off, only for light, switch, fan, media player, climate,
  humidifier, input boolean and cover, at most 12, checked when the scene is saved, when it is loaded from storage and when it
  starts. Locks, alarms, scripts, automations and every other service are not reachable this way. The calls carry the context of
  whoever starts the scene, so Home Assistant refuses a device that user may not control; a failing action is logged and never
  stops the scene or the other actions. Any user who may start a scene triggers its actions: that is the purpose, and it is why
  the list is short.
- A light can play one of its own effects with the scene's colours (HP-10.7, experimental): this is a write to the bridge
  through the Hue integration's connection, limited to a fixed list of effect names, the light's own id and one write per light
  every 3 seconds at most; a light that does not offer the effect is driven normally.

**Spotify sync token.** The token and UUID are entered by the user (or read once from a file that is then deleted) and stored in the config entry like any credentials. They are checked against the sync service before being stored, never logged or put in errors (tests check this), and a refused token starts a reauthentication; nothing is renewed automatically.

**Accepted risk.** The Spotify sync depends on a private cloud interface and a token the user obtains themselves; it is
experimental and off by default. Its token is stored in the config entry like any integration's credentials.

**Local streaming (experimental, off by default).** New secrets in the config entry: Hue Plus's own app key, the client key (the
pre-shared key of the DTLS connection) and the application id. They are never logged or shown (`Registration` hides them in its
repr; tests check the DTLS errors do not name them). The registration needs a physical press of the bridge's link button. Native
code: the OpenSSL calls go through `ctypes` (D-19); the PSK callback refuses an identity or key that does not fit OpenSSL's buffers.
The services are administrator-only. Frames are validated whole before anything is started (channel count, colour range, area id).
A stream is bounded (1 hour at most) and always ends by telling the area to stop. Unverified: the bridge's own handling of malformed
frames, and which libssl `ctypes` finds on the Home Assistant box.
