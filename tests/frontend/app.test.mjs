// SPDX-License-Identifier: GPL-3.0-or-later
// The Hue dashboard panel (frontend/app, the dashboard module): its texts exist, its bundle is complete and plain script, and its pages only reach the services Hue Plus and Home Assistant have.
// Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const APP_FILES = ["shell.js", "home.js", "sortable.js", "scenes.js", "switchpages.js", "cyclepage.js", "lightsettings.js", "autotab.js", "light.js", "syncpage.js"].map((f) => read(`frontend/app/${f}`));
const host = read("frontend/app/host.js");
const bundle = read("custom_components/hue_plus/frontend/app.js");
const plugin = [...APP_FILES, ...["huemenu.js", "huewizard.js", "humotion.js", "huerooms.js", "huesync.js", "huescenes.js", "huestyle.js"].map((f) => read(`frontend/src/${f}`))].join("\n");
const strings = read("frontend/src/strings.js");

// The words the host itself holds, the table (EN) in host.js.
const hostTable = host.slice(host.indexOf("var EN = {"), host.indexOf("\n  };", host.indexOf("var EN = {")));
const hasText = (key) => strings.includes(`"${key}":`) || hostTable.includes(`"${key}":`) || hostTable.includes(`${key}:`);

test("every text the panel's own pages use is defined", () => {
  const keys = new Set(APP_FILES.join("\n").matchAll(/_T\("([a-z0-9_]+)"\)/g).map((m) => m[1]));
  assert.ok(keys.size > 20);
  for (const key of keys) assert.ok(hasText(key), `${key} has no text`);
});

test("every page the panel opens is registered by the panel or by the Hue Plus menu", () => {
  const registered = new Set([...plugin.matchAll(/HP_PAGES\["([a-z0-9-]+)"\]\s*=|^\s*"([a-z0-9-]+)": \[/gm)].map((m) => m[1] || m[2]));
  for (const m of APP_FILES.join("\n").matchAll(/(?:showPopup\(|tap: )"([a-z-]+)(?::|")/g)) assert.ok(registered.has(m[1]) || /^app-/.test(m[1]), `${m[1]} is opened but has no page`);
});

test("the bundle is plain script that can be loaded as a classic script", () => {
  assert.doesNotThrow(() => new vm.Script(bundle, { filename: "app.js" }));
  assert.ok(bundle.includes("window.HuePlusApp"));
  assert.ok(bundle.includes("window.HomeControl"), "the host must offer the plugin API the pages are written against");
});

test("nothing a bridge or a device names is put into the page as markup", () => {
  for (const code of APP_FILES) {
    for (const m of code.matchAll(/\.innerHTML\s*=\s*([^;]+);/g)) assert.ok(!/friendly_name|\.name\b|attributes/.test(m[1]), `innerHTML takes a name: ${m[0]}`);
  }
});

test("the panel does not write to the bridge except through Hue Plus services, the light and scene services and a device's firmware update", () => {
  const calls = [...APP_FILES.join("\n").matchAll(/\bcall(?:Raw|Live)?\("([a-z_]+)",\s*"([a-z_]+)"/g)].map((m) => `${m[1]}.${m[2]}`);
  for (const call of calls) assert.ok(/^(light\.|hue_plus\.|scene\.|update\.install)/.test(call), `${call} is not a service the panel should call`);
});

test("nothing is kept in Home Assistant: the panel and the frame of the light panel do not read or write its saved data", () => {
  const popup = read("custom_components/hue_plus/frontend/popup.html");
  for (const code of [...APP_FILES, host, popup]) assert.ok(!/set_user_data|set_system_data|get_user_data|get_system_data|subscribe_system_data/.test(code.replace(/\/\*[\s\S]*?\*\//g, "")), "a call that saves data in Home Assistant");
  // Home Control's dashboard saves its layout, theme and colours there; the frame turns all of that into nothing.
  assert.ok(/HA\.data = \{ get: nothing, set: nothing, subscribe: nothing, unsubscribe: nothing \}/.test(popup));
  assert.ok(/window\.savedRoomOf = function \(\) \{\s*return null;/.test(popup));
});

test("a room's scenes are the app's folders and a scene's page has only what the bridge can do", () => {
  const scenes = read("frontend/app/scenes.js");
  // The Hue Plus scene page has Home Control's "import as a classic scene" and "hide"; the app has neither, and the panel does not open that page.
  assert.ok(!/import_as_a|importLiveScene|hueImportable/.test(APP_FILES.join("\n")));
  // What the scene's page and its three dots change goes to the bridge with services Hue Plus has.
  for (const service of scenes.matchAll(/hpCall\("hue_plus", "([a-z_]+)"/g)) assert.ok(read("custom_components/hue_plus/bridge/spec.py").includes(`"${service[1]}"`), `${service[1]} is not a Hue Plus service`);
  assert.ok(/frows/.test(read("frontend/app/app.css")) && /grid-auto-rows/.test(read("frontend/app/app.css")), "the folders are rows that scroll sideways");
});

test("no two pages of the Hue Plus menu share a key (one used to hide another: the scene wizard's lights page hid Lights & smart plugs)", () => {
  const sources = ["huemenu.js", "huewizard.js", "humotion.js", "huerooms.js", "huesync.js", "huescenes.js", "huestyle.js", "huenewscene.js", "hueplus.js", "epilogue.js"].map((f) => read(`frontend/src/${f}`)).join("\n");
  const keys = [...sources.matchAll(/HP_PAGES\["([a-z0-9-]+)"\]\s*=/g), ...sources.matchAll(/HC\.registerPage\(\s*"([a-z0-9-]+)"/g), ...sources.matchAll(/^\s*"([a-z0-9-]+)": \[$/gm)].map((m) => m[1]);
  const seen = new Set();
  for (const key of keys) {
    assert.ok(!seen.has(key), `${key} is registered twice`);
    seen.add(key);
  }
});
