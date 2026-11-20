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
      head = mk("div", "swhead named", "<span class='ic'></span><div class='nm'></div>");
    head.querySelector(".ic").innerHTML = svg("switch");
    head.querySelector(".nm").textContent = x.name;
    if (hueplus.has(H(), "set_name"))
      head.appendChild(
        hpRound("edit", _T("app_edit_name_and_type"), function () {
          delete HPRENAME[id];
          showPopup("app-rename:" + id, true);
        })
      );
    box.appendChild(head);
    /* The room the switch is in: the row opens the room, where its devices are chosen (a switch moves by being added to another room). */
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("app_room"),
          val: room ? room.name : _T("hm_the_whole_home"),
          tap: room
            ? function () {
                hrwStart(room.type === "zone" ? "zone" : "room", room);
              }
            : null,
        }),
      ])
    );
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
        tap: "app-btnctl:" + x.id + "|" + btn.number,
      })
    );
    var t = hmBtnTargets(r, x, btn);
    /* "Selected lights" is a row with its pencil, and the room or zone as a tile under it. */
    var lights = mk("div", "lbrow"),
      selectable = hueplus.has(H(), "set_button_lights"),
      open = function () {
        showPopup("app-btnlights:" + x.id + "|" + btn.number, true);
      };
    var lt = mk("div", "lbtitle");
    lt.textContent = _T("app_selected_lights");
    lights.appendChild(lt);
    if (selectable) lights.appendChild(hpRound("edit", _T("app_selected_lights"), open));
    box.appendChild(lights);
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
              return kind === "scene" ? _T("app_press_all_lights") : kind === "cycle" || kind === "time" ? hmPressSummary(r, spec()).replace(/^[^·]*· ?/, "") : hpKindTitle(kind);
            },
            disc: scenes[0] ? hpDiscOf(scenes[0].colours) : null,
            icon: scenes[0] ? null : hpKindIcon(hmPressKind(spec())),
            tap: p[0] === "long" && hmHoldRepeats(x, btn) ? null : "app-press:" + x.id + "|" + btn.number + "|" + p[0],
          });
        })
      )
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
    /* A press that is a cycle is the cycle's list itself, as in the app. */
    if (kind() === "cycle") {
      hpCycleDraw(box, r, id, k, f, 1);
      return;
    }
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
        target = k0 === "scene" ? "hue-pick-scene:" : k0 === "cycle" ? "hue-cycle:" : "hue-time:";
      box.appendChild(
        hmGroup([
          hpDiscRow({
            title: room ? room.name : _T("hm_the_whole_home"),
            val: k0 === "scene" ? _T("app_press_all_lights") : hmPressSummary(r, spec()).replace(/^[^·]*· ?/, ""),
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
            var row = hmRow({
              title: _T(c[2]),
              sub: _T(c[2] + "_sub"),
              icon: hpKindIcon(c[0]),
              check: function () {
                return kind === c[0];
              },
              tap: function () {
                if (c[0] === "scene") showPopup("hue-pick-scene:" + id, true);
                else if (c[0] === "cycle") showPopup("hue-cycle:" + id, true);
                else if (c[0] === "time") showPopup("hue-time:" + id, true);
                else {
                  hmStagePress(k, f, { action: c[1] });
                  popBack();
                }
              },
            });
            row.classList.add("discic");
            return row;
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
    var targets = hmBtnTargets(r, f.acc, f.btn),
      scenes = hmBtnScenes(r, targets),
      current = hmPressScenes(f.spec)[0],
      preview = HPSW.preview === true,
      done = function () {
        popBack();
        popBack();
      };
    /* The room's name is the title of the page, as in the app. */
    var ttl = b.parentNode && b.parentNode.querySelector(".pbar .ttl");
    if (ttl) ttl.textContent = targets.name || _T("hm_the_whole_home");
    /* My scenes: the label with the blue plus that makes a new scene, then the scenes in two rows; the one chosen has its pencil beside it. */
    var bar = mk("div", "lbrow");
    bar.appendChild(hmLabel(_T("app_my_scenes")));
    if (hueplus.has(H(), "create_scene")) {
      var plus = hpRound("plus", _T("hn_add_a_scene"), function () {
        hueStartMaker("home");
      });
      plus.classList.add("blue");
      bar.appendChild(plus);
    }
    box.appendChild(bar);
    var grid = mk("div", "pgrid scrows"),
      rowsOf = [mk("div", "scr"), mk("div", "scr")];
    grid.appendChild(rowsOf[0]);
    grid.appendChild(rowsOf[1]);
    function entityOf(sceneId) {
      return Object.keys(H().entities).filter(function (e) {
        return H().entities[e].unique_id === sceneId;
      })[0];
    }
    scenes.forEach(function (sc, at) {
      var t = mk("div", "sitem" + (current === sc.id ? " on" : ""), "<span class='dc'></span><b></b>"),
        lane = rowsOf[at % 2];
      t.querySelector(".dc").appendChild(hpDiscOf(sc.colours));
      t.querySelector("b").textContent = sc.name;
      hpActive(t, function () {
        hmStagePress(k, f, { action: "scene", scene: sc.id, with_off: hmPressWithOff(f.spec) });
        var ent = entityOf(sc.id);
        if (preview && ent) call("scene", "turn_on", { entity_id: ent });
        done();
      });
      lane.appendChild(t);
      if (current === sc.id && entityOf(sc.id)) {
        var pen = hpRound("edit", _T("hn_rename"), function () {
          showPopup("app-scene:" + entityOf(sc.id) + "~", true);
        });
        pen.classList.add("scpen");
        lane.appendChild(pen);
      }
    });
    box.appendChild(grid);
    box.appendChild(hmLabel(_T("app_suggestions")));
    var sug = mk("div", "pgrid");
    var bright = scenes.filter(function (sc) {
      return /^bright$/i.test(sc.name);
    })[0];
    [
      bright ? ["bright", { action: "scene", scene: bright.id, with_off: hmPressWithOff(f.spec) }, "app_bright", "bright"] : null,
      ["off", { action: "all_off" }, "app_off", "target"],
      ["nothing", { action: "do_nothing" }, "hm_do_nothing", "minus"],
    ]
      .filter(Boolean)
      .forEach(function (c) {
        var t = mk("div", "sitem", "<span class='dc'></span><b></b>");
        t.querySelector(".dc").innerHTML = "<span class='disc dark'>" + svg(c[3]) + "</span>";
        t.querySelector("b").textContent = _T(c[2]);
        hpActive(t, function () {
          hmStagePress(k, f, c[1]);
          done();
        });
        sug.appendChild(t);
      });
    box.appendChild(sug);
    /* Show preview: with it on, a scene that is chosen plays in the room at once. */
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("app_show_preview"),
          sub: _T("app_show_preview_sub"),
          toggle: {
            get: function () {
              return HPSW.preview === true;
            },
            set: function () {
              HPSW.preview = !HPSW.preview;
              preview = HPSW.preview;
              refresh();
            },
          },
        }),
      ])
    );
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
    /* The text of the page, with the two parts the app writes in bold. */
    function paragraph(parts) {
      var p = mk("div", "pintro smart");
      parts.forEach(function (part, i) {
        var node = i % 2 ? mk("b") : document.createTextNode("");
        node.textContent = part;
        p.appendChild(node);
      });
      return p;
    }
    box.appendChild(paragraph([_T("app_smart_1"), _T("app_smart_on_and_off"), _T("app_smart_2"), _T("app_smart_only_on"), "."]));
    box.appendChild(paragraph([_T("app_smart_3")]));
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
HP_PAGES["hue-pick-scene"] = ["app_my_scenes", "palette", hpPressScenePage];
HP_PAGES["app-press"] = ["hm_press", "switch", hpPressPage];
HP_PAGES["app-smart"] = ["hm_smart_on_off", "switch", hpSmartPage];

/* What a button controls: the question with the button's name, and the kinds the app offers. A button of this bridge's switches controls lights; the Hue app's "Automations" (start or stop an automation) is not offered here yet. */
function hpButtonControlsPage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories"], function (box, r) {
    var k = hmBtnKey(id),
      acc = (r.accessories || []).filter(function (x) {
        return x.id === k.acc;
      })[0],
      btn = acc && (acc.buttons || []).filter(function (y) {
        return y.number === k.n;
      })[0];
    if (!btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var ask = mk("div", "pintro bigask"),
      name = mk("b");
    name.textContent = hpButtonLook(acc, btn).name.toLowerCase();
    ask.appendChild(document.createTextNode(_T("app_control_with_pre")));
    ask.appendChild(name);
    ask.appendChild(document.createTextNode(_T("app_control_with_post")));
    box.appendChild(ask);
    box.appendChild(hmLabel(_T("app_button_controls")));
    var row = hmRow({ icon: "lights", title: _T("lights"), sub: _T("app_lights_sub"), check: function () { return true; } });
    row.classList.add("discic");
    box.appendChild(hmGroup([row]));
  });
}

HP_PAGES["app-btnctl"] = ["app_button_controls", "lights", hpButtonControlsPage];
