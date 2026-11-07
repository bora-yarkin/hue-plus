// SPDX-License-Identifier: GPL-3.0-or-later
// The Hue Plus menu that Hue Plus brings to the dashboard (frontend/src): every page it opens exists, every text it uses is defined, nothing a bridge or a device names is put
// into the page as markup, and nothing writes a device's setting except saving its draft. Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const SRC = new URL("../../frontend/src/", import.meta.url);
const read = (name) => readFileSync(new URL(name, SRC), "utf8");
const menu = read("huemenu.js");
// The plugin's own texts, and the few the dashboard has for everything (a word like "off" or "lights" is not repeated in every plugin).
const strings = read("strings.js");
const SHARED = new Set(["add_at_least_one_light", "all_off", "area", "auto", "automations", "button", "clock", "firmware", "give_the_area_a_name", "home", "home_and_away", "hue_plus", "in_this_room", "light", "lights", "loading", "lock", "manual", "no_effect", "none", "nothing_found", "number", "off", "on_2", "other", "pause", "power", "press", "rooms", "safety", "scene", "scenes", "switch", "time", "unavailable", "zigbee_channel"]);
const pages = new Set([...(menu + read("hueplus.js")).matchAll(/HP_PAGES\["([a-z-]+)"\]\s*=|^\s*"([a-z-]+)": \[/gm)].map((m) => m[1] || m[2]));
const hasText = (key) => SHARED.has(key) || strings.includes(`"${key}":`);

test("every page the menu opens is defined", () => {
  const opened = [...menu.matchAll(/(?:tap: |showPopup\()"(hue-[a-z]+|stg-hue)(?::|")/g)].map((m) => m[1]);
  assert.ok(opened.length > 10);
  for (const key of opened) assert.ok(pages.has(key), `${key} is opened but has no page`);
});

test("every text of the menu is defined", () => {
  const keys = new Set([...menu.matchAll(/_T\("([a-z0-9_]+)"\)/g)].map((m) => m[1]));
  for (const key of keys) assert.ok(hasText(`${key}`), `${key} has no text`);
  // The texts built from a value of the bridge or of an entity: every value the menu offers has its own.
  const families = {
    hm_fn_: ["decorative", "functional", "mixed"],
    fn_: ["decorative", "functional", "mixed"],
    hm_pw_: ["safety", "last_on_state", "powerfail", "custom"],
    hm_end_: ["last_state", "off", "pause", "scene"],
    end_: ["last_state", "off", "pause", "scene"],
    hm_: ["horizontal", "vertical", "forward", "reversed"],
    hp_: ["sunrise", "sunset", "no_effect"],
    hm_kind_: ["brighten", "dim", "off", "nothing", "scene", "cycle", "time"],
  };
  for (const [prefix, values] of Object.entries(families))
    for (const value of values) assert.ok(hasText(`${prefix}${value}`), `${prefix}${value} has no text`);
  for (const value of ["safety", "last_on_state", "powerfail", "custom"]) assert.ok(hasText(`hm_pw_${value}_sub`), `hm_pw_${value}_sub has no text`);
  for (const value of ["scene_cycle", "single_scene", "brighten", "dim", "lights_off", "do_nothing"]) assert.ok(hasText(`hm_${value}_sub`), `hm_${value}_sub has no text`);
});

test("the menu puts no name of a device or of the bridge into the page as markup", () => {
  // Markup is only a fixed string and an icon; the only names allowed besides are the switches of a row (is there a toggle, a tick, an arrow, an icon).
  const allowed = new Set(["o", "icon", "toggle", "check", "key", "svg"]);
  const risky = [...menu.matchAll(/innerHTML\s*=\s*([^;]+);/g)]
    .map((m) => m[1].replace(/"(?:[^"\\]|\\.)*"/g, "S"))
    .flatMap((v) => v.match(/[A-Za-z_]+/g) || [])
    .filter((word) => word !== "S" && !allowed.has(word));
  assert.deepEqual(risky, []);
  const calls = [];
  for (let at = menu.indexOf("mk("); at >= 0; at = menu.indexOf("mk(", at + 1)) {
    let depth = 0,
      i = at + 2,
      quote = null;
    const args = [];
    let from = i + 1;
    for (; i < menu.length; i++) {
      const c = menu[i];
      if (quote) {
        if (c === "\\") i++;
        else if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) {
          args.push(menu.slice(from, i));
          break;
        }
      } else if (c === "," && depth === 1) {
        args.push(menu.slice(from, i));
        from = i + 1;
      }
    }
    if (args.length >= 3) calls.push(args[2].trim());
  }
  assert.ok(calls.length > 0);
  for (const html of calls)
    assert.ok(/^("[^"]*"|svg\("[a-z]+"\))(\s*\+\s*(svg\("[a-z]+"\)|svg\(icon\)|"[^"]*"))*$/.test(html), `markup from ${html}`);
});

test("a page never writes a setting of a device: only saving a device's draft does", () => {
  // The settings of a light, a switch, a MotionAware area and an entertainment area are staged and sent by hmSaveLight, hmSaveSwitch, hmSaveMotion and hmSaveArea; no other function of the menu may send them.
  const writes = [
    ...menu.matchAll(/(?:hpCall|call|callRaw)\(\s*"(hue_plus|select)",\s*"(configure_light|configure_button|set_motion_area|select_option|set_streaming_end_state|update_entertainment_area)"/g),
  ];
  assert.ok(writes.length >= 6, "the device writes are all there");
  for (const match of writes) {
    const owner = [...menu.slice(0, match.index).matchAll(/^function (\w+)/gm)].pop()[1];
    assert.match(owner, /^hmSave(Light|Switch|Motion|Area)$/, `${match[2]} is sent from ${owner}`);
  }
});

test("the menu is read once when it opens, and every page draws from that", () => {
  assert.equal([...menu.matchAll(/hueplus\.resources\(HM_KINDS\)/g)].length, 1);
  assert.doesNotMatch(menu, /hmFetch/);
  // The pages that act at once read only their own kinds again; none of them reads on opening.
  assert.match(menu, /if \(HM_READY\) show\(\);/);
});

test("a device of the menu asks when it is left with changes that are not saved, on its page and on the pages that choose its settings", () => {
  for (const [page, inner] of [["hmLight", false], ["hmSwitch", false], ["hmMotionArea", false], ["hmArea", false]])
    assert.match(menu, new RegExp(`function ${page}\\(b, id\\) \\{\\s*hmBox\\(b\\);\\s*hmGuard\\(hmdKey\\("[a-z]+", id\\)\\);`), `${page} is not a guarded device`);
  for (const page of ["hmButtonPage", "hmPress", "hmScenePick", "hmCycle", "hmTimePage", "hmCycleSlot", "hmTimeSlot", "hmEnd", "hmEndScene", "hmPerf"])
    assert.match(menu, new RegExp(`function ${page}\\(b, id\\) \\{\\s*hmBox\\(b\\);\\s*hmGuard\\([^;]*, true\\);`), `${page} is not an inner page of a device`);
  assert.match(menu, /var cfg = HM_PICKS\[kind\],\s*key = hmdKey\("light", id\);\s*hmGuard\(key, true\);/);
});

test("every function and variable of the menu and its drafts that is used is defined somewhere", () => {
  // The menu's own helpers (hm..., hp..., hmd..., HM...) are global; a helper that was removed while a page still calls it only fails when that page is opened.
  const all = ["adapter.js", "hmdraft.js", "hueplus.js", "huemenu.js"].map(read).join("\n");
  const defined = new Set([...all.matchAll(/(?:^|\n)\s*(?:function\s+([A-Za-z_]\w*)|var\s+([A-Za-z_]\w*)\s*=)/g)].flatMap((m) => [m[1], m[2]]).filter(Boolean));
  const used = new Set();
  for (const file of ["huemenu.js", "hmdraft.js", "hueplus.js"])
    for (const m of read(file).replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/"(?:[^"\\\n]|\\.)*"/g, '""').matchAll(/(?<![.\w$])((?:hm|hp|hmd|HM|HP)[A-Za-z0-9_]*)\s*\(/g)) used.add(m[1]);
  assert.ok(used.size > 40);
  for (const name of used) assert.ok(defined.has(name), `${name} is called but defined nowhere`);
});

test("the bundle is built in the order the pages need, and uses the dashboard only through the plugin API", () => {
  const order = ["prologue.js", "strings.js", "adapter.js", "hmdraft.js", "hueplus.js", "huemenu.js", "epilogue.js"];
  const built = readFileSync(new URL("../../custom_components/hue_plus/frontend/menu.js", import.meta.url), "utf8");
  let at = -1;
  for (const name of order) {
    const first = read(name).trim().split("\n")[0];
    const next = built.indexOf(first, at + 1);
    assert.ok(next > at, `${name} is in the bundle, after the one before it`);
    at = next;
  }
  assert.match(read("prologue.js"), /if \(!HC \|\| HC\.version !== 1\) return;/, "a dashboard with another version of the API is left alone");
  // Nothing in the sources reaches for a dashboard variable by name: what the dashboard keeps in variables is read through the prologue's functions.
  for (const name of ["huemenu.js", "hueplus.js", "hmdraft.js", "adapter.js"])
    assert.doesNotMatch(read(name).replace(/\/\*[\s\S]*?\*\//g, ""), /\b(ISADMIN|SHEET|POPGUARD|EAD|Integrations)\b/, `${name} uses a dashboard variable directly`);
});
