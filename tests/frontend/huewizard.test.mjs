// SPDX-License-Identifier: GPL-3.0-or-later
// The Hue app's wizards in the menu (frontend/src/huewizard.js, humotion.js, huerooms.js): what a routine or area from the bridge becomes in the wizard, and what saving sends to the bridge.
// Run: node --test tests/frontend
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const plain = (value) => JSON.parse(JSON.stringify(value));
const APP = new URL("../../frontend/src/", import.meta.url);

function load(held = {}, texts = {}) {
  const sent = [];
  const popped = [];
  const context = vm.createContext({
    Object, Array, JSON, Date, String, Number, Math, Promise,
    HP_PAGES: {},
    _T: (key) => texts[key] || key,
    H: () => ({}),
    A: () => ({ hue_light_id: "hl1" }),
    hpName: () => "Lamp",
    hueplus: { lights: () => ["light.a"] },
    HM: held,
    HM_READY: true,
    hmList: (kind) => (Array.isArray(held[kind]) ? held[kind] : []),
    hmMotionAreas: () => (held.motion_areas || {}).areas || [],
    hmMotionArea1: (id) => ((held.motion_areas || {}).areas || []).filter((x) => x.id === id)[0],
    hmEnsure: () => {},
    cntS: (n, one, many) => `${n} ${n === 1 ? one : many}`,
    toast: () => {},
    showPopup: () => {},
    popBack: () => popped.push("back"),
    hpCall: (domain, service, data) => (sent.push([domain, service, plain(data)]), Promise.resolve()),
  });
  for (const name of ["huewizard.js", "humotion.js", "huerooms.js"]) vm.runInContext(readFileSync(new URL(name, APP), "utf8"), context);
  context.sent = sent;
  context.popped = popped;
  return context;
}

// What the Hue app wrote for the owner's own "Wake up" routine (read from the bridge, ids shortened).
const WAKE_UP = {
  id: "auto-1",
  name: "Wake up",
  script: "Basic wake up routine",
  configuration: {
    end_brightness: 65.0087260034904,
    fade_in_duration: { seconds: 1800 },
    style: "sunrise",
    when: { recurrence_days: ["wednesday"], time_point: { time: { hour: 6, minute: 0 }, type: "time" } },
    where: [{ group: { rid: "room-1", rtype: "room" }, items: [{ rid: "l1", rtype: "light" }] }],
  },
};

test("a wake-up routine of the bridge becomes the answers of the wizard, as the Hue app shows them", () => {
  const w = load();
  const state = w.hwAutomationState("wake_up", WAKE_UP);
  assert.equal(state.time, "06:00");
  assert.deepEqual(plain(state.days), ["wednesday"]);
  assert.equal(state.minutes, 30);
  assert.equal(state.brightness, 65);
  assert.equal(state.style, "sunrise");
  assert.deepEqual(plain(state.group), { id: "room-1", type: "room" });
  assert.equal(state.edit, "auto-1");
  assert.equal(state.name, "Wake up");
});

test("a new routine starts with the Hue app's own values and a name that is not taken", () => {
  const w = load({ automations: [{ name: "Wake up" }, { name: "Wake up 2" }] }, { hw_name_wake_up: "Wake up" });
  w.hwSeen = w.hmList("automations");
  const wake = w.hwAutomationState("wake_up", null);
  assert.equal(wake.name, "Wake up 3");
  assert.equal(wake.time, "07:00");
  assert.equal(wake.minutes, 30);
  assert.equal(wake.brightness, 100);
  assert.equal(wake.style, "sunrise");
  assert.equal(wake.days.length, 7);
  const sleep = w.hwAutomationState("go_to_sleep", null);
  assert.equal(sleep.style, "sunset");
  assert.equal(sleep.minutes, 15);
  assert.equal(sleep.steps.indexOf("hue-wz-settings") >= 0, true);
});

function saved(w, state) {
  w.hwBegin({ finish: w.hwSaveAutomation, steps: [], ...state });
  w.HW.depth = 1;
  w.hwSaveAutomation();
  return w.sent[w.sent.length - 1];
}

test("saving sends the fields the service takes, for every kind of automation", () => {
  const w = load();
  const group = { id: "room-1", type: "room" };
  const base = { group, name: "N", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] };

  let [domain, service, data] = saved(w, { ...base, kind: "wake_up", time: "06:45", minutes: 20, brightness: 80, style: "basic", offAfter: 15 });
  assert.deepEqual([domain, service], ["hue_plus", "create_routine"]);
  assert.deepEqual(data, { name: "N", group: "room-1", group_type: "room", time: "06:45:00", days: [], minutes: 20, end_brightness: 80, style: "basic", turn_off_after_minutes: 15, routine: "wake_up" });

  [, , data] = saved(w, { ...base, kind: "wake_up", time: "06:45", minutes: 20, brightness: 80, style: "sunrise", offAfter: 0, days: ["monday"] });
  assert.equal("turn_off_after_minutes" in data, false, "no switch-off when the answer is No");
  assert.deepEqual(data.days, ["monday"]);

  [, , data] = saved(w, { ...base, kind: "go_to_sleep", time: "22:30", minutes: 15, style: "sunset" });
  assert.deepEqual(data, { name: "N", group: "room-1", group_type: "room", time: "22:30:00", days: [], minutes: 15, style: "sunset", routine: "go_to_sleep" });

  [, , data] = saved(w, { ...base, kind: "timer", hours: 1, mins: 5, scene: "s1" });
  assert.deepEqual(data, { name: "N", group: "room-1", group_type: "room", minutes: 65, scene: "s1", routine: "timer" });

  [, , data] = saved(w, { ...base, kind: "schedule", time: "18:00", until: "23:00", randomize: 15, scene: "s1" });
  assert.equal(data.until, "23:00:00");
  assert.equal(data.randomize_minutes, 15);
  assert.equal(data.scene, "s1");

  [, , data] = saved(w, { ...base, kind: "schedule", time: "18:00", until: "", randomize: 0, scene: "s1" });
  assert.equal("until" in data, false);
  assert.equal("randomize_minutes" in data, false);

  [, , data] = saved(w, { ...base, kind: "coming_home", scene: "s1" });
  assert.deepEqual(data, { name: "N", group: "room-1", group_type: "room", scene: "s1", routine: "coming_home" });

  [, , data] = saved(w, { ...base, kind: "leaving_home" });
  assert.deepEqual(data, { name: "N", group: "room-1", group_type: "room", routine: "leaving_home" });
});

test("changing a routine names it, and goes to update_routine instead of creating another", () => {
  const w = load();
  const [, service, data] = saved(w, { kind: "timer", group: { id: "room-1", type: "room" }, name: "Tea", hours: 0, mins: 4, scene: "s1", edit: "auto-2" });
  assert.equal(service, "update_routine");
  assert.equal(data.automation, "auto-2");
  assert.equal("routine" in data, false);
});

test("saving a wizard goes back past every page it opened, and an unsaved wizard is gone", () => {
  const w = load();
  w.hwBegin({ kind: "x", steps: [] });
  w.HW.depth = 4;
  w.hwLeave();
  assert.equal(w.popped.length, 4);
  assert.equal(w.HW, null);
});

const AREA_AUTOMATION = {
  id: "auto-3",
  configuration: {
    source: { rid: "ma-1", rtype: "motion_area_configuration" },
    where: [{ group: { rid: "room-1", rtype: "room" } }],
    when: {
      timeslots: [
        { start_time: { type: "time", time: { hour: 7, minute: 0 } }, on_motion: { recall_single: [{ action: { recall: { rid: "scene-4", rtype: "scene" } } }] }, on_no_motion: { after: { minutes: 10 }, recall_single: [{ action: "all_off" }] } },
        { start_time: { type: "time", time: { hour: 23, minute: 0 } }, on_motion: { recall_single: [{ action: { recall: { rid: "scene-3", rtype: "scene" } } }] } },
      ],
    },
    settings: { daylight_sensitivity: { dark_threshold: 4000, offset: 7000 } },
  },
};

test("the times of a MotionAware area are read from its automation the way the bridge keeps them", () => {
  const w = load({ automations: [AREA_AUTOMATION], motion_areas: { areas: [{ id: "ma-1", group: { rid: "room-1", rtype: "room" } }] } });
  assert.equal(w.hmwAutomationOf("ma-1").id, "auto-3");
  assert.equal(w.hmwAutomationOf("other"), undefined);
  assert.deepEqual(plain(w.hmwSlotsFrom(AREA_AUTOMATION)), [
    { time: "07:00", scene: "scene-4", off: 10 },
    { time: "23:00", scene: "scene-3", off: 0 },
  ]);
  w.hmwStartSlots("ma-1");
  assert.deepEqual(plain(w.HW.groups), [{ id: "room-1", type: "room" }]);
  assert.equal(w.HW.dark, 4000);
  assert.equal(w.HW.slots.length, 2);
});

test("an area without an automation yet controls the lights of its own room", () => {
  const w = load({ automations: [], motion_areas: { areas: [{ id: "ma-1", group: { rid: "room-1", rtype: "room" } }] } });
  w.hmwStartSlots("ma-1");
  assert.deepEqual(plain(w.HW.groups), [{ id: "room-1", type: "room" }]);
  assert.deepEqual(plain(w.HW.slots), []);
  assert.equal(w.HW.dark, undefined);
});

test("what an area does is written with set_motion_area_lights: scenes by time, minutes before the lights go off, and the daylight level", () => {
  const w = load();
  w.hwBegin({ kind: "mslots", areaId: "ma-1", groups: [{ id: "room-1", type: "room" }], slots: [{ time: "07:00", scene: "s1", off: 10 }, { time: "23:00", scene: "s2", off: 0 }], dark: 4000 });
  w.HW.depth = 1;
  w.hmwSetLights();
  assert.deepEqual(w.sent[0], [
    "hue_plus",
    "set_motion_area_lights",
    { area: "ma-1", groups: ["room-1"], slots: [{ time: "07:00", scene: "s1", off_after_minutes: 10 }, { time: "23:00", scene: "s2" }], dark_threshold: 4000 },
  ]);
  w.hwBegin({ kind: "mslots", areaId: "ma-1", groups: [{ id: "room-1", type: "room" }], slots: [{ time: "07:00", scene: "s1", off: 0 }], dark: null });
  w.hmwSetLights();
  assert.equal("dark_threshold" in w.sent[1][2], false, "no daylight setting, no dark_threshold");
});

test("the Hue app's default times use the scenes of the room by name, and only when all three are there", () => {
  const scenes = [
    { id: "c", name: "Concentrate", group_id: "room-1" },
    { id: "r", name: "Read", group_id: "room-1" },
    { id: "n", name: "Nightlight", group_id: "room-1" },
    { id: "x", name: "Read", group_id: "other-room" },
  ];
  const w = load({ scenes });
  w.hwBegin({ kind: "motion", groups: [{ id: "room-1", type: "room" }] });
  assert.deepEqual(plain(w.hmwDefaultSlots()), [
    { time: "07:00", scene: "c", off: 10 },
    { time: "17:00", scene: "r", off: 15 },
    { time: "23:00", scene: "n", off: 10 },
  ]);
  w.hwBegin({ kind: "motion", groups: [{ id: "other-room", type: "room" }] });
  assert.deepEqual(plain(w.hmwDefaultSlots()), [], "a room without the three scenes gets no invented times");
});

test("only devices the bridge offers take part, three or four of them, and the area is created with their ids", () => {
  const w = load({
    motion_areas: { candidates: [{ id: "c1", owner: { rid: "d1" } }, { id: "c2", owner: { rid: "d2" } }, { id: "c3", owner: { rid: "d3" } }], areas: [] },
  });
  const room = { id: "room-1", children: [{ id: "d1", name: "A" }, { id: "dimmer", name: "Dimmer" }, { id: "d2", name: "B" }, { id: "d3", name: "C" }] };
  assert.deepEqual(plain(w.hmwDevicesOf(room).map((c) => c.id)), ["d1", "d2", "d3"], "a dimmer is not offered");
  w.hwBegin({ kind: "motion", group: room, devices: { d1: true, d2: true, d3: true, dimmer: false }, name: "Hall", steps: [] });
  assert.deepEqual(plain(w.hmwChosen()), ["d1", "d2", "d3"]);
});

test("the levels of sensitivity are named when the bridge has two or three, and the daylight level is shown in lux", () => {
  const w = load();
  assert.equal(w.hmwLevelText(0, 1), "hmw_low");
  assert.equal(w.hmwLevelText(1, 1), "hmw_high");
  assert.equal(w.hmwLevelText(1, 2), "hmw_medium");
  assert.equal(w.hmwLevelText(3, 4), "hmw_level 3");
  assert.equal(w.hmwLux(1), "1.0 lx");
  assert.equal(w.hmwLux(20001), "100 lx");
});

test("a room holds devices but not the bridge; a zone holds lights", () => {
  const w = load({ devices: [{ id: "d1", name: "Lamp", services: ["light"] }, { id: "b", name: "Bridge", services: ["bridge"] }] });
  assert.deepEqual(plain(w.hrwMembers("room")), [{ id: "d1", name: "Lamp" }]);
  assert.deepEqual(plain(w.hrwMembers("zone")), [{ id: "hl1", name: "Lamp" }]);
});

test("a room or zone is saved with the devices chosen, and a new one is created", () => {
  const w = load();
  w.hrwStart("room", { id: "room-1", name: "Bedroom", children: [{ id: "d1" }, { id: "d2" }] });
  w.HW.members.d2 = false;
  w.HW.members.d3 = true;
  w.hrwSave();
  assert.deepEqual(w.sent[0], ["hue_plus", "update_room", { name: "Bedroom", members: ["d1", "d3"], room: "room-1" }]);
  w.hrwStart("zone", null);
  w.HW.name = "  Desk  ";
  w.HW.members.hl1 = true;
  w.hrwSave();
  assert.deepEqual(w.sent[1], ["hue_plus", "create_zone", { name: "Desk", members: ["hl1"] }]);
});
