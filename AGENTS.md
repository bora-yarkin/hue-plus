# Philips Hue Plus: project instructions

- Domain `hue_plus`, display name "Philips Hue Plus". Unofficial; never use Signify logos.
- Source of truth for order and status: `docs/roadmap.md`. Decisions: `docs/decisions.md`.
- Layering: HA-free core (API client, models, payload builders, engine) in plain Python with stdlib tests; a thin Home
  Assistant layer on top (coordinator, entities, config flow, services); see `docs/architecture.md`. Keep the core free of `homeassistant` imports.
- Reuses the core Hue integration's connection (`hue` config entry); never stores bridge keys itself.
- Admin-only and destructive actions need `confirm: true`; keys and tokens never appear in logs or error messages.
- A live Home Assistant restart is done only when the owner says so. Test against the real bridge with read-only calls
  unless the owner approved the exact visible action.
- Commit to `main` only for docs; use a work branch for code. Public at https://github.com/bora-yarkin/hue-plus (installed through the Marketplace (HACS inside Home Assistant) as a custom repository; not in its default list). The Hue app's identifiers and the Hue sign-in code are not in this repository (D-17); the owner keeps them in a local branch of the private working copy.
- Tests: see `docs/testing.md`. Generated files (`services.yaml`, `strings.json`, `translations/en.json`) are written by
  `scripts/generate_services.py`; never edit them by hand.
- Licence GPL-3.0-or-later; every Python file starts with the SPDX line.
