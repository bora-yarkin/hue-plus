// SPDX-License-Identifier: GPL-3.0-or-later
// Making and changing Hue scenes from the dashboard (frontend/src/huenewscene.js): the room or zone and the lights chosen, what is written to the bridge, and the colours of a photo.
// Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const plain = (value) => JSON.parse(JSON.stringify(value));
const SOURCE = readFileSync(new URL("../../frontend/src/huenewscene.js", import.meta.url), "utf8");

const RESOURCES = {
  rooms: [{ id: "room-1", name: "Bora", lights: ["bl1", "bl2", "bl3"] }],
  zones: [{ id: "zone-1", name: "Reading", lights: ["bl1", "other-room-light"] }],
  scenes: [{ id: "uid-a", name: "Read", group_id: "room-1", group_type: "room", lights: ["bl1", "bl2"] }],
};

function hass() {
  const light = (id) => ({ state: "on", attributes: { hue_light_id: id, friendly_name: `Light ${id}` } });
  return {
    states: {
      "light.bora": { state: "on", attributes: { is_hue_group: true, hue_type: "room", friendly_name: "Bora" } },
      "light.l1": light("bl1"),
      "light.l2": light("bl2"),
      "light.l3": light("bl3"),
      "light.far": light("other-room-light"),
      "scene.a": { state: "unknown", attributes: { name: "Read", is_dynamic: false, group_name: "Bora", group_type: "room" } },
      "scene.b": { state: "unknown", attributes: { name: "Relax", is_dynamic: false, group_name: "Bora", group_type: "room" } },
      "scene.c": { state: "unknown", attributes: { name: "Moving", is_dynamic: true, group_name: "Bora", group_type: "room" } },
    },
    entities: {
      "light.bora": { platform: "hue_plus", area_id: "bora_area" },
      "scene.a": { platform: "hue_plus", unique_id: "uid-a" },
      "scene.b": { platform: "hue_plus", unique_id: "uid-b" },
      "scene.c": { platform: "hue_plus", unique_id: "uid-c" },
    },
  };
}

function page(h = hass(), extra = {}) {
  const log = { raw: [], responses: [], toasts: [], editors: [], calls: [], opened: [] };
  const sandbox = {
    H: () => h,
    A: (id) => (h.states[id] || {}).attributes || {},
    roomById: (id) => ({ bora: { id: "bora", area: "bora_area", name: "Bora" } })[id] || null,
    hueplus: {
      lights: () => ["light.l1", "light.l2", "light.l3", "light.far"],
      resources: () => Promise.resolve(plain(RESOURCES)),
    },
    callRaw: (domain, service, data) => (log.raw.push([domain, service, plain(data)]), Promise.resolve()),
    call: (domain, service, data) => log.calls.push([domain, service, plain(data)]),
    serviceResponse: (domain, service, data) => (log.responses.push([domain, service, plain(data)]), Promise.resolve({})),
    editLights: (o) => log.editors.push(o),
    toast: (t) => log.toasts.push(t),
    showPopup: (key) => log.opened.push(key),
    closeSheet() {},
    refresh() {},
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

test("the rooms and zones of the bridge come with their lights, and a light shows only when Home Assistant has an entity for it", async () => {
  const { sandbox } = page();
  const data = plain(await sandbox.hueLoadData());
  assert.deepEqual(data.groups.map((g) => [g.name, g.type, g.lights.length]), [["Bora", "room", 3], ["Reading", "zone", 2]]);
  assert.equal(sandbox.hueLightEntity("bl2"), "light.l2");
  assert.equal(sandbox.hueLightEntity("nope"), null);
  const lonely = sandbox.hueGroupLightIds({ lights: ["bl1", "nope"] });
  assert.deepEqual(plain(lonely), ["bl1"]);
});

test("a page's room is chosen with all its lights to begin with, by its area or its name", async () => {
  const { sandbox } = page();
  await sandbox.hueLoadData();
  sandbox.HUENEW.scope = "bora";
  sandbox.hueChooseLights("custom");
  assert.equal(sandbox.HUENEW.g.id, "room-1");
  assert.deepEqual(plain(sandbox.hueSelectedIds()), ["bl1", "bl2", "bl3"]);
  const named = hass();
  named.entities["light.bora"].area_id = "elsewhere";
  const second = page(named);
  await second.sandbox.hueLoadData();
  second.sandbox.HUENEW.scope = "bora";
  second.sandbox.hueChooseLights("custom");
  assert.equal(second.sandbox.HUENEW.g && second.sandbox.HUENEW.g.id, "room-1", "by the name when the area does not say");
  const none = page();
  await none.sandbox.hueLoadData();
  none.sandbox.HUENEW.scope = "home";
  none.sandbox.hueChooseLights("custom");
  assert.equal(none.sandbox.HUENEW.g, null, "the home page chooses nothing: the person does");
});

test("choosing a room or zone chooses all its lights: a scene sets every light of it", async () => {
  const { sandbox } = page();
  const data = await sandbox.hueLoadData();
  sandbox.hueSelectGroup(data.groups[1]);
  assert.deepEqual(plain(sandbox.hueSelectedIds()), ["bl1", "other-room-light"]);
  assert.deepEqual(plain(sandbox.hueSelectedEntities()), ["light.l1", "light.far"]);
});

test("a scene is written to the room or zone chosen, and nothing before", async () => {
  const { sandbox, log } = page();
  const data = await sandbox.hueLoadData();
  sandbox.hueSelectGroup(data.groups[0]);
  sandbox.HUENEW.name = "Evening";
  sandbox.hueSaveCurrent();
  await Promise.resolve();
  assert.deepEqual(log.raw, [["hue_plus", "create_scene", { name: "Evening", group: "room-1", group_type: "room" }]]);
});

test("a custom scene is made in the light popup on all lights of the room: nothing is written until its checkmark", async () => {
  const { sandbox, log } = page();
  const data = await sandbox.hueLoadData();
  sandbox.hueSelectGroup(data.groups[0]);
  sandbox.HUENEW.name = "Mine";
  sandbox.hueOpenEditor();
  assert.deepEqual(log.raw, []);
  const editor = log.editors[0];
  assert.deepEqual([editor.name, plain(editor.lights)], ["Mine", ["light.l1", "light.l2", "light.l3"]], "every light of the room is in the popup");
  assert.equal(await editor.onSave([]), true);
  assert.deepEqual(log.raw, [["hue_plus", "create_scene", { name: "Mine", group: "room-1", group_type: "room" }]]);
});

test("a scene that could not be written to the bridge leaves the popup open and says so", async () => {
  const { sandbox, log } = page(hass(), { callRaw: () => Promise.reject(new Error("bridge")) });
  const data = await sandbox.hueLoadData();
  sandbox.hueSelectGroup(data.groups[0]);
  sandbox.HUENEW.name = "Mine";
  sandbox.hueOpenEditor();
  assert.equal(await log.editors[0].onSave([]), false);
  assert.deepEqual(log.toasts, ["hn_couldn_t_save_the_scene"]);
});

test("changing a scene starts with its own room chosen, and only that room is shown", async () => {
  const { sandbox, log } = page();
  sandbox.hueSceneEdit("scene.a");
  await new Promise((r) => setImmediate(r));
  assert.equal(sandbox.HUENEW.mode, "edit");
  assert.equal(sandbox.HUENEW.restrict, "room-1");
  assert.deepEqual(plain(sandbox.hueSelectedIds()), ["bl1", "bl2", "bl3"], "all the lights of the room");
  assert.deepEqual(log.opened, ["hue-pick-lights"]);
});

test("then the lights are set as the scene has them, the light popup opens on the chosen ones, and its checkmark records them on the bridge", async () => {
  const { sandbox, log } = page();
  sandbox.hueSceneEdit("scene.a");
  await new Promise((r) => setImmediate(r));
  sandbox.hueAfterLights();
  assert.deepEqual(log.calls, [["scene", "turn_on", { entity_id: "scene.a" }]]);
  assert.deepEqual(plain(log.editors[0].lights), ["light.l1", "light.l2", "light.l3"]);
  assert.equal(await log.editors[0].onSave([]), true);
  assert.deepEqual(log.raw, [["hue_plus", "update_scene", { scene: "uid-a", record_current: true }]]);
});

test("an all-day scene is written with its times in order, the scenes by their bridge ids, the room by its id and the days chosen", async () => {
  const { sandbox, log } = page();
  const data = await sandbox.hueLoadData();
  sandbox.hueSelectGroup(data.groups[0]);
  sandbox.HUENEW.name = "Day";
  sandbox.HUENEW.slots = [{ time: "18:00", scene: "scene.b" }, { time: "07:00", scene: "scene.a" }];
  sandbox.HUENEW.days = [0, 1, 1, 1, 1, 1, 0];
  sandbox.hueSaveAllDay();
  assert.deepEqual(log.responses, [
    ["hue_plus", "create_daily_smart_scene", { name: "Day", group: "room-1", group_type: "room", slots: [{ time: "07:00", scene: "uid-a" }, { time: "18:00", scene: "uid-b" }], days: ["monday", "tuesday", "wednesday", "thursday", "friday"] }],
  ]);
});

test("an all-day scene needs a name and a day, and only the room's still scenes are offered for its times", async () => {
  const { sandbox, log } = page();
  const data = await sandbox.hueLoadData();
  sandbox.hueSelectGroup(data.groups[0]);
  sandbox.HUENEW.slots = [{ time: "07:00", scene: "scene.a" }];
  sandbox.HUENEW.days = [1, 1, 1, 1, 1, 1, 1];
  sandbox.hueSaveAllDay();
  sandbox.HUENEW.name = "X";
  sandbox.HUENEW.days = [0, 0, 0, 0, 0, 0, 0];
  sandbox.hueSaveAllDay();
  assert.deepEqual(log.toasts, ["hn_give_it_a_name", "hn_pick_a_day"]);
  assert.deepEqual(log.responses, []);
  assert.deepEqual(plain(sandbox.hueRoomScenes()), ["scene.a", "scene.b"], "Read and Relax by name; the moving scene is not offered");
});

test("deleting a scene asks the bridge with the scene's own id, confirmed", async () => {
  const { sandbox, log } = page();
  await sandbox.hueSceneRemove("scene.b");
  assert.deepEqual(log.raw, [["hue_plus", "delete_scene", { scene: "uid-b", confirm: true }]]);
});

test("the colours of a photo are the ones that cover most of it, the commonest first", () => {
  const { sandbox } = page();
  const red = Array.from({ length: 30 }, () => [220, 30, 30]);
  const blue = Array.from({ length: 10 }, () => [30, 40, 210]);
  const palette = plain(sandbox.huePalette(red.concat(blue), 2));
  assert.equal(palette.length, 2);
  assert.ok(palette[0][0] > 150 && palette[0][2] < 80, "red first (the most pixels)");
  assert.ok(palette[1][2] > 150 && palette[1][0] < 80);
  assert.deepEqual(plain(sandbox.huePalette([], 3)), []);
});
