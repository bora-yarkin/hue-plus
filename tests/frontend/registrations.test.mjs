// SPDX-License-Identifier: GPL-3.0-or-later
// What the plugin registers with the dashboard (the built menu.js run against a stand-in for window.HomeControl): the Spotify sync and the sync box as devices, what plays on a
// light, Hue's scenes as a scene kind and an import source, and the style of a gradient light. Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const BUILT = readFileSync(new URL("../../custom_components/hue_plus/frontend/menu.js", import.meta.url), "utf8");

function load(hass) {
  const reg = { pages: {}, kinds: [], devices: [], imports: [], playback: [], styles: [], settings: [], styles_css: [], calls: [] };
  const noop = () => undefined;
  const ui = new Proxy({}, { get: (_t, key) => (key === "pageFill" ? "pagefill" : noop) });
  const HC = {
    version: 1,
    isAdmin: true,
    hass: () => hass,
    attrs: (id) => (hass.states[id] || {}).attributes || {},
    state: (id) => (hass.states[id] || {}).state,
    isOn: (id) => (hass.states[id] || {}).state === "on",
    registry: (id) => hass.entities[id],
    call: (...args) => reg.calls.push(args),
    callRaw: noop,
    toggle: noop,
    toast: noop,
    refresh: noop,
    el: noop,
    icon: () => "",
    row: noop,
    count: noop,
    confirm: noop,
    open: noop,
    back: noop,
    closeLayer: noop,
    guard: noop,
    t: (key) => key,
    editing: () => false,
    room: () => null,
    serviceResponse: async (domain, service, data) => ({ domain, service, data }),
    ui,
    areas: new Proxy({}, { get: () => noop }),
    scenes: { hidden: () => false, setHidden: noop, importFrom: noop },
    addStrings: noop,
    addStyles: (css) => reg.styles_css.push(css),
    registerPage: (key, title, icon, builder) => (reg.pages[key] = { title, icon, builder }),
    registerSettings: (def) => reg.settings.push(def),
    registerAreaHooks: noop,
    registerSceneKind: (def) => reg.kinds.push(def),
    registerSceneImport: (def) => reg.imports.push(def),
    registerDeviceKind: (def) => reg.devices.push(def),
    registerPlayback: (def) => reg.playback.push(def),
    registerLightStyle: (def) => reg.styles.push(def),
  };
  const sandbox = { window: { HomeControl: HC }, console, setTimeout, clearTimeout, Date, Math, JSON, Object, Array, String, Number, document: {} };
  vm.createContext(sandbox);
  vm.runInContext(BUILT, sandbox);
  return reg;
}

const entity = (platform, unique_id, extra = {}) => ({ platform, unique_id, ...extra });
const HASS = {
  states: {
    "switch.bridge_sync": { state: "off", attributes: {} },
    "switch.box_sync": { state: "off", attributes: {} },
    "switch.something": { state: "off", attributes: {} },
    "scene.arctic": { state: "unknown", attributes: { name: "Arctic aurora", is_dynamic: true, group_name: "Bora" } },
    "scene.static": { state: "unknown", attributes: { name: "Reading", is_dynamic: false, group_name: "Bora" } },
    "scene.other": { state: "unknown", attributes: { name: "Other" } },
    "light.tube": { state: "on", attributes: { gradient_modes: ["interpolated_palette"], gradient_mode: "interpolated_palette" } },
    "light.plain": { state: "on", attributes: {} },
  },
  entities: {
    "switch.bridge_sync": entity("hue_plus", "bridge1_sync_sync"),
    "switch.box_sync": entity("hue_plus", "box1_syncbox_sync"),
    "switch.something": entity("hue_plus", "bridge1_other"),
    "scene.arctic": entity("hue_plus", "s1", { device_id: "room" }),
    "scene.static": entity("hue", "s2", { device_id: "room" }),
    "scene.other": entity("homekit", "s3"),
  },
  services: { hue_plus: { import_hue_scene: {} } },
};

test("the Spotify sync and the sync box are devices of the Lights section, and nothing else is", () => {
  const reg = load(HASS);
  const kind = (id) => reg.devices.filter((d) => d.match(id)).map((d) => d.pop);
  assert.deepEqual(kind("switch.bridge_sync"), ["hsync"]);
  assert.deepEqual(kind("switch.box_sync"), ["hsbox"]);
  assert.deepEqual(kind("switch.something"), []);
  for (const d of reg.devices) assert.ok(d.icon && d.search === "light" && typeof d.row === "function");
  for (const key of ["hsync", "hsbox", "hsync-style", "hsync-intensity", "hsync-colour", "hsync-area", "hsync-delay"]) assert.ok(reg.pages[key], `${key} is a page`);
});

test("nothing plays on a light while no Spotify sync runs", () => {
  const reg = load(HASS);
  assert.equal(reg.playback.length, 1);
  assert.equal(reg.playback[0].plays("light.plain"), null);
});

test("Hue's scenes are a scene kind: the Hue integration's and Hue Plus's, not another integration's", () => {
  const reg = load(HASS);
  assert.equal(reg.kinds.length, 1);
  const kind = reg.kinds[0];
  assert.equal(kind.match("scene.arctic"), true);
  assert.equal(kind.match("scene.static"), true);
  assert.equal(kind.match("scene.other"), false);
  assert.equal(kind.dynamic("scene.arctic"), true);
  assert.equal(kind.dynamic("scene.static"), false);
  assert.equal(kind.popup, "hue-scene");
  assert.ok(reg.pages["hue-scene"]);
  assert.equal(reg.pages["hue-scene"].title("scene.arctic~bora"), "Arctic aurora");
});

test("only Hue's live scenes can be imported, and they are read from the bridge by Hue Plus's own service", async () => {
  const reg = load(HASS);
  const source = reg.imports[0];
  assert.equal(source.id, "hue");
  assert.equal(source.available(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(source.list())), [{ id: "scene.arctic", name: "Arctic aurora", group: "Bora" }]);
  const read = await source.read("scene.arctic");
  assert.deepEqual(JSON.parse(JSON.stringify(read)), { domain: "hue_plus", service: "import_hue_scene", data: { entity_id: "scene.arctic" } });
  const without = load({ ...HASS, services: {} });
  assert.equal(without.imports[0].available(), false);
});

test("a light with gradient styles has the style button, and the other lights do not", () => {
  const reg = load(HASS);
  const style = reg.styles[0];
  assert.equal(style.applies("light.tube"), true);
  assert.equal(style.applies("light.plain"), false);
  assert.match(style.icon("light.tube"), /<svg/);
  assert.equal(style.blends("light.tube"), true);
  const scattered = load({ ...HASS, states: { ...HASS.states, "light.tube": { state: "on", attributes: { gradient_modes: ["random_pixelated"], gradient_mode: "random_pixelated" } } } });
  assert.equal(scattered.styles[0].blends("light.tube"), false);
});

test("the styles of the sync popups are added to the page once", () => {
  const reg = load(HASS);
  assert.equal(reg.styles_css.length, 1);
  assert.match(reg.styles_css[0], /\.hs-now/);
});
