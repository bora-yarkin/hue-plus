/* A switch and what its buttons do, laid out as the Hue app lays it out: Switch settings (the switch, its room, a tile for each button, what the selected button controls, its lights, what a press does, smart on/off),
 the Press page (the kind of press and what it acts on), the choice of kind, the scene to recall, and Smart on/off. What a press does is staged and written to the bridge when the switch is saved, with the same functions the
 Hue Plus menu uses (hmStagePress, hmSaveSwitch); only the pages are the app's. They replace the menu's pages of the same names in this panel. */

var HPSW = { sel: {} };

/* The tiles of the four buttons of a dimmer switch carry the app's names and pictures; any other switch has its buttons by number. */
function hpButtonLook(acc, btn) {
  var four = (acc.buttons || []).length === 4,
    look = four ? { 1: ["power", "app_btn_onoff"], 2: ["bright", "app_btn_brighten"], 3: ["bright", "app_btn_dim"], 4: ["hue", "app_btn_hue"] }[btn.number] : null;
  return look ? { icon: look[0], name: _T(look[1]) } : { icon: "power", name: _T("hm_button_label") + " " + btn.number };
}

HOST_ICONS.hue = "<text x='1' y='16' font-size='9' font-weight='700' fill='currentColor' stroke='none' font-family='sans-serif'>hue</text>";

/* The name of the room or zone a device is in. */
function hpRoomOfDevice(r, id) {
  var found = null;
  (r.rooms || []).concat(r.zones || []).forEach(function (g) {
    if ((g.children || []).some(function (c) { return c.id === id; })) found = found || g;
  });
  return found;
}

/* A round tile with the picture of what a press recalls: the colours of a scene, or an icon on a dark disc. */
function hpDiscOf(colours) {
  var d = mk("span", "disc"),
    cols = (colours || []).map(hpColourCss);
  d.style.background = !cols.length ? "#f9d27a" : cols.length === 1 ? cols[0] : "conic-gradient(" + cols.concat(cols[0]).join(",") + ")";
  return d;
}

function hpKindIcon(kind) {
  return { time: "clock", cycle: "swap", scene: "palette", brighten: "bright", dim: "bright", off: "power", homeoff: "power", nothing: "minus" }[kind] || "palette";
}

function hpKindTitle(kind) {
  return _T({ time: "hm_time_based_light", cycle: "hm_scene_cycle", scene: "hm_single_scene", brighten: "hm_brighten", dim: "hm_dim", off: "hm_lights_off", homeoff: "hm_entire_home_off", nothing: "hm_do_nothing" }[kind]);
}

/* The app has no arrow on a row that shows its value. */
function hpNoChev(row) {
  row.classList.add("nochev");
  return row;
}

/* A row whose end is a round picture, as the app's rows are. */
function hpDiscRow(o) {
  var row = hmRow({ title: o.title, sub: o.sub, val: o.val, tap: o.tap });
  var end = mk("span", "rend");
  if (o.disc) end.appendChild(o.disc);
  else if (o.icon) {
    end.classList.add("ico");
    end.innerHTML = svg(o.icon);
  }
  row.appendChild(end);
  row.classList.add("nochev");
  return row;
}

/* ---- Switch settings ---- */

function hpSwitchPage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", id));
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var x = (r.accessories || []).filter(function (y) {
      return y.id === id;
    })[0];
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var room = hpRoomOfDevice(r, id),
      buttons = x.buttons || [],
      selected = HPSW.sel[id] || (buttons[0] && buttons[0].number),
      head = mk("div", "swhead", "<span class='ic'></span><div class='nm'></div>");
    head.querySelector(".ic").innerHTML = svg("switch");
    head.querySelector(".nm").textContent = x.name;
    box.appendChild(head);
    box.appendChild(hmGroup([hmRow({ title: _T("app_room"), val: room ? room.name : _T("hm_the_whole_home") })]));
    var tiles = mk("div", "btiles");
    buttons.forEach(function (btn) {
      var look = hpButtonLook(x, btn),
        t = mk("div", "btile" + (btn.number === selected ? " sel" : ""), "<span class='ic'></span><b></b>");
      t.querySelector(".ic").innerHTML = svg(look.icon);
      t.querySelector("b").textContent = look.name;
      hpActive(t, function () {
        HPSW.sel[id] = btn.number;
        showPopup("hue-switch:" + id, false);
      });
      tiles.appendChild(t);
    });
    box.appendChild(tiles);
    var btn = buttons.filter(function (y) {
      return y.number === selected;
    })[0];
    if (!btn) return;
    box.appendChild(
      hpDiscRow({
        title: _T("app_button_controls"),
        val: _T("lights"),
        icon: "lights",
      })
    );
    var t = hmBtnTargets(r, x, btn);
    box.appendChild(hmLabel(_T("app_selected_lights")));
    var sel = mk("div", "selroom", "<span class='ic'></span><div><b></b><i></i></div>");
    sel.querySelector(".ic").innerHTML = svg(room && room.type === "zone" ? "target" : "home");
    sel.querySelector("b").textContent = t.name || (room ? room.name : _T("hm_the_whole_home"));
    sel.querySelector("i").textContent = _T("app_entire_room");
    box.appendChild(sel);
    box.appendChild(hmLabel(_T("hm_behavior")));
    box.appendChild(
      hmGroup(
        HM_PRESSES.map(function (p) {
          var spec = function () {
            return hmPressSpec(x, btn, p[0]);
          };
          var scenes = hmPressScenes(spec()).map(function (sid) {
            return (r.scenes || []).filter(function (s) {
              return s.id === sid;
            })[0];
          });
          return hpDiscRow({
            title: _T(p[1]),
            val: function () {
              var kind = hmPressKind(spec());
              return kind === "scene" || kind === "cycle" || kind === "time" ? hmPressSummary(r, spec()).replace(/^[^·]*· ?/, "") : hpKindTitle(kind);
            },
            disc: scenes[0] ? hpDiscOf(scenes[0].colours) : null,
            icon: scenes[0] ? null : hpKindIcon(hmPressKind(spec())),
            tap: "app-press:" + x.id + "|" + btn.number + "|" + p[0],
          });
        })
      )
    );
    box.appendChild(hmLabel(_T("hm_advanced")));
    box.appendChild(
      hmGroup([
        hpNoChev(
          hmRow({
            title: _T("hm_smart_on_off"),
            val: function () {
              return hmPressWithOff(hmPressSpec(x, btn, "short")) ? _T("app_enabled") : _T("app_disabled");
            },
            tap: "app-smart:" + x.id + "|" + btn.number + "|short",
          })
        ),
      ])
    );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          hmRemoveDevice(x.id, null);
        }),
      ])
    );
  });
}

/* ---- the Press page: the kind, and what it acts on ---- */

function hpPressPage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var spec = function () {
        return hmPressSpec(f.acc, f.btn, k.press);
      },
      kind = function () {
        return hmPressKind(spec());
      },
      room = hpRoomOfDevice(r, f.acc.id);
    box.appendChild(
      hmGroup([
        hpDiscRow({
          title: _T(HM_PRESSES.filter(function (p) { return p[0] === k.press; })[0][1]),
          val: function () {
            return hpKindTitle(kind());
          },
          icon: hpKindIcon(kind()),
          tap: "hue-press:" + id,
        }),
      ])
    );
    var k0 = kind();
    if (k0 === "scene" || k0 === "cycle" || k0 === "time") {
      box.appendChild(hmLabel(_T("hm_behavior")));
      var names = hmPressScenes(spec()).map(function (sid) {
          return (r.scenes || []).filter(function (s) {
            return s.id === sid;
          })[0];
        }),
        target = k0 === "scene" ? "hue-scene:" : k0 === "cycle" ? "hue-cycle:" : "hue-time:";
      box.appendChild(
        hmGroup([
          hpDiscRow({
            title: room ? room.name : _T("hm_the_whole_home"),
            val: k0 === "scene" ? (names[0] ? names[0].name : _T("hm_unknown_scene")) : hmPressSummary(r, spec()).replace(/^[^·]*· ?/, ""),
            disc: names[0] ? hpDiscOf(names[0].colours) : null,
            icon: names[0] ? null : "palette",
            tap: target + id,
          }),
        ])
      );
      box.appendChild(hmLabel(_T("hm_advanced")));
      box.appendChild(
        hmGroup([
          hpNoChev(
            hmRow({
              title: _T("hm_smart_on_off"),
              val: function () {
                return hmPressWithOff(spec()) ? _T("app_enabled") : _T("app_disabled");
              },
              tap: "app-smart:" + id,
            })
          ),
        ])
      );
    }
  });
}

/* ---- the kind of press ---- */

function hpPressKindPage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var kind = hmPressKind(f.spec),
      look = hpButtonLook(f.acc, f.btn),
      intro = mk("div", "pintro");
    intro.appendChild(document.createTextNode(_T("app_set_what_happens")));
    intro.appendChild(mk("b")).textContent = (k.press === "long" ? _T("hm_long_press") : _T("hm_press")).toLowerCase();
    intro.appendChild(document.createTextNode(" " + _T("app_the_button") + " "));
    intro.appendChild(mk("b")).textContent = look.name.toLowerCase();
    box.appendChild(intro);
    HM_CHOICES.forEach(function (group) {
      box.appendChild(hmLabel(_T(group[0])));
      box.appendChild(
        hmGroup(
          group[1].map(function (c) {
            return hmRow({
              title: _T(c[2]),
              sub: _T(c[2] + "_sub"),
              icon: hpKindIcon(c[0]),
              check: function () {
                return kind === c[0];
              },
              tap: function () {
                if (c[0] === "scene") showPopup("hue-scene:" + id, true);
                else if (c[0] === "cycle") showPopup("hue-cycle:" + id, true);
                else if (c[0] === "time") showPopup("hue-time:" + id, true);
                else {
                  hmStagePress(k, f, { action: c[1] });
                  popBack();
                }
              },
            });
          })
        )
      );
    });
  });
}

/* ---- the scene a press recalls: the room's scenes as round tiles, and what else a press can do ---- */

function hpPressScenePage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var scenes = hmBtnScenes(r, hmBtnTargets(r, f.acc, f.btn)),
      current = hmPressScenes(f.spec)[0];
    box.appendChild(hmLabel(_T("app_my_scenes")));
    var grid = mk("div", "pgrid");
    scenes.forEach(function (s) {
      var t = mk("div", "sitem" + (current === s.id ? " on" : ""), "<span class='dc'></span><b></b>");
      t.querySelector(".dc").appendChild(hpDiscOf(s.colours));
      t.querySelector("b").textContent = s.name;
      hpActive(t, function () {
        hmStagePress(k, f, { action: "scene", scene: s.id, with_off: hmPressWithOff(f.spec) });
        popBack();
        popBack();
      });
      grid.appendChild(t);
    });
    box.appendChild(grid);
    box.appendChild(hmLabel(_T("app_suggestions")));
    var sug = mk("div", "pgrid");
    [
      ["off", "all_off", "hm_lights_off", "power"],
      ["nothing", "do_nothing", "hm_do_nothing", "minus"],
    ].forEach(function (c) {
      var t = mk("div", "sitem", "<span class='dc'></span><b></b>");
      t.querySelector(".dc").innerHTML = "<span class='disc dark'>" + svg(c[3]) + "</span>";
      t.querySelector("b").textContent = _T(c[2]);
      hpActive(t, function () {
        hmStagePress(k, f, { action: c[1] });
        popBack();
        popBack();
      });
      sug.appendChild(t);
    });
    box.appendChild(sug);
  });
}

/* ---- Smart on/off ---- */

function hpSmartPage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var spec = function () {
      return hmPressSpec(f.acc, f.btn, k.press);
    };
    var text = mk("div", "pintro");
    text.textContent = _T("app_smart_text");
    box.appendChild(text);
    function choose(on) {
      var s = spec(),
        kind = hmPressKind(s),
        ids = hmPressScenes(s),
        seconds = ((s.scene_cycle_extended || s.time_based_extended || {}).repeat_timeout || {}).seconds || 3;
      if (kind !== "scene" && kind !== "cycle" && kind !== "time") return;
      hmStagePress(
        k,
        f,
        kind === "scene"
          ? { action: "scene", scene: ids[0], with_off: on }
          : kind === "cycle"
            ? { action: "scene_cycle", scenes: ids, with_off: on, repeat_timeout: seconds }
            : { action: "time_based", slots: hmTimeSlots(s), with_off: on, repeat_timeout: seconds }
      );
      refresh();
    }
    box.appendChild(
      hmGroup(
        [
          [false, "app_disabled"],
          [true, "app_enabled"],
        ].map(function (c) {
          return hmRow({
            title: _T(c[1]),
            check: function () {
              return hmPressWithOff(spec()) === c[0];
            },
            tap: function () {
              choose(c[0]);
            },
          });
        })
      )
    );
  });
}

HP_PAGES["hue-switch"] = ["app_switch_settings", "switch", hpSwitchPage];
HP_PAGES["hue-press"] = ["hm_press", "switch", hpPressKindPage];
HP_PAGES["hue-scene"] = ["app_my_scenes", "palette", hpPressScenePage];
HP_PAGES["app-press"] = ["hm_press", "switch", hpPressPage];
HP_PAGES["app-smart"] = ["hm_smart_on_off", "switch", hpSmartPage];
