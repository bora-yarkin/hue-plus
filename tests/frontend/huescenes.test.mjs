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

test("the scene settings of a scene write the bridge's own settings: auto-play, Colors and Reset scene, and open the lights the scene has", async () => {
  const calls = [];
  const opened = [];
  const made = [];
  const node = (kind) => ({ kind, children: [], appendChild(c) { this.children.push(c); return c; } });
  const context = {
    H: () => ({}),
    A: () => ({ name: "Aurora" }),
    hueSceneUid: () => "bridge-scene",
    hueSceneRename: () => {},
    hueplus: { resources: () => Promise.resolve({ scenes: [{ id: "bridge-scene", speed: 0.25, auto_dynamic: true }] }) },
    sep: (text) => ({ kind: "sep", text }),
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
    showPopup: (key) => opened.push(key),
    confirmDlg: (text, then) => then(),
    toast: () => {},
    refresh: () => {},
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../../frontend/src/huescenes.js", import.meta.url), "utf8"), context);
  const body = node("body");
  vm.runInContext("hueSceneBridge", context)(body, "scene.aurora", false);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const by = (text) => made.find((p) => p.text === text).o;
  assert.equal(by("app_auto_play").on(), true, "auto-play shows what the bridge has, read when the page opens");
  by("app_auto_play").tap();
  by("app_colors").tap();
  by("app_reset_scene").tap();
  by("lights").tap();
  assert.deepEqual(calls, [
    ["hue_plus", "update_scene", { scene: "bridge-scene", auto_dynamic: false }],
    ["hue_plus", "update_scene", { scene: "bridge-scene", recolor: "shuffle" }],
    ["hue_plus", "update_scene", { scene: "bridge-scene", recolor: "reset" }],
  ]);
  assert.deepEqual(opened, ["hue-scene-lights:scene.aurora"]);
  made.length = 0;
  vm.runInContext("hueSceneBridge", context)(node("body"), "scene.still", true);
  assert.ok(!made.some((p) => p.text === "app_colors" || p.text === "app_auto_play"), "a still scene has no Colors, Reset or Auto-play");
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
