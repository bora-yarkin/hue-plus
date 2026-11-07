// SPDX-License-Identifier: GPL-3.0-or-later
// Which entities belong to one Hue Spotify sync and to one Hue Play HDMI Sync Box (frontend/src/huesync.js). Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const SOURCE = readFileSync(new URL("../../frontend/src/huesync.js", import.meta.url), "utf8");

function sandbox(rows) {
  const hass = { entities: {} };
  for (const [id, platform, unique_id] of rows) hass.entities[id] = { entity_id: id, platform, unique_id };
  const context = {};
  vm.createContext(context);
  vm.runInContext(SOURCE + "\n;this.exported = { HUESYNC, HUESYNCBOX };", context);
  return { hass, ...context.exported };
}

const BOX = [
  ["switch.box_sync", "hue_plus", "b1_syncbox_sync"],
  ["select.box_mode", "hue_plus", "b1_syncbox_mode"],
  ["select.box_hdmi_input", "hue_plus", "b1_syncbox_source"],
  ["number.box_brightness", "hue_plus", "b1_syncbox_brightness"],
  ["binary_sensor.box_hdmi_signal", "hue_plus", "b1_syncbox_hdmi_signal"],
  ["switch.other_box_sync", "hue_plus", "b2_syncbox_sync"],
  ["select.other_box_mode", "hue_plus", "b2_syncbox_mode"],
];
const SPOTIFY = [
  ["switch.spotify", "hue_plus", "br_sync_sync"],
  ["number.spotify_brightness", "hue_plus", "br_sync_brightness"],
];

test("the entities of one box are found from any of its entities, and another box's are not mixed in", () => {
  const { hass, HUESYNC, HUESYNCBOX } = sandbox([...BOX, ...SPOTIFY]);
  const box = HUESYNCBOX;
  const first = box.entities(hass, "select.box_mode");
  assert.deepEqual(JSON.parse(JSON.stringify(first)), {
    sync: "switch.box_sync",
    mode: "select.box_mode",
    source: "select.box_hdmi_input",
    brightness: "number.box_brightness",
    hdmi_signal: "binary_sensor.box_hdmi_signal",
  });
  assert.equal(box.entities(hass, "switch.other_box_sync").mode, "select.other_box_mode");
  assert.equal(box.isBox(hass, "switch.box_sync"), true);
  assert.equal(box.isBox(hass, "select.box_mode"), false);
});

test("a Spotify sync is never taken for a box, and a box never for a Spotify sync", () => {
  const { hass, HUESYNC, HUESYNCBOX } = sandbox([...BOX, ...SPOTIFY]);
  assert.equal(HUESYNCBOX.isBox(hass, "switch.spotify"), false);
  assert.equal(HUESYNC.isSync(hass, "switch.box_sync"), false);
  assert.equal(HUESYNC.isSync(hass, "switch.spotify"), true);
  assert.equal(HUESYNCBOX.entities(hass, "number.spotify_brightness"), null);
});

test("entities of other integrations, or unknown keys, are not part of a box", () => {
  const { hass, HUESYNC, HUESYNCBOX } = sandbox([
    ["switch.x_sync", "other", "b1_syncbox_sync"],
    ["switch.y", "hue_plus", "b1_syncbox_mystery"],
    ["switch.z", "hue_plus", null],
  ]);
  for (const id of ["switch.x_sync", "switch.y", "switch.z", "switch.missing"]) {
    assert.equal(HUESYNCBOX.entities(hass, id), null, id);
  }
});

test("a box whose sync switch is disabled has no entities to show", () => {
  const { hass, HUESYNC, HUESYNCBOX } = sandbox([["select.box_mode", "hue_plus", "b1_syncbox_mode"]]);
  assert.equal(HUESYNCBOX.entities(hass, "select.box_mode"), null);
});
