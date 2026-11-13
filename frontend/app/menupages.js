/* The pages of the app's Settings, as the app draws them: the Settings list, Devices (and where devices are added), Lights, Software update with its time of day, Smart home and the apps that can be linked,
 Entertainment areas with their edit page, light placement and brightness balancer. They are the Hue Plus menu's pages (what is read and written is the same); only the page is the app's. */

HOST_ICONS.headphones = "<path d='M4 15v-3a8 8 0 0 1 16 0v3'/><rect x='3' y='14' width='4.5' height='7' rx='1.6'/><rect x='16.5' y='14' width='4.5' height='7' rx='1.6'/>";

/* A round blue button in the top bar of a page (the app's plus on a list). */
function hpBarPlus(b, label, fn) {
  var root = b.parentNode,
    bar = root && root.querySelector(".lbar");
  if (!bar) return;
  root.classList.add("plusbar");
  var plus = hpRound("plus", label, fn);
  plus.classList.add("blue");
  bar.appendChild(plus);
}

function hpCount(n) {
  return n === undefined || n === null ? "" : String(n);
}

/* ---- the Settings list ---- */

function hpSettingsTab(box) {
  var head = mk("div", "hd", "<h1></h1>");
  head.querySelector("h1").textContent = _T("app_settings");
  box.appendChild(head);
  var inner = mk("div");
  box.appendChild(inner);
  hmBox(inner);
  hmLoad(inner, HM_KINDS, function (list) {
    list.appendChild(hmLabel(_T("hm_in_this_home")));
    list.appendChild(
      hmGroup([
        hmRow({ icon: "lights", title: _T("hm_devices"), tap: "hue-devices" }),
        hmRow({ icon: "plug", title: _T("hm_bridges"), tap: "app-bridges" }),
        hmRow({ icon: "motion", title: _T("hm_motionaware_areas"), tap: "hue-motion" }),
        hmRow({ icon: "target", title: _T("entertainment_areas"), tap: "hue-ent" }),
        hmRow({ icon: "scene", title: _T("hm_smart_home"), tap: "hue-matter" }),
        hmRow({ icon: "restart", title: _T("hm_software_update"), tap: "hue-updates" }),
      ])
    );
    list.appendChild(hmLabel(_T("hm_advanced")));
    list.appendChild(hmGroup([hmRow({ icon: "lock", title: _T("hm_applications"), tap: "hue-apps" })]));
  });
}

/* ---- Devices and adding devices ---- */

function hpDevicesPage(b) {
  hmBox(b);
  hmEnsure();
  var E = hpBridgeEnts();
  hpBarPlus(b, _T("app_add_devices"), function () {
    showPopup("app-adddev", true);
  });
  b.appendChild(
    hmGroup([
      hmRow({
        icon: "lamp",
        title: _T("hm_lights_and_smart_plugs"),
        val: function () {
          return hpCount(hueplus.lights(H()).length);
        },
        tap: "hue-lights",
      }),
      hmRow({
        icon: "switch",
        title: _T("hm_switches"),
        val: function () {
          return HM.accessories ? hpCount(hmList("accessories").length) : "";
        },
        tap: "hue-switches",
      }),
    ])
  );
  if (E.search) b.dataset.search = "1";
}

/* Where do you want to add devices: the rooms of the bridge, and a new room. */
function hpAddDevicesWhere(b) {
  hmBox(b);
  hmLoad(b, ["rooms"], function (box, r) {
    box.appendChild(hmTitle("", _T("app_where_add_devices")));
    box.appendChild(hmLabel((HM.bridge && HM.bridge.name) || _T("hue_bridge")));
    var rows = (r.rooms || []).map(function (room) {
      return hmRow({ icon: "bed", title: room.name, tap: "app-adddev2:" + encodeURIComponent(room.name) });
    });
    rows.push(hmRow({ icon: "plus", title: _T("app_create_new_room"), tap: "hue-group" }));
    box.appendChild(hmGroup(rows));
  });
}

/* Add devices to a room: the bridge searches for new lights and switches, which then appear in its rooms. */
function hpAddDevicesTo(b, id) {
  hmBox(b);
  var name = decodeURIComponent(id || ""),
    E = hpBridgeEnts();
  b.appendChild(hmTitle("", _T("app_add_devices_to") + " " + name, _T("app_add_devices_text")));
  b.appendChild(
    hmActions([
      E.search
        ? hmButton(_T("search_for_new_devices"), "primary", function () {
            call("button", "press", { entity_id: E.search });
            toast(_T("app_searching"));
          })
        : null,
    ])
  );
}

/* Lights and smart plugs: each one a row, a tap opens its settings. */
function hpLightsListPage(b) {
  hmBox(b);
  var list = hueplus.lights(H());
  if (!list.length) b.appendChild(hmCallout(_T("nothing_found")));
  b.appendChild(
    hmGroup(
      list.map(function (id) {
        return hmRow({
          icon: "lamp",
          title: hpName(id),
          val: function () {
            return V_(id) === "unavailable" ? _T("hm_unreachable") : "";
          },
          tap: "hue-light:" + id,
        });
      })
    )
  );
}

/* ---- Software update ---- */

/* A wheel of values to scroll to one: the centre row is the choice. */
function hpWheel(values, current, pick) {
  var wheel = mk("div", "wheel"),
    ROW = 36,
    timer = null;
  wheel.appendChild(mk("div", "pad"));
  values.forEach(function (v) {
    wheel.appendChild(mk("div", "wv")).textContent = String(v).length < 2 ? "0" + v : String(v);
  });
  wheel.appendChild(mk("div", "pad"));
  var at = Math.max(0, values.indexOf(current));
  requestAnimationFrame(function () {
    wheel.scrollTop = at * ROW;
  });
  wheel.addEventListener("scroll", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var i = Math.max(0, Math.min(values.length - 1, Math.round(wheel.scrollTop / ROW)));
      pick(values[i]);
    }, 140);
  });
  return wheel;
}

function hpUpdateTime(E) {
  var raw = String(V_(E.auto_update_time) || "00:00").split(":"),
    h = parseInt(raw[0], 10) || 0,
    m = parseInt(raw[1], 10) || 0,
    box = mk("div", "wheels"),
    hours = [],
    mins = [];
  for (var i = 0; i < 24; i++) hours.push(i);
  for (var j = 0; j < 60; j++) mins.push(j);
  var send = function () {
    call("time", "set_value", { entity_id: E.auto_update_time, time: (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":00" });
  };
  box.appendChild(mk("div", "band"));
  box.appendChild(
    hpWheel(hours, h, function (v) {
      if (v === h) return;
      h = v;
      send();
    })
  );
  box.appendChild(
    hpWheel(mins, m, function (v) {
      if (v === m) return;
      m = v;
      send();
    })
  );
  return box;
}

function hpUpdatesPage(b) {
  hmBox(b);
  var E = hpBridgeEnts(),
    list = hueplus.updates(H());
  var status = hmRow({
    title: function () {
      var n = hmUpdatesDue();
      return n ? cntS(n, _T("update_available_2"), _T("updates_available")) : _T("hm_everything_is_up_to_date");
    },
    good: function () {
      return !hmUpdatesDue();
    },
    check: function () {
      return !hmUpdatesDue();
    },
  });
  b.appendChild(hmGroup([status]));
  if (E.auto_update) {
    var auto = [
      hmRow({
        title: _T("automatic_updates"),
        toggle: {
          get: function () {
            return isOn(E.auto_update);
          },
          set: function () {
            toggleEnt(E.auto_update);
          },
        },
      }),
    ];
    var g = hmGroup(auto);
    if (E.auto_update_time) g.appendChild(hpUpdateTime(E));
    b.appendChild(g);
    if (E.auto_update_time) b.appendChild(mk("div", "pintro small")).textContent = _T("hm_updates_are_installed_at_this_time");
  }
  b.appendChild(hmLabel(_T("hm_devices")));
  if (!list.length) b.appendChild(hmCallout(_T("nothing_found")));
  b.appendChild(
    hmGroup(
      list.map(function (id) {
        return hmRow({
          title: hpName(id).replace(/ (bridge )?firmware$/i, ""),
          sub: function () {
            return A(id).installed_version || "";
          },
          val: function () {
            return V_(id) === "on" ? hmUpdateText(id) : "";
          },
          tap: function () {
            if (V_(id) !== "on") return;
            confirmDlg(_T("install_this_update"), function () {
              call("update", "install", { entity_id: id });
            });
          },
        });
      })
    )
  );
  if (E.check_update)
    b.appendChild(
      hmActions([
        hmButton(_T("check_for_an_update"), "ghost", function () {
          call("button", "press", { entity_id: E.check_update });
        }),
      ])
    );
}

/* ---- Smart home ---- */

var HP_LINK_APPS = ["Apple Home", "Amazon Alexa", "Google Home", "Smart Things", "Sonos Voice Control"];

function hpSmartHomePage(b) {
  hmBox(b);
  var E = hpBridgeEnts(),
    f = (E.matter_fabrics && A(E.matter_fabrics).fabrics) || [];
  hpBarPlus(b, _T("app_link_an_app"), function () {
    showPopup("app-link", true);
  });
  b.appendChild(hmLabel(_T("hm_linked_to_hue")));
  if (!f.length) b.appendChild(hmCallout(_T("nothing_connected")));
  else
    b.appendChild(
      hmGroup(
        f.map(function (x) {
          return hmRow({
            icon: "home",
            title: x.label || x.vendor || _T("app_matter_controller"),
            sub: [x.vendor, x.status].filter(Boolean).join(" · "),
            tap: function () {
              confirmDlg(_T("disconnect_this_matter_app_from_the_bridge"), function () {
                call("hue_plus", "remove_matter_fabric", { fabric: x.id, confirm: true });
                popBack();
              });
            },
          });
        })
      )
    );
}

function hpLinkPage(b) {
  hmBox(b);
  b.appendChild(hmTitle("", _T("app_what_to_link")));
  var grid = mk("div", "pgrid");
  HP_LINK_APPS.concat([_T("app_other_apps")]).forEach(function (name) {
    var t = mk("div", "ptile", "<span class='ic'></span><b></b>");
    t.querySelector(".ic").textContent = name.charAt(0);
    t.querySelector("b").textContent = name;
    hpActive(t, function () {
      showPopup("app-link2", true);
    });
    grid.appendChild(t);
  });
  b.appendChild(grid);
}

function hpLinkAnother(b) {
  hmBox(b);
  b.appendChild(hmTitle("", _T("app_link_another_app"), _T("hm_matter_pairing_code_note")));
}

/* ---- Entertainment areas ---- */

function hpAreasPage(b) {
  hmBox(b);
  hpBarPlus(b, _T("app_new_area"), function () {
    showPopup("app-newarea", true);
  });
  hmLoad(b, ["entertainment_areas"], function (box, r) {
    var list = r.entertainment_areas || [];
    if (!list.length) box.appendChild(hmCallout(_T("nothing_found")));
    else
      box.appendChild(
        hmGroup(
          list.map(function (x) {
            return hmRow({ icon: "headphones", title: x.name, tap: "hue-area:" + x.id });
          })
        )
      );
  });
}

var HP_AREA_TYPES = ["screen", "monitor", "music", "3dspace", "other"];

/* A new area: its name, what it is for, and the lights in it. The lights start in a row; Light placement on the area's page puts them where they are. */
function hpNewAreaPage(b) {
  hmBox(b);
  var picked = {},
    type = "other",
    name = mk("input", "sq pin");
  name.type = "text";
  name.maxLength = 32;
  name.placeholder = _T("app_name");
  b.appendChild(hmTitle("", _T("app_new_area")));
  var field = mk("div", "pfield");
  field.appendChild(name);
  b.appendChild(field);
  b.appendChild(hmLabel(_T("app_area_type")));
  b.appendChild(
    hmGroup(
      HP_AREA_TYPES.map(function (t) {
        return hmRow({
          title: _T("app_area_" + t),
          check: function () {
            return type === t;
          },
          tap: function () {
            type = t;
            refresh();
          },
        });
      })
    )
  );
  b.appendChild(hmLabel(_T("hm_lights_label")));
  var lights = hueplus.lights(H()).filter(hpHueId);
  b.appendChild(
    hmGroup(
      lights.map(function (e) {
        return hmRow({
          icon: "lamp",
          title: hpName(e),
          check: function () {
            return !!picked[e];
          },
          tap: function () {
            picked[e] = !picked[e];
            refresh();
          },
        });
      })
    )
  );
  b.appendChild(
    hmActions([
      hmButton(_T("app_create"), "primary", function () {
        var chosen = lights.filter(function (e) {
          return picked[e];
        });
        if (!name.value.trim()) {
          toast(_T("give_the_area_a_name"));
          return;
        }
        if (!chosen.length) {
          toast(_T("add_at_least_one_light"));
          return;
        }
        var step = chosen.length > 1 ? 1.6 / (chosen.length - 1) : 0;
        hpCall("hue_plus", "create_entertainment_area", {
          name: name.value.trim(),
          area_type: type,
          lights: chosen.map(function (e, i) {
            return { light: hpHueId(e), x: chosen.length > 1 ? -0.8 + i * step : 0, y: 0, z: 0 };
          }),
        }).then(
          function () {
            toast(_T("hm_saved_to_the_bridge"));
            HM_READY = false;
            popBack();
            hmEnsure();
          },
          function () {
            toast(_T("hm_the_bridge_did_not_accept_this"));
          }
        );
      }),
    ])
  );
}

/* What the area has for its lights: the draft when something was changed, else the bridge's. */
function hpAreaKey(id) {
  return hmdKey("area", id);
}

function hpAreaBase(x) {
  return (x.lights || []).map(function (l) {
    var o = { light: l.light_id, name: l.name || String(l.light_id), x: l.x || 0, y: l.y || 0, z: l.z || 0, balance: typeof l.balance === "number" ? l.balance : 1 };
    /* every position the bridge holds (the ends of a strip or tube) */
    if (Array.isArray(l.positions) && l.positions.length > 1) o.positions = l.positions;
    return o;
  });
}

function hpAreaLights(x) {
  return hmdValue(hpAreaKey(x.id), "lights", hpAreaBase(x));
}

function hpAreaName(x) {
  return hmdValue(hpAreaKey(x.id), "name", x.name);
}

function hpStageLights(x, lights) {
  hmdStage(hpAreaKey(x.id), "lights", lights, hpAreaBase(x));
}

/* The area's changes (its lights, their places, its name) go to the bridge with the rest of the area's draft. */
var hpSaveAreaRest = hmSaveArea;
hmSaveArea = function (id, ch) {
  var job = Promise.resolve();
  if (ch.lights || ch.name) {
    var data = { area: id };
    if (ch.name) data.name = ch.name;
    if (ch.lights)
      data.lights = ch.lights.map(function (l) {
        var item = { light: l.light, x: l.x, y: l.y, z: l.z, balance: l.balance };
        if (l.positions) item.positions = l.positions;
        return item;
      });
    job = hpCall("hue_plus", "update_entertainment_area", data);
  }
  var rest = Object.assign({}, ch);
  delete rest.lights;
  delete rest.name;
  return job.then(function () {
    return hpSaveAreaRest(id, rest);
  });
};

/* The edit page of an area, as the app draws it: its icon and name, its lights (each can be taken out, a blue plus adds one), then placement, brightness balance, what happens when the sync stops, performance and Delete. */
function hpAreaPage(b, id) {
  hmBox(b);
  hmGuard(hpAreaKey(id));
  hmLoad(b, ["entertainment_areas", "scenes"], function (box, r, again) {
    var x = hmEntArea(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var head = mk("div", "swhead named", "<span class='ic'></span><div class='nm'></div>"),
      pen = hpRound("edit", _T("app_rename"), function () {
        hpPrompt(_T("app_name"), hpAreaName(x), function (v) {
          hmdStage(hpAreaKey(id), "name", v, x.name);
          refresh();
        });
      });
    head.querySelector(".ic").innerHTML = svg("headphones");
    head.appendChild(pen);
    box.appendChild(head);
    var label = mk("div", "lbrow"),
      text = hmLabel(_T("hm_lights_label")),
      add = hpRound("plus", _T("app_add_a_light"), function () {
        showPopup("app-areaadd:" + id, true);
      });
    add.classList.add("blue");
    label.appendChild(text);
    label.appendChild(add);
    box.appendChild(label);
    var tiles = mk("div", "ltiles areal");
    box.appendChild(tiles);
    function draw() {
      head.querySelector(".nm").textContent = hpAreaName(x);
      tiles.innerHTML = "";
      hpAreaLights(x).forEach(function (l) {
        var t = mk("div", "ptile sm", "<span class='ic'></span><b></b>"),
          minus = mk("button", "minus", svg("minus"));
        minus.type = "button";
        minus.setAttribute("aria-label", _T("app_remove"));
        t.querySelector(".ic").innerHTML = svg("lamp");
        t.querySelector("b").textContent = l.name;
        minus.addEventListener("click", function () {
          var rest = hpAreaLights(x).filter(function (o) {
            return o.light !== l.light;
          });
          if (!rest.length) {
            toast(_T("add_at_least_one_light"));
            return;
          }
          hpStageLights(x, rest);
          draw();
        });
        t.appendChild(minus);
        tiles.appendChild(t);
      });
    }
    draw();
    reg(draw);
    box.appendChild(
      hmGroup([
        hmRow({ title: _T("hm_light_placement"), tap: "app-place:" + id, val: "" }),
        hmRow({
          title: _T("app_balancer"),
          val: function () {
            return hpAreaLights(x).every(function (l) {
              return l.balance === 1;
            })
              ? _T("app_default")
              : _T("app_custom");
          },
          tap: "app-balance:" + id,
        }),
        hmRow({
          title: _T("hm_when_sync_stops"),
          val: function () {
            return _T("end_" + hmAreaEnd(x).end_state);
          },
          tap: "hue-end:" + id,
        }),
        hmRow({
          title: _T("hm_performance"),
          val: function () {
            return hmAreaPerf(x).mode === "manual" ? _T("hm_manual") : _T("hm_auto");
          },
          tap: "hue-perf:" + id,
        }),
      ])
    );
    box.appendChild(
      hmActions([
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T("hm_delete_this_entertainment_area"), function () {
            hmdDiscard(hpAreaKey(id));
            call("hue_plus", "delete_entertainment_area", { area: id, confirm: true });
            HM_READY = false;
            closePopup();
            hmEnsure();
          });
        }),
      ])
    );
  });
}

/* The lights that can still be added to an area. */
function hpAreaAddPage(b, id) {
  hmBox(b);
  hmGuard(hpAreaKey(id), true);
  hmLoad(b, ["entertainment_areas"], function (box) {
    var x = hmEntArea(id),
      have = hpAreaLights(x).map(function (l) {
        return l.light;
      }),
      free = hueplus.lights(H()).filter(function (e) {
        return hpHueId(e) && have.indexOf(hpHueId(e)) < 0;
      });
    if (!free.length) box.appendChild(hmCallout(_T("nothing_found")));
    box.appendChild(
      hmGroup(
        free.map(function (e) {
          return hmRow({
            icon: "lamp",
            title: hpName(e),
            tap: function () {
              hpStageLights(x, hpAreaLights(x).concat([{ light: hpHueId(e), name: hpName(e), x: 0, y: 0, z: 0, balance: 1 }]));
              popBack();
            },
          });
        })
      )
    );
  });
}

/* Light placement is Home Control's area editor (the room in three dimensions, the lights to drag, their tray), run in the light frame under this page's bar and drawn as the app draws it. DONE takes what it holds
 back into the area's draft; it goes to the bridge with SAVE on the area, like the rest of the area's changes. */
var HPPLACE = null;

function hpPlacePage(b, id) {
  hmBox(b);
  hmGuard(hpAreaKey(id), true);
  var wait = mk("div", "empty"),
    token = (HPPLACE = {});
  wait.textContent = _T("loading");
  b.appendChild(wait);
  hmLoad(b, ["entertainment_areas"], function (box) {
    var x = hmEntArea(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var area = {
        id: id,
        name: hpAreaName(x),
        lights: hpAreaLights(x).map(function (l) {
          return { light_id: l.light, name: l.name, x: l.x, y: l.y, z: l.z, positions: l.positions, balance: l.balance };
        }),
      },
      names = {};
    area.lights.forEach(function (l) {
      names[l.light_id] = l.name;
    });
    hpLightFrame(function (win) {
      if (HPPLACE !== token) return;
      wait.remove();
      win.HuePopup.hide();
      hpFrameShow(true);
      win.HuePopup.area(area);
      HC.onDone = function () {
        var d = JSON.parse(win.HuePopup.areaDraft() || "null");
        if (d) {
          var lights = (d.kept || []).map(function (k) {
            return { light: k.light, name: names[k.light] || String(k.light), x: k.x, y: k.y, z: k.z, balance: typeof k.balance === "number" ? k.balance : 1 };
          });
          (d.lights || []).forEach(function (l) {
            var every = hpBarPositions(l),
              first = every ? every[0] : { x: l.x, y: hpFlip(l.y), z: l.z };
            lights.push({ light: hpHueId(l.id), name: hpName(l.id), x: first.x, y: first.y, z: first.z, positions: every || undefined, balance: typeof l.balance === "number" ? l.balance : 1 });
          });
          if (lights.length) hpStageLights(x, lights);
        }
        popBack();
      };
    });
  });
}

/* Brightness balancer: how bright each light of the area is next to the others. */
function hpBalancePage(b, id) {
  hmBox(b);
  hmGuard(hpAreaKey(id), true);
  hmLoad(b, ["entertainment_areas"], function (box) {
    var x = hmEntArea(id);
    hpAreaLights(x).forEach(function (l) {
      box.appendChild(
        sliderRow({
          icon: "lamp",
          name: l.name,
          min: 0.2,
          max: 2,
          step: 0.1,
          get: function () {
            var cur = hpAreaLights(x).filter(function (o) {
              return o.light === l.light;
            })[0];
            return cur ? cur.balance : 1;
          },
          fmt: function (v) {
            return v.toFixed(1) + "×";
          },
          on: function () {
            return true;
          },
          commit: function (v) {
            hpStageLights(
              x,
              hpAreaLights(x).map(function (o) {
                return o.light === l.light ? Object.assign({}, o, { balance: Math.round(v * 10) / 10 }) : o;
              })
            );
            refresh();
          },
        })
      );
    });
  });
}

HP_PAGES["hue-devices"] = ["hm_devices", "lights", hpDevicesPage];
HP_PAGES["app-adddev"] = ["app_add_devices", "plus", hpAddDevicesWhere];
HP_PAGES["app-adddev2"] = ["app_add_devices", "plus", hpAddDevicesTo];
HP_PAGES["hue-lights"] = ["hm_lights_and_smart_plugs", "lamp", hpLightsListPage];
HP_PAGES["hue-updates"] = ["hm_software_update", "restart", hpUpdatesPage];
HP_PAGES["hue-matter"] = ["hm_smart_home", "scene", hpSmartHomePage];
HP_PAGES["app-link"] = ["hm_smart_home", "scene", hpLinkPage];
HP_PAGES["app-link2"] = ["hm_smart_home", "scene", hpLinkAnother];
HP_PAGES["hue-ent"] = ["entertainment_areas", "target", hpAreasPage];
HP_PAGES["hue-area"] = ["app_edit", "target", hpAreaPage];
HP_PAGES["app-areaadd"] = ["app_add_a_light", "plus", hpAreaAddPage];
HP_PAGES["app-place"] = ["hm_light_placement", "target", hpPlacePage];
HP_PAGES["app-balance"] = ["app_balancer", "tune", hpBalancePage];
HP_PAGES["app-newarea"] = ["app_new_area", "plus", hpNewAreaPage];
