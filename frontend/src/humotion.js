/* MotionAware areas as the Hue app has them: "Create a MotionAware area" (three pages of advice, the room, three or four devices, a name, then what the area does when it senses motion)
 and the area's own page (name, on or off, the times and scenes of "Control lights", the motion-sensitive devices, sensitivity and daylight). The steps use the wizard pieces of huewizard.js;
 the bridge's request for each is in docs/bridge-findings.md. */

/* The default times of the Hue app when it finishes the wizard: scenes of the room by name, with the minutes without motion before the lights go off. */
var HMW_DEFAULTS = [["07:00", "Concentrate", 10], ["17:00", "Read", 15], ["23:00", "Nightlight", 10]];

function hmwCandidates() {
  var owners = {};
  ((HM.motion_areas || {}).candidates || []).forEach(function (c) {
    owners[(c.owner || {}).rid] = c.id;
  });
  return owners;
}

/* The devices of a room that can take part in a MotionAware area. */
function hmwDevicesOf(group) {
  var owners = hmwCandidates();
  return group.children.filter(function (c) {
    return owners[c.id];
  });
}

/* The devices that already belong to an area: a device is in one area only. */
function hmwUsed() {
  var used = {};
  hmMotionAreas().forEach(function (x) {
    hmwOwners(x).forEach(function (d) {
      used[d] = true;
    });
  });
  return used;
}

/* The devices of a room that can still be chosen. */
function hmwFreeDevicesOf(group) {
  var used = hmwUsed();
  return hmwDevicesOf(group).filter(function (c) {
    return !used[c.id];
  });
}

var HMW_MAX_AREAS = 4;

function hmwStart() {
  if (hmMotionAreas().length >= HMW_MAX_AREAS) {
    toast(_T("hmw_four_areas"));
    return;
  }
  hwBegin({
    kind: "motion",
    icon: "motion",
    steps: ["hue-mw-intro", "hue-mw-tip1", "hue-mw-tip2", "hue-mw-tip3", "hue-mw-where", "hue-mw-devices", "hue-mw-leave", "hue-mw-calibrating", "hue-wz-name", "hue-mw-created", "hue-mw-choice", "hue-mw-groups", "hue-mw-done"],
    group: null,
    devices: {},
    name: _T("hm_motionaware_area"),
    nameHeading: _T("hmw_name_your_area"),
    finish: hmwSetLights,
    onName: hmwRename1,
    last: "hn_next",
    slots: [],
    groups: [],
    dark: null,
  });
  hwPush("hue-mw-intro");
}

/* A page of advice: a heading, the paragraphs, Next. */
function hmwInfo(key, title, texts, label, next) {
  return function (b) {
    if (!hwOpen(b, key)) return;
    b.appendChild(hmTitle("motion", _T(title)));
    texts.forEach(function (t) {
      hwHint(b, _T(t));
    });
    b.appendChild(hwNext(label ? _T(label) : null, next));
  };
}

function hmwWherePage(b) {
  if (!hwOpen(b, "hue-mw-where")) return;
  hmLoad(b, ["rooms", "zones", "motion_areas"], function (box, r) {
    box.appendChild(hmTitle("motion", _T("hmw_where_are_the_lights")));
    hwHint(box, _T("hmw_where_hint"));
    var rooms = hwGroups(r).filter(function (g) {
      return g.type === "room";
    });
    box.appendChild(hmLabel(_T("hn_rooms")));
    box.appendChild(
      hmGroup(
        rooms.map(function (g) {
          var n = hmwFreeDevicesOf(g).length;
          return hmRow({
            icon: "home",
            title: g.name,
            sub: cntS(n, _T("hmw_available_device"), _T("hmw_available_devices")),
            check: function () {
              return !!HW.group && HW.group.id === g.id;
            },
            tap: function () {
              if (n < 3) {
                toast(_T("hmw_needs_three"));
                return;
              }
              if (!HW.group || HW.group.id !== g.id) {
                HW.group = g;
                HW.devices = {};
                hmwFreeDevicesOf(g)
                  .slice(0, 3)
                  .forEach(function (c) {
                    HW.devices[c.id] = true;
                  });
              }
              refresh();
            },
          });
        })
      )
    );
    box.appendChild(
      hwNext(null, function () {
        if (!HW.group) {
          toast(_T("hn_choose_a_room"));
          return;
        }
        hwAdvance();
      })
    );
  });
}

function hmwChosen() {
  return Object.keys(HW.devices).filter(function (k) {
    return HW.devices[k];
  });
}

function hmwDevicesPage(b) {
  if (!hwOpen(b, "hue-mw-devices")) return;
  hmLoad(b, ["rooms", "zones", "motion_areas"], function (box) {
    var list = hmwDevicesOf(HW.group),
      used = hmwUsed();
    box.appendChild(hmTitle("motion", _T("hmw_choose_devices")));
    hwHint(box, _T("hmw_choose_devices_hint"));
    box.appendChild(hmLabel(HW.group.name));
    box.appendChild(
      hmGroup(
        list.map(function (c) {
          return hmRow({
            icon: "lamp",
            title: c.name,
            sub: used[c.id] ? _T("hmw_in_use") : "",
            check: function () {
              return !!HW.devices[c.id];
            },
            tap: function () {
              if (used[c.id]) {
                toast(_T("hmw_in_use_hint"));
                return;
              }
              if (!HW.devices[c.id] && hmwChosen().length >= 4) {
                toast(_T("hmw_three_or_four"));
                return;
              }
              HW.devices[c.id] = !HW.devices[c.id];
              refresh();
            },
          });
        })
      )
    );
    box.appendChild(
      hwNext(null, function () {
        var n = hmwChosen().length;
        if (n < 3 || n > 4) {
          toast(_T("hmw_three_or_four"));
          return;
        }
        hwAdvance();
      })
    );
  });
}

/* "Leave the area" was read: the area is made on the bridge with the name it will be called until it is named, and switched on, which calibrates it. Nobody may be in the room for about 20 seconds. */
function hmwStartCalibration() {
  var before = {};
  hmMotionAreas().forEach(function (x) {
    before[x.id] = 1;
  });
  var made = HW.areaId
    ? Promise.resolve()
    : hpCall("hue_plus", "create_motion_area", { name: HW.name, group: HW.group.id, group_type: "room", lights: hmwChosen() }).then(function () {
        return hueplus.resources(["motion_areas", "automations"]).then(function (r) {
          HM.motion_areas = r.motion_areas;
          HM.automations = r.automations;
          var area = ((r.motion_areas || {}).areas || []).filter(function (x) {
            return !before[x.id];
          })[0];
          if (!area) throw new Error("not found");
          HW.areaId = area.id;
        });
      });
  made
    .then(function () {
      return hpCall("hue_plus", "set_motion_area", { area: HW.areaId, enabled: true });
    })
    .then(
      function () {
        HW.calibrationStart = Date.now();
        hwPush("hue-mw-calibrating");
      },
      function () {
        toast(_T("hmw_couldn_t_create_the_area"));
      }
    );
}

/* The bridge calls the area healthy once its devices have measured the room. */
function hmwCalibrated(x) {
  return !!x && x.health === "healthy" && (x.participants || []).every(function (p) {
    return !p.status || p.status.health === "healthy";
  });
}

var HMW_CALIBRATION_SECONDS = 20;
var HMW_CALIBRATION_GIVE_UP_SECONDS = 120;

/* "Calibrating area…": a count down while the bridge is asked every two seconds; when the area is healthy the wizard goes on to the name. */
function hmwCalibratingPage(b) {
  if (!hwOpen(b, "hue-mw-calibrating")) return;
  b.appendChild(hmTitle("motion", _T("hmw_calibrating_area")));
  hwHint(b, _T("hmw_calibrating_hint"));
  var status = hmRow({
      title: function () {
        var left = HMW_CALIBRATION_SECONDS - Math.floor((Date.now() - HW.calibrationStart) / 1000);
        return left > 0 ? cntS(left, _T("hmw_second_to_go"), _T("hmw_seconds_to_go")) : _T("hmw_almost_done");
      },
    }),
    box = hmGroup([status]),
    stopped = false,
    timer = null;
  b.appendChild(box);
  function leave() {
    stopped = true;
    clearInterval(timer);
  }
  function check() {
    if (stopped || !b.isConnected) return leave();
    refresh();
    if (Date.now() - HW.calibrationStart > HMW_CALIBRATION_GIVE_UP_SECONDS * 1000) {
      leave();
      b.appendChild(hmCallout(_T("hmw_calibration_didn_t_finish")));
      b.appendChild(
        hmActions([
          hmButton(_T("hmw_try_again"), "primary", function () {
            popBack();
          }),
        ])
      );
      return;
    }
    hueplus.resources(["motion_areas"]).then(function (r) {
      if (stopped) return;
      HM.motion_areas = r.motion_areas;
      var x = hmMotionArea1(HW.areaId);
      if (hmwCalibrated(x) && Date.now() - HW.calibrationStart > HMW_CALIBRATION_SECONDS * 1000 - 5000) {
        leave();
        HW.depth--;
        popBack();
        hwPush("hue-wz-name");
      }
    });
  }
  timer = setInterval(check, 2000);
}

/* The area exists and is calibrated: if it was given a name other than the one it was made with, it is renamed, then the wizard goes on. */
function hmwRename1() {
  var d = HW,
    area = hmMotionArea1(d.areaId);
  if (area && area.name === d.name) {
    hwAdvance();
    return;
  }
  hpCall("hue_plus", "set_motion_area", { area: d.areaId, name: d.name }).then(
    function () {
      if (area) area.name = d.name;
      hwAdvance();
    },
    function () {
      toast(_T("hmw_couldn_t_save"));
    }
  );
}

/* The scenes of the rooms (or the zone) the area controls, by name, for the Hue app's default times. */
function hmwDefaultSlots() {
  var scenes = hmList("scenes"),
    ids = HW.groups.map(function (g) {
      return g.id;
    }),
    here = scenes.filter(function (s) {
      return ids.indexOf(s.group_id) >= 0;
    }),
    out = [];
  HMW_DEFAULTS.forEach(function (d) {
    var s = here.filter(function (x) {
      return String(x.name).toLowerCase() === d[1].toLowerCase();
    })[0];
    if (s) out.push({ sun: null, offset: 0, time: d[0], scene: s.id, off: d[2] });
  });
  return out.length === HMW_DEFAULTS.length ? out : [];
}

/* "What should your MotionAware area do?": the app offers three; here the bridge can do the first (the other two are a sensor group, and alerts that are a Signify subscription). */
function hmwChoicePage(b) {
  if (!hwOpen(b, "hue-mw-choice")) return;
  b.appendChild(hmTitle("motion", _T("hmw_what_should_your_area_do")));
  b.appendChild(
    hmGroup([
      hmRow({
        icon: "lamp",
        title: _T("hmw_control_lights"),
        sub: _T("hmw_control_lights_sub"),
        tap: hwAdvance,
      }),
    ])
  );
  hwHint(b, _T("hmw_choice_footer"));
}

function hmwGroupsPage(b) {
  if (!hwOpen(b, "hue-mw-groups")) return;
  hmLoad(b, ["rooms", "zones", "scenes"], function (box, r) {
    if (!HW.groups.length) HW.groups = [{ id: HW.group.id, type: "room" }];
    var groups = hwGroups(r),
      has = function (g) {
        return HW.groups.some(function (x) {
          return x.id === g.id;
        });
      };
    box.appendChild(hmTitle("lamp", _T("hmw_which_lights")));
    hwHint(box, _T("hmw_which_lights_hint"));
    hwGroupRows(box, groups, has, function (g) {
      if (has(g)) {
        HW.groups = HW.groups.filter(function (x) {
          return x.id !== g.id;
        });
        return;
      }
      var zone = g.type === "zone" || HW.groups.some(function (x) { return x.type === "zone"; });
      if (zone) HW.groups = [{ id: g.id, type: g.type }];
      else if (HW.groups.length >= 3) toast(_T("hmw_three_rooms"));
      else HW.groups.push({ id: g.id, type: g.type });
    });
    box.appendChild(
      hwNext(null, function () {
        if (!HW.groups.length) {
          toast(_T("hn_choose_a_room"));
          return;
        }
        HW.slots = hmwDefaultSlots();
        hwAdvance();
      })
    );
  });
}

/* "Success!": what the area will do, the Hue app's way of saying it, with Customize and Done. */
function hmwDonePage(b) {
  if (!hwOpen(b, "hue-mw-done")) return;
  b.appendChild(hmTitle("check", _T("hmw_success")));
  hwHint(b, _T("hmw_default_settings"));
  b.appendChild(hmwSlotRows(true));
  if (!HW.slots.length) b.appendChild(hmCallout(_T("hmw_no_default_scenes")));
  b.appendChild(
    hmActions([
      hmButton(_T("hmw_customize"), "ghost", function () {
        hmwOpenSlots(HW.areaId);
      }),
      hmButton(_T("hm_done"), "primary", function () {
        if (!HW.slots.length) {
          toast(_T("hmw_add_a_time"));
          return;
        }
        HW.finish();
      }),
    ])
  );
}

/* ---- what an area does: the times, as rows ---- */

function hmwNext(i) {
  return HW.slots[(i + 1) % HW.slots.length];
}

function hmwSceneName(id) {
  var s = hmList("scenes").filter(function (x) {
    return x.id === id;
  })[0];
  return s ? s.name : "";
}

/* A slot starts at a time of day, or at sunrise or sunset shifted by some minutes. */
function hmwSunText(sun, offset) {
  var n = Math.abs(offset || 0);
  if (!n) return _T("hw_" + sun);
  return n + " " + _T("hm_min") + " " + _T(offset < 0 ? "hmw_before" : "hmw_after") + " " + _T("hw_" + sun).toLowerCase();
}

function hmwStartText(s) {
  return s.sun ? hmwSunText(s.sun, s.offset) : s.time;
}

/* Where a slot falls in the day, to put them in order (sunrise and sunset count as 06:00 and 18:00 here, as on the bridge's side). */
function hmwOrder(s) {
  if (!s.sun) return Number(s.time.slice(0, 2)) * 60 + Number(s.time.slice(3, 5));
  return (s.sun === "sunrise" ? 360 : 1080) + (s.offset || 0);
}

function hmwSorted() {
  return HW.slots.slice().sort(function (a, b) {
    return hmwOrder(a) - hmwOrder(b);
  });
}

/* One row for each time: from when to when, the scene (or no lights), the minutes without motion before the lights go off. `plain` rows are not pressable. */
function hmwSlotRows(plain) {
  var sorted = hmwSorted();
  return hmGroup(
    sorted.map(function (s, i) {
      var to = sorted[(i + 1) % sorted.length];
      return hmRow({
        icon: "clock",
        title: hmwStartText(s) + " – " + hmwStartText(to),
        sub: (s.scene ? hmwSceneName(s.scene) : _T("hmw_no_lights")) + (s.scene && s.off ? " · " + hwMinutesText(s.off) : ""),
        tap: plain
          ? null
          : function () {
              HW.edit = HW.slots.indexOf(s);
              showPopup("hue-mslot", true);
              HW.depth++;
            },
      });
    })
  );
}

/* The area's times from its automation on the bridge: the scene each time recalls and the minutes before the lights go off. */
function hmwAutomationOf(areaId) {
  return hmList("automations").filter(function (a) {
    return ((a.configuration || {}).source || {}).rid === areaId;
  })[0];
}

function hmwSlotsFrom(a) {
  return (((a.configuration || {}).when || {}).timeslots || []).map(function (t) {
    var start = t.start_time || {},
      tm = start.time || {},
      action = (((t.on_motion || {}).recall_single || [])[0] || {}).action,
      slot = {
        sun: start.type === "sunrise" || start.type === "sunset" ? start.type : null,
        offset: (start.offset || {}).minutes || 0,
        time: tm.hour === undefined ? "" : String(tm.hour).padStart(2, "0") + ":" + String(tm.minute).padStart(2, "0"),
        scene: (action && action.recall && action.recall.rid) || "",
        off: ((t.on_no_motion || {}).after || {}).minutes || 0,
      };
    return slot;
  });
}

function hmwStartSlots(areaId) {
  var a = hmwAutomationOf(areaId),
    c = (a && a.configuration) || {};
  hwBegin({
    kind: "mslots",
    icon: "clock",
    areaId: areaId,
    steps: [],
    groups: (c.where || []).length
      ? c.where.map(function (w) {
          return { id: w.group.rid, type: w.group.rtype };
        })
      : hmwDefaultGroup(areaId),
    slots: a ? hmwSlotsFrom(a) : [],
    dark: ((c.settings || {}).daylight_sensitivity || {}).dark_threshold,
    finish: hmwSetLights,
  });
}

/* The wizard's Customize opens the times it is holding. */
function hmwOpenSlots(areaId) {
  showPopup("hue-mslots:" + areaId, true);
  HW.depth++;
}

/* The page of the times. From an area's page it starts from what the bridge holds (the area page drops edits that were walked away from); from the wizard it shows the wizard's own. */
function hmwSlotsPage(b, id) {
  hmBox(b);
  hmLoad(b, ["scenes", "automations", "rooms", "zones"], function (box) {
    if (!HW || (HW.kind !== "motion" && !(HW.kind === "mslots" && HW.areaId === id))) {
      hmwStartSlots(id);
      HW.depth = 1;
    }
    box.appendChild(hmTitle("clock", _T("hmw_control_lights")));
    hwHint(box, _T("hmw_control_lights_hint"));
    box.appendChild(hmwSlotRows(false));
    if (HW.slots.length < 10)
      box.appendChild(
        hmGroup([
          hmRow({
            icon: "plus",
            title: _T("hm_add_a_time"),
            tap: function () {
              HW.edit = HW.slots.length;
              showPopup("hue-mslot", true);
              HW.depth++;
            },
          }),
        ])
      );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          if (!HW.slots.length) {
            toast(_T("hmw_add_a_time"));
            return;
          }
          if (HW.kind === "mslots") HW.finish();
          else {
            HW.depth--;
            popBack();
          }
        }),
      ])
    );
  });
}

/* An area with no automation yet controls the lights of its own room. */
function hmwDefaultGroup(areaId) {
  var x = hmMotionArea1(areaId);
  return x && x.group ? [{ id: x.group.rid, type: x.group.rtype }] : [];
}

var HMW_OFFSETS = [-60, -30, -15, 0, 15, 30, 60];

function hmwSlotPage(b) {
  hmBox(b);
  if (!HW || HW.edit === undefined) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var isNew = HW.edit >= HW.slots.length,
    cur = isNew ? { sun: null, offset: 0, time: "12:00", scene: "", off: 10 } : Object.assign({}, HW.slots[HW.edit]),
    ids = HW.groups.map(function (g) {
      return g.id;
    }),
    scenes = hmList("scenes").filter(function (s) {
      return ids.indexOf(s.group_id) >= 0;
    });
  b.appendChild(hmLabel(_T("hmw_starts")));
  b.appendChild(
    hmGroup(
      [["", "hw_at_a_specific_time"], ["sunrise", "hw_sunrise"], ["sunset", "hw_sunset"]].map(function (t) {
        return hmRow({
          title: _T(t[1]),
          check: function () {
            return (cur.sun || "") === t[0];
          },
          tap: function () {
            if (t[0] && !hwHasLocation()) {
              toast(_T("hw_sun_needs_home_location"));
              return;
            }
            cur.sun = t[0] || null;
            refresh();
            hmwShowStart();
          },
        });
      })
    )
  );
  var timeBox = mk("div"),
    sunBox = mk("div");
  b.appendChild(timeBox);
  b.appendChild(sunBox);
  timeBox.appendChild(hmGroup([hwTimeRow(_T("time"), function () { return cur.time; }, function (v) { cur.time = v; })]));
  sunBox.appendChild(hmLabel(_T("hmw_shifted_by")));
  sunBox.appendChild(hmChips(HMW_OFFSETS, function () { return cur.offset; }, function (v) { cur.offset = v; }, function (v) { return v ? (v > 0 ? "+" : "−") + Math.abs(v) : "0"; }));
  function hmwShowStart() {
    timeBox.style.display = cur.sun ? "none" : "";
    sunBox.style.display = cur.sun ? "" : "none";
  }
  hmwShowStart();
  b.appendChild(hmLabel(_T("hm_scene")));
  b.appendChild(
    hmGroup(
      [{ id: "", name: _T("hmw_dont_trigger_lights") }].concat(scenes).map(function (s) {
        return hmRow({
          icon: s.id ? "scene" : "power",
          title: s.name,
          check: function () {
            return cur.scene === s.id;
          },
          tap: function () {
            cur.scene = s.id;
            refresh();
          },
        });
      })
    )
  );
  b.appendChild(hmLabel(_T("hmw_lights_off_after")));
  b.appendChild(hmChips([0, 5, 10, 15, 30, 60], function () { return cur.off; }, function (v) { cur.off = v; }, function (v) { return v ? hwMinutesText(v) : _T("hmw_stay_on"); }));
  var actions = [
    hmButton(_T("hm_done"), "primary", function () {
      if (!cur.sun && !/^\d\d:\d\d$/.test(cur.time)) {
        toast(_T("hm_pick_a_time"));
        return;
      }
      var clash = HW.slots.some(function (s, i) {
        return i !== HW.edit && hmwStartText(s) === hmwStartText(cur);
      });
      if (clash) {
        toast(_T("hm_two_times_cannot_be_the_same"));
        return;
      }
      if (isNew) HW.slots.push(cur);
      else HW.slots[HW.edit] = cur;
      HW.depth--;
      popBack();
    }),
  ];
  if (!isNew && HW.slots.length > 1)
    actions.push(
      hmButton(_T("hm_remove_this_time"), "danger", function () {
        HW.slots.splice(HW.edit, 1);
        HW.depth--;
        popBack();
      })
    );
  b.appendChild(hmActions(actions));
}

/* Writes what the area does to the bridge. At the end of the wizard it goes back to the list of areas; from an area's own page, back to the area. */
function hmwSetLights() {
  var d = HW,
    body = {
      area: d.areaId,
      groups: d.groups.map(function (g) {
        return g.id;
      }),
      slots: d.slots.map(function (s) {
        var slot = s.sun ? { sun: s.sun } : { time: s.time };
        if (s.sun && s.offset) slot.offset_minutes = s.offset;
        if (s.scene) slot.scene = s.scene;
        if (s.scene && s.off) slot.off_after_minutes = s.off;
        return slot;
      }),
    };
  if (d.dark !== null && d.dark !== undefined) body.dark_threshold = d.dark;
  hpCall("hue_plus", "set_motion_area_lights", body).then(
    function () {
      HM_READY = false;
      hwLeave();
      hmEnsure();
    },
    function () {
      toast(_T("hmw_couldn_t_save"));
    }
  );
}

/* ---- an area that exists ---- */

function hmwHealthText(x) {
  return _T("hmw_health_" + (x.health || "unknown"));
}

function hmwService(x) {
  var id = ((x.services || []).filter(function (s) { return s.rtype === "convenience_area_motion"; })[0] || {}).rid;
  return ((HM.motion_areas || {}).services || []).filter(function (s) { return s.id === id; })[0];
}

function hmMotionArea(b, id) {
  hmBox(b);
  hmGuard(hmdKey("marea", id));
  if (HW && HW.kind === "mslots") HW = null;
  HMW_DAY = null;
  var key = hmdKey("marea", id);
  hmLoad(b, ["motion_areas", "automations", "scenes", "rooms", "zones"], function (box) {
    var x = hmMotionArea1(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var name = function () {
        return hmdValue(key, "name", x.name || id);
      },
      enabled = function () {
        return hmdValue(key, "enabled", !!x.enabled);
      },
      svc = hmwService(x),
      level = function () {
        return hmdValue(key, "sensitivity", svc && svc.sensitivity ? svc.sensitivity.sensitivity : 0);
      },
      a = hmwAutomationOf(id);
    box.appendChild(hmTitle("motion", name));
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hmw_name"),
          val: name,
          tap: "hue-mname:" + id,
        }),
        hmRow({
          title: _T("hm_enabled"),
          toggle: {
            get: enabled,
            set: function () {
              hmdStage(key, "enabled", !enabled(), !!x.enabled);
              refresh();
            },
          },
        }),
        hmInfo(_T("hm_status"), function () {
          return hmwHealthText(x);
        }),
      ])
    );
    box.appendChild(hmLabel(_T("hmw_what_it_does")));
    box.appendChild(
      hmGroup([
        hmRow({
          icon: "lamp",
          title: _T("hmw_control_lights"),
          sub: a ? cntS(hmwSlotsFrom(a).length, _T("hmw_time_n"), _T("hmw_times_n")) : _T("hmw_nothing_set"),
          tap: "hue-mslots:" + id,
        }),
      ])
    );
    box.appendChild(hmLabel(_T("hmw_general_settings")));
    box.appendChild(
      hmGroup([
        hmRow({
          icon: "motion",
          title: _T("hmw_motion_sensitive_devices"),
          sub: function () {
            return cntS(hmdValue(key, "lights", hmwOwners(x)).length, _T("hm_light"), _T("hm_lights"));
          },
          tap: "hue-mdev:" + id,
        }),
        svc && svc.sensitivity
          ? hmRow({
              icon: "walk",
              title: _T("hmw_motion_sensitivity"),
              val: function () {
                return hmwLevelText(level(), svc.sensitivity.sensitivity_max);
              },
              tap: "hue-msens:" + id,
            })
          : null,
        a
          ? hmRow({
              icon: "bright",
              title: _T("hmw_daylight_settings"),
              val: hmwDaylightOn(hmwSlotsFrom(a)) ? _T("hmw_sunrise_sunset") : _T("hmw_disabled"),
              tap: "hue-mday:" + id,
            })
          : null,
      ])
    );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T("delete_this_motion_area"), function () {
            hmdDiscard(key);
            call("hue_plus", "delete_motion_area", { area: x.id, confirm: true });
            HM_READY = false;
            closeLayer();
            hmEnsure();
          });
        }),
      ])
    );
  });
}

/* The levels the bridge offers are 0 to its maximum; five of them (the bridge it was tried on) are the app's Very low, Low, Medium, High and Very high. Two or three are low and high (and medium); other counts have no names of their own. */
function hmwLevelText(v, max) {
  if (max === 1) return [_T("hmw_low"), _T("hmw_high")][v];
  if (max === 2) return [_T("hmw_low"), _T("hmw_medium"), _T("hmw_high")][v];
  if (max === 4) return [_T("hmw_very_low"), _T("hmw_low"), _T("hmw_medium"), _T("hmw_high"), _T("hmw_very_high")][v];
  return _T("hmw_level") + " " + v;
}

function hmwRename(b, id) {
  hmBox(b);
  var key = hmdKey("marea", id),
    x = hmMotionArea1(id);
  hmGuard(key, true);
  if (!x) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.value = hmdValue(key, "name", x.name || "");
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    hmActions([
      hmButton(_T("hm_done"), "primary", function () {
        var v = inp.value.trim();
        if (!v) {
          toast(_T("hw_give_it_a_name"));
          return;
        }
        hmdStage(key, "name", v, x.name);
        popBack();
      }),
    ])
  );
}

/* The devices of an area: the owners of its participants (the candidates are keyed by the device they belong to). */
function hmwOwners(x) {
  var owner = {};
  ((HM.motion_areas || {}).candidates || []).forEach(function (c) {
    owner[c.id] = (c.owner || {}).rid;
  });
  return (x.participants || []).map(function (p) {
    return owner[p.resource.rid];
  });
}

/* The devices an area can use: those of its room that the bridge offers, plus the ones it already has. */
function hmwEligible(x) {
  var owners = hmwCandidates(),
    room = hmList("rooms").filter(function (g) {
      return g.id === (x.group || {}).rid;
    })[0],
    have = hmwOwners(x),
    names = {};
  hmList("devices").forEach(function (d) {
    names[d.id] = d.name;
  });
  var ids = (room ? room.children.map(function (c) { return c.id; }) : Object.keys(owners)).filter(function (d) {
    return owners[d];
  });
  have.forEach(function (d) {
    if (ids.indexOf(d) < 0) ids.push(d);
  });
  return ids.map(function (d) {
    return { id: d, name: names[d] || d };
  });
}

/* Which devices the area has: three or four, chosen on this page and kept in the area's draft until it is saved. */
function hmwDevices(b, id) {
  hmBox(b);
  var key = hmdKey("marea", id);
  hmGuard(key, true);
  hmLoad(b, ["motion_areas", "devices", "rooms"], function (box) {
    var x = hmMotionArea1(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var actual = hmwOwners(x).slice().sort(),
      chosen = hmdValue(key, "lights", actual).slice();
    hwHint(box, _T("hmw_choose_devices_hint"));
    box.appendChild(
      hmGroup(
        hmwEligible(x).map(function (c) {
          return hmRow({
            icon: "lamp",
            title: c.name,
            check: function () {
              return chosen.indexOf(c.id) >= 0;
            },
            tap: function () {
              var at = chosen.indexOf(c.id);
              if (at >= 0) chosen.splice(at, 1);
              else if (chosen.length >= 4) {
                toast(_T("hmw_three_or_four"));
                return;
              } else chosen.push(c.id);
              refresh();
            },
          });
        })
      )
    );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          if (chosen.length < 3 || chosen.length > 4) {
            toast(_T("hmw_three_or_four"));
            return;
          }
          hmdStage(key, "lights", chosen.slice().sort(), actual);
          popBack();
        }),
      ])
    );
  });
}

function hmwSensitivity(b, id) {
  hmBox(b);
  var key = hmdKey("marea", id);
  hmGuard(key, true);
  hmLoad(b, ["motion_areas"], function (box) {
    var x = hmMotionArea1(id),
      svc = x && hmwService(x);
    if (!svc || !svc.sensitivity) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var max = svc.sensitivity.sensitivity_max || 0,
      levels = [];
    for (var i = 0; i <= max; i++) levels.push(i);
    box.appendChild(
      hmGroup(
        levels.map(function (v) {
          return hmRow({
            title: hmwLevelText(v, max),
            check: function () {
              return hmdValue(key, "sensitivity", svc.sensitivity.sensitivity) === v;
            },
            tap: function () {
              hmdStage(key, "sensitivity", v, svc.sensitivity.sensitivity);
              popBack();
            },
          });
        })
      )
    );
  });
}

/* Whether the area is left dark by day: a time that starts at sunrise and triggers no lights. */
function hmwDaylightOn(slots) {
  return slots.some(function (s) {
    return s.sun === "sunrise" && !s.scene;
  });
}

/* Turns "only when it's dark" on or off in the times of the area. On: the times of the day (between sunrise and sunset) are replaced by one that starts at sunset with the scene the evening had,
   and a time that starts at sunrise and triggers no lights. Off: those two are removed. */
function hmwApplyDaylight(on, startOffset, stopOffset) {
  var timed = HW.slots.filter(function (s) {
    return !s.sun;
  });
  if (!on) {
    if (!timed.length) return false;
    HW.slots = timed;
    return true;
  }
  var sunrise = 360 + stopOffset,
    sunset = 1080 + startOffset,
    day = timed
      .filter(function (s) {
        return hmwOrder(s) > sunrise && hmwOrder(s) < sunset;
      })
      .sort(function (a, b) {
        return hmwOrder(a) - hmwOrder(b);
      }),
    rest = timed.filter(function (s) {
      return day.indexOf(s) < 0;
    }),
    basis = day.length ? day[day.length - 1] : rest.slice().sort(function (a, b) { return hmwOrder(a) - hmwOrder(b); })[0];
  if (!basis || !basis.scene) return false;
  HW.slots = rest.concat([
    { sun: "sunset", offset: startOffset, time: "", scene: basis.scene, off: basis.off },
    { sun: "sunrise", offset: stopOffset, time: "", scene: "", off: 0 },
  ]);
  return true;
}

/* The daylight choice being made, kept while a page that picks minutes is open on top of it; the area's page drops it. */
var HMW_DAY = null;

function hmwDaylight(b, id) {
  hmBox(b);
  hmLoad(b, ["automations", "scenes", "home_and_away"], function (box) {
    var a = hmwAutomationOf(id);
    if (!a) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    if (!HMW_DAY || HMW_DAY.id !== id) {
      var slots = hmwSlotsFrom(a),
        sunsetSlot = slots.filter(function (s) { return s.sun === "sunset"; })[0],
        sunriseSlot = slots.filter(function (s) { return s.sun === "sunrise" && !s.scene; })[0];
      HMW_DAY = { id: id, st: { on: hmwDaylightOn(slots), start: sunsetSlot ? sunsetSlot.offset : 0, stop: sunriseSlot ? sunriseSlot.offset : 0 } };
    }
    var st = HMW_DAY.st;
    hwHint(box, _T("hmw_daylight_hint"));
    box.appendChild(
      hmGroup(
        [[false, "hmw_disabled"], [true, "hmw_sunrise_sunset"]].map(function (t) {
          return hmRow({
            title: _T(t[1]),
            check: function () {
              return st.on === t[0];
            },
            tap: function () {
              if (t[0] && !hwHasLocation()) {
                toast(_T("hw_sun_needs_home_location"));
                return;
              }
              st.on = t[0];
              refresh();
              show();
            },
          });
        })
      )
    );
    var more = mk("div");
    box.appendChild(more);
    function show() {
      more.innerHTML = "";
      if (!st.on) return;
      [["start", "hmw_start_triggering", "sunset"], ["stop", "hmw_stop_triggering", "sunrise"]].forEach(function (t) {
        more.appendChild(hmLabel(_T(t[1])));
        more.appendChild(
          hmGroup([
            hmRow({
              title: _T("hmw_when_x"),
              val: function () {
                return hmwSunText(t[2], st[t[0]]);
              },
              tap: function () {
                hmwPickOffset(st, t[0], t[2]);
              },
            }),
          ])
        );
      });
      refresh();
    }
    show();
    box.appendChild(
      hmActions([
        hmButton(_T("hm_done"), "primary", function () {
          hmwStartSlots(id);
          HW.depth = 1;
          if (!hmwApplyDaylight(st.on, st.start, st.stop)) {
            toast(_T("hmw_add_a_time_with_a_scene"));
            return;
          }
          HW.finish();
        }),
      ])
    );
  });
}

/* The minutes before or after sunrise or sunset, chosen on a page of their own. */
function hmwPickOffset(st, key, sun) {
  hwBegin({ kind: "pick-holder", steps: [], depth: 0 });
  hwChoose({
    options: HMW_OFFSETS.map(function (v) {
      return { value: v, title: hmwSunText(sun, v) };
    }),
    get: function () {
      return st[key];
    },
    set: function (v) {
      st[key] = v;
    },
  });
}

HP_PAGES["hue-mw-intro"] = ["hmw_create_a_motionaware_area", "motion", hmwInfo("hue-mw-intro", "hmw_create_a_motionaware_area", ["hmw_intro_1", "hmw_intro_2"], "hmw_create_area")];
HP_PAGES["hue-mw-tip1"] = ["hmw_before_you_choose_devices", "motion", hmwInfo("hue-mw-tip1", "hmw_before_you_choose_devices", ["hmw_tip1_1"])];
HP_PAGES["hue-mw-tip2"] = ["hmw_before_you_choose_devices", "motion", hmwInfo("hue-mw-tip2", "hmw_before_you_choose_devices", ["hmw_tip2_1", "hmw_tip2_2"])];
HP_PAGES["hue-mw-tip3"] = ["hmw_before_you_choose_devices", "motion", hmwInfo("hue-mw-tip3", "hmw_before_you_choose_devices", ["hmw_tip3_1", "hmw_tip3_2"])];
HP_PAGES["hue-mw-where"] = ["hmw_create_a_motionaware_area", "motion", hmwWherePage];
HP_PAGES["hue-mw-devices"] = ["hmw_choose_devices", "motion", hmwDevicesPage];
HP_PAGES["hue-mw-leave"] = ["hmw_leave_the_area", "motion", hmwInfo("hue-mw-leave", "hmw_leave_the_area", ["hmw_leave_hint"], null, hmwStartCalibration)];
HP_PAGES["hue-mw-calibrating"] = ["hmw_calibrating_area", "motion", hmwCalibratingPage];
HP_PAGES["hue-mw-created"] = ["hmw_area_created", "motion", hmwInfo("hue-mw-created", "hmw_area_created", ["hmw_area_created_sub"])];
HP_PAGES["hue-mw-choice"] = ["hmw_what_should_your_area_do", "motion", hmwChoicePage];
HP_PAGES["hue-mw-groups"] = ["hmw_which_lights", "lamp", hmwGroupsPage];
HP_PAGES["hue-mw-done"] = ["hmw_success", "check", hmwDonePage];
HP_PAGES["hue-mslots"] = ["hmw_control_lights", "clock", hmwSlotsPage];
HP_PAGES["hue-mslot"] = ["hm_time", "clock", hmwSlotPage];
HP_PAGES["hue-mname"] = ["hmw_name", "edit", hmwRename];
HP_PAGES["hue-mdev"] = ["hmw_motion_sensitive_devices", "motion", hmwDevices];
HP_PAGES["hue-msens"] = ["hmw_motion_sensitivity", "walk", hmwSensitivity];
HP_PAGES["hue-mday"] = ["hmw_daylight_settings", "bright", hmwDaylight];
HP_PAGES["hue-marea"] = ["motion_area", "motion", hmMotionArea];
