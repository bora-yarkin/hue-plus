/* Edit automation, as the Hue app has it: one screen with everything an automation has (its name, when, how long it fades, the days, the lights, the settings), and SAVE at the top; every row that
   needs a choice opens it over the screen and comes back. The rows are the wizard's (huewizard.js: hwWhenRows, hwSettingsRows, hwLengthRows, hwSceneRows) and the lights are the picker of the app
   (huepicker.js), so a new automation and an edited one are asked the same things. A kind this does not edit (one of the bridge's own, not made from a template) keeps its short page. */

/* What the screen has been changed from: the answers, without what only the wizard's pages use. */
function hweSnapshot() {
  return JSON.stringify(HW, function (key, value) {
    return ["depth", "at", "steps", "finish", "groups", "pick", "targets", "first", "editing"].indexOf(key) >= 0 || typeof value === "function" ? undefined : value;
  });
}

/* The name at the top, with a pencil that makes it a field. */
function hweHead(box) {
  var head = mk("div", "hwe-head"),
    title = hmTitle(HW.kind === "wake_up" && typeof HOST_ICONS !== "undefined" && HOST_ICONS.sunrise ? "sunrise" : HW.icon || "clock", HW.name),
    pen = mk("button", "hwe-pen");
  pen.type = "button";
  pen.setAttribute("aria-label", _T("hn_rename"));
  pen.innerHTML = svg("edit");
  pen.addEventListener("click", function () {
    var w = mk("div", "sqw pane"),
      inp = mk("input", "sq");
    inp.type = "text";
    inp.maxLength = 32;
    inp.value = HW.name || "";
    inp.setAttribute("aria-label", _T("hw_name"));
    inp.addEventListener("input", function () {
      HW.name = inp.value;
    });
    w.appendChild(inp);
    head.replaceWith(w);
    inp.focus();
    inp.select();
  });
  head.appendChild(title);
  head.appendChild(pen);
  box.appendChild(head);
}

/* How many lights the choice has. */
function hweLightCount(groups) {
  if (HW.lights.home) {
    var seen = {};
    groups.forEach(function (g) {
      g.lights.forEach(function (l) {
        seen[l.id] = 1;
      });
    });
    return Object.keys(seen).length;
  }
  var ids = {};
  Object.keys(HW.lights.picked).forEach(function (k) {
    HW.lights.picked[k].forEach(function (id) {
      ids[id] = 1;
    });
  });
  return Object.keys(ids).length;
}

/* The lights the automation is for, as the app draws them: "Selected lights" with a pencil that opens the picker over this screen, and a tile with the room's icon, its name and how many lights. */
function hweLights(box, groups) {
  var card = mk("div", "hwe-lcard"),
    head = mk("div", "hwe-lh", "<span></span>"),
    pen = mk("button", "hwe-pen");
  head.querySelector("span").textContent = _T("app_selected_lights");
  pen.type = "button";
  pen.setAttribute("aria-label", _T("hn_rename"));
  pen.innerHTML = svg("edit");
  function open() {
    showPopup("hue-ed-lights", true);
  }
  pen.addEventListener("click", open);
  head.appendChild(pen);
  card.appendChild(head);
  var tile = mk("div", "selroom", "<span class='ic'></span><div><b></b><i></i></div>"),
    first = groups.filter(function (g) {
      return (HW.lights.picked[g.id] || []).length;
    })[0],
    icon = HW.lights.home || !first ? "home" : first.type === "zone" ? "target" : (typeof HP_ROOM_ICONS !== "undefined" && HP_ROOM_ICONS[first.archetype]) || "home";
  tile.querySelector(".ic").innerHTML = svg(icon);
  tile.querySelector("b").textContent = hwGroupName() || _T("hn_choose_a_room");
  var n = hweLightCount(groups);
  tile.querySelector("i").textContent = n ? cntS(n, _T("hm_light"), _T("hm_lights")) : "";
  tile.setAttribute("role", "button");
  tile.tabIndex = 0;
  tile.addEventListener("click", open);
  tile.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
  card.appendChild(tile);
  box.appendChild(card);
}

/* The choice of lights, over the edit screen: the picker, and DONE puts the choice back on it. */
function hweLightsPage(b) {
  hmBox(b);
  if (!HW || !HW.groups) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var one = HW_ONE_ROOM.indexOf(HW.kind) >= 0,
    work = JSON.parse(JSON.stringify(HW.lights)),
    pick = mk("div");
  b.appendChild(pick);
  hpkPicker(pick, { groups: HW.groups, state: work, one: one, whole: one, recommend: hweRecommend });
  /* DONE is in the bar of the page, as in the app: it puts the choice back on the edit screen. */
  HC.onDone = function () {
    var targets = hpkTargets(work, HW.groups);
    if (!targets.length) {
      toast(_T("hpk_choose_lights"));
      return;
    }
    HW.lights = work;
    HW.targets = targets;
    var first = HW.groups.filter(function (g) {
      return (work.picked[g.id] || []).length;
    })[0];
    HW.group = first ? { id: first.id, type: first.type } : null;
    popBack();
    showPopup("hue-routine:" + HW.edit, false);
  };
}

/* Wake up and go to sleep are best on lights that can show a gradient (the app says so under them). */
function hweRecommend(light) {
  return (HW.kind === "wake_up" || HW.kind === "go_to_sleep") && /lightstrip|gradient/.test(String(light.archetype || ""));
}

/* When the lights are chosen again while the screen is open, the screen is drawn again with the choice. */
function hweChoice(box, title, options, get, set) {
  return hmGroup([
    hmRow({
      title: title,
      val: function () {
        var now = get(),
          found = options.filter(function (o) {
            return o.value === now;
          })[0];
        return found ? found.title : "";
      },
      tap: function () {
        hwChoose({
          options: options,
          get: get,
          set: function (v) {
            set(v);
          },
        });
      },
    }),
  ]);
}

/* The screen. */
function hwEditPage(b, id) {
  hmBox(b);
  hmLoad(b, ["automations", "rooms", "zones", "scenes"], function (box, r, again) {
    var x = (r.automations || []).filter(function (y) {
      return y.id === id;
    })[0];
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var kind = hwKindOf(x),
      groups = hpkGroups(r);
    /* Back from a page opened over this screen: the answers are the ones in progress, not the bridge's. */
    if (!(HW && HW.edit === x.id && HW.editing)) {
      hwBegin(hwAutomationState(kind, x));
      HW.depth = 1;
      HW.editing = true;
      HW.groups = groups;
      HW.lights = hpkStateOf(((x.configuration || {}).where) || [], groups);
      HW.targets = hpkTargets(HW.lights, groups);
      HW.first = hweSnapshot();
    }
    var editable = hwEditable(x);
    if (editable) hweBody(box, r, kind, groups);
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hm_enabled"),
          toggle: {
            get: function () {
              return !!x.enabled;
            },
            set: function () {
              x.enabled = !x.enabled;
              hpDo(again, "update_automation", { automation: x.id, enabled: x.enabled });
            },
          },
        }),
      ])
    );
    if (hwRunnable(x))
      box.appendChild(
        hmGroup(
          [["start", "play", "hw_start"], ["stop", "stop", "hw_stop"]].map(function (t) {
            return hmRow({
              icon: t[1],
              title: _T(t[2]),
              sub: t[0] === "start" ? hwRunText(x) : "",
              tap: function () {
                hpDo(again, "trigger_automation", { automation: x.id, action: t[0] });
              },
            });
          })
        )
      );
    if (x.last_error) box.appendChild(hmCallout(x.last_error));
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T("delete_this_routine_from_the_bridge"), function () {
            call("hue_plus", "delete_automation", { automation: x.id, confirm: true });
            HW = null;
            closeLayer();
          });
        }),
      ])
    );
    if (editable)
      guardUnsaved({
        dirty: function () {
          return !!HW && hweSnapshot() !== HW.first;
        },
        save: function (leave) {
          return hweSave(leave);
        },
        discard: function () {
          HW = null;
        },
      });
  });
}

/* The time of day as the app has it: two wheels (hours and minutes) that turn under a band that marks the chosen time, and wrap round. */
function hweWheel(get, set) {
  var box = mk("div", "hwe-wheel"),
    band = mk("div", "hwe-band"),
    cols = [];
  function column(count, value, change) {
    var col = mk("div", "hwe-col"),
      timer = 0;
    /* a row is as high as the page draws it (the panel scales every length with the phone's width) */
    function ROW() {
      return col.children[0].offsetHeight || 40;
    }
    for (var rep = 0; rep < 3; rep++)
      for (var i = 0; i < count; i++) {
        var o = mk("div", "hwe-opt");
        o.textContent = (i < 10 ? "0" : "") + i;
        col.appendChild(o);
      }
    function go(v, smooth) {
      col.scrollTo({ top: (count + v) * ROW(), behavior: smooth ? "smooth" : "auto" });
      shade();
    }
    function shade() {
      var c = col.scrollTop / ROW(),
        first = Math.max(0, Math.floor(c) - 3),
        last = Math.min(col.children.length - 1, Math.ceil(c) + 3);
      for (var k = first; k <= last; k++) {
        var d = Math.abs(k - c),
          o = col.children[k];
        o.style.opacity = d < 0.5 ? "1" : d < 1.5 ? ".55" : ".25";
        o.style.transform = "scale(" + (d < 0.5 ? 1 : d < 1.5 ? 0.9 : 0.78) + ")";
      }
    }
    col.addEventListener("scroll", function () {
      shade();
      clearTimeout(timer);
      timer = setTimeout(function () {
        var at = Math.round(col.scrollTop / ROW()) % count;
        /* back to the middle copy, so the wheel never ends */
        col.scrollTo({ top: (count + at) * ROW(), behavior: "auto" });
        change(at);
      }, 90);
    });
    cols.push({ col: col, go: go, value: value });
    return col;
  }
  var parts = String(get() || "06:00").split(":");
  box.appendChild(band);
  box.appendChild(
    column(24, Number(parts[0]), function (h) {
      var m = String(get() || "06:00").split(":")[1];
      set((h < 10 ? "0" : "") + h + ":" + m);
    })
  );
  box.appendChild(
    column(60, Number(parts[1]), function (m) {
      var h = String(get() || "06:00").split(":")[0];
      set(h + ":" + (m < 10 ? "0" : "") + m);
    })
  );
  /* The wheels are put at the time once they are in the page. */
  var tries = 0;
  (function place() {
    if (!box.isConnected || box.clientHeight === 0) {
      if (tries++ < 30) setTimeout(place, 50);
      return;
    }
    var t = String(get() || "06:00").split(":");
    cols[0].go(Number(t[0]), false);
    cols[1].go(Number(t[1]), false);
  })();
  return box;
}

/* "05:30" from a time and a length in minutes before it. */
function hweMinus(time, minutes) {
  var p = String(time || "06:00").split(":"),
    at = (((Number(p[0]) * 60 + Number(p[1]) - minutes) % 1440) + 1440) % 1440,
    h = Math.floor(at / 60),
    m = at % 60;
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}

/* The days, as the app draws them: S M T W T F S in round buttons, the chosen ones blue. */
function hweDays() {
  var order = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    box = mk("div", "hwe-days");
  order.forEach(function (day) {
    var b = mk("button", "hwe-day");
    b.type = "button";
    b.textContent = _T("hw_day_long_" + day).charAt(0).toUpperCase();
    b.setAttribute("aria-label", _T("hw_day_long_" + day));
    b.addEventListener("click", function () {
      if (HW.repeat === false) return;
      var at = HW.days.indexOf(day);
      if (at >= 0) HW.days.splice(at, 1);
      else HW.days.push(day);
      refresh();
    });
    b.refresh = function () {
      var on = HW.days.indexOf(day) >= 0 && HW.repeat !== false;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.disabled = HW.repeat === false;
    };
    reg(b.refresh);
    b.refresh();
    box.appendChild(b);
  });
  return box;
}

/* The pieces of the screen: the time (wheels and the fade), Repeat and its days, the lights. */
function hweTime(box, kind) {
  box.appendChild(hmLabel(_T("hw_when_label")));
  var group = mk("div", "hm-group");
  group.appendChild(hweWheel(function () { return HW.time; }, function (v) { HW.time = v; refresh(); }));
  if (kind === "wake_up") {
    group.appendChild(
      hmRow({
        title: _T("hw_fade_duration"),
        val: function () {
          return hwMinutesText(HW.minutes);
        },
        tap: function () {
          showPopup("hue-ed-fade", true);
        },
      })
    );
  }
  box.appendChild(group);
  if (kind === "wake_up") {
    var note = mkHint("");
    note.refresh = function () {
      note.textContent = _T("hw_lights_will_start") + " " + hweMinus(HW.time, HW.minutes) + " " + _T("hw_with_a_fade_duration_of") + " " + HW.minutes + " " + _T("hw_minutes_word") + ".";
    };
    reg(note.refresh);
    note.refresh();
    box.appendChild(note);
  }
}

function hweRepeat(box, kind) {
  /* One card: the Repeat switch and the days. Only a wake-up can run once (the bridge takes it without days, tried 2026-11-20); the other kinds have the days alone. */
  var card = mk("div", "hm-group");
  if (kind === "wake_up")
    card.appendChild(
      hmRow({
        title: _T("hw_repeat"),
        toggle: {
          get: function () {
            return HW.repeat !== false;
          },
          set: function () {
            HW.repeat = HW.repeat === false;
            refresh();
          },
        },
      })
    );
  else card.appendChild(hmLabel(_T("hw_repeat")));
  card.appendChild(hweDays());
  box.appendChild(card);
}

/* The settings that belong to each kind, one under the other. */
function hweBody(box, r, kind, groups) {
  hweHead(box);
  if (kind === "wake_up" || kind === "go_to_sleep") {
    hweTime(box, kind);
    hweRepeat(box, kind);
  } else if (kind === "schedule") {
    box.appendChild(hmLabel(_T("hw_when_label")));
    hwWhenRows(box);
  }
  if (kind === "timer") {
    box.appendChild(hmLabel(_T("hw_how_long_should_your_timer_last")));
    hwLengthRows(box);
  }
  if (kind === "coming_home") {
    box.appendChild(
      hweChoice(
        box,
        _T("hw_when_should_your_lights_turn_on"),
        [
          { value: "always", title: _T("hw_always") },
          { value: "nighttime", title: _T("hw_at_night") },
        ],
        function () {
          return HW.whenType;
        },
        function (v) {
          if (v === "nighttime" && !hwHasLocation()) {
            toast(_T("hw_sun_needs_home_location"));
            return;
          }
          HW.whenType = v;
        }
      )
    );
  }
  if (kind === "mimic_presence") {
    box.appendChild(
      hweChoice(
        box,
        _T("hw_when_should_your_lights_turn_on_active"),
        [
          { value: "24h", title: _T("hw_all_day") },
          { value: "nighttime", title: _T("hw_only_when_its_dark") },
        ],
        function () {
          return HW.mode;
        },
        function (v) {
          HW.mode = v;
        }
      )
    );
  }
  hweLights(box, groups);
  if (kind === "wake_up" || kind === "go_to_sleep") {
    box.appendChild(hmLabel(_T("hw_choose_your_settings")));
    hwSettingsRows(box);
  }
  if (kind === "timer" || kind === "coming_home" || kind === "schedule") {
    box.appendChild(hmLabel(_T("hw_what_should_your_lights_do")));
    hwSceneRows(box, r);
  }
}

/* Fade duration: a page of its own over the screen, as the app opens it: how long, and when it starts because of it. */
function hweFadePage(b) {
  hmBox(b);
  /* as short as its content, up from the bottom of the screen, as the app has it */
  if (b.parentNode) b.parentNode.classList.add("shortpg");
  if (!HW) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  var head = mk("div", "hwe-fade"),
    left = mk("div", "hwe-fl", "<span></span><b></b>"),
    right = mk("div", "hwe-fr", "<span></span><b></b>"),
    track = mk("div", "hwe-track", "<div class='hwe-fill'></div><div class='hwe-thumb'></div>"),
    ticks = mk("div", "hwe-ticks"),
    MAX = 60,
    STEP = 5;
  left.querySelector("span").textContent = _T("hw_fade_for");
  right.querySelector("span").textContent = _T("hw_start_at_upper");
  head.appendChild(left);
  head.appendChild(right);
  [60, 50, 40, 30, 20, 10, 0].forEach(function (n) {
    ticks.appendChild(mk("span")).textContent = String(n);
  });
  var wrap = mk("div", "hwe-slider");
  wrap.appendChild(track);
  wrap.appendChild(ticks);
  var group = mk("div", "hm-group");
  group.appendChild(head);
  group.appendChild(wrap);
  b.appendChild(group);
  var fill = track.querySelector(".hwe-fill"),
    thumb = track.querySelector(".hwe-thumb");
  function paint() {
    /* the scale runs from 60 on the left to 0 on the right, the blue is what is left of it */
    var at = 1 - HW.minutes / MAX;
    thumb.style.left = at * 100 + "%";
    fill.style.left = at * 100 + "%";
    left.querySelector("b").textContent = hwMinutesText(HW.minutes);
    right.querySelector("b").textContent = hweMinus(HW.time, HW.minutes);
  }
  function from(e) {
    var r = track.getBoundingClientRect(),
      x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      m = Math.max(STEP, Math.round(((1 - x) * MAX) / STEP) * STEP);
    HW.minutes = m;
    paint();
  }
  track.addEventListener("pointerdown", function (e) {
    track.setPointerCapture(e.pointerId);
    from(e);
    function move(ev) {
      from(ev);
    }
    function up() {
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
    }
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
  });
  paint();
  HC.onDone = function () {
    popBack();
  };
}

/* SAVE: checks what the kind needs, then writes it; on success the screen is left. */
function hweSave(leave) {
  var kind = HW.kind;
  if (!(HW.name || "").trim()) {
    toast(_T("hw_give_it_a_name"));
    return false;
  }
  if ((kind === "wake_up" || kind === "go_to_sleep" || kind === "schedule") && !hwWhenValid()) return false;
  if (kind === "timer" && !hwLengthValid()) return false;
  if ((kind === "timer" || kind === "coming_home" || kind === "schedule") && HW.action === "scene" && !HW.scene) {
    toast(_T("hm_pick_a_scene"));
    return false;
  }
  HW.name = HW.name.trim();
  return hwSaveAutomation(function () {
    HW = null;
    leave();
  });
}

HP_PAGES["hue-routine"] = ["hw_edit_automation", "clock", hwEditPage];
/* Maximum brightness: a short sheet with its slider, as the app opens it. */
function hweBriPage(b) {
  hmBox(b);
  if (!HW) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  if (b.parentNode) b.parentNode.classList.add("shortpg");
  var head = mk("div", "hwe-fade", "<div class='hwe-fl'><span></span><b></b></div><div></div>"),
    track = mk("div", "hwe-track", "<div class='hwe-fill2'></div><div class='hwe-thumb'></div>"),
    wrap = mk("div", "hwe-slider"),
    group = mk("div", "hm-group");
  head.querySelector("span").textContent = _T("hw_maximum_brightness").toUpperCase();
  wrap.appendChild(track);
  group.appendChild(head);
  group.appendChild(wrap);
  b.appendChild(group);
  var fill = track.querySelector(".hwe-fill2"),
    thumb = track.querySelector(".hwe-thumb");
  function paint() {
    var at = (HW.brightness - 1) / 99;
    thumb.style.left = at * 100 + "%";
    fill.style.width = at * 100 + "%";
    head.querySelector("b").textContent = HW.brightness + "%";
  }
  function from(e) {
    var r = track.getBoundingClientRect();
    HW.brightness = Math.max(1, Math.min(100, Math.round(1 + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 99)));
    paint();
  }
  track.addEventListener("pointerdown", function (e) {
    track.setPointerCapture(e.pointerId);
    from(e);
    track.onpointermove = from;
    track.onpointerup = track.onpointercancel = function () {
      track.onpointermove = null;
    };
  });
  paint();
  HC.onDone = function () {
    popBack();
  };
}

HP_PAGES["hue-ed-bri"] = ["hw_maximum_brightness", "bright", hweBriPage];
HP_PAGES["hue-ed-lights"] = ["hw_edit_lights", "lamp", hweLightsPage];
HP_PAGES["hue-ed-fade"] = ["hw_fade_duration", "clock", hweFadePage];
