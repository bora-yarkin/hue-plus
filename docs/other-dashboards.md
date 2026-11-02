# Using Hue Plus from your own dashboard

Hue Plus has no screen of its own. Everything it does is available to any dashboard through ordinary Home Assistant
entities, services and two websocket commands.

## Entities

Each light or accessory it has an entity for gets its own device, named like the Hue one and linked to the bridge's
device. The bridge device holds the diagnostics (firmware, Zigbee channel, authorized apps, update state), the update
switch and time, the bridge's automations as switches, and the `Live scenes` sensor.

Gradient lights get a light named `<name> zones` (the whole tube) and `<name> zone 1..n`. Its attributes include
`hue_light_id`, `gradient_mode` and `gradient_modes`.

## Services

`Developer tools → Actions` lists every `hue_plus.*` service with its fields. Services of a module that is switched off
are not usable. All bridge services are for administrators; scene and zone services are for any user.

## Websocket

```js
// What is available: modules per bridge, the lights and what each can do, which services work.
await hass.connection.sendMessagePromise({ type: "hue_plus/capabilities" });
// -> { version: 1, bridges: [{ config_entry_id, name, modules: ["bridge","zones","scenes","sync"], services: [...],
//      lights: { "light.floor_light": { effects: ["candle", ...], timed_effects: [...], signals: [...],
//                gradient: null | { points_capable, modes, mode }, colour, white, zones_entity_id? } },
//      sync_entity, scenes_sensor }] }

// Saved live scenes, areas, the shipped presets and what is running.
await hass.connection.sendMessagePromise({ type: "hue_plus/library" });
```

Show a control only when the capabilities say it exists: an effect picker from `effects`, a style picker from
`gradient.modes`, the scenes screen when `scenes` is in `modules`.

## Lovelace example

```yaml
type: entities
entities:
  - light.bed_light_zones
  - light.bed_light_zone_1
  - select.floor_light_power_on_behavior
  - button.floor_light_identify
  - sensor.hue_bridge_pro_live_scenes
tap_action: {action: more-info}
```

```yaml
type: button
name: Candle on the floor lights
tap_action:
  action: perform-action
  perform_action: hue_plus.scene_start
  data:
    scene_id: candle
    preset: candle
    lights:
      - {entity_id: light.floor_light_l, x: -1}
      - {entity_id: light.floor_light_r, x: 1}
```
