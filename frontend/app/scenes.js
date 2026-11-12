/* The scenes of a room, as the Hue app shows them: folders (Lights, Scenes, Defaults) in two rows that scroll sideways; a folder opens as a card of round scene tiles; a scene that plays gets a pencil
 and three dots beside it; the pencil is the scene's settings page (its name, brightness, dynamic speed, auto-play and lights, with SAVE) and the three dots list what can be done with it.
 The app draws a moving scene with its picture, which comes from Signify's cloud; here the round tile is drawn with the colours of the scene, which the bridge gives. */

/* The scenes of each bridge, as get_resources lists them (their colours, speed and auto-play), by the bridge's own id. */
var HPSC = { byId: {}, loaded: false, waiting: [] };

function hpSceneData(then) {
  if (HPSC.loaded) return then();
  HPSC.waiting.push(then);
  if (HPSC.waiting.length > 1) return;
  hueplus.resources(["scenes"]).then(
    function (r) {
      (r.scenes || []).forEach(function (s) {
        HPSC.byId[s.id] = s;
      });
      HPSC.loaded = true;
      HPSC.waiting.splice(0).forEach(function (fn) {
        fn();
      });
    },
    function () {
      HPSC.waiting.splice(0);
    }
  );
}

function hpSceneInfo(sid) {
  return HPSC.byId[hueSceneUid(sid)] || {};
}

function hpIsDynamic(sid) {
  return A(sid).is_dynamic !== false;
}

/* What the Hue app calls its own ready-made still scenes. */
var HP_DEFAULT_SCENES = ["bright", "relax", "read", "concentrate", "energize", "nightlight", "dimmed"];

function hpFolderOf(sid) {
  if (hpIsDynamic(sid)) return "scenes";
  return HP_DEFAULT_SCENES.indexOf(String(A(sid).name || "").toLowerCase()) >= 0 ? "defaults" : "lights";
}

function hpColourCss(c) {
  if (c.xy) return cssRgb(liveXyRgb(c.xy[0], c.xy[1]));
  if (c.mirek) return cssRgb(kelvinRgb(Math.round(1000000 / c.mirek)));
  return "#f9d27a";
}

/* The round tile of a scene: its colours as a disc. */
function hpDisc(sid) {
  var d = mk("span", "disc");
  function paint() {
    var cols = (hpSceneInfo(sid).colours || []).map(hpColourCss);
    d.style.background = !cols.length ? "#f9d27a" : cols.length === 1 ? cols[0] : "conic-gradient(" + cols.concat(cols[0]).join(",") + ")";
  }
  paint();
  hpSceneData(paint);
  return d;
}

/* The scenes of the room grouped as the app groups them; a folder that has none is not there. */
function hpFolders(room) {
  var by = { lights: [], scenes: [], defaults: [] };
  hpScenesOf(room).forEach(function (sid) {
    by[hpFolderOf(sid)].push(sid);
  });
  return [
    ["lights", _T("app_folder_lights")],
    ["scenes", _T("scenes")],
    ["defaults", _T("app_folder_defaults")],
  ]
    .map(function (f) {
      return { key: f[0], name: f[1], scenes: by[f[0]] };
    })
    .filter(function (f) {
      return f.scenes.length;
    });
}

/* ---- the folders of a room: two rows, scrolling sideways ---- */

function hpFolderTile(folder, room) {
  var t = mk("div", "ftile", "<div class='dots'></div><b></b>");
  t.querySelector("b").textContent = folder.name;
  t.setAttribute("aria-label", folder.name);
  var dots = t.querySelector(".dots");
  folder.scenes.slice(0, 6).forEach(function (sid) {
    dots.appendChild(hpDisc(sid));
  });
  hpActive(t, function () {
    hpFolderCard(folder, room);
  });
  t.refresh = function () {
    t.classList.toggle(
      "lit",
      folder.scenes.some(function (sid) {
        return HUESCENES.active(H(), sid);
      })
    );
  };
  reg(t.refresh);
  return t;
}

function hpFolderRows(box, room) {
  var folders = hpFolders(room);
  if (!folders.length) return;
  var grid = mk("div", "frows");
  grid.style.setProperty("--cols", Math.max(3, Math.ceil(folders.length / 2)));
  folders.forEach(function (f) {
    grid.appendChild(hpFolderTile(f, room));
  });
  box.appendChild(grid);
}

/* ---- the folder's card ---- */

function hpSceneItem(sid, room, close) {
  var it = mk("div", "sitem", "<span class='dc'></span><b></b>");
  it.querySelector("b").textContent = A(sid).name || sid;
  it.querySelector(".dc").appendChild(hpDisc(sid));
  var stop = mk("span", "stop", "<i></i>");
  it.querySelector(".dc").appendChild(stop);
  it.setAttribute("aria-label", A(sid).name || sid);
  hpActive(it, function () {
    hueSceneToggle(sid);
  });
  it.refresh = function () {
    var on = HUESCENES.active(H(), sid);
    it.classList.toggle("on", on);
    it.classList.toggle("moving", on && hpIsDynamic(sid));
  };
  reg(it.refresh);
  return it;
}

function hpFolderCard(folder, room) {
  var scrim = mk("div", "fscrim"),
    card = mk("div", "fcard", "<div class='ft'></div><div class='fg'></div>"),
    grid = card.querySelector(".fg");
  card.querySelector(".ft").textContent = folder.name;
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", folder.name);
  function close() {
    scrim.classList.remove("in");
    card.classList.remove("in");
    setTimeout(function () {
      scrim.remove();
      card.remove();
    }, 220);
  }
  folder.scenes.forEach(function (sid) {
    grid.appendChild(hpSceneItem(sid, room, close));
  });
  /* The scene that plays has its pencil and its three dots beside it, as the app draws them. */
  var side = mk("div", "sside");
  side.appendChild(
    hpRound("edit", _T("hn_rename"), function () {
      var on = folder.scenes.filter(function (s) {
        return HUESCENES.active(H(), s);
      })[0];
      if (on) {
        close();
        showPopup("app-scene:" + on + "~" + room, true);
      }
    })
  );
  side.appendChild(
    hpRound("dots", _T("app_more"), function () {
      var on = folder.scenes.filter(function (s) {
        return HUESCENES.active(H(), s);
      })[0];
      if (on) hpSceneActions(on, room, close);
    })
  );
  card.refresh = function () {
    var on = folder.scenes.filter(function (s) {
      return HUESCENES.active(H(), s);
    })[0];
    var item = on && grid.querySelectorAll(".sitem")[folder.scenes.indexOf(on)];
    if (item) {
      if (side.previousSibling !== item) grid.insertBefore(side, item.nextSibling);
    } else if (side.parentNode) side.remove();
  };
  reg(card.refresh);
  scrim.addEventListener("click", close);
  document.body.appendChild(scrim);
  document.body.appendChild(card);
  refresh();
  requestAnimationFrame(function () {
    scrim.classList.add("in");
    card.classList.add("in");
    card.refresh();
  });
}

/* What the three dots list for a scene: the speed of a moving one (on its settings page) and deleting it; what the app also lists (copying, sharing) is not something the bridge does. */
function hpSceneActions(sid, room, close) {
  var items = [];
  if (hpIsDynamic(sid))
    items.push({
      label: _T("app_change_dynamic_speed"),
      fn: function () {
        if (close) close();
        showPopup("app-scene:" + sid + "~" + room, true);
      },
    });
  if (isAdmin() && hueplus.has(H(), "delete_scene"))
    items.push({
      label: _T("hn_delete_scene"),
      danger: true,
      fn: function () {
        confirmDlg(_T("hn_delete_scene") + ": " + (A(sid).name || sid) + "?", function () {
          hueSceneRemove(sid).then(function () {
            if (close) close();
          });
        });
      },
    });
  hpActions(items);
}

/* ---- a scene's settings page ---- */

function hpSpeedWord(step) {
  return step <= 3 ? _T("app_slow") : step <= 7 ? _T("app_medium") : _T("app_fast");
}

function hpScenePage(body, key) {
  var sid = String(key).split("~")[0],
    room = String(key).split("~")[1] || "",
    P = HUESCENES;
  if (!H().states[sid]) {
    body.appendChild(mk("div", "empty")).textContent = _T("nothing_found");
    return;
  }
  hmBox(body);
  var root = body.parentNode;
  root.classList.add("scenepg");
  var cols = (hpSceneInfo(sid).colours || []).map(hpColourCss);
  root.style.setProperty("--sc1", cols[0] || "#8a7a4a");
  root.style.setProperty("--sc2", cols[1] || cols[0] || "#2a2a2c");
  var dyn = hpIsDynamic(sid),
    draft = {};
  var head = mk("div", "schead", "<span class='big'></span><div class='nm'></div>");
  head.querySelector(".big").appendChild(hpDisc(sid));
  head.querySelector(".nm").textContent = A(sid).name || sid;
  if (isAdmin() && hueplus.has(H(), "update_scene"))
    head.appendChild(
      hpRound("edit", _T("hn_rename"), function () {
        hueSceneRename(sid);
      })
    );
  body.appendChild(head);
  body.appendChild(
    hmGroup([
      sliderRow({
        name: _T("app_scene_brightness"),
        min: 1,
        max: 100,
        step: 1,
        get: function () {
          var g = P.group(H(), sid);
          return g && V_(g) === "on" ? Math.max(1, Math.round((A(g).brightness || 0) / 2.55)) : hueSceneSet(sid).bri;
        },
        fmt: function (v) {
          return v + "%";
        },
        on: function () {
          return P.active(H(), sid);
        },
        live: function (v) {
          var g = P.group(H(), sid);
          if (g && P.active(H(), sid) && V_(g) === "on") callLive(g, "light", "turn_on", { entity_id: g, brightness_pct: v });
        },
        commit: function (v) {
          var st = hueSceneSet(sid);
          st.bri = v;
          hueSceneSave(sid, st);
          var g = P.group(H(), sid);
          if (g && P.active(H(), sid) && V_(g) === "on") call("light", "turn_on", { entity_id: g, brightness_pct: v });
        },
      }),
    ])
  );
  if (dyn)
    hmLoad(body, ["scenes"], function (box, r) {
      var s = (r.scenes || []).filter(function (x) {
        return x.id === hueSceneUid(sid);
      })[0];
      if (!s) return;
      draft = { speed: s.speed, auto: !!s.auto_dynamic };
      box.appendChild(hmLabel(_T("app_dynamic_scene")));
      box.appendChild(
        hmGroup([
          sliderRow({
            name: _T("app_dynamic_speed"),
            min: 1,
            max: P.speedSteps,
            step: 1,
            get: function () {
              return P.speedToStep(Math.round(draft.speed * 100));
            },
            fmt: function (v) {
              return v + " - " + hpSpeedWord(v);
            },
            commit: function (v) {
              draft.speed = P.stepToSpeed(v) / 100;
              draft.changed = true;
            },
          }),
          hmRow({
            title: _T("app_auto_play"),
            sub: _T("app_auto_play_sub"),
            toggle: {
              get: function () {
                return draft.auto;
              },
              set: function () {
                draft.auto = !draft.auto;
                draft.changed = true;
                refresh();
              },
            },
          }),
        ])
      );
      guardUnsaved({
        dirty: function () {
          return !!draft.changed;
        },
        discard: function () {
          draft.changed = false;
        },
        save: function (leave) {
          return hpCall("hue_plus", "update_scene", { scene: hueSceneUid(sid), speed: draft.speed, auto_dynamic: draft.auto }).then(
            function () {
              draft.changed = false;
              HPSC.loaded = false;
              HPSC.byId = {};
              hpSceneData(function () {});
              leave();
              return true;
            },
            function () {
              toast(_T("hn_couldn_t_save_the_scene"));
              return false;
            }
          );
        },
      });
    });
  var lights = hpSceneLights(sid);
  if (lights.length) {
    body.appendChild(hmLabel(_T("lights")));
    var tiles = mk("div", "ltiles");
    lights.forEach(function (lid) {
      tiles.appendChild(hpLightTile(lid, room));
    });
    body.appendChild(tiles);
  }
}

/* The lights a scene sets: the lights of its room that the bridge lists among its actions. */
function hpSceneLights(sid) {
  var room = hpRoomOfScene(sid),
    ids = (hpSceneInfo(sid).lights || []).filter(Boolean);
  if (!room) return [];
  return hpGroupLights(room).filter(function (lid) {
    return !ids.length || ids.indexOf(A(lid).hue_light_id) >= 0 || ids.indexOf(lid) >= 0;
  });
}

function hpRoomOfScene(sid) {
  var a = A(sid);
  return hpGroups().filter(function (g) {
    return A(g).friendly_name === a.group_name && A(g).hue_type === a.group_type;
  })[0];
}

HC.registerPage(
  "app-scene",
  function () {
    return _T("app_edit_scene");
  },
  "scene",
  hpScenePage
);
