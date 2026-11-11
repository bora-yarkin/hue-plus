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
