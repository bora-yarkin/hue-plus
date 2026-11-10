# Notice

Hue Plus is GPL-3.0-or-later (see LICENSE).

`custom_components/hue_plus/hue/` holds copies of the platforms of Home Assistant's Hue integration (`homeassistant/components/hue/`,
Home Assistant 2026.11.0): the light, light group, sensor, binary sensor, button and dial event, scene, motion and contact switch and
select entities, with their helpers and constants. They are Apache-2.0, Copyright the Home Assistant authors, and each file says so in
its first lines. Only the lines that name the Hue integration's bridge type (`hue/bridge.py` is Hue Plus's own) and the removal of
the v1 API branches (`light.py`, `sensor.py`, `binary_sensor.py`) differ from the originals. The licence text of Apache-2.0 is at
https://www.apache.org/licenses/LICENSE-2.0.

To compare them with a newer Home Assistant, diff each file against `homeassistant/components/hue/` of that release.
