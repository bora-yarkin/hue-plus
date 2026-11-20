/* The Hue app's wizards in the Hue Plus menu: what the pages of one wizard share (the state in progress, a heading, Next, a name, a time, the days, a room or zone to choose) and the
 automation wizards ("What kind of automation do you want to create?": wake up, go to sleep, timer, lighting schedule, coming home, leaving home). The pieces are the menu's own (hmRow,
 hmGroup, hmButton, hmChips, sliderRow, the time input of the time-based light); this file only adds the order of the steps. MotionAware's wizard is in humotion.js. */

/* The wizard in progress: {kind, steps, depth, ...its answers}. Pages open from a row of the menu, so one page is pushed on the popup stack per step (depth) and Save goes back to where the wizard began. */
var HW = null;

function hwBegin(state) {
  HW = state;
  HW.depth = 0;
  HW.steps = HW.steps || [];
}

function hwPush(key) {
  if (HW) HW.depth++;
  showPopup(key, true);
}

/* Leaves the wizard: back to the page it began on. */
function hwLeave() {
  var n = HW ? HW.depth : 0;
  HW = null;
  for (var i = 0; i < n; i++) popBack();
}

/* Every page of a wizard starts here. Without a wizard in progress (a page opened again after a reload) it says nothing was found. */
function hwOpen(b, key) {
  hmBox(b);
  if (!HW) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return false;
  }
  if (key) HW.at = HW.steps.indexOf(key);
  return true;
}

/* The step after this one, or the end of the wizard. */
function hwAdvance() {
  var i = HW.at + 1;
  if (i < HW.steps.length) hwPush(HW.steps[i]);
  else HW.finish();
}

function hwNext(label, fn) {
  return hmActions([hmButton(label || _T("hn_next"), "primary", fn || hwAdvance)]);
}

function hwHint(b, text) {
  if (text) b.appendChild(mkHint(text));
}

/* Rooms and zones with their lights, from what the menu read. */
function hwGroups(r) {
  var out = [];
  [["room", r.rooms], ["zone", r.zones]].forEach(function (t) {
    (t[1] || []).forEach(function (g) {
      out.push({ id: g.id, name: g.name, type: t[0], lights: g.lights || [], children: g.children || [] });
    });
  });
  return out;
}

function hwGroupRows(box, groups, isOn, pick) {
  [["room", "hn_rooms", "home"], ["zone", "hn_zones", "target"]].forEach(function (t) {
    var list = groups.filter(function (g) {
      return g.type === t[0];
    });
    if (!list.length) return;
    box.appendChild(hmLabel(_T(t[1])));
    box.appendChild(
      hmGroup(
        list.map(function (g) {
          return hmRow({
            icon: t[2],
            title: g.name,
            sub: cntS(g.lights.length, _T("hm_light"), _T("hm_lights")),
            check: function () {
              return isOn(g);
            },
            tap: function () {
              pick(g);
              refresh();
            },
          });
        })
      )
    );
  });
}

/* A time of day as a time input in a row (the same input the time-based light uses). `get()` and `set(value)` are "HH:MM". */
function hwTimeRow(title, get, set) {
  var row = mk("div", "hm-row"),
    label = mk("span", "hm-t"),
    inp = mk("input", "hm-time");
  label.appendChild(mk("span", "hm-n")).textContent = title;
  inp.type = "time";
  inp.value = get() || "";
  inp.setAttribute("aria-label", title);
  inp.addEventListener("input", function () {
    set(inp.value);
  });
  row.appendChild(label);
  row.appendChild(inp);
  return row;
}

var HW_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/* The days of the week as seven buttons; `days` is the list of names that are on. */
function hwDays(days) {
  var box = mk("div", "hm-chips");
  HW_WEEK.forEach(function (d, i) {
    var c = mk("button", "hm-chip");
    c.type = "button";
    c.textContent = _T("hw_day_" + d);
    c.setAttribute("aria-label", _T("hw_day_long_" + d));
    c.addEventListener("click", function () {
      var at = days.indexOf(d);
      if (at >= 0) days.splice(at, 1);
      else days.push(d);
      refresh();
    });
    c.refresh = function () {
      c.classList.toggle("on", days.indexOf(d) >= 0);
    };
    reg(c.refresh);
    box.appendChild(c);
  });
  return box;
}

function hwMinutesText(n) {
  return n >= 60 && n % 60 === 0 ? n / 60 + " " + _T("hw_h") : n + " " + _T("hm_min");
}

/* A name asked for on its own page, as the Hue app does at the end of a wizard. */
function hwNamePage(b) {
  if (!hwOpen(b, "hue-wz-name")) return;
  b.appendChild(hmTitle(HW.icon || "edit", HW.nameHeading));
  var w = mk("div", "hw-field"),
    lab = mk("span", "hw-flabel"),
    inp = mk("input", "hw-input"),
    clr = mk("button", "hw-clear");
  lab.textContent = _T("hw_name").toUpperCase();
  inp.type = "text";
  inp.maxLength = 32;
  inp.value = HW.name || "";
  inp.setAttribute("aria-label", _T("hw_name"));
  inp.addEventListener("input", function () {
    HW.name = inp.value;
  });
  clr.type = "button";
  clr.innerHTML = svg("close");
  clr.setAttribute("aria-label", _T("hw_clear"));
  clr.addEventListener("click", function () {
    inp.value = "";
    HW.name = "";
    inp.focus();
  });
  w.appendChild(lab);
  w.appendChild(inp);
  w.appendChild(clr);
  b.appendChild(w);
  b.appendChild(
    hwNext(HW.last === "hw_save" ? _T("hw_save") : _T("hn_next"), function () {
      HW.name = (inp.value || "").trim();
      if (!HW.name) {
        toast(_T("hw_give_it_a_name"));
        inp.focus();
        return;
      }
      if (HW.onName) HW.onName();
      else hwAdvance();
    })
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* A short list of choices on its own page ("Style", "Turn lights off"): options [{value, title, sub}], get(), set(value). */
function hwPickPage(b) {
  if (!hwOpen(b)) return;
  var p = HW.pick;
  if (!p) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  hwHint(b, p.hint);
  b.appendChild(
    hmGroup(
      p.options.map(function (o) {
        return hmRow({
          title: o.title,
          sub: o.sub,
          check: function () {
            return p.get() === o.value;
          },
          tap: function () {
            p.set(o.value);
            popBack();
          },
        });
      })
    )
  );
}

function hwChoose(pick) {
  HW.pick = pick;
  showPopup("hue-wz-pick", true);
}

/* ---- the automations: what kind ---- */

var HW_AUTOMATIONS = [
  { kind: "wake_up", icon: "bright", title: "hw_wake_up", sub: "hw_wake_up_sub", steps: ["hue-wz-lights", "hue-wz-when", "hue-wz-settings", "hue-wz-name"] },
  { kind: "go_to_sleep", icon: "moon", title: "hw_go_to_sleep", sub: "hw_go_to_sleep_sub", steps: ["hue-wz-lights", "hue-wz-start", "hue-wz-when", "hue-wz-settings", "hue-wz-name"] },
  { kind: "coming_home", icon: "home", title: "hw_coming_home", sub: "hw_coming_home_sub", steps: ["hue-wz-lights", "hue-wz-whenhome", "hue-wz-scene", "hue-wz-name"] },
  { kind: "leaving_home", icon: "home", title: "hw_leaving_home", sub: "hw_leaving_home_sub", steps: ["hue-wz-lights", "hue-wz-name"] },
  { kind: "mimic_presence", icon: "home", title: "hw_mimic_presence", sub: "hw_mimic_presence_sub", steps: ["hue-wz-mimicintro", "hue-wz-lights", "hue-wz-mimic", "hue-wz-summary"], one: "PM" },
  { kind: "timer", icon: "clock", title: "hw_timer", sub: "hw_timer_sub", steps: ["hue-wz-length", "hue-wz-lights", "hue-wz-scene", "hue-wz-name"] },
  { kind: "schedule", icon: "clock", title: "hw_lighting_schedule", sub: "hw_lighting_schedule_sub", steps: ["hue-wz-lights", "hue-wz-when", "hue-wz-scene", "hue-wz-name"] },
];

function hwAutomation(kind) {
  return HW_AUTOMATIONS.filter(function (a) {
    return a.kind === kind;
  })[0];
}

/* The bridge keeps one automation of some kinds (Mimic presence): the kind then opens the one there is. */
function hwExisting(a) {
  return a.one
    ? hmList("automations").filter(function (x) {
        return x.script === a.one;
      })[0]
    : null;
}

function hwNewAutomation(b) {
  hmBox(b);
  b.appendChild(hmTitle("plus", _T("hw_what_kind_of_automation")));
  hwHint(b, _T("hw_what_kind_of_automation_sub"));
  b.appendChild(
    hmGroup(
      HW_AUTOMATIONS.map(function (a) {
        var have = hwExisting(a);
        return hmRow({
          icon: a.icon,
          title: _T(a.title),
          sub: have ? _T("hw_one_only") : _T(a.sub),
          tap: function () {
            hwStartAutomation(a.kind, have || null);
          },
        });
      })
    )
  );
}

/* The answers of an automation wizard, from a routine on the bridge when it is being changed, else the Hue app's starting values. */
/* {hour, minute} as "HH:MM". */
function hwHhmm(t) {
  return String(t.hour).padStart(2, "0") + ":" + String(t.minute).padStart(2, "0");
}

function hwClock(point) {
  var t = (point && point.time_point && point.time_point.time) || {};
  return t.hour === undefined ? "" : String(t.hour).padStart(2, "0") + ":" + String(t.minute).padStart(2, "0");
}

/* A start or an end of a schedule: "time", "sunrise" or "sunset" (and "none" for an end that is not there). */
function hwPointType(point) {
  return point && point.time_point ? point.time_point.type : "none";
}

function hwAutomationState(kind, x) {
  var a = hwAutomation(kind),
    c = (x && x.configuration) || {},
    when = c.when || {},
    point = (when.time_point || {}).time || {},
    ext = c.when_extended || {},
    between = (c.when_constrained || {}).type === "between" ? c.when_constrained : null,
    recall = ((c.what || [])[0] || {}).recall || {},
    firstAction = ((((c.what || [])[0] || {}).actions || [])[0] || {}).action || null,
    group = ((c.where || [])[0] || {}).group || {},
    st = {
      kind: kind,
      icon: a.icon,
      steps: a.steps.slice(),
      edit: x ? x.id : null,
      group: group.rid ? { id: group.rid, type: group.rtype } : null,
      where: c.where || null,
      name: x ? x.name : "",
      time: when.time_point ? String(point.hour).padStart(2, "0") + ":" + String(point.minute).padStart(2, "0") : hwClock(ext.start_at) || (kind === "wake_up" ? "07:00" : kind === "go_to_sleep" ? "22:00" : ""),
      startType: ext.start_at ? hwPointType(ext.start_at) : "time",
      until: hwClock(ext.end_at),
      untilType: ext.end_at ? hwPointType(ext.end_at) : "none",
      days: (when.recurrence_days || ext.recurrence_days || (!x && kind === "wake_up" ? HW_WEEK.slice(0, 5) : HW_WEEK)).slice(),
      repeat: !x || kind !== "wake_up" || !!when.recurrence_days,
      minutes: c.fade_in_duration ? c.fade_in_duration.seconds / 60 : c.fade_out_duration ? c.fade_out_duration.seconds / 60 : kind === "go_to_sleep" ? 15 : 30,
      brightness: c.end_brightness ? Math.round(c.end_brightness) : 100,
      style: c.style || (kind === "go_to_sleep" ? "sunset" : "sunrise"),
      endState: c.end_state || (kind === "mimic_presence" ? "do_nothing" : "turn_off"),
      mode: c.mode || "24h",
      excluded: c.excluded_lights || "turn_off",
      whenType: between ? "between" : (c.when_constrained || {}).type || "always",
      between: between,
      manual: kind === "go_to_sleep" && !!x && !x.enabled,
      offAfter: c.turn_lights_off_after ? c.turn_lights_off_after.minutes || Math.round(c.turn_lights_off_after.seconds / 60) : 0,
      randomize: (ext.randomization || {}).minutes || 0,
      scene: recall.rid || "",
      action: firstAction && firstAction.on ? (firstAction.on.on ? "on" : "off") : "scene",
      hours: c.duration ? Math.floor((c.duration.minutes || 0) / 60) : 0,
      mins: c.duration ? (c.duration.minutes || 0) % 60 : 1,
      finish: hwSaveAutomation,
      nameHeading: _T("hw_name_your_automation"),
      last: "hw_save",
    };
  if (!st.name) st.name = hwDefaultName(kind);
  if (kind === "go_to_sleep" && st.manual) st.steps = hwSleepSteps(true);
  return st;
}

/* Go to sleep that starts by hand has no time page: the bridge still wants a time, which is kept and never used. */
function hwSleepSteps(manual) {
  return manual ? ["hue-wz-lights", "hue-wz-start", "hue-wz-settings", "hue-wz-name"] : ["hue-wz-lights", "hue-wz-start", "hue-wz-when", "hue-wz-settings", "hue-wz-name"];
}

var hwSeen = null; /* the automations read when the wizard began, to number a default name */

function hwDefaultName(kind) {
  var base = _T("hw_name_" + kind),
    names = {};
  (hwSeen || []).forEach(function (x) {
    names[x.name] = 1;
  });
  if (!names[base]) return base;
  for (var i = 2; names[base + " " + i]; i++);
  return base + " " + i;
}

/* The page the wizard was chosen on (the list of kinds, or the routine being changed) is left with it: Save goes back to the list of automations. */
function hwStartAutomation(kind, x) {
  hwSeen = hmList("automations");
  hwBegin(hwAutomationState(kind, x));
  HW.depth = 1;
  hwPush(HW.steps[0]);
}

/* Automations that recall a scene are for one room or zone, since a scene belongs to one room; the others can be for My entire home or several rooms and zones, or single lights, as in the app. */
var HW_ONE_ROOM = ["timer", "schedule", "coming_home"];

/* Choose your lights: the app's picker (huepicker.js). */
function hwLightsPage(b) {
  if (!hwOpen(b, "hue-wz-lights")) return;
  hmLoad(b, ["rooms", "zones"], function (box, r) {
    var groups = hpkGroups(r),
      one = HW_ONE_ROOM.indexOf(HW.kind) >= 0;
    if (!HW.lights) HW.lights = HW.where ? hpkStateOf(HW.where, groups) : { home: false, picked: {} };
    if (one && (HW.lights.home || Object.keys(HW.lights.picked).length > 1)) HW.lights = { home: false, picked: {} };
    box.appendChild(hmTitle("lamp", _T("hn_choose_your_lights")));
    if (!groups.length) box.appendChild(hmCallout(_T("hn_no_hue_room")));
    var pick = mk("div");
    box.appendChild(pick);
    hpkPicker(pick, { groups: groups, state: HW.lights, one: one, whole: one });
    box.appendChild(
      hwNext(null, function () {
        var targets = hpkTargets(HW.lights, groups);
        if (!targets.length) {
          toast(_T("hn_choose_a_room"));
          return;
        }
        HW.targets = targets;
        HW.groups = groups;
        var first = groups.filter(function (g) {
          return (HW.lights.picked[g.id] || []).length;
        })[0];
        HW.group = first ? { id: first.id, type: first.type } : null;
        hwAdvance();
      })
    );
  });
}

/* Sunrise and sunset need the bridge to know where home is. */
function hwHasLocation() {
  return !!(HM.home_and_away && HM.home_and_away.configured);
}

var HW_POINTS = ["time", "sunrise", "sunset"];

function hwPointText(t) {
  return _T(t === "none" ? "hw_no_end_time" : t === "time" ? "hw_at_a_specific_time" : "hw_" + t);
}

/* A start or an end that is a time, sunrise, sunset (or, for an end, nothing): its picker row. */
function hwPointRow(title, key, withNone) {
  return hmRow({
    title: title,
    val: function () {
      return hwPointText(HW[key]);
    },
    tap: function () {
      hwChoose({
        hint: hwHasLocation() ? "" : _T("hw_sun_needs_home_location"),
        options: (withNone ? ["none"] : []).concat(HW_POINTS).map(function (t) {
          return { value: t, title: hwPointText(t) };
        }),
        get: function () {
          return HW[key];
        },
        set: function (v) {
          if ((v === "sunrise" || v === "sunset") && !hwHasLocation()) {
            toast(_T("hw_sun_needs_home_location"));
            return;
          }
          HW[key] = v;
        },
      });
    },
  });
}

/* The rows of "When": wake up, go to sleep and the schedule differ in what goes with the time. Shared by the wizard's page and the screen that edits an automation. */
function hwWhenRows(b) {
  var kind = HW.kind,
    schedule = kind === "schedule";
  if (schedule) {
    b.appendChild(hmGroup([hwPointRow(_T("hw_start_at"), "startType", false)]));
    if (HW.startType === "time") b.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return HW.time; }, function (v) { HW.time = v; })]));
    b.appendChild(hmGroup([hwPointRow(_T("hw_end_at"), "untilType", true)]));
    if (HW.untilType === "time") b.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return HW.until; }, function (v) { HW.until = v; })]));
  } else b.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return HW.time; }, function (v) { HW.time = v; })]));
  if (kind === "wake_up") {
    b.appendChild(hmLabel(_T("hw_fade_duration")));
    b.appendChild(hmChips([5, 10, 15, 20, 30, 45, 60], function () { return HW.minutes; }, function (v) { HW.minutes = v; }, hwMinutesText));
  }
  b.appendChild(hmLabel(_T("hw_repeat")));
  b.appendChild(hwDays(HW.days));
  if (schedule) {
    b.appendChild(hmLabel(_T("hw_extra_options")));
    b.appendChild(
      hmGroup([
        hmRow({
          title: _T("hw_randomize_times"),
          val: function () {
            return HW.randomize ? hwMinutesText(HW.randomize) : _T("hw_no");
          },
          tap: function () {
            hwChoose({
              hint: _T("hw_randomize_times_hint"),
              options: [0, 5, 10, 15, 30, 60].map(function (m) {
                return { value: m, title: m ? hwMinutesText(m) : _T("hw_no") };
              }),
              get: function () { return HW.randomize; },
              set: function (v) { HW.randomize = v; },
            });
          },
        }),
      ])
    );
  }
}

/* Whether the times and days are fit to save; says what is wrong. */
function hwWhenValid() {
  var schedule = HW.kind === "schedule";
  if ((!schedule || HW.startType === "time") && !/^\d\d:\d\d$/.test(HW.time)) {
    toast(_T("hm_pick_a_time"));
    return false;
  }
  if (schedule && HW.untilType === "time" && !/^\d\d:\d\d$/.test(HW.until)) {
    toast(_T("hm_pick_a_time"));
    return false;
  }
  if (schedule && HW.startType === "time" && HW.untilType === "time" && HW.until === HW.time) {
    toast(_T("hm_two_times_cannot_be_the_same"));
    return false;
  }
  if (!HW.days.length) {
    toast(_T("hw_choose_a_day"));
    return false;
  }
  return true;
}

/* When: wake up, go to sleep and the schedule differ in what goes with the time. */
function hwWhenPage(b) {
  if (!hwOpen(b, "hue-wz-when")) return;
  var kind = HW.kind;
  b.appendChild(hmTitle("clock", _T(kind === "wake_up" ? "hw_when_do_you_want_to_wake_up" : kind === "go_to_sleep" ? "hw_when_do_you_want_to_go_to_sleep" : "hw_when_do_you_want_to_schedule")));
  if (kind === "wake_up" || kind === "go_to_sleep") {
    hweTime(b, kind);
    hweRepeat(b, kind);
  } else hwWhenRows(b);
  b.appendChild(
    hwNext(null, function () {
      if (hwWhenValid()) hwAdvance();
    })
  );
}

/* A choice that is a card of its own with a round icon, as the app lays out "how should it start" and "when should it turn on". */
function hwCards(rows) {
  var g = hmGroup(rows);
  g.classList.add("cards");
  rows.forEach(function (r) {
    r.classList.add("discic");
  });
  return g;
}

/* The Mimic presence page that comes first: a house at night with a clock, what the automation does and a Next. */
function hwMimicIntroPage(b) {
  if (!hwOpen(b, "hue-wz-mimicintro")) return;
  var root = b.parentNode,
    bar = root && root.querySelector(".pbar");
  if (bar) {
    [].slice.call(bar.querySelectorAll(".mwart")).forEach(function (old) {
      old.remove();
    });
    bar.appendChild(
      mk(
        "div",
        "mwart house",
        "<svg viewBox='0 0 300 260' aria-hidden='true'><defs><linearGradient id='mhsk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1d2c55'/><stop offset='1' stop-color='#3a3f68'/></linearGradient><clipPath id='mhcl'><circle cx='140' cy='125' r='118'/></clipPath></defs>" +
          "<circle cx='140' cy='125' r='118' fill='url(#mhsk)'/><g clip-path='url(#mhcl)'><rect x='0' y='190' width='300' height='80' fill='#16161f'/>" +
          "<polygon points='60,190 60,92 170,70 230,92 230,190' fill='#6f6a8d'/><polygon points='170,70 230,92 230,190 170,190' fill='#57537a'/><polygon points='60,92 170,70 170,190 60,190' fill='#8a86a6'/>" +
          "<rect x='78' y='100' width='36' height='34' fill='#9fe3f2'/><rect x='128' y='96' width='24' height='30' fill='#23233a'/><rect x='188' y='108' width='30' height='28' fill='#23233a'/><rect x='84' y='152' width='70' height='38' fill='#2a2a40'/><rect x='186' y='156' width='34' height='34' fill='#2a2a40'/></g>" +
          "<circle cx='226' cy='204' r='32' fill='#f4f4f4'/><path d='M226 204 L226 182 M226 204 L240 212' stroke='#222' stroke-width='3' stroke-linecap='round' fill='none'/></svg>"
      )
    );
    root.classList.add("artpg");
  }
  b.appendChild(hmTitle("home", _T("hw_mimic_presence")));
  hwHint(b, _T("hw_mimic_intro_text"));
  b.appendChild(hwNext());
}

/* "How should Go to sleep start?": at a time, or only by the play button. */
function hwStartPage(b) {
  if (!hwOpen(b, "hue-wz-start")) return;
  b.appendChild(hmTitle("moon", _T("hw_how_should_go_to_sleep_start")));
  hwHint(b, _T("hw_start_hint_1"));
  /* the second paragraph names the places of the app in bold */
  var way = mk("div", "notec pane dim");
  [_T("hw_start_hint_2"), _T("hm_settings"), " > ", _T("hm_devices"), " > ", _T("hm_switches"), "."].forEach(function (part, i) {
    var node = i === 1 || i === 3 || i === 5 ? mk("b") : document.createTextNode("");
    node.textContent = part;
    way.appendChild(node);
  });
  b.appendChild(way);
  function row(manual, icon, title, sub) {
    return hmRow({
      icon: icon,
      title: title,
      sub: sub,
      check: function () {
        return HW.manual === manual;
      },
      tap: function () {
        HW.manual = manual;
        HW.steps = hwSleepSteps(manual);
        hwAdvance();
      },
    });
  }
  b.appendChild(
    hwCards([
      row(false, "clock", _T("hw_at_a_certain_time"), _T("hw_at_a_certain_time_sub")),
      row(true, "play", _T("hw_with_a_button_press"), _T("hw_with_a_button_press_sub")),
    ])
  );
}

/* Coming home: every time, or only when the sun is down. */
function hwHomeWhenPage(b) {
  if (!hwOpen(b, "hue-wz-whenhome")) return;
  b.appendChild(hmTitle("home", _T("hw_when_should_your_lights_turn_on")));
  function row(type, icon, title, sub) {
    return hmRow({
      icon: icon,
      title: title,
      sub: sub,
      check: function () {
        return HW.whenType === type;
      },
      tap: function () {
        if (type === "nighttime" && !hwHasLocation()) {
          toast(_T("hw_sun_needs_home_location"));
          return;
        }
        HW.whenType = type;
        hwAdvance();
      },
    });
  }
  b.appendChild(
    hmGroup([
      row("always", "bright", _T("hw_always"), _T("hw_always_sub")),
      row("nighttime", "moon", _T("hw_at_night"), _T("hw_at_night_sub")),
    ])
  );
  if (!hwHasLocation()) b.appendChild(hmCallout(_T("hw_sun_needs_home_location")));
}

/* Mimic presence, step two: all day or only when it is dark. */
function hwMimicPage(b) {
  if (!hwOpen(b, "hue-wz-mimic")) return;
  b.appendChild(hmTitle("home", _T("hw_when_should_your_lights_turn_on_active")));
  function row(mode, icon, title, sub) {
    return hmRow({
      icon: icon,
      title: title,
      sub: sub,
      check: function () {
        return HW.mode === mode;
      },
      tap: function () {
        HW.mode = mode;
        if (HW.fromSummary) {
          HW.fromSummary = false;
          popBack();
        } else hwAdvance();
      },
    });
  }
  b.appendChild(
    hwCards([
      row("24h", "bright", _T("hw_all_day"), _T("hw_all_day_sub")),
      row("nighttime", "moon", _T("hw_only_when_its_dark"), _T("hw_only_when_its_dark_sub")),
    ])
  );
}

function hwGroupName() {
  if (HW.lights && HW.lights.home) return _T("hpk_my_entire_home");
  var names = (HW.groups || []).filter(function (g) {
    return (HW.lights.picked[g.id] || []).length;
  }).map(function (g) {
    return g.name;
  });
  if (names.length) return names.join(", ");
  var found = null;
  hwGroups({ rooms: hmList("rooms"), zones: hmList("zones") }).forEach(function (g) {
    if (HW.group && g.id === HW.group.id) found = g.name;
  });
  return found || "";
}

/* "This is how your automation works": where, when and what it ends with, then Save. */
function hwSummaryPage(b) {
  if (!hwOpen(b, "hue-wz-summary")) return;
  HW.fromSummary = false;
  b.appendChild(hmTitle("home", _T("hw_this_is_how_your_automation_works")));
  hwHint(b, _T("hw_mimic_presence_explanation"));
  b.appendChild(
    hmGroup([
      hmRow({ title: _T("hw_where"), val: hwGroupName }),
      hmRow({
        title: _T("hw_when"),
        endicon: "bright",
        val: function () {
          return _T(HW.mode === "24h" ? "hw_all_day" : "hw_only_when_its_dark");
        },
        tap: function () {
          HW.fromSummary = true;
          showPopup("hue-wz-mimic", true);
        },
      }),
      hmRow({
        title: _T("hw_end_with"),
        endicon: "minus",
        val: function () {
          return _T(HW.endState === "turn_off" ? "hw_lights_off" : "hw_do_nothing");
        },
        tap: function () {
          hwChoose({
            options: ["do_nothing", "turn_off"].map(function (v) {
              return { value: v, title: _T(v === "turn_off" ? "hw_lights_off" : "hw_do_nothing") };
            }),
            get: function () {
              return HW.endState;
            },
            set: function (v) {
              HW.endState = v;
            },
          });
        },
      }),
    ])
  );
  b.appendChild(hwNext(_T("hw_save"), HW.finish));
}

function hwStyleText(style) {
  return _T(style === "basic" ? (HW.kind === "wake_up" ? "hw_style_basic_up" : "hw_style_basic_down") : "hw_style_" + style);
}

/* The rows of the settings of wake up and go to sleep: style, brightness or fade duration, and what happens at the end. */
function hwSettingsRows(b) {
  var wake = HW.kind === "wake_up",
    styles = wake ? ["sunrise", "basic"] : ["sunset", "basic"];
  var rows = [
    hmRow({
      disc: hwStyleDisc(HW.style),
      title: _T("hw_style"),
      val: function () {
        return hwStyleText(HW.style);
      },
      tap: function () {
        hwChoose({
          hint: _T(wake ? "hw_sunrise_hint" : "hw_sunset_hint"),
          options: styles.map(function (v) {
            return { value: v, title: hwStyleText(v) };
          }),
          get: function () { return HW.style; },
          set: function (v) { HW.style = v; },
        });
      },
    }),
  ];
  if (!wake) {
    rows.push(
      hmRow({
        title: _T("hw_fade_duration"),
        val: function () {
          return hwMinutesText(HW.minutes);
        },
        tap: function () {
          hwChoose({
            options: [5, 10, 15, 20, 30, 45, 60].map(function (m) {
              return { value: m, title: hwMinutesText(m) };
            }),
            get: function () { return HW.minutes; },
            set: function (v) { HW.minutes = v; },
          });
        },
      }),
      hmRow({
        title: _T("hw_end_with"),
        val: function () {
          return _T("hw_end_" + HW.endState);
        },
        tap: function () {
          hwChoose({
            options: ["turn_off", "minimum_brightness", "nightlight"].map(function (v) {
              return { value: v, title: _T("hw_end_" + v) };
            }),
            get: function () {
              return HW.endState;
            },
            set: function (v) {
              HW.endState = v;
            },
          });
        },
      })
    );
  }
  if (wake) {
    /* the app has the three in one card: style, maximum brightness (a row that opens its slider) and when the lights go off */
    rows.push(
      hmRow({
        title: _T("hw_maximum_brightness"),
        val: function () {
          return HW.brightness + "%";
        },
        tap: function () {
          showPopup("hue-ed-bri", true);
        },
      }),
      hmRow({
        title: _T("hw_turn_lights_off"),
        val: function () {
          return HW.offAfter ? hwMinutesText(HW.offAfter) : _T("hw_no");
        },
        tap: function () {
          hwChoose({
            hint: _T("hw_turn_lights_off_hint"),
            options: [0, 5, 10, 15, 30, 60].map(function (m) {
              return { value: m, title: m ? hwMinutesText(m) : _T("hw_no") };
            }),
            get: function () { return HW.offAfter; },
            set: function (v) { HW.offAfter = v; },
          });
        },
      })
    );
  }
  b.appendChild(hmGroup(rows));
}

/* The picture of a style the app puts at the end of its row: the sky of a sunrise or a sunset, or a plain light. */
function hwStyleDisc(style) {
  return style === "sunrise"
    ? "linear-gradient(180deg,#3d5fd3 0%,#e98a70 58%,#f6d6a8 100%)"
    : style === "sunset"
      ? "linear-gradient(180deg,#f2b05c 0%,#d4572a 60%,#3b2440 100%)"
      : "radial-gradient(circle,#fff6d6 0%,#e9c77a 100%)";
}

/* Settings of wake up and go to sleep. */
function hwSettingsPage(b) {
  if (!hwOpen(b, "hue-wz-settings")) return;
  b.appendChild(hmTitle("tune", _T("hw_choose_your_settings")));
  hwSettingsRows(b);
  b.appendChild(hwNext());
}

/* The scenes of the room or zone chosen, from what the menu read. A lighting schedule can also switch the lights on or off. */
function hwSceneRows(box, r) {
  var scenes = (r.scenes || []).filter(function (s) {
    return HW.group && s.group_id === HW.group.id;
  });
  if (HW.kind === "schedule")
    box.appendChild(
      hmGroup(
        [["on", "bright", "hw_on"], ["off", "power", "hw_off"]].map(function (t) {
          return hmRow({
            icon: t[1],
            title: _T(t[2]),
            check: function () {
              return HW.action === t[0];
            },
            tap: function () {
              HW.action = t[0];
              HW.scene = "";
              refresh();
            },
          });
        })
      )
    );
  if (HW.kind === "schedule") box.appendChild(hmLabel(_T("hw_custom")));
  if (!scenes.length) box.appendChild(hmCallout(_T("hw_no_scenes_here")));
  box.appendChild(
    hmGroup(
      scenes.map(function (s) {
        return hmRow({
          icon: "scene",
          title: s.name,
          check: function () {
            return HW.action === "scene" && HW.scene === s.id;
          },
          tap: function () {
            HW.action = "scene";
            HW.scene = s.id;
            refresh();
          },
        });
      })
    )
  );
}

function hwScenePage(b) {
  if (!hwOpen(b, "hue-wz-scene")) return;
  hmLoad(b, ["scenes"], function (box, r) {
    box.appendChild(hmTitle("scene", _T("hw_what_should_your_lights_do")));
    hwSceneRows(box, r);
    box.appendChild(
      hwNext(null, function () {
        if (HW.action === "scene" && !HW.scene) {
          toast(_T("hm_pick_a_scene"));
          return;
        }
        hwAdvance();
      })
    );
  });
}

/* The rows of a timer's length. */
function hwLengthRows(b) {
  /* The length is two wheels, hours and minutes, as the app has it: the time wheel with the length written as 00:01. */
  var card = mk("div", "hm-group"),
    pad = function (n) {
      return (n < 10 ? "0" : "") + n;
    },
    wheel = hweWheel(
      function () {
        return pad(HW.hours || 0) + ":" + pad(HW.mins || 0);
      },
      function (v) {
        var p = String(v).split(":");
        HW.hours = Number(p[0]);
        HW.mins = Number(p[1]);
      }
    );
  wheel.classList.add("dur");
  wheel.setAttribute("data-h", _T("hw_hours"));
  wheel.setAttribute("data-m", _T("hm_min"));
  card.appendChild(wheel);
  b.appendChild(card);
}

function hwLengthValid() {
  if (HW.hours * 60 + HW.mins < 1) {
    toast(_T("hw_a_timer_needs_a_minute"));
    return false;
  }
  return true;
}

function hwLengthPage(b) {
  if (!hwOpen(b, "hue-wz-length")) return;
  b.appendChild(hmTitle("clock", _T("hw_how_long_should_your_timer_last")));
  hwLengthRows(b);
  b.appendChild(
    hwNext(null, function () {
      if (hwLengthValid()) hwAdvance();
    })
  );
}

/* The call that makes (or changes) the routine, then back to the list of automations. */
function hwSaveAutomation(after) {
  var d = HW,
    pad = function (t) {
      return t + ":00";
    },
    body = { name: d.name };
  if (d.targets) body.targets = d.targets;
  else {
    body.group = d.group.id;
    body.group_type = d.group.type;
  }
  if (d.kind === "wake_up" || d.kind === "go_to_sleep" || d.kind === "schedule") {
    var timed = d.kind !== "schedule" || d.startType === "time";
    if (timed) body.time = pad(d.time);
    body.days = d.days.length === 7 ? [] : d.days;
  }
  if (d.kind === "wake_up") {
    if (d.repeat === false) body.repeat = false;
    body.minutes = d.minutes;
    body.end_brightness = d.brightness;
    body.style = d.style;
    if (d.offAfter) body.turn_off_after_minutes = d.offAfter;
  }
  if (d.kind === "go_to_sleep") {
    body.minutes = d.minutes;
    body.style = d.style;
    body.end_state = d.endState;
    body.enabled = !d.manual;
  }
  if (d.kind === "schedule") {
    body.start_type = d.startType;
    if (d.untilType !== "none") {
      body.until_type = d.untilType;
      if (d.untilType === "time") body.until = pad(d.until);
    }
    if (d.randomize) body.randomize_minutes = d.randomize;
    body.action = d.action;
  }
  if (d.kind === "mimic_presence") {
    body.mode = d.mode;
    body.end_state = d.endState;
    body.excluded_lights = d.excluded;
  }
  if (d.kind === "coming_home") {
    if (d.whenType === "between" && d.between) {
      body.time = pad(hwHhmm(d.between.start));
      body.until = pad(hwHhmm(d.between.end));
    } else body.when_type = d.whenType;
  }
  if (d.kind === "timer") body.minutes = d.hours * 60 + d.mins;
  if (d.kind === "timer" || d.kind === "coming_home" || (d.kind === "schedule" && d.action === "scene")) body.scene = d.scene;
  if (d.edit) body.automation = d.edit;
  else body.routine = d.kind;
  return hpCall("hue_plus", d.edit ? "update_routine" : "create_routine", body).then(
    function () {
      HM_READY = false;
      if (after) after();
      else hwLeave();
      hmEnsure();
      return true;
    },
    function () {
      toast(_T("hw_couldn_t_save_the_automation"));
      return false;
    }
  );
}

/* A routine made from one of the bridge's templates can be changed with the same pages it was made with. */
function hwEditable(x) {
  return !!x.script && ["Basic wake up routine", "Native Go To Sleep", "Timers", "Schedule", "Coming home", "Leaving home", "PM"].indexOf(x.script) >= 0;
}

/* The automations that have the app's play button: they start and stop by hand, whether or not they are switched on. */
function hwRunnable(x) {
  return ["Basic wake up routine", "Native Go To Sleep", "Timers", "PM"].indexOf(x.script) >= 0;
}

/* Whether it is running now, from the state the bridge keeps for it (gts_state, pm_state, ...). */
function hwRunText(x) {
  var st = x.state || {},
    running = Object.keys(st).some(function (k) {
      return /_state$/.test(k) && (st[k] === "started" || st[k] === "running");
    });
  return running ? _T("hw_running") : "";
}

function hwKindOf(x) {
  return { "Basic wake up routine": "wake_up", "Native Go To Sleep": "go_to_sleep", Timers: "timer", Schedule: "schedule", "Coming home": "coming_home", "Leaving home": "leaving_home", PM: "mimic_presence" }[x.script];
}

HP_PAGES["hue-newauto"] = ["hw_new_automation", "plus", hwNewAutomation];
HP_PAGES["hue-wz-lights"] = ["hn_choose_your_lights", "lamp", hwLightsPage];
HP_PAGES["hue-wz-when"] = ["hm_time", "clock", hwWhenPage];
HP_PAGES["hue-wz-settings"] = ["hw_choose_your_settings", "tune", hwSettingsPage];
HP_PAGES["hue-wz-start"] = ["hw_go_to_sleep", "moon", hwStartPage];
HP_PAGES["hue-wz-whenhome"] = ["hw_coming_home", "home", hwHomeWhenPage];
HP_PAGES["hue-wz-mimic"] = ["hw_mimic_presence", "home", hwMimicPage];
HP_PAGES["hue-wz-mimicintro"] = ["hw_mimic_presence", "home", hwMimicIntroPage];
HP_PAGES["hue-wz-summary"] = ["hw_mimic_presence", "home", hwSummaryPage];
HP_PAGES["hue-wz-scene"] = ["hm_scene", "scene", hwScenePage];
HP_PAGES["hue-wz-length"] = ["hw_timer", "clock", hwLengthPage];
HP_PAGES["hue-wz-name"] = ["hw_name_your_automation", "edit", hwNamePage];
HP_PAGES["hue-wz-pick"] = ["hw_choose", "tune", hwPickPage];
