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

test("the scene settings of a moving scene write the bridge's own settings: speed, auto-play, Colors and Reset scene", async () => {
  const calls = [];
  const made = [];
  const node = (kind) => ({ kind, children: [], appendChild(c) { this.children.push(c); return c; } });
  const context = {
    HUESCENES: undefined,
    H: () => ({}),
    A: () => ({}),
    hueSceneUid: () => "bridge-scene",
    hueplus: { resources: () => Promise.resolve({ scenes: [{ id: "bridge-scene", speed: 0.25, auto_dynamic: true }] }) },
    sep: (text) => ({ kind: "sep", text }),
    sliderRow: (o) => ({ kind: "slider", o }),
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
    confirmDlg: (text, then) => then(),
    toast: () => {},
    refresh: () => {},
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../../frontend/src/huescenes.js", import.meta.url), "utf8"), context);
  const body = node("body");
  vm.runInContext("hueSceneBridge", context)(body, "scene.aurora");
  await new Promise((resolve) => setTimeout(resolve, 0));
  const slider = body.children.find((c) => c.kind === "slider");
  assert.equal(slider.o.get(), vm.runInContext("HUESCENES.speedToStep(25)", context), "the speed shown is the bridge's, read when the page opens");
  slider.o.commit(12);
  made.find((p) => p.text === "app_auto_play").o.tap();
  made.find((p) => p.text === "app_colors").o.tap();
  made.find((p) => p.text === "app_reset_scene").o.tap();
  assert.deepEqual(calls, [
    ["hue_plus", "update_scene", { scene: "bridge-scene", speed: 1 }],
    ["hue_plus", "update_scene", { scene: "bridge-scene", auto_dynamic: false }],
    ["hue_plus", "update_scene", { scene: "bridge-scene", recolor: "shuffle" }],
    ["hue_plus", "update_scene", { scene: "bridge-scene", recolor: "reset" }],
  ]);
});
