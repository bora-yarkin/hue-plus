// SPDX-License-Identifier: GPL-3.0-or-later
// The lights picker of the Hue app (frontend/src/huepicker.js): what is chosen becomes the targets the services take, and what an automation or a button has becomes what is chosen. Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const plain = (v) => JSON.parse(JSON.stringify(v));
const SRC = new URL("../../frontend/src/", import.meta.url);

function load() {
  const context = vm.createContext({ Object, Array, JSON });
  vm.runInContext(readFileSync(new URL("huepicker.js", SRC), "utf8"), context);
  return context;
}

const rooms = [
  { id: "r1", name: "Bedroom", lights: ["a", "b", "c"], light_items: [{ id: "a", name: "Bed Light" }, { id: "b", name: "Ceiling L" }, { id: "c", name: "Ceiling R" }] },
  { id: "r2", name: "Bathroom", lights: ["d"], light_items: [{ id: "d", name: "Mirror" }] },
];
const zones = [{ id: "z1", name: "Reading", lights: ["a"], light_items: [{ id: "a", name: "Bed Light" }] }];

test("a room with every light chosen is the room, with some of them it is those lights, and nothing chosen is nothing", () => {
  const c = load();
  const groups = c.hpkGroups({ rooms, zones });
  assert.deepEqual(plain(c.hpkTargets({ home: false, picked: { r1: ["a", "b", "c"], r2: [] } }, groups)), [{ group: "Bedroom", group_type: "room" }]);
  assert.deepEqual(plain(c.hpkTargets({ home: false, picked: { r1: ["a", "c"] } }, groups)), [{ group: "Bedroom", group_type: "room", lights: ["Bed Light", "Ceiling R"] }]);
  assert.deepEqual(plain(c.hpkTargets({ home: false, picked: {} }, groups)), []);
});

test("several rooms and zones are several targets, and the whole home is the whole home alone", () => {
  const c = load();
  const groups = c.hpkGroups({ rooms, zones });
  assert.deepEqual(plain(c.hpkTargets({ home: false, picked: { r2: ["d"], z1: ["a"] } }, groups)), [
    { group: "Bathroom", group_type: "room" },
    { group: "Reading", group_type: "zone" },
  ]);
  assert.deepEqual(plain(c.hpkTargets({ home: true, picked: {} }, groups)), [{ group_type: "home" }]);
});

test("what the bridge keeps for an automation or a button is what the picker starts with", () => {
  const c = load();
  const groups = c.hpkGroups({ rooms, zones });
  const state = c.hpkStateOf(
    [{ group: { rid: "r1", rtype: "room" }, items: [{ rid: "b", rtype: "light" }] }, { group: { rid: "r2", rtype: "room" } }],
    groups
  );
  assert.deepEqual(plain(state), { home: false, picked: { r1: ["b"], r2: ["d"] } });
  assert.equal(c.hpkStateOf([{ group: { rid: "h", rtype: "bridge_home" } }], groups).home, true);
});

test("a group the bridge answered without its lights can only be chosen whole", () => {
  const c = load();
  const [room] = c.hpkGroups({ rooms: [{ id: "r1", name: "Bedroom", lights: ["a"] }], zones: [] });
  assert.equal(room.whole, true);
});
