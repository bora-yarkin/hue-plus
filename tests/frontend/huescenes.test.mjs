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
