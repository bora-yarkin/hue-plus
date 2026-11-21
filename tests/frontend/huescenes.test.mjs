// SPDX-License-Identifier: GPL-3.0-or-later
// Hue scenes (frontend/src/huescenes.js): which scene entities are Hue's, how one is started, and when one is on. Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const plain = (value) => JSON.parse(JSON.stringify(value));

function integrations() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../../frontend/src/huescenes.js", import.meta.url), "utf8") + "\n;this.scenes = HUESCENES;", context);
  return context.scenes;
}

const state = (name) => ({ attributes: { name }, state: "scening" });

test("a Hue Plus scene is a Hue scene, started with Hue Plus's own service", () => {
  const scenes = integrations();
  const h = { entities: { "scene.a": { platform: "hue_plus" }, "scene.b": { platform: "hue" }, "scene.c": { platform: "matter" } } };
  assert.equal(scenes.isHue(h, "scene.a"), true);
  assert.equal(scenes.isHue(h, "scene.b"), true);
  assert.equal(scenes.isHue(h, "scene.c"), false);
  assert.deepEqual(plain(scenes.start(h, "scene.a", 50, 128)).slice(0, 2), ["hue_plus", "activate_scene"]);
  assert.deepEqual(plain(scenes.start(h, "scene.b", 50, 128)).slice(0, 2), ["hue", "activate_scene"]);
});

test("a Hue Plus scene is on when its room's scene select shows its name, and only a select of the same integration counts", () => {
  const scenes = integrations();
  const h = {
    entities: {
      "scene.read": { platform: "hue_plus", device_id: "room" },
      "select.room": { platform: "hue_plus", device_id: "room" },
      "select.hue_room": { platform: "hue", device_id: "room" },
    },
    states: {
      "scene.read": state("Read"),
      "select.room": { state: "Read", attributes: { options: ["Read", "Relax"] } },
      "select.hue_room": { state: "Read", attributes: { options: ["Read", "Relax"] } },
    },
  };
  assert.equal(scenes.active(h, "scene.read"), true);
  h.states["select.room"].state = "Relax";
  assert.equal(scenes.active(h, "scene.read"), false);
});

test("the scene settings page keeps its changes until SAVE and writes the bridge's own settings with them: the speed, auto-play, Colors or Reset scene", async () => {
  const calls = [];
  let guard = null;
  const clicks = {};
  function node(kind, cls = "") {
    const n = {
      kind,
      cls,
      children: [],
      style: { setProperty() {} },
      classList: { add() {}, remove() {}, toggle() {} },
      appendChild(c) {
        this.children.push(c);
        return c;
      },
      addEventListener(type, fn) {
        if (type === "click") clicks[cls || kind] = fn;
      },
      querySelector() {
        return node("x");
      },
      setAttribute() {},
      set innerHTML(v) {},
      set textContent(v) {},
    };
    return n;
  }
  const context = {
    window: { HueHost: {} },
    HP_PAGES: {},
    document: { createTextNode: () => node("text") },
    HM: {},
    A: () => ({ name: "Aurora", is_dynamic: true }),
    H: () => ({ states: { "scene.aurora": {} } }),
    V_: () => "off",
    isAdmin: () => true,
    cssRgb: () => "#fff",
    liveXyRgb: () => [1, 1, 1],
    kelvinRgb: () => [1, 1, 1],
    hueSceneUid: () => "bridge-scene",
    hueSceneSet: () => ({ bri: 50, speed: 50 }),
    hueSceneSave: () => {},
    hueSceneRename: () => {},
    hueplus: { has: () => true, resources: () => Promise.resolve({ scenes: [] }) },
    hmReady: () => Promise.resolve(),
    hmBox: () => {},
    hmGroup: (rows) => node("group"),
    hmLabel: () => node("label"),
    hmRow: () => node("row"),
    hpRound: () => node("round"),
    hpRoot: (b) => b,
    hpEntityOf: () => null,
    hpEntityLabel: () => "",
    hpRoomOfLight: () => null,
    sliderRow: () => node("slider"),
    svg: () => "",
    mk: node,
    pill: () => node("pill"),
    _T: (key) => key,
    callLive: () => {},
    call: () => {},
    callRaw: () => Promise.resolve(),
    confirmDlg: (text, then) => then(),
    hueSceneRemove: () => Promise.resolve(),
    showPopup: () => {},
    popBack: () => {},
    toast: () => {},
    refresh: () => {},
    mkHint: () => node("hint"),
    hmLoad: (b, kinds, draw) => draw(node("box"), { scenes: [{ id: "bridge-scene", speed: 0.25, auto_dynamic: true }] }, () => {}),
    guardUnsaved: (cfg) => {
      guard = cfg;
    },
    hpCall: (domain, service, data) => {
      calls.push([domain, service, plain(data)]);
      return Promise.resolve();
    },
    HUESCENES: { group: () => null, active: () => false, speedSteps: 12, speedToStep: (s) => Math.round(s / 100 * 11) + 1, stepToSpeed: (s) => Math.round(((s - 1) / 11) * 100) },
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../../frontend/src/hueapp.js", import.meta.url), "utf8").replace(/^if \(!window\.HueHost\)[\s\S]*$/m, ""), context);
  vm.runInContext("hpScenePage", context)(node("body"), "scene.aurora~");
  assert.ok(guard, "the page asks to be kept until SAVE");
  assert.equal(guard.dirty(), false, "nothing is changed when the page opens");
  clicks.colorsbtn();
  assert.equal(guard.dirty(), true, "Colors is a change until SAVE");
  clicks.resetbtn();
  await guard.save(() => {});
  assert.deepEqual(calls, [["hue_plus", "update_scene", { scene: "bridge-scene", speed: 0.25, auto_dynamic: true, recolor: "reset" }]]);
});

test("the lights page of a scene lists the lights of its room or zone with their rooms and saves the ticked ones by id", async () => {
  const calls = [];
  const made = [];
  const node = (kind) => ({ kind, children: [], appendChild(c) { this.children.push(c); return c; }, set innerHTML(v) { this.children = []; } });
  const resources = {
    scenes: [{ id: "bridge-scene", group_id: "zone-1", group_type: "zone", lights: ["a"] }],
    zones: [{ id: "zone-1", light_items: [{ id: "a", name: "Ceiling" }, { id: "b", name: "Ceiling" }] }],
    rooms: [
      { id: "r1", name: "Kitchen", lights: ["a"] },
      { id: "r2", name: "Hall", lights: ["b"] },
    ],
  };
  const context = {
    window: {},
    hueSceneUid: () => "bridge-scene",
    hueplus: { resources: () => Promise.resolve(resources) },
    mkHint: (text) => ({ kind: "hint", text }),
    pill: (icon, text, o) => {
      const p = { kind: "pill", text, o };
      made.push(p);
      return p;
    },
    mk: node,
    _T: (key) => key,
    callRaw: (domain, service, data) => {
      calls.push([domain, service, plain(data)]);
      return Promise.resolve();
    },
    toast: () => {},
    popBack: () => {},
    refresh: () => {},
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../../frontend/src/huescenes.js", import.meta.url), "utf8"), context);
  vm.runInContext("hueSceneLightsPage", context)(node("body"), "scene.aurora");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const ceilings = made.filter((p) => p.text === "Ceiling");
  assert.deepEqual(ceilings.map((p) => p.o.sub()), ["Kitchen", "Hall"], "two lights with one name are told apart by their rooms");
  assert.deepEqual(ceilings.map((p) => p.o.check()), [true, false]);
  ceilings[1].o.tap();
  made.find((p) => p.text === "hn_save").o.tap();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, [["hue_plus", "update_scene", { scene: "bridge-scene", lights: ["a", "b"] }]], "by the lights' ids, not their names");
});

const ROOM_STATES = {
  "light.room": { state: "on", attributes: { is_hue_group: true, entity_id: [], lights: ["Bed", "Lamp", "Desk"] } },
  "light.bed": { state: "on", attributes: { friendly_name: "Bed", brightness: 215 } },
  "light.lamp": { state: "on", attributes: { friendly_name: "Lamp", brightness: 67 } },
  "light.desk": { state: "on", attributes: { friendly_name: "Desk", brightness: 67 } },
};

function sceneContext(kept = {}) {
  const calls = [];
  const states = JSON.parse(JSON.stringify(ROOM_STATES));
  const context = {
    deviceGet: (key, fallback) => kept[key] || fallback,
    deviceSet: (key, value) => {
      kept[key] = value;
    },
    A: (id) => (id === "scene.nebula" ? { brightness: 67, speed: 0.56, is_dynamic: true } : states[id] ? states[id].attributes : {}),
    H: () => ({
      states,
      entities: { "scene.nebula": { platform: "hue_plus", device_id: "d" }, "light.room": { platform: "hue_plus" }, "light.bed": { platform: "hue_plus" }, "light.lamp": { platform: "hue_plus" }, "light.desk": { platform: "hue_plus" } },
      services: { hue_plus: { import_hue_scene: {} } },
    }),
    V_: (id) => (states[id] || {}).state || "off",
    HFROZEN: {},
    liveStopOn() {},
    call: (...a) => calls.push(["now", ...a]),
    callLive: (key, ...a) => calls.push(["live", ...a]),
    gate: (ids, fn) => fn(),
    callRaw: (...a) => {
      calls.push(["now", ...a]);
      return Promise.resolve();
    },
    serviceResponse: () =>
      Promise.resolve({ states: [{ entity_id: "light.bed", on: true, brightness: 215 }, { entity_id: "light.lamp", on: true, brightness: 67 }, { entity_id: "light.desk", on: true, brightness: 67 }] }),
    setTimeout: (fn) => fn(),
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../../frontend/src/huescenes.js", import.meta.url), "utf8") + "\n;this.set = hueSceneSet; this.save = hueSceneSave; this.start = hueSceneStart; this.dim = hueSceneDim;", context);
  vm.runInContext("HUESCENES.group = function () { return 'light.room'; };", context);
  return { context, calls, states };
}
const later = () => new Promise((resolve) => setTimeout(resolve, 0));

test("a scene starts with its own levels as the Hue app does, no one brightness for every light; only a brightness set here is scaled onto them", async () => {
  const { context, calls } = sceneContext();
  context.start("scene.nebula");
  const started = plain(calls.pop());
  assert.equal(started[2], "activate_scene");
  assert.equal("brightness" in started[3], false, "the bridge gives each light the level the scene has it at");
  context.save("scene.nebula", { speed: 30 });
  context.start("scene.nebula");
  await later();
  assert.equal(calls.length, 1, "only the speed was set here: nothing is scaled");
  calls.length = 0;
  context.save("scene.nebula", { bri: 20 });
  context.start("scene.nebula");
  await later();
  const sent = calls.map((c) => plain(c.slice(1)));
  assert.deepEqual(sent[0].slice(0, 2), ["hue_plus", "activate_scene"]);
  assert.deepEqual(sent.slice(1).map((c) => c[2].brightness_pct).sort((a, b) => a - b), [12, 37], "a set 20% scales the scene's levels (45% on average) by 20/45");
});

test("the brightness slider scales every light of the scene from its own level, keeps the ratios, stops at 100, sends one position's lights together and only the latest position waits", async () => {
  const { context, calls } = sceneContext();
  context.dim("scene.nebula", 20, true);
  await later();
  const sent = calls.map((c) => plain(c));
  assert.deepEqual(sent.map((c) => [c[0], c[1], c[2]]), [["now", "light", "turn_on"], ["now", "light", "turn_on"]]);
  assert.deepEqual(Object.fromEntries(sent.map((c) => [c[3].brightness_pct, c[3].entity_id])), { 37: ["light.bed"], 12: ["light.lamp", "light.desk"] });
  await later();
  calls.length = 0;
  for (const v of [30, 40, 50, 60, 90]) context.dim("scene.nebula", v, false);
  await later();
  await later();
  assert.ok(calls.every((c) => c[3].brightness_pct <= 100), "a light does not go past 100%");
  const last = calls.slice(-2).map((c) => c[3].brightness_pct).sort((a, b) => a - b);
  assert.deepEqual(last, [86, 97], "the last position is the one that settles (above the scene's own brightness the lights move toward 100% in proportion)");
  assert.ok(calls.length <= 4, "the positions in between are not all sent");
  calls.length = 0;
  context.dim("scene.nebula", 100, true);
  await later();
  assert.deepEqual(plain(calls.map((c) => [c[3].brightness_pct, c[3].entity_id.slice().sort()])), [[100, ["light.bed", "light.desk", "light.lamp"]]], "100% is every light at 100%, in one command");
  calls.length = 0;
  context.HFROZEN["light.room"] = "scene.nebula";
  context.dim("scene.nebula", 20, true);
  assert.deepEqual(plain(calls.pop()), ["now", "light", "turn_on", { entity_id: "light.room", brightness_pct: 20 }], "a frozen scene is a plain brightness");
});

test("the lights of a room are the ones its group names when it lists no entities, found by their names among the Hue lights", () => {
  const scenes = integrations();
  const h = {
    entities: { "light.room": { platform: "hue_plus" }, "light.bed": { platform: "hue_plus" }, "light.desk": { platform: "hue" }, "light.other": { platform: "hue_plus" }, "light.zwave": { platform: "zwave_js" } },
    states: {
      "light.room": { attributes: { is_hue_group: true, entity_id: [], lights: ["Bed Light", "Desk light"] } },
      "light.bed": { attributes: { friendly_name: "Bed light" } },
      "light.desk": { attributes: { friendly_name: "Desk Light" } },
      "light.other": { attributes: { friendly_name: "Other" } },
      "light.zwave": { attributes: { friendly_name: "Bed light" } },
    },
  };
  assert.deepEqual(plain(scenes.roomLights(h, "light.room")).sort(), ["light.bed", "light.desk"]);
  h.states["light.room"].attributes.entity_id = ["light.other"];
  assert.deepEqual(plain(scenes.roomLights(h, "light.room")), ["light.other"], "the members it lists are used as they are");
});

test("a live scene is playing when a light of the room that is on says so, also when the group names its lights instead of listing them", () => {
  const scenes = integrations();
  const h = {
    entities: { "light.room": { platform: "hue_plus" }, "light.a": { platform: "hue_plus" }, "light.b": { platform: "hue_plus" } },
    states: {
      "light.room": { attributes: { is_hue_group: true, entity_id: [], lights: ["A", "B"], dynamics: true } },
      "light.a": { state: "on", attributes: { friendly_name: "A", dynamics: "none" } },
      "light.b": { state: "on", attributes: { friendly_name: "B", dynamics: "dynamic_palette" } },
    },
  };
  assert.equal(scenes.playing(h, "light.room"), true);
  h.states["light.b"].attributes.dynamics = "none";
  assert.equal(scenes.playing(h, "light.room"), false);
});
