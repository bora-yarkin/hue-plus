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
