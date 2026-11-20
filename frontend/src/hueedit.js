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
    title = hmTitle(HW.icon || "clock", HW.name),
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

/* The lights the automation is for: a tile with a pencil that opens the picker over this screen. */
function hweLights(box, groups) {
  box.appendChild(hmLabel(_T("app_selected_lights")));
  var tile = mk("div", "selroom", "<span class='ic'></span><div><b></b><i></i></div>");
  var icon = HW.lights && HW.lights.home ? "home" : "lamp";
  tile.querySelector(".ic").innerHTML = svg(icon);
  tile.querySelector("b").textContent = hwGroupName() || _T("hn_choose_a_room");
  var chosen = hpkTargets(HW.lights, groups),
    n = chosen.length === 1 && chosen[0].lights ? chosen[0].lights.length : 0;
  tile.querySelector("i").textContent = HW.lights.home ? "" : n ? cntS(n, _T("hm_light"), _T("hm_lights")) : "";
  tile.setAttribute("role", "button");
  tile.tabIndex = 0;
  function open() {
    showPopup("hue-ed-lights", true);
  }
  tile.addEventListener("click", open);
  tile.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
  box.appendChild(tile);
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
  b.appendChild(mkHint(_T("hpk_select_lights_for_automation")));
  b.appendChild(pick);
  hpkPicker(pick, { groups: HW.groups, state: work, one: one, whole: one });
  b.appendChild(
    hmActions([
      hmButton(_T("hm_done"), "primary", function () {
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
      }),
    ])
  );
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

/* The settings that belong to each kind, one under the other. */
function hweBody(box, r, kind, groups) {
  hweHead(box);
  if (kind === "wake_up" || kind === "go_to_sleep" || kind === "schedule") {
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
HP_PAGES["hue-ed-lights"] = ["hw_edit_lights", "lamp", hweLightsPage];
