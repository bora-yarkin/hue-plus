/* A pretend Home Assistant for the Hue dashboard panel: states, the registries, services and the websocket commands the panel uses. All names and ids are invented. Nothing leaves the page. */

const BRIDGE = "bridgeuid00000000000000000000000000";
const BOX = "boxuid0000000000000000000000000000";

function state(entity_id, value, attributes = {}) {
  const now = new Date().toISOString();
  return [entity_id, { entity_id, state: String(value), attributes, last_changed: now, last_updated: now, context: {} }];
}

function reg(entity_id, platform, unique_id, device_id, extra = {}) {
  return { entity_id, platform, unique_id, device_id, area_id: null, disabled_by: null, hidden_by: null, entity_category: null, ...extra };
}

const COLOUR = ["xy", "color_temp"];

function light(id, name, extra = {}, value = "on") {
  return state("light." + id, value, { friendly_name: name, brightness: 180, supported_color_modes: COLOUR, color_mode: "color_temp", color_temp_kelvin: 2700, min_color_temp_kelvin: 2000, max_color_temp_kelvin: 6500, hs_color: [30, 60], xy_color: [0.45, 0.4], effect_list: ["no_effect", "candle", "prism"], effect: "no_effect", hue_light_id: "hl-" + id, ...extra });
}

export function makeHass(query) {
  const states = Object.fromEntries([
    light("desk_lamp", "Desk Lamp"),
    light("shelf_strip", "Shelf Strip"),
    light("floor_lamp", "Floor Lamp"),
    light("bed_light", "Bed Light", {}, "off"),
    light("ceiling_light", "Ceiling Light", {}, "off"),
    light("desk_top", "Desk Top"),
    state("light.living_room", "on", { friendly_name: "Living room", brightness: 150, is_hue_group: true, hue_type: "room", entity_id: ["light.desk_lamp", "light.shelf_strip", "light.floor_lamp"] }),
    state("light.bedroom", "off", { friendly_name: "Bedroom", is_hue_group: true, hue_type: "room", entity_id: ["light.bed_light", "light.ceiling_light"] }),
    state("light.desk_area", "on", { friendly_name: "Desk area", brightness: 200, is_hue_group: true, hue_type: "zone", entity_id: ["light.desk_top", "light.desk_lamp"] }),
    state("scene.living_room_arctic_aurora", "unknown", { friendly_name: "Living room Arctic aurora", name: "Arctic aurora", is_dynamic: true, group_name: "Living room", group_type: "room", speed: 0.5, brightness: 200 }),
    state("scene.living_room_reading", "unknown", { friendly_name: "Living room Reading", name: "Reading", is_dynamic: false, group_name: "Living room", group_type: "room" }),
    state("scene.living_room_relax", "unknown", { friendly_name: "Living room Relax", name: "Relax", is_dynamic: false, group_name: "Living room", group_type: "room" }),
    state("scene.bedroom_nightlight", "unknown", { friendly_name: "Bedroom Nightlight", name: "Nightlight", is_dynamic: false, group_name: "Bedroom", group_type: "room" }),
    state("select.living_room_scene", "Reading", { friendly_name: "Scene", options: ["Arctic aurora", "Reading", "Relax"] }),
    state("select.bedroom_scene", "Nightlight", { friendly_name: "Scene", options: ["Nightlight"] }),
    state("switch.hue_spotify_sync", "off", { friendly_name: "Hue Spotify sync" }),
    state("number.hue_spotify_sync_sync_brightness", "80", { friendly_name: "Brightness", min: 1, max: 100, step: 1 }),
    state("switch.bridge_automatic_updates", "on", { friendly_name: "Automatic updates" }),
    state("select.desk_lamp_power_on", "powerfail", { friendly_name: "Power-on behavior", options: ["safety", "powerfail", "last_on_state"] }),
    state("button.desk_lamp_identify", "unknown", { friendly_name: "Identify" }),
    state("button.bridge_search_for_new_devices", "unknown", { friendly_name: "Search for new devices" }),
    state("sensor.bridge_zigbee_channel", "25", { friendly_name: "Zigbee channel", extended_pan_id: "fake-pan" }),
    state("sensor.bridge_matter_fabrics", "1", { friendly_name: "Matter fabrics", max_fabrics: 16, has_qr_code: true, fabrics: [{ id: "f1", label: "Home", vendor: "Apple", status: "paired" }] }),
    state("sensor.bridge_authorized_apps", "2", { friendly_name: "Authorized apps", apps: [{ id: "a1", name: "Hue app" }, { id: "a2", name: "Home Assistant" }] }),
    state("sensor.bridge_home_and_away", "configured", { friendly_name: "Home and Away" }),
    state("sensor.bridge_firmware", "1976154040", { friendly_name: "Firmware" }),
    state("update.bridge_firmware", "off", { friendly_name: "Bridge firmware", installed_version: "1976154040", latest_version: "1976154040" }),
    state("switch.living_room_box_sync", "on", { friendly_name: "Living room box" }),
    state("select.living_room_box_mode", "video", { friendly_name: "Mode", options: ["video", "game", "music", "passthrough", "powersave"] }),
    state("select.living_room_box_hdmi_input", "Console", { friendly_name: "HDMI input", options: ["Console", "TV box", "input3", "input4"] }),
    state("select.living_room_box_intensity", "high", { friendly_name: "Intensity", options: ["subtle", "moderate", "high", "intense"] }),
    state("number.living_room_box_brightness", "120", { friendly_name: "Brightness", min: 0, max: 200, step: 1 }),
    state("binary_sensor.living_room_box_hdmi_signal", "on", { friendly_name: "HDMI signal" }),
  ]);
  const members = ["desk_lamp", "shelf_strip", "floor_lamp", "bed_light", "ceiling_light", "desk_top"];
  const entities = [
    ...members.map((m) => reg("light." + m, "hue_plus", "hl-" + m, "dev-" + m)),
    reg("light.living_room", "hue_plus", "group-1", "dev-living-group"),
    reg("light.bedroom", "hue_plus", "group-2", "dev-bedroom-group"),
    reg("light.desk_area", "hue_plus", "group-3", "dev-desk-area"),
    reg("scene.living_room_arctic_aurora", "hue_plus", "scene-1", "dev-living-group"),
    reg("scene.living_room_reading", "hue_plus", "scene-2", "dev-living-group"),
    reg("scene.living_room_relax", "hue_plus", "scene-3", "dev-living-group"),
    reg("scene.bedroom_nightlight", "hue_plus", "scene-4", "dev-bedroom-group"),
    reg("select.living_room_scene", "hue_plus", "group-1_scene", "dev-living-group"),
    reg("select.bedroom_scene", "hue_plus", "group-2_scene", "dev-bedroom-group"),
    reg("switch.hue_spotify_sync", "hue_plus", `${BRIDGE}_sync_sync`, "dev-spotify"),
    reg("number.hue_spotify_sync_sync_brightness", "hue_plus", `${BRIDGE}_sync_brightness`, "dev-spotify"),
    reg("switch.bridge_automatic_updates", "hue_plus", `${BRIDGE}_auto_update`, "dev-bridge"),
    reg("button.bridge_search_for_new_devices", "hue_plus", `${BRIDGE}_search`, "dev-bridge"),
    reg("select.desk_lamp_power_on", "hue_plus", `${BRIDGE}_powerup_hl-desk_lamp`, "dev-desk_lamp"),
    reg("button.desk_lamp_identify", "hue_plus", `${BRIDGE}_identify_hl-desk_lamp`, "dev-desk_lamp"),
    reg("sensor.bridge_zigbee_channel", "hue_plus", `${BRIDGE}_zigbee_channel`, "dev-bridge", { entity_category: "diagnostic" }),
    reg("sensor.bridge_matter_fabrics", "hue_plus", `${BRIDGE}_matter_fabrics`, "dev-bridge", { entity_category: "diagnostic" }),
    reg("sensor.bridge_authorized_apps", "hue_plus", `${BRIDGE}_authorized_apps`, "dev-bridge", { entity_category: "diagnostic" }),
    reg("sensor.bridge_home_and_away", "hue_plus", `${BRIDGE}_home_and_away`, "dev-bridge", { entity_category: "diagnostic" }),
    reg("sensor.bridge_firmware", "hue_plus", `${BRIDGE}_firmware`, "dev-bridge", { entity_category: "diagnostic" }),
    reg("update.bridge_firmware", "hue_plus", `${BRIDGE}_bridge_update`, "dev-bridge"),
    reg("switch.living_room_box_sync", "hue_plus", `${BOX}_syncbox_sync`, "dev-box"),
    reg("select.living_room_box_mode", "hue_plus", `${BOX}_syncbox_mode`, "dev-box"),
    reg("select.living_room_box_hdmi_input", "hue_plus", `${BOX}_syncbox_source`, "dev-box"),
    reg("select.living_room_box_intensity", "hue_plus", `${BOX}_syncbox_intensity`, "dev-box"),
    reg("number.living_room_box_brightness", "hue_plus", `${BOX}_syncbox_brightness`, "dev-box"),
    reg("binary_sensor.living_room_box_hdmi_signal", "hue_plus", `${BOX}_syncbox_hdmi_signal`, "dev-box"),
  ];
  const devices = [...members.map((m) => ["dev-" + m, m]), ["dev-bridge", "Hue Bridge"], ["dev-living-group", "Living room"], ["dev-spotify", "Hue Spotify sync"], ["dev-box", "Living room box"]].map(([id, name]) => ({ id, name, area_id: null, manufacturer: "Invented", model: "Test" }));

  const calls = [];
  window.__calls = calls;
  const listeners = [];

  const resources = {
    automations: [
      { id: "auto-1", name: "Wake up", enabled: true, script: "Basic wake up routine", status: "running" },
      { id: "auto-2", name: "Evening timer", enabled: false, script: "Timers", status: "disabled" },
    ],
    rooms: [{ id: "room-1", name: "Living room", children: [{ id: "dev-lamp", name: "Desk lamp" }], lights: ["light-1", "light-2", "light-3"] }],
    zones: [{ id: "zone-1", name: "Desk area", children: [], lights: ["light-1"] }], smart_scenes: [], scenes: [{ id: "scene-1", name: "Movie", group_id: "room-1", group_type: "room", lights: ["light-1", "light-2"] }, { id: "scene-2", name: "Relax", group_id: "room-1", group_type: "room", lights: ["light-1", "light-2", "light-3"] }, { id: "scene-3", name: "Nightlight", group_id: "room-1", group_type: "room", lights: ["light-2"] }],
    entertainment_areas: [
      {
        id: "area-1", name: "TV", type: "screen", end_state: "last_state", performance: "auto", performance_light: null,
        lights: [
          { light_id: "light-1", name: "Desk lamp", x: -0.6, y: -1, z: 0.4, balance: 1 },
          { light_id: "light-2", name: "Shelf strip", x: 0.5, y: 0.9, z: -0.2, balance: 1.5 },
        ],
      },
    ],
    motion_areas: { candidates: [], areas: [{ id: "ma-1", metadata: { name: "Hallway" }, enabled: true }] },
    apps: [{ id: "a1", name: "Hue app", last_used: "2026-11-04T21:00:00" }, { id: "a2", name: "Home Assistant", last_used: "2026-11-05T01:12:00" }],
    accessories: [
      {
        id: "acc-1", name: "Desk dimmer", dials: 0, automation_id: "auto-1",
        buttons: [{ id: "b1", number: 1, last_event: "short_release" }, { id: "b2", number: 2, last_event: null }, { id: "b3", number: 3, last_event: null }, { id: "b4", number: 4, last_event: "long_release" }],
        actions: {
          b1: { on_short_release: { action: "dim_up" }, on_long_press: { action: "dim_up" } },
          b2: {
            on_short_release: { recall_single_extended: { actions: [{ action: { recall: { rid: "scene-1", rtype: "scene" } } }], with_off: { enabled: true } } },
            on_long_press: { action: "do_nothing" },
          },
          b3: { on_short_release: { action: "dim_down" }, on_long_press: { action: "home_off" } },
          b4: {
            on_short_release: {
              scene_cycle_extended: {
                repeat_timeout: { seconds: 3 },
                slots: ["scene-1", "scene-2", "scene-3"].map((rid) => [{ action: { recall: { rid, rtype: "scene" } } }]),
                with_off: { enabled: true },
              },
            },
            on_long_press: {
              time_based_extended: {
                repeat_timeout: { seconds: 3 },
                slots: [["scene-1", 7, 0], ["scene-2", 20, 0], ["scene-3", 23, 0]].map(([rid, hour, minute]) => ({ actions: [{ action: { recall: { rid, rtype: "scene" } } }], start_time: { hour, minute } })),
                with_off: { enabled: false },
              },
            },
          },
        },
        targets: { b1: ["room-1"], b2: ["room-1"], b3: ["room-1"], b4: ["room-1"] },
      },
      { id: "acc-2", name: "Door tap switch", dials: 1, automation_id: null, buttons: [{ id: "b5", number: 1, last_event: null }], actions: {}, targets: {} },
    ],
    bridge: { name: "Hue Bridge Pro", time_zone: "Europe/Istanbul", internet: "connected" },
  };

  const HUE_SERVICES = ["get_resources", "set_effect", "set_style", "configure_light", "timed_effect", "signal", "create_routine", "update_routine", "trigger_automation", "configure_button", "set_streaming_end_state", "stream_colors", "stop_streaming", "set_motion_area", "create_motion_area", "set_motion_area_lights", "delete_motion_area", "update_automation", "delete_automation", "set_auto_update", "check_for_update", "install_bridge_update", "set_zigbee_channel", "set_home_location", "configure_bridge", "search_for_devices", "remove_matter_fabric", "remove_device", "revoke_app", "update_entertainment_area", "delete_entertainment_area", "import_hue_scene", "create_scene", "update_scene", "delete_scene", "create_daily_smart_scene", "create_room", "update_room", "delete_room", "create_zone", "update_zone", "delete_zone", "set_name", "activate_scene"];

  function set(id, patch, value) {
    const s = states[id];
    if (!s) return;
    states[id] = { ...s, state: value === undefined ? s.state : value, attributes: { ...s.attributes, ...patch } };
  }

  function lightsOf(id) {
    const a = states[id] && states[id].attributes;
    return a && a.is_hue_group ? a.entity_id : [id];
  }

  /* What a light service does to the pretend lights, the way a real light would: a group's members follow it, and a group is on when one of them is. */
  function lightService(service, data) {
    const ids = [].concat(data.entity_id || []);
    ids.forEach((id) => {
      lightsOf(id).forEach((m) => {
        const on = service === "toggle" ? states[m].state !== "on" : service === "turn_on";
        const patch = {};
        if (data.brightness_pct) patch.brightness = Math.round(data.brightness_pct * 2.55);
        if (data.brightness) patch.brightness = data.brightness;
        if (data.hs_color) Object.assign(patch, { hs_color: data.hs_color, color_mode: "hs" });
        if (data.color_temp_kelvin) Object.assign(patch, { color_temp_kelvin: data.color_temp_kelvin, color_mode: "color_temp" });
        if (data.effect) patch.effect = data.effect;
        set(m, patch, on ? "on" : "off");
      });
      Object.keys(states).forEach((g) => {
        const a = states[g].attributes;
        if (a.is_hue_group) {
          const on = a.entity_id.some((m) => states[m].state === "on");
          const lead = states[a.entity_id.find((m) => states[m].state === "on")];
          set(g, lead ? { brightness: lead.attributes.brightness } : {}, on ? "on" : "off");
        }
      });
    });
  }

  const hass = {
    states,
    services: { light: { turn_on: {}, turn_off: {}, toggle: {} }, scene: { turn_on: {} }, switch: { turn_on: {}, turn_off: {} }, number: { set_value: {} }, select: { select_option: {} }, button: { press: {} }, update: { install: {} }, hue_plus: Object.fromEntries(HUE_SERVICES.map((s) => [s, {}])) },
    config: { unit_system: { temperature: "°C" }, time_zone: "UTC", language: "en", latitude: 41.5, longitude: 29.25 },
    user: { id: "u1", name: "Test user", is_admin: query.get("user") !== "guest", is_owner: true },
    locale: { language: "en", time_format: "24" },
    connected: true,
    connection: {
      subscribeEvents() {
        return Promise.resolve(() => {});
      },
      addEventListener() {},
    },
    callService(domain, service, data = {}) {
      calls.push({ domain, service, data });
      if (domain === "light") lightService(service, data);
      if (domain === "switch") set(data.entity_id, {}, service === "turn_on" ? "on" : service === "turn_off" ? "off" : states[data.entity_id].state === "on" ? "off" : "on");
      if (domain === "number") set(data.entity_id, {}, String(data.value));
      if (domain === "select") set(data.entity_id, {}, data.option);
      if (domain === "hue_plus" && service === "activate_scene") {
        const a = states[data.entity_id].attributes;
        const sel = Object.keys(states).find((k) => k.startsWith("select.") && (states[k].attributes.options || []).includes(a.name));
        if (sel) set(sel, {}, a.name);
      }
      if (domain === "scene" && service === "turn_on") {
        const a = states[data.entity_id].attributes;
        const sel = Object.keys(states).find((k) => k.startsWith("select.") && (states[k].attributes.options || []).includes(a.name));
        if (sel) set(sel, {}, a.name);
      }
      hass.states = { ...states };
      const el = document.querySelector("hue-plus-panel");
      if (el) el.hass = hass;
      return Promise.resolve();
    },
    callWS(msg) {
      switch (msg.type) {
        case "config/entity_registry/list":
          return Promise.resolve(entities);
        case "config/device_registry/list":
          return Promise.resolve(devices);
        case "config/area_registry/list":
          return Promise.resolve([]);
        case "hue_plus/capabilities":
          return Promise.resolve({ version: 1, bridges: [{ config_entry_id: "e1", bridge: BRIDGE, name: "Hue Bridge Pro", modules: ["bridge", "lights", "devices", "zones", "sync", "dashboard"], services: HUE_SERVICES, lights: {} }] });
        case "call_service":
          calls.push({ domain: msg.domain, service: msg.service, data: msg.service_data, response: true });
          if (msg.domain === "hue_plus" && msg.service === "get_resources") return Promise.resolve({ response: resources });
          return Promise.resolve({ response: {} });
        default:
          return Promise.resolve(null);
      }
    },
  };
  hass.connection.sendMessagePromise = hass.callWS;
  return hass;
}
