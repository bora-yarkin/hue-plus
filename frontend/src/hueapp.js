/* What the pages of the Hue dashboard panel share with Home Control's Hue Plus menu: small helpers (round buttons, switches, zoom), the icons only this plugin draws, the scenes the bridge has (colours, speed,
 auto-play) and a scene's settings page. The panel draws these pages in the Hue app's way and Home Control in its own theme (huecss.js and hueappcss.js style them); the pages are the same. */

/* Icons Home Control's set does not have (the panel's own table has them too: see HOST_ICONS in shell.js). */
var HP_EXTRA_ICONS = {
  headphones: "<path d='M4 15v-3a8 8 0 0 1 16 0v3'/><rect x='3' y='14' width='4.5' height='7' rx='1.6'/><rect x='16.5' y='14' width='4.5' height='7' rx='1.6'/>",
  switch: "<rect x='7' y='2.5' width='10' height='19' rx='2.4'/><path d='M10 6.5h4M10 10h4M10 13.5h4M10 17h4'/>",
  shuffle: "<path d='M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5'/>",
  sunrise: "<path d='M12 4V2M4.9 7.9 3.5 6.5M19.1 7.9l1.4-1.4M2 17h3M19 17h3M7 17a5 5 0 0 1 10 0M3 21h18'/>",
  hue: "<text x='1' y='16' font-size='9' font-weight='700' fill='currentColor' stroke='none' font-family='sans-serif'>hue</text>",
};

/* How much the browser has zoomed the page, when it reports what it measures (a rectangle, a pointer's place) in zoomed units while a style's px is not zoomed (Safari's page zoom): a measured length
 becomes a style's px by dividing by this. It is 1 where the two agree. */
function hpZoom() {
  var styled = parseFloat(getComputedStyle(document.body).width);
  return styled ? document.body.getBoundingClientRect().width / styled || 1 : 1;
}

/* A round button of the page's top: an icon, a label for the screen reader, and what it does. */
function hpRound(icon, label, fn) {
  var b = mk("button", "rbt", svg(icon));
  b.type = "button";
  b.setAttribute("aria-label", label);
  b.addEventListener("click", fn);
  return b;
}

function hpActive(el, open) {
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.addEventListener("click", open);
  el.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target === el) {
      e.preventDefault();
      open();
    }
  });
}

function hpToggle(label, get, set) {
  var t = mk("button", "tg", "<i></i>");
  t.type = "button";
  t.setAttribute("role", "switch");
  t.setAttribute("aria-label", label);
  t.addEventListener("click", function (e) {
    e.stopPropagation();
    set();
  });
  t.refresh = function () {
    var on = get();
    t.classList.toggle("on", on);
    t.setAttribute("aria-checked", on ? "true" : "false");
  };
  reg(t.refresh);
  return t;
}

/* The scenes of each bridge, as get_resources lists them (their colours, speed and auto-play), by the bridge's own id. */
var HPSC = { byId: {}, loaded: false, waiting: [] };

function hpSceneData(then) {
  if (HPSC.loaded) return then();
  HPSC.waiting.push(then);
  if (HPSC.waiting.length > 1) return;
  hmReady().then(
    function () {
      (HM.scenes || []).forEach(function (s) {
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

function hpSpeedWord(step) {
  return step <= 3 ? _T("app_slow") : step <= 7 ? _T("app_medium") : _T("app_fast");
}

var HPSCN = {};

function hpScenePage(body, key) {
  var sid = String(key).split("~")[0],
    room = String(key).split("~")[1] || "",
    P = HUESCENES;
  if (!H().states[sid]) {
    body.appendChild(mk("div", "empty")).textContent = _T("nothing_found");
    return;
  }
  hmBox(body);
  var root = hpRoot(body);
  root.classList.add("scenepg");
  var cols = (hpSceneInfo(sid).colours || []).map(hpColourCss);
  root.style.setProperty("--sc1", cols[0] || "#8a7a4a");
  root.style.setProperty("--sc2", cols[1] || cols[0] || "#2a2a2c");
  root.style.setProperty("--sc3", cols[2] || cols[1] || cols[0] || "#2a2a2c");
  /* What is changed on this page is kept until SAVE, also while a page opened from it (the speed) is shown and this one is drawn again. */
  var dyn = hpIsDynamic(sid),
    draft = HPSCN[sid] || (HPSCN[sid] = {});
  var panel = !!window.HueHost,
    canEdit = isAdmin() && hueplus.has(H(), "update_scene");
  if (panel) {
    var head = mk("div", "schead", "<span class='big'></span><div class='nm'></div>");
    head.querySelector(".big").appendChild(hpDisc(sid));
    head.querySelector(".nm").textContent = A(sid).name || sid;
    if (canEdit)
      head.appendChild(
        hpRound("edit", _T("hn_rename"), function () {
          hueSceneRename(sid);
        })
      );
    body.appendChild(head);
  } else
    body.appendChild(
      hmGroup([
        hmRow({
          ldisc: cols[0] || "#8a7a4a",
          title: A(sid).name || sid,
          sub: canEdit ? _T("hn_rename") : "",
          tap: canEdit
            ? function () {
                hueSceneRename(sid);
              }
            : null,
        }),
      ])
    );
  var briRow = (
      sliderRow({
        icon: "bright",
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
          hueSceneSave(sid, { bri: v });
          var g = P.group(H(), sid);
          if (g && P.active(H(), sid) && V_(g) === "on") call("light", "turn_on", { entity_id: g, brightness_pct: v });
        },
      })
  );
  if (panel) body.appendChild(hmGroup([briRow]));
  if (dyn)
    hmLoad(body, ["scenes"], function (box, r) {
      var s = (r.scenes || []).filter(function (x) {
        return x.id === hueSceneUid(sid);
      })[0];
      if (!s) return;
      if (!draft.read) {
        draft.read = true;
        draft.saved = typeof s.speed === "number" ? s.speed : 0.5;
        draft.speed = draft.saved;
        draft.auto = !!s.auto_dynamic;
      }
      box.appendChild(hmLabel(_T("app_dynamic_scene")));
      box.appendChild(
        hmGroup([
          panel
            ? hmRow({
                title: _T("app_dynamic_speed"),
                val: function () {
                  var step = P.speedToStep(Math.round(draft.speed * 100));
                  return step + " - " + hpSpeedWord(step);
                },
                tap: "app-speed:" + sid,
              })
            : null,
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
          return !!draft.changed || !!draft.recolor;
        },
        discard: function () {
          delete HPSCN[sid];
        },
        save: function (leave) {
          var change = { scene: hueSceneUid(sid), speed: draft.speed, auto_dynamic: draft.auto };
          if (draft.recolor) change.recolor = draft.recolor;
          return hpCall("hue_plus", "update_scene", change).then(
            function () {
              delete HPSCN[sid];
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
  if (!panel) {
    /* Home Control: the scene's own popup has playing, brightness and speed; this page has what changes the scene. */
    if (canEdit) {
      var rows = [
        hmRow({
          icon: "palette",
          title: _T("app_scene_look"),
          sub: _T("app_scene_look_sub"),
          tap: function () {
            hueSceneEdit(sid);
          },
        }),
      ];
      if (dyn)
        rows.push(
          hmRow({
            icon: "shuffle",
            title: _T("app_colors"),
            sub: _T("app_colors_sub"),
            tap: function () {
              draft.recolor = "shuffle";
              toast(_T("app_colors_when_saved"));
            },
          })
        );
      body.appendChild(hmGroup(rows));
    }
  } else if (lights.length || canEdit) {
    /* The Lights title has the Colors button of a moving scene: it gives the scene's colours out to the lights again, in another order (kept until SAVE). */
    var bar = mk("div", "lbrow lightsbar");
    var title = mk("div", "lbtitle");
    title.textContent = _T("lights");
    bar.appendChild(title);
    if (dyn && hueplus.has(H(), "update_scene")) {
      var shuffle = mk("button", "colorsbtn", svg("shuffle") + "<span></span>");
      shuffle.type = "button";
      shuffle.querySelector("span").textContent = _T("app_colors");
      shuffle.addEventListener("click", function () {
        draft.recolor = "shuffle";
        toast(_T("app_colors_when_saved"));
      });
      bar.appendChild(shuffle);
    }
    if (canEdit)
      bar.appendChild(
        hpRound("edit", _T("hn_scene_lights"), function () {
          showPopup("hue-scene-lights:" + sid, true);
        })
      );
    body.appendChild(bar);
    var tiles = mk("div", "ltiles");
    lights.forEach(function (lid) {
      var tile = hpSceneTile(lid, room);
      /* a zone can have lights of several rooms, and two of them can be named alike: the tile says the room too */
      if (room && A(room).hue_type === "zone") tile.querySelector("b").textContent = hpEntityLabel(lid);
      tiles.appendChild(tile);
    });
    body.appendChild(tiles);
  }
  var tail = [];
  /* Reset scene: the palette is given out to the lights in its own order and at its own brightness again (kept until SAVE). */
  if (dyn && hueplus.has(H(), "update_scene")) {
    var reset = panel ? mk("button", "resetbtn") : null;
    var doReset = function () {
      draft.recolor = "reset";
      toast(_T("app_reset_when_saved"));
    };
    if (panel) {
      reset.type = "button";
      reset.textContent = _T("app_reset_scene");
      reset.addEventListener("click", doReset);
      body.appendChild(reset);
    } else tail.push(hmRow({ icon: "palette", title: _T("app_reset_scene"), tap: doReset }));
  }
  if (isAdmin() && hueplus.has(H(), "delete_scene")) {
    var doDelete = function () {
      confirmDlg(_T("hn_delete_scene") + ": " + (A(sid).name || sid) + "?", function () {
        hueSceneRemove(sid).then(function () {
          delete HPSCN[sid];
          popBack();
        });
      });
    };
    if (panel) {
      var del = mk("button", "deletebtn");
      del.type = "button";
      del.textContent = _T("hn_delete_scene");
      del.addEventListener("click", doDelete);
      body.appendChild(del);
    } else tail.push(hmRow({ icon: "trash", title: _T("hn_delete_scene"), danger: true, tap: doDelete }));
  }
  if (tail.length) body.appendChild(hmGroup(tail));
}

/* The speed of a moving scene: a short sheet with the twelve steps of the app (kept on the scene's page until SAVE). */
function hpSpeedPage(body, sid) {
  hmBox(body);
  var st = HPSCN[sid],
    P = HUESCENES;
  if (!st || !st.read) {
    body.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  hpRoot(body).classList.add("shortpg");
  var box = mk("div", "spsheet"),
    cap = mk("span", "spcap"),
    val = mk("b", "spval"),
    track = mk("div", "sptrack", "<div class='spfill'></div><div class='spthumb'></div>"),
    ticks = mk("div", "spticks");
  cap.textContent = _T("app_speed").toUpperCase();
  for (var n = 1; n <= P.speedSteps; n++) ticks.appendChild(mk("i")).textContent = String(n);
  var note = mk("div", "pintro");
  note.textContent = _T("app_speed_text");
  box.appendChild(cap);
  box.appendChild(val);
  box.appendChild(track);
  box.appendChild(ticks);
  body.appendChild(box);
  body.appendChild(note);
  var thumb = track.querySelector(".spthumb"),
    fill = track.querySelector(".spfill");
  function step() {
    return P.speedToStep(Math.round(st.speed * 100));
  }
  function paint() {
    var at = (step() - 1) / (P.speedSteps - 1);
    thumb.style.left = at * 100 + "%";
    fill.style.width = at * 100 + "%";
    val.textContent = step() + " - " + hpSpeedWord(step()) + (step() === P.speedToStep(Math.round(st.saved * 100)) ? " " + _T("app_default_in_brackets") : "");
  }
  function from(e) {
    var r = track.getBoundingClientRect(),
      at = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      next = 1 + Math.round(at * (P.speedSteps - 1));
    st.speed = P.stepToSpeed(next) / 100;
    st.changed = true;
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

/* The lights a scene has, by the bridge's ids: the Hue Plus lights of the ids its actions name. */
function hpSceneLights(sid) {
  return (hpSceneInfo(sid).lights || [])
    .filter(Boolean)
    .map(hpEntityOf)
    .filter(Boolean);
}

/* A light of a scene: the panel's tile opens its light screen; Home Control's is a row that opens the light's own popup. */
function hpSceneTile(lid, room) {
  if (typeof hpLightTile === "function") return hpLightTile(lid, room);
  var where = hpRoomOfLight(lid);
  return pill("light", hpName(lid), {
    sub: function () {
      return where ? where.name : "";
    },
    tap: function () {
      showPopup("light:" + lid, true);
    },
  });
}

HP_PAGES["app-speed"] = ["app_dynamic_speed", "tune", hpSpeedPage];
HP_PAGES["app-scene"] = ["app_edit_scene", "scene", hpScenePage];

function hpSyncEntities(test) {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      var e = h.entities[id];
      return test(h, id) && !(e && e.hidden);
    })
    .sort();
}

/* The panel's pages end with DONE or SAVE in the bar of the page (`HC.onDone = function`). Home Control's popups have no such button, so there the same function is a row at the end of the page (DONE keeps what the
 page holds, as it does in the panel). */
var HP_DONE_PAGE = null;

if (!window.HueHost)
  Object.defineProperty(HC, "onDone", {
    configurable: true,
    get: function () {
      return HP_DONE_PAGE && HP_DONE_PAGE.fn;
    },
    set: function (fn) {
      if (!HP_DONE_PAGE) return;
      HP_DONE_PAGE.fn = fn;
      if (HP_DONE_PAGE.row) HP_DONE_PAGE.row.remove();
      HP_DONE_PAGE.row = null;
      if (!fn) return;
      HP_DONE_PAGE.row = pill("check", _T("hm_done"), { tap: fn });
      HP_DONE_PAGE.row.classList.add("hp-done");
      HP_DONE_PAGE.body.appendChild(HP_DONE_PAGE.row);
    },
  });
