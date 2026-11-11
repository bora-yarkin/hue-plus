# Bridge findings (verified on the owner's Hue Bridge Pro, 2026-11-12)

Each line was observed on the real bridge through `hue_plus.raw_request`, not guessed.

## MotionAware (`motion_area_configuration`)

- Create: `POST motion_area_configuration` with `{"name": str, "group": {"rid": <room or zone id>, "rtype": "room"|"zone"}, "participants": [{"resource": {"rid": <motion_area_candidate id>, "rtype": "motion_area_candidate"}}, ...]}`. The name is top level, NOT `metadata.name`. Fewer than three participants is refused ("Invalid rfsensing_area_configuration participants"); other participant shapes (device ids, `service`, `member`, `sensor`) are refused.
- The bridge answers `{"data": [{"rid": <new id>, "rtype": "motion_area_configuration"}]}`.
- A new area reads back `{"id", "name", "group", "participants", "services": [convenience_area_motion, security_area_motion], "health": "not_running", "enabled": true}`. `health` is read-only (a PUT of it is "Not compliant").
- `PUT motion_area_configuration/<id>` with `{"name": ...}` renames it; unknown fields are accepted and ignored without error (so a 200 is not proof a field exists).
- `motion_area_candidate` entries are keyed by `owner.rid` = the device id; capabilities `sensor`, `collector`, `sync`. On this bridge 12 devices qualify (every light and Hue Play, not the dimmers).
- The "Motion Sensor" template (`bba79770-19f1-11ec-9621-0242ac130002`) takes the area as its source: `configuration.source = {"rid": <area id>, "rtype": "motion_area_configuration"}`, plus `where` and `when` (both required). That is the app's "Control lights" step.

## Routines

- The app's own "Wake up" automation carries `style: "sunrise"`, `fade_in_duration.seconds`, `end_brightness`, `when {time_point, recurrence_days}` and `where [{group, items [lights]}]`.

## Motion Sensor template as the area's "Control lights" (accepted by the bridge as a disabled throwaway, then deleted)

`configuration = {"source": {"rid": <area id>, "rtype": "motion_area_configuration"}, "where": [{"group": {rid, rtype: room|zone}}], "when": {"timeslots": [{"start_time": {"type": "time", "time": {"hour", "minute"}}, "on_motion": {"recall_single": [{"action": {"recall": {"rid": <scene>, "rtype": "scene"}}}]}, "on_no_motion": {"after": {"minutes": N}, "recall_single": [{"action": "all_off"}]}}]}, "settings": {"daylight_sensitivity": {"dark_threshold": 0..65534, "offset": 7000}}}`.
`on_no_motion` and `settings` are optional; `offset` is fixed at 7000. `on_motion` needs `recall_single`. `time_slots` is refused (it is `timeslots`, at least one).
Sensitivity is a field of the area's `convenience_area_motion` service (`{"sensitivity": {"sensitivity": N}}`, aiohue `MotionSensingFeatureSensitivity`).
Calibration (found by reading the Hue app and then trying it): `PUT convenience_area_motion/<id>` with `{"enabled": true}`. The area then reports `health: "healthy"` after about 25 seconds, its participants first `unhealthy`, then `healthy` (the app says "20 seconds, keep the room empty"). A new area has its service `enabled: false` and stays `not_running` until then; the area's own `enabled` flag does not start it. Switching the area's `enabled` off makes it `not_running` again.
Changing the participants of a running area (`PUT motion_area_configuration/<id>` with three or four `participants`; two or five are refused) makes it recalibrate by itself while its service is on.
`convenience_area_motion` also has `sensitivity: {sensitivity, sensitivity_max}` (0 to 4 here, default 2 = the app's "Medium") and `algorithm_mode` (`mimic_pir` or `mimic_radar`, default `mimic_radar`, values in `algorithm_mode_values`). `security_area_motion` has `enabled` and `sensitivity` too.

## Routine fields the Hue app's wizards use (accepted as disabled throwaways)

- Basic wake up routine: `style` is `sunrise` or `basic` ("Transition to bright"); `turn_lights_off_after` takes `{"minutes": N}` (a duration object).
- Native Go To Sleep: `style` is `sunset` or `basic`; `end_state` accepts `turn_off` (the other names tried were refused).
- Schedule: `when_extended` accepts `end_at` (same shape as `start_at`) and `randomization: {"minutes": N}`.
- PM (Mimic presence): requires `where`, `excluded_lights`, `end_state` (`do_nothing` and `turn_off` pass), `mode`. `excluded_lights` is refused as an array and as every string tried; `mode` values tried (`all_day`, `dark_only`, ...) are refused. Not solved from error messages.

## Services tried on the real bridge (2026-11-12, throwaway objects, all deleted afterwards)

`create_motion_area`, `set_motion_area` (name, sensitivity, devices), `set_motion_area_lights` (creates, then replaces the same automation; no `dark_threshold` removes `settings`), `delete_motion_area` (also deletes the area's automation), `create_routine` for wake up, go to sleep, timer, schedule (end time, randomised), coming home and leaving home (created disabled; read back as sent), `update_routine`, `delete_automation`, `create_zone`/`update_zone`/`delete_zone`, `create_room`/`update_room`/`delete_room` (an empty room). Not tried because they change real things: `remove_device`, `delete_entertainment_area`, `set_zigbee_channel`.
Found by that test: `update_routine` switched a disabled routine on, because the service schema gave `enabled` a default of true; changes have no default now.

## The missing pieces, found by reading the Hue app and trying the bridge (2026-11-12)

How: the Hue app is a Flutter app. Its English texts are plain JSON in the xapk (`assets/flutter_assets/packages/<package>/i18n/en_us.json`: `taurus` = MotionAware, `behavior_ui` and `behavior_accessories_common` = automations and daylight, `security`, `schedules` = the Bluetooth-only routines, not the bridge's) and its code is in `lib/arm64-v8a/libapp.so` (strings only). The bridge validates a request against a JSON schema and reports the first problem, so a value can be tested without creating anything: an `enum` error at a field means the value is wrong, a `required ... missing` error about another field means it passed. Throwaway objects were created disabled and deleted.

- **Mimic presence** is the `PM` template ("PM Automation", one instance per bridge, `max_number_instances: 1`; the app calls it Mimic presence). Configuration: `{"where": [{"group": {rid, rtype}}], "excluded_lights": "do_nothing", "end_state": "do_nothing" | "turn_off", "mode": "24h" | "nighttime"}`. The app's "All day" is `24h`, "Only when it's dark" is `nighttime`. `excluded_lights` is an enum string that accepts `do_nothing` and `turn_off`; the app's wizard has no screen for it. Run state is `state.pm_state` (`started` / `stopped`). All four values accepted by the bridge as a disabled throwaway.
- **Go to sleep "End with"** has three values in the app (Lights off, Dimmed lights, Warm nightlight): `end_state` `turn_off`, `minimum_brightness`, `nightlight`, all accepted.
- **The play button** of an automation is `PUT behavior_instance/<id>` with `{"trigger": {"start": true}}` (and `{"stop": true}`); the instance's `state` then shows `gts_state: started` with a `fade_end_time` (timers use `timer_state`). It works on a disabled routine. "With a button press" in the Go to sleep wizard is therefore a routine that is only started this way; the template still requires a `when`. (Tried on a throwaway Go to sleep routine for the bathroom light, which is off.)
- **Lighting schedule** (`Schedule`): `when_extended.start_at` and `end_at` take `{"time_point": {"type": "time", "time": {hour, minute}}}`, or `{"type": "sunrise"|"sunset"}` (schema-valid; needs the bridge's home location, otherwise "Geolocation configuration error": `geolocation.is_configured` is false on the owner's bridge). `randomization` has four accepted forms, `{"minutes": N}` is one. There is no fade field. What it does is `what[0]`: `{"group": ..., "recall": scene}` or `{"group": ..., "actions": [{"target": {rid: light, rtype: "light"}, "action": {"on": {"on": false}}}]}` (the app's On / Off / Custom).
- **Coming home** `when_constrained.type`: `always`, `between` (with `start` and `end`), and `nighttime` (schema-valid; needs the home location).
- **MotionAware daylight** is not the light-level `settings.daylight_sensitivity` (a MotionAware area has no light sensor). The app offers Disabled, Sunrise/Sunset (with an offset before or after each) and sensors. On the bridge a time slot may start `{"type": "sunset"|"sunrise", "offset": {"minutes": ±N}}` (the offset is stored), and a slot's `on_motion.recall_single[].action` may be the string `do_nothing` (no lights). That is how "stop triggering lights at sunrise" can be written. No other top-level or `settings` keys exist on the Motion Sensor template.
- **Sensitivity** names in the app: Very low, Low, Medium, High, Very high (0 to 4).
- **Limits** from the app: a bridge takes up to four MotionAware areas; a device can be in one area only ("in use"); changing an area's devices recalibrates it.
- **Not found**: "Area activity" (High/Low) and the algorithm mode (`mimic_pir` / `mimic_radar`) have no writable field that I could find; the mapping between them is a guess, so neither has a page. Randomisation before/after values, and the "Group with other sensors" and "Send alerts" choices (a sensor group, and a Signify subscription).

## Home location, and the new services tried on the real bridge (2026-11-12, after the restart)

- The bridge's home location is `geolocation` (`is_configured`). `PUT geolocation/<id>` with `{"latitude": ..., "longitude": ...}` sets it and `is_configured` becomes true. It was set on the owner's bridge from Home Assistant's home location, on the owner's instruction; the coordinates are not recorded here. Sunrise and sunset starts, Coming home `nighttime` and a Go to sleep `time_point` of sunset need it (otherwise "Geolocation configuration error").
- Tried through the Hue Plus services, as disabled throwaways deleted afterwards: Mimic presence create and update (`update_routine` leaves a disabled routine disabled), a schedule from sunset to sunrise that switches the lights off, a schedule that switches them on at a time, Coming home at night, Go to sleep ending on the nightlight, `trigger_automation` start and stop (state `started` then `stopped`, tried on the bathroom light, which is off).
- The MotionAware wizard's sequence, as services: `create_motion_area`, `set_motion_area enabled: true`, healthy after 32 seconds (the wizard waits up to 120), `set_motion_area name`, `set_motion_area_lights` with a time that starts at sunrise (30 minutes before, no lights), one at sunset (15 minutes after, a scene, switch-off delay) and one at a time of day, `set_motion_area sensitivity: 4` (the top level), `enabled: false` (area back to `not_running`), `delete_motion_area`.
