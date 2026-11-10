/* Making and changing Hue scenes from the dashboard's scenes section, the way the Hue app does ("Add a scene"): choose the room or zone, then a custom scene (the lights set
 in the dashboard's light popup, then saved), the current settings saved as a scene, an all-day scene (scenes by time of day) or a colour palette taken from a photo. Everything is written
 to the bridge (hue_plus.create_scene, update_scene, delete_scene, create_daily_smart_scene). Dynamic scenes cannot be made here: the Hue app only has them from its cloud gallery. */

/* g: the room or zone chosen {id, name, type, lights: [the bridge's light ids]}; sel: the bridge's light ids of it (a scene sets every light of its room or zone: the bridge refuses one that leaves a light out); data: what the bridge says about its rooms, zones and scenes. */
var HUENEW = { scope: "", g: null, sel: {}, mode: "", name: "", slots: [], days: [1, 1, 1, 1, 1, 1, 1], open: {}, restrict: "", target: "", data: null };

/* ---- what the bridge has ---- */

function hueLoadData() {
  return hueplus.resources(["rooms", "zones", "scenes"]).then(function (r) {
    var groups = (r.rooms || [])
      .map(function (g) {
        return { id: g.id, name: g.name, type: "room", lights: g.lights || [] };
      })
      .concat(
        (r.zones || []).map(function (g) {
          return { id: g.id, name: g.name, type: "zone", lights: g.lights || [] };
        })
      );
    HUENEW.data = { groups: groups, scenes: r.scenes || [] };
    return HUENEW.data;
  });
}

/* The Home Assistant light that stands for one of the bridge's lights. */
function hueLightEntity(lightId) {
  var h = H();
  return (
    hueplus.lights(h).filter(function (id) {
      return A(id).hue_light_id === lightId;
    })[0] || null
  );
}

function hueLightName(lightId) {
  var e = hueLightEntity(lightId);
  return e ? A(e).friendly_name || e : lightId;
}

/* The lights that have an entity (a light of the bridge Home Assistant does not show cannot be set from here). */
function hueGroupLightIds(g) {
  return g.lights.filter(function (id) {
    return !!hueLightEntity(id);
  });
}

function hueSelectedIds() {
  return Object.keys(HUENEW.sel).filter(function (id) {
    return HUENEW.sel[id];
  });
}

/* The entities of the lights chosen, to set in the light popup. */
function hueSelectedEntities() {
  return hueSelectedIds()
    .map(hueLightEntity)
    .filter(function (e) {
      return !!e;
    });
}

/* The room or zone of the page the scene is made from, if it is one of the bridge's: by its name (the Hue Plus light of a room carries the room's name). */
function hueGroupOfPage(scope) {
  var h = H(),
    room = scope && scope !== "home" ? roomById(scope) : null,
    groups = hueGroups().filter(function (k) {
      return room && room.area && h.entities[k].area_id === room.area;
    });
  if (groups.length !== 1 && room) {
    groups = hueGroups().filter(function (k) {
      return A(k).friendly_name === room.name;
    });
  }
  return groups.length === 1 ? A(groups[0]).friendly_name : null;
}

/* The Hue Plus lights that stand for a room or zone of the bridge. */
function hueGroups() {
  var h = H();
  return Object.keys(h.states).filter(function (k) {
    var e = h.entities[k];
    return k.indexOf("light.") === 0 && e && e.platform === "hue_plus" && h.states[k].attributes.is_hue_group;
  });
}

/* The bridge's own id of a scene entity (its unique id). */
function hueSceneUid(id) {
  var e = H().entities[id];
  return e && e.unique_id;
}

function mkHint(text) {
  var d = mk("div", "notec pane dim");
  d.textContent = text;
  return d;
}

/* ---- the start: the Hue app's "Add a scene" ---- */

function hueStartMaker(scope) {
  HUENEW = { scope: scope, g: null, sel: {}, mode: "", name: "", slots: [], days: [1, 1, 1, 1, 1, 1, 1], open: {}, restrict: "", target: "", data: null };
  hueLoadData().then(
    function () {
      showPopup("hue-add-scene", true);
    },
    function () {
      toast(_T("hn_couldn_t_read_the_hue_bridge"));
    }
  );
}

function hueAddScenePage(b) {
  var grid = mk("div", "gridl g2"),
    items = [
      ["edit", "hn_custom_scene", "hn_custom_scene_sub", "custom"],
      ["check", "hn_save_current", "hn_save_current_sub", "current"],
      ["clock", "hn_all_day", "hn_all_day_sub", "allday"],
      ["cam", "hn_from_photo", "hn_from_photo_sub", "photo"],
    ];
  b.appendChild(mkHint(_T("hn_add_a_scene_hint")));
  items.forEach(function (it) {
    grid.appendChild(
      pill(it[0], _T(it[1]), {
        sub: function () {
          return _T(it[2]);
        },
        tap: function () {
          hueChooseLights(it[3]);
        },
      })
    );
  });
  b.appendChild(grid);
}

/* ---- choose your lights: rooms and zones, each with its lights ---- */

/* Opens the choice for a way of making a scene. The room of the page is chosen, with all its lights, to begin with. */
function hueChooseLights(mode) {
  HUENEW.mode = mode;
  var name = hueGroupOfPage(HUENEW.scope),
    g = name
      ? HUENEW.data.groups.filter(function (x) {
          return x.name === name;
        })[0]
      : null;
  HUENEW.sel = {};
  HUENEW.g = null;
  if (g) hueSelectGroup(g);
  showPopup("hue-lights", true);
}

function hueSelectGroup(g) {
  HUENEW.g = g;
  HUENEW.sel = {};
  g.lights.forEach(function (id) {
    HUENEW.sel[id] = true;
  });
}

function hueLightsPage(b) {
  var box = mk("div"),
    groups = HUENEW.data.groups.filter(function (g) {
      return !HUENEW.restrict || g.id === HUENEW.restrict;
    });
  b.appendChild(box);
  if (HUENEW.mode === "edit") HUENEW.open[HUENEW.restrict] = true;
  function groupRow(g) {
    var wrap = mk("div"),
      row = pill(g.type === "zone" ? "target" : "home", g.name, {
        check: function () {
          return !!HUENEW.g && HUENEW.g.id === g.id;
        },
        sub: function () {
          return cntS(g.lights.length, _T("light"), _T("lights"));
        },
        tap: function () {
          hueSelectGroup(g);
          refresh();
        },
      }),
      chev = mk("span", "chev", svg("chev"));
    chev.addEventListener("click", function (e) {
      e.stopPropagation();
      HUENEW.open[g.id] = !HUENEW.open[g.id];
      draw();
    });
    row.appendChild(chev);
    wrap.appendChild(row);
    if (HUENEW.open[g.id]) {
      /* The lights of the room or zone, for information: the scene sets all of them (any one can be set to off in the light popup). */
      var grid = mk("div", "gridl g2");
      g.lights.forEach(function (id) {
        grid.appendChild(pill("light", hueLightName(id), {}));
      });
      wrap.appendChild(grid);
    }
    return wrap;
  }
  function draw() {
    box.innerHTML = "";
    box.appendChild(mkHint(_T(HUENEW.mode === "edit" ? "hn_choose_hint_edit" : "hn_choose_hint")));
    [["zone", "hn_zones"], ["room", "hn_rooms"]].forEach(function (t) {
      var list = groups.filter(function (g) {
        return g.type === t[0];
      });
      if (!list.length) return;
      box.appendChild(sep(_T(t[1]), t[0] === "zone" ? "target" : "home"));
      list.forEach(function (g) {
        box.appendChild(groupRow(g));
      });
    });
    if (!groups.length) box.appendChild(mkHint(_T("hn_no_hue_room")));
    box.appendChild(
      pill("check", _T("hn_next"), {
        tap: function () {
          if (!HUENEW.g) {
            toast(_T("hn_choose_a_room"));
            return;
          }
          hueAfterLights();
        },
      })
    );
  }
  draw();
}

function hueAfterLights() {
  var m = HUENEW.mode;
  if (m === "allday") hueStartAllDay();
  else if (m === "photo") showPopup("hue-photo", true);
  else if (m === "edit") hueEditOpen();
  else hueAskName(m);
}

/* ---- a name ---- */

function hueAskName(mode) {
  HUENEW.mode = mode;
  showPopup("hue-scene-name", true);
}

function hueNamePage(b) {
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.placeholder = _T("hn_name_of_the_scene");
  inp.value = HUENEW.name;
  inp.addEventListener("input", function () {
    HUENEW.name = inp.value;
  });
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    pill("check", _T("hn_next"), {
      tap: function () {
        var name = (HUENEW.name || "").trim();
        if (!name) {
          toast(_T("hn_give_it_a_name"));
          inp.focus();
          return;
        }
        HUENEW.name = name;
        if (HUENEW.mode === "rename") hueRenameNow(name);
        else if (HUENEW.mode === "current") hueSaveCurrent();
        else hueOpenEditor();
      },
    })
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* A scene of the room or zone chosen: what every one of its lights shows now, which is what the light popup has set. */
function hueCreate() {
  return callRaw("hue_plus", "create_scene", { name: HUENEW.name, group: HUENEW.g.id, group_type: HUENEW.g.type });
}

/* The lights as they are now, saved. */
function hueSaveCurrent() {
  Promise.resolve(hueCreate()).then(
    function () {
      toast(_T("hn_scene_saved") + HUENEW.name);
      closeSheet();
    },
    function () {
      toast(_T("hn_couldn_t_save_the_scene"));
    }
  );
}

/* The dashboard's light popup for the lights chosen: set them, press the checkmark, and what they show is the scene. */
function hueOpenEditor() {
  var lights = hueSelectedEntities();
  if (!lights.length) {
    toast(_T("hn_no_hue_lights_here"));
    return;
  }
  var name = HUENEW.name;
  editLights({
    name: name,
    icon: "palette",
    lights: lights,
    onSave: function () {
      return Promise.resolve(hueCreate()).then(
        function () {
          toast(_T("hn_scene_saved") + name);
          return true;
        },
        function () {
          toast(_T("hn_couldn_t_save_the_scene"));
          return false;
        }
      );
    },
    after: function () {
      closeSheet();
    },
  });
}

/* ---- all-day scene: scenes by time of day ---- */

/* The still scenes of the room or zone chosen (a moving scene cannot be a time slot of a smart scene made here). */
function hueRoomScenes() {
  var h = H(),
    g = HUENEW.g;
  return Object.keys(h.states)
    .filter(function (k) {
      return k.indexOf("scene.") === 0 && h.entities[k] && ["hue", "hue_plus"].indexOf(h.entities[k].platform) >= 0 && A(k).group_name === g.name && A(k).group_type === g.type && A(k).is_dynamic === false;
    })
    .sort(function (x, y) {
      return (A(x).name || x).localeCompare(A(y).name || y);
    });
}

function hueStartAllDay() {
  var scenes = hueRoomScenes();
  if (!scenes.length) {
    toast(_T("hn_make_a_scene_first"));
    return;
  }
  HUENEW.slots = [
    { time: "07:00", scene: scenes[0] },
    { time: "18:00", scene: scenes[scenes.length > 1 ? 1 : 0] },
  ];
  HUENEW.days = [1, 1, 1, 1, 1, 1, 1];
  HUENEW.name = "";
  HUENEW.mode = "allday";
  showPopup("hue-all-day", true);
}

/* The bridge's names of the days, in the order of the day buttons (Sunday first, as in the Hue app). */
var HUE_DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

var HUE_DAYS = ["hn_day_sun", "hn_day_mon", "hn_day_tue", "hn_day_wed", "hn_day_thu", "hn_day_fri", "hn_day_sat"];

function hueAllDayPage(b) {
  var box = mk("div");
  b.appendChild(box);
  var scenes = hueRoomScenes();
  function draw() {
    box.innerHTML = "";
    var w = mk("div", "sqw pane"),
      inp = mk("input", "sq");
    inp.type = "text";
    inp.maxLength = 32;
    inp.placeholder = _T("hn_name_of_the_scene");
    inp.value = HUENEW.name;
    inp.addEventListener("input", function () {
      HUENEW.name = inp.value;
    });
    w.appendChild(inp);
    box.appendChild(w);
    box.appendChild(mkHint(_T("hn_all_day_hint")));
    HUENEW.slots.forEach(function (s, i) {
      var r = mk("div", "pill pane hn-slot"),
        t = mk("input", "sq hn-time"),
        sel = mk("select", "hn-pick");
      t.type = "time";
      t.value = s.time;
      t.addEventListener("change", function () {
        if (t.value) s.time = t.value;
      });
      scenes.forEach(function (k) {
        var o = mk("option");
        o.value = k;
        o.textContent = A(k).name || k;
        if (k === s.scene) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        s.scene = sel.value;
      });
      var rm = mk("div", "rnd pane sm", svg("close"));
      rm.addEventListener("click", function () {
        if (HUENEW.slots.length <= 1) return;
        HUENEW.slots.splice(i, 1);
        draw();
      });
      r.appendChild(t);
      r.appendChild(sel);
      r.appendChild(rm);
      box.appendChild(r);
    });
    box.appendChild(
      pill("plus", _T("hm_add_a_time"), {
        tap: function () {
          if (HUENEW.slots.length >= 8) return;
          HUENEW.slots.push({ time: "12:00", scene: scenes[0] });
          draw();
        },
      })
    );
    var days = mk("div", "hn-days");
    HUE_DAYS.forEach(function (key, i) {
      var d = mk("div", "rnd pane hn-day" + (HUENEW.days[i] ? " on" : ""));
      d.textContent = _T(key);
      d.setAttribute("role", "button");
      d.addEventListener("click", function () {
        HUENEW.days[i] = HUENEW.days[i] ? 0 : 1;
        d.classList.toggle("on", !!HUENEW.days[i]);
      });
      days.appendChild(d);
    });
    box.appendChild(days);
    box.appendChild(
      pill("check", _T("hn_save"), {
        tap: function () {
          hueSaveAllDay();
        },
      })
    );
  }
  draw();
}

function hueSaveAllDay() {
  var name = (HUENEW.name || "").trim();
  if (!name) {
    toast(_T("hn_give_it_a_name"));
    return;
  }
  if (!HUENEW.days.some(Boolean)) {
    toast(_T("hn_pick_a_day"));
    return;
  }
  var slots = HUENEW.slots
    .slice()
    .sort(function (x, y) {
      return x.time.localeCompare(y.time);
    })
    .map(function (s) {
      return { time: s.time, scene: hueSceneUid(s.scene) };
    });
  serviceResponse("hue_plus", "create_daily_smart_scene", {
    name: name,
    group: HUENEW.g.id,
    group_type: HUENEW.g.type,
    slots: slots,
    days: HUENEW.days
      .map(function (on, i) {
        return on ? HUE_DAY_NAMES[i] : "";
      })
      .filter(Boolean),
  }).then(
    function () {
      toast(_T("hn_scene_saved") + name);
      closeSheet();
    },
    function () {
      toast(_T("hn_couldn_t_save_the_scene"));
    }
  );
}

/* ---- colour palette from a photo ---- */

/* k colours from the pixels (as [r,g,b]), by k-means; the most common first. A photo is shrunk first, so this is quick. */
function huePalette(pixels, k) {
  if (!pixels.length) return [];
  var centers = [];
  for (var i = 0; i < k; i++) centers.push(pixels[Math.floor(((i + 0.5) * pixels.length) / k)].slice());
  var groups;
  for (var step = 0; step < 8; step++) {
    groups = centers.map(function () {
      return [];
    });
    pixels.forEach(function (p) {
      var best = 0,
        bd = 1e12;
      centers.forEach(function (c, ci) {
        var d = (p[0] - c[0]) * (p[0] - c[0]) + (p[1] - c[1]) * (p[1] - c[1]) + (p[2] - c[2]) * (p[2] - c[2]);
        if (d < bd) {
          bd = d;
          best = ci;
        }
      });
      groups[best].push(p);
    });
    centers = centers.map(function (c, ci) {
      var g = groups[ci];
      if (!g.length) return c;
      return [0, 1, 2].map(function (x) {
        return Math.round(
          g.reduce(function (s, p) {
            return s + p[x];
          }, 0) / g.length
        );
      });
    });
  }
  return centers
    .map(function (c, ci) {
      return { c: c, n: groups[ci].length };
    })
    .filter(function (x) {
      return x.n > 0;
    })
    .sort(function (x, y) {
      return y.n - x.n;
    })
    .map(function (x) {
      return x.c;
    });
}

function huePhotoPixels(img) {
  var c = document.createElement("canvas"),
    scale = Math.min(1, 48 / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  var ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  var d = ctx.getImageData(0, 0, c.width, c.height).data,
    out = [];
  for (var i = 0; i < d.length; i += 4) {
    var lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (d[i + 3] > 200 && lum > 25) out.push([d[i], d[i + 1], d[i + 2]]); /* near-black pixels would only make dark lights */
  }
  return out;
}

function huePhotoPage(b) {
  var lights = hueSelectedEntities(),
    sw = mk("div", "hn-swatches"),
    file = mk("input");
  file.type = "file";
  file.accept = "image/*";
  b.appendChild(mkHint(_T("hn_photo_hint")));
  b.appendChild(
    pill("cam", _T("hn_choose_a_photo"), {
      tap: function () {
        file.click();
      },
    })
  );
  b.appendChild(sw);
  file.addEventListener("change", function () {
    var f = file.files && file.files[0];
    if (!f) return;
    var img = new Image();
    img.onload = function () {
      var colors = huePalette(huePhotoPixels(img), Math.min(5, Math.max(2, lights.length)));
      URL.revokeObjectURL(img.src);
      if (!colors.length) {
        toast(_T("hn_no_colours_in_that_photo"));
        return;
      }
      sw.innerHTML = "";
      colors.forEach(function (c) {
        var s = mk("span", "hn-sw");
        s.style.background = "rgb(" + c.join(",") + ")";
        sw.appendChild(s);
      });
      /* Each light gets one of the colours, in turn; the lights show it at once. */
      lights.forEach(function (id, i) {
        callRaw("light", "turn_on", { entity_id: id, rgb_color: colors[i % colors.length], brightness: 255 });
      });
      b.appendChild(
        pill("check", _T("hn_use_these_colours"), {
          tap: function () {
            hueAskName("custom");
          },
        })
      );
    };
    img.onerror = function () {
      toast(_T("hn_couldn_t_open_that_photo"));
    };
    img.src = URL.createObjectURL(f);
  });
}

/* ---- changing a scene that exists ---- */

/* The scene's own room or zone is shown, then its lights are set as the scene has them, the light popup opens on all of them, and the checkmark records what they show as the scene. */
function hueSceneEdit(id) {
  var uid = hueSceneUid(id);
  if (!uid) {
    toast(_T("hn_no_hue_lights_here"));
    return;
  }
  hueLoadData().then(
    function (data) {
      var scene = data.scenes.filter(function (s) {
          return s.id === uid;
        })[0],
        g = scene && data.groups.filter(function (x) { return x.id === scene.group_id; })[0];
      if (!g) {
        toast(_T("hn_no_hue_lights_here"));
        return;
      }
      HUENEW = { scope: "", g: g, sel: {}, mode: "edit", name: A(id).name || A(id).friendly_name || "", slots: [], days: [], open: {}, restrict: g.id, target: id, data: data };
      hueSelectGroup(g);
      showPopup("hue-lights", true);
    },
    function () {
      toast(_T("hn_couldn_t_read_the_hue_bridge"));
    }
  );
}

function hueEditOpen() {
  var id = HUENEW.target,
    uid = hueSceneUid(id),
    name = HUENEW.name,
    lights = hueSelectedEntities();
  if (!uid || !lights.length) {
    toast(_T("hn_no_hue_lights_here"));
    return;
  }
  call("scene", "turn_on", { entity_id: id });
  setTimeout(function () {
    editLights({
      name: name,
      icon: "palette",
      lights: lights,
      onSave: function () {
        return Promise.resolve(callRaw("hue_plus", "update_scene", { scene: uid, record_current: true })).then(
          function () {
            toast(_T("hn_scene_saved") + name);
            return true;
          },
          function () {
            toast(_T("hn_couldn_t_save_the_scene"));
            return false;
          }
        );
      },
      after: function () {
        closeSheet();
      },
    });
  }, 900);
}

function hueSceneRename(id) {
  HUENEW.target = id;
  HUENEW.name = A(id).name || "";
  hueAskName("rename");
}

function hueRenameNow(name) {
  var uid = hueSceneUid(HUENEW.target);
  if (!uid) return;
  Promise.resolve(callRaw("hue_plus", "set_name", { resource: "scene", id: uid, name: name })).then(
    function () {
      toast(_T("hn_scene_saved") + name);
      closeSheet();
    },
    function () {
      toast(_T("hn_couldn_t_save_the_scene"));
    }
  );
}

/* Deleting a scene from the bridge, after a question; used by the trash of the section and by the scene's page. */
function hueSceneRemove(id) {
  var uid = hueSceneUid(id);
  if (!uid) return Promise.reject(new Error("no id"));
  return Promise.resolve(callRaw("hue_plus", "delete_scene", { scene: uid, confirm: true })).then(function () {
    toast(_T("hn_scene_deleted"));
  });
}

/* The styles of these pages. */
var HUE_NEW_CSS =
  ".hn-slot{display:flex;align-items:center;gap:10px;padding:8px 12px}\n.hn-time{width:auto;flex:none;background:transparent;color:inherit;border:0;font-size:var(--fs-m)}\n.hn-pick{flex:1;min-width:0;background:transparent;color:inherit;border:0;font-size:var(--fs-m)}\n.hn-days{display:flex;justify-content:space-between;gap:6px;margin:var(--sp) 0}\n.hn-day{width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:600}\n.hn-day.on{background:color-mix(in srgb,var(--acc) 55%,var(--f-card))}\n.hn-swatches{display:flex;gap:8px;margin:var(--sp) 0}\n.hn-sw{flex:1;height:40px;border-radius:var(--r-m);border:1px solid var(--f-line)}";
