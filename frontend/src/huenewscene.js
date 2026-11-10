/* Making and changing Hue scenes from the dashboard's scenes section, the way the Hue app does ("Add a scene"): a custom scene (the lights set in the dashboard's light
 popup, then saved), the current settings saved as a scene, an all-day scene (scenes by time of day), and a colour palette taken from a photo. Everything is written to the
 bridge (hue_plus.create_scene, update_scene, delete_scene, create_daily_smart_scene). Dynamic scenes cannot be made here: the Hue app only has them from its cloud gallery. */

var HUENEW = { scope: "", group: "", name: "", slots: [], days: [1, 1, 1, 1, 1, 1, 1], photo: null };

/* The Hue Plus light that stands for a room or zone: the one of the page's area, else the only one there is. */
function hueGroups() {
  var h = H();
  return Object.keys(h.states).filter(function (k) {
    var e = h.entities[k];
    return k.indexOf("light.") === 0 && e && e.platform === "hue_plus" && h.states[k].attributes.is_hue_group;
  });
}

function hueGroupFor(scope) {
  var h = H(),
    room = scope && scope !== "home" ? roomById(scope) : null,
    all = hueGroups(),
    byArea = room && room.area ? all.filter(function (k) { return h.entities[k].area_id === room.area; }) : [];
  if (byArea.length === 1) return byArea[0];
  return all.length === 1 ? all[0] : null;
}

/* The Hue lights a scene of that room or zone is made of: the lights of the group's area, else of the page. */
function hueGroupLights(scope, group) {
  var h = H(),
    area = group && h.entities[group] && h.entities[group].area_id,
    mine = (sceneLights(scope) || []).filter(function (id) { return !!A(id).hue_light_id; });
  if (mine.length) return mine;
  return hueplus.lights(h).filter(function (id) { return !!area && h.entities[id].area_id === area; });
}

function hueGroupRef(group) {
  return { group: A(group).friendly_name, group_type: A(group).hue_type === "zone" ? "zone" : "room" };
}

/* The bridge's own id of a scene entity (its unique id). */
function hueSceneUid(id) {
  var e = H().entities[id];
  return e && e.unique_id;
}

/* ---- the choices ---- */

function hueStartMaker(scope) {
  HUENEW = { scope: scope, group: hueGroupFor(scope), name: "", slots: [], days: [1, 1, 1, 1, 1, 1, 1], photo: null };
  showPopup(HUENEW.group ? "hue-add-scene" : "hue-pick-group", true);
}

function huePickGroupPage(b) {
  var h = H();
  b.appendChild(mkHint(_T("hn_which_room")));
  hueGroups().forEach(function (g) {
    b.appendChild(
      pill(A(g).hue_type === "zone" ? "target" : "home", A(g).friendly_name || g, {
        sub: function () {
          return A(g).hue_type === "zone" ? _T("hn_zone") : _T("hn_room");
        },
        tap: function () {
          HUENEW.group = g;
          showPopup("hue-add-scene", true);
        },
      })
    );
  });
  if (!hueGroups().length) b.appendChild(mkHint(_T("hn_no_hue_room")));
}

function mkHint(text) {
  var d = mk("div", "notec pane dim");
  d.textContent = text;
  return d;
}

/* The Hue app's "Add a scene". */
function hueAddScenePage(b) {
  var grid = mk("div", "gridl g2"),
    items = [
      ["edit", "hn_custom_scene", "hn_custom_scene_sub", function () { hueAskName("custom"); }],
      ["check", "hn_save_current", "hn_save_current_sub", function () { hueAskName("current"); }],
      ["clock", "hn_all_day", "hn_all_day_sub", function () { hueStartAllDay(); }],
      ["cam", "hn_from_photo", "hn_from_photo_sub", function () { showPopup("hue-photo", true); }],
    ];
  b.appendChild(mkHint(_T("hn_add_a_scene_hint").replace("{room}", A(HUENEW.group).friendly_name || "")));
  items.forEach(function (it) {
    grid.appendChild(
      pill(it[0], _T(it[1]), {
        sub: function () {
          return _T(it[2]);
        },
        tap: it[3],
      })
    );
  });
  b.appendChild(grid);
}

/* ---- a name ---- */

function hueAskName(mode) {
  HUENEW.mode = mode;
  HUENEW.name = "";
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

function hueCreate(extra) {
  var ref = hueGroupRef(HUENEW.group);
  return callRaw("hue_plus", "create_scene", Object.assign({ name: HUENEW.name, group: ref.group, group_type: ref.group_type }, extra || {}));
}

/* The lights as they are now, saved. */
function hueSaveCurrent() {
  var p = hueCreate();
  Promise.resolve(p).then(
    function () {
      toast(_T("hn_scene_saved") + HUENEW.name);
      closeSheet();
    },
    function () {
      toast(_T("hn_couldn_t_save_the_scene"));
    }
  );
}

/* The dashboard's light popup for the room's lights: set them, press the checkmark, and what they show is the scene. */
function hueOpenEditor() {
  var lights = hueGroupLights(HUENEW.scope, HUENEW.group);
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

function hueRoomScenes(group) {
  var h = H(),
    name = A(group).friendly_name;
  return Object.keys(h.states)
    .filter(function (k) {
      return k.indexOf("scene.") === 0 && HUESCENES.isHue(h, k) && A(k).group_name === name && A(k).is_dynamic === false;
    })
    .sort(function (x, y) {
      return (A(x).name || x).localeCompare(A(y).name || y);
    });
}

function hueStartAllDay() {
  var scenes = hueRoomScenes(HUENEW.group);
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

var HUE_DAYS = ["hn_day_sun", "hn_day_mon", "hn_day_tue", "hn_day_wed", "hn_day_thu", "hn_day_fri", "hn_day_sat"];

function hueAllDayPage(b) {
  var box = mk("div");
  b.appendChild(box);
  var scenes = hueRoomScenes(HUENEW.group);
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
  var ref = hueGroupRef(HUENEW.group),
    slots = HUENEW.slots
      .slice()
      .sort(function (x, y) {
        return x.time.localeCompare(y.time);
      })
      .map(function (s) {
        return { time: s.time, scene: hueSceneUid(s.scene) };
      });
  serviceResponse("hue_plus", "create_daily_smart_scene", {
    name: name,
    group: ref.group,
    group_type: ref.group_type,
    slots: slots,
    days: HUENEW.days
      .map(function (on, i) {
        return on ? i : -1;
      })
      .filter(function (i) {
        return i >= 0;
      }),
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
  var lights = hueGroupLights(HUENEW.scope, HUENEW.group),
    sw = mk("div", "hn-swatches"),
    file = mk("input");
  file.type = "file";
  file.accept = "image/*";
  b.appendChild(mkHint(_T("hn_photo_hint")));
  var pick = pill("cam", _T("hn_choose_a_photo"), {
    tap: function () {
      file.click();
    },
  });
  b.appendChild(pick);
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
        var c = colors[i % colors.length];
        callRaw("light", "turn_on", { entity_id: id, rgb_color: c, brightness: 255 });
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

/* The scene's lights are set as the scene has them, the light popup opens on them, and the checkmark records what they show as the scene. */
function hueSceneEdit(id, room) {
  var group = hueGroupFor(room ? room.id : "home"),
    lights = hueGroupLights(room ? room.id : "home", group),
    uid = hueSceneUid(id);
  if (!uid || !lights.length) {
    toast(_T("hn_no_hue_lights_here"));
    return;
  }
  call("scene", "turn_on", { entity_id: id });
  var name = A(id).name || A(id).friendly_name || "";
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
    });
  }, 900);
}

function hueSceneRename(id) {
  HUENEW.target = id;
  hueAskName("rename");
  HUENEW.name = A(id).name || "";
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
