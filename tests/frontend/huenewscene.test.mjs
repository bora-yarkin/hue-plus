// SPDX-License-Identifier: GPL-3.0-or-later
// Making and changing Hue scenes from the dashboard (frontend/src/huenewscene.js): which Hue room a page's scene goes in, what is written to the bridge, and the colours taken from a photo.
// Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const plain = (value) => JSON.parse(JSON.stringify(value));
const SOURCE = readFileSync(new URL("../../frontend/src/huenewscene.js", import.meta.url), "utf8");

function page(hass, extra = {}) {
  const log = { raw: [], responses: [], toasts: [], editors: [], calls: [], opened: [] };
  const sandbox = {
    H: () => hass,
    A: (id) => (hass.states[id] || {}).attributes || {},
    roomById: (id) => ({ bora: { id: "bora", area: "bora_area" } })[id] || null,
    sceneLights: () => ["light.l1", "light.l2", "light.other"],
    hueplus: { lights: () => ["light.l1", "light.l2"] },
    HUESCENES: { isHue: (h, id) => h.entities[id] && ["hue", "hue_plus"].includes(h.entities[id].platform) },
    callRaw: (domain, service, data) => (log.raw.push([domain, service, plain(data)]), Promise.resolve()),
    call: (domain, service, data) => log.calls.push([domain, service, plain(data)]),
    serviceResponse: (domain, service, data) => (log.responses.push([domain, service, plain(data)]), Promise.resolve({})),
    editLights: (o) => log.editors.push(o),
    toast: (t) => log.toasts.push(t),
    showPopup: (key) => log.opened.push(key),
    closeSheet() {},
    _T: (k) => k,
    mk: () => ({}),
    pill: () => ({}),
    setTimeout: (fn) => fn(),
    Promise,
    Object,
    Array,
    Math,
    ...extra,
  };
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);
  return { sandbox, log };
}

const hass = () => ({
  states: {
    "light.bora": { state: "on", attributes: { is_hue_group: true, hue_type: "room", friendly_name: "Bora" } },
    "light.den": { state: "on", attributes: { is_hue_group: true, hue_type: "zone", friendly_name: "Den" } },
    "light.l1": { state: "on", attributes: { hue_light_id: "a" } },
    "light.l2": { state: "off", attributes: { hue_light_id: "b" } },
    "light.other": { state: "on", attributes: {} },
    "scene.a": { state: "unknown", attributes: { name: "Read", is_dynamic: false, group_name: "Bora" } },
    "scene.b": { state: "unknown", attributes: { name: "Relax", is_dynamic: false, group_name: "Bora" } },
    "scene.c": { state: "unknown", attributes: { name: "Moving", is_dynamic: true, group_name: "Bora" } },
  },
  entities: {
    "light.bora": { platform: "hue_plus", area_id: "bora_area" },
    "light.den": { platform: "hue_plus", area_id: "den_area" },
    "light.l1": { platform: "hue_plus", area_id: "bora_area" },
    "scene.a": { platform: "hue_plus", unique_id: "uid-a" },
    "scene.b": { platform: "hue_plus", unique_id: "uid-b" },
    "scene.c": { platform: "hue_plus", unique_id: "uid-c" },
  },
});

test("a page's scene goes in the Hue room of its area, else the only room there is, else the person is asked", () => {
  const { sandbox } = page(hass());
  assert.equal(sandbox.hueGroupFor("bora"), "light.bora");
  const one = hass();
  delete one.states["light.den"];
  assert.equal(page(one).sandbox.hueGroupFor("home"), "light.bora", "one room: no question");
  assert.equal(sandbox.hueGroupFor("home"), null, "two rooms and no page's area: ask");
});

test("only Hue lights are in a scene, the page's own first", () => {
  const { sandbox } = page(hass());
  assert.deepEqual(plain(sandbox.hueGroupLights("bora", "light.bora")), ["light.l1", "light.l2"]);
});

test("saving the lights as they are writes a scene to the room's Hue group, and a zone is made in the zone", () => {
  const { sandbox, log } = page(hass());
  sandbox.HUENEW = { scope: "bora", group: "light.bora", name: "Evening", mode: "current" };
  sandbox.hueSaveCurrent();
  sandbox.HUENEW = { scope: "home", group: "light.den", name: "Z", mode: "current" };
  sandbox.hueSaveCurrent();
  assert.deepEqual(log.raw, [
    ["hue_plus", "create_scene", { name: "Evening", group: "Bora", group_type: "room" }],
    ["hue_plus", "create_scene", { name: "Z", group: "Den", group_type: "zone" }],
  ]);
});

test("a custom scene is made in the light popup: nothing is written until its checkmark, which saves the look of the lights", async () => {
  const { sandbox, log } = page(hass());
  sandbox.HUENEW = { scope: "bora", group: "light.bora", name: "Mine", mode: "custom" };
  sandbox.hueOpenEditor();
  assert.deepEqual(log.raw, []);
  const editor = log.editors[0];
  assert.deepEqual([editor.name, plain(editor.lights)], ["Mine", ["light.l1", "light.l2"]]);
  assert.equal(await editor.onSave([]), true);
  assert.deepEqual(log.raw, [["hue_plus", "create_scene", { name: "Mine", group: "Bora", group_type: "room" }]]);
});

test("a scene that could not be written to the bridge leaves the popup open and says so", async () => {
  const { sandbox, log } = page(hass(), { callRaw: () => Promise.reject(new Error("bridge")) });
  sandbox.HUENEW = { scope: "bora", group: "light.bora", name: "Mine", mode: "custom" };
  sandbox.hueOpenEditor();
  assert.equal(await log.editors[0].onSave([]), false);
  assert.deepEqual(log.toasts, ["hn_couldn_t_save_the_scene"]);
});

test("changing a scene sets the lights as it has them, then records what they show over it on the bridge", async () => {
  const { sandbox, log } = page(hass());
  sandbox.hueSceneEdit("scene.a", { id: "bora" });
  assert.deepEqual(log.calls, [["scene", "turn_on", { entity_id: "scene.a" }]]);
  assert.equal(await log.editors[0].onSave([]), true);
  assert.deepEqual(log.raw, [["hue_plus", "update_scene", { scene: "uid-a", record_current: true }]]);
});

test("an all-day scene is written with its times in order, the scenes by their bridge ids and the days chosen", () => {
  const { sandbox, log } = page(hass());
  sandbox.HUENEW = {
    group: "light.bora",
    name: "Day",
    slots: [{ time: "18:00", scene: "scene.b" }, { time: "07:00", scene: "scene.a" }],
    days: [0, 1, 1, 1, 1, 1, 0],
  };
  sandbox.hueSaveAllDay();
  assert.deepEqual(log.responses, [
    ["hue_plus", "create_daily_smart_scene", { name: "Day", group: "Bora", group_type: "room", slots: [{ time: "07:00", scene: "uid-a" }, { time: "18:00", scene: "uid-b" }], days: [1, 2, 3, 4, 5] }],
  ]);
});

test("an all-day scene needs a name and a day, and only the room's still scenes are offered for its times", () => {
  const { sandbox, log } = page(hass());
  sandbox.HUENEW = { group: "light.bora", name: "", slots: [{ time: "07:00", scene: "scene.a" }], days: [1, 1, 1, 1, 1, 1, 1] };
  sandbox.hueSaveAllDay();
  sandbox.HUENEW.name = "X";
  sandbox.HUENEW.days = [0, 0, 0, 0, 0, 0, 0];
  sandbox.hueSaveAllDay();
  assert.deepEqual(log.toasts, ["hn_give_it_a_name", "hn_pick_a_day"]);
  assert.deepEqual(log.responses, []);
  assert.deepEqual(plain(sandbox.hueRoomScenes("light.bora")), ["scene.a", "scene.b"], "Read and Relax by name; the moving scene is not offered");
});

test("deleting a scene asks the bridge with the scene's own id, confirmed", async () => {
  const { sandbox, log } = page(hass());
  await sandbox.hueSceneRemove("scene.b");
  assert.deepEqual(log.raw, [["hue_plus", "delete_scene", { scene: "uid-b", confirm: true }]]);
});

test("the colours of a photo are the ones that cover most of it, the commonest first, and near-black is left out", () => {
  const { sandbox } = page(hass());
  const red = Array.from({ length: 30 }, () => [220, 30, 30]);
  const blue = Array.from({ length: 10 }, () => [30, 40, 210]);
  const palette = plain(sandbox.huePalette(red.concat(blue), 2));
  assert.equal(palette.length, 2);
  assert.ok(palette[0][0] > 150 && palette[0][2] < 80, "red first (the most pixels)");
  assert.ok(palette[1][2] > 150 && palette[1][0] < 80);
  assert.deepEqual(plain(sandbox.huePalette([], 3)), []);
});
