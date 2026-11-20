/* The scenes of a room, as the Hue app shows them: folders (Lights, Scenes, Defaults) in two rows that scroll sideways; a folder opens as a card of round scene tiles; a scene that plays gets a pencil
 and three dots beside it; the pencil is the scene's settings page (its name, brightness, dynamic speed, auto-play and lights, with SAVE) and the three dots list what can be done with it.
 The app draws a moving scene with its picture, which comes from Signify's cloud; here the round tile is drawn with the colours of the scene, which the bridge gives. */

/* What the Hue app calls its own ready-made still scenes. */
var HP_DEFAULT_SCENES = ["bright", "relax", "read", "concentrate", "energize", "nightlight", "dimmed"];

function hpFolderOf(sid) {
  if (hpIsDynamic(sid)) return "scenes";
  return HP_DEFAULT_SCENES.indexOf(String(A(sid).name || "").toLowerCase()) >= 0 ? "defaults" : "lights";
}

/* The folders the person makes by dropping a scene on another. The app keeps them in the app, the bridge has no place for them, so here they are kept on this device. */
function hpUserFolders(room) {
  var v = deviceGet("db_ufolders_" + room, []);
  return Array.isArray(v) ? v : [];
}

function hpSaveUserFolders(room, list) {
  deviceSet(
    "db_ufolders_" + room,
    list.filter(function (f) {
      return f.scenes.length;
    })
  );
}

/* A scene can be outside every folder, as in the app: it is then a tile of its own among the folders. Which scenes are, is kept on this device (the app keeps it in the app). */
function hpLooseScenes(room) {
  var v = deviceGet("db_loose_" + room, []);
  return Array.isArray(v) ? v : [];
}

function hpSetLoose(room, sid, loose) {
  var list = hpLooseScenes(room).filter(function (s) {
    return s !== sid;
  });
  if (loose) list.push(sid);
  deviceSet("db_loose_" + room, list.slice(0, 200));
  /* A scene outside the folders is in none of the person's folders. */
  if (loose)
    hpSaveUserFolders(
      room,
      hpUserFolders(room).map(function (f) {
        return { id: f.id, name: f.name, scenes: f.scenes.filter(function (s) { return s !== sid; }) };
      })
    );
}

/* The scenes of the room grouped as the app groups them, the person's own folders, and the scenes outside every folder; a folder that has none is not there. */
function hpFolders(room) {
  var all = hpScenesOf(room),
    loose = hpLooseScenes(room).filter(function (s) {
      return all.indexOf(s) >= 0;
    }),
    mine = hpUserFolders(room)
      .map(function (f) {
        return { key: "u:" + f.id, id: f.id, name: f.name, user: true, scenes: f.scenes.filter(function (s) { return all.indexOf(s) >= 0; }) };
      })
      .filter(function (f) {
        return f.scenes.length;
      }),
    taken = {};
  loose.forEach(function (s) {
    taken[s] = 1;
  });
  mine.forEach(function (f) {
    f.scenes = f.scenes.filter(function (s) { return loose.indexOf(s) < 0; });
  });
  mine = mine.filter(function (f) {
    return f.scenes.length;
  });
  mine.forEach(function (f) {
    f.scenes.forEach(function (s) {
      taken[s] = 1;
    });
  });
  var by = { lights: [], scenes: [], defaults: [] };
  all.forEach(function (sid) {
    if (!taken[sid]) by[hpFolderOf(sid)].push(sid);
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
    })
    .concat(mine)
    .concat(
      loose.map(function (sid) {
        return { key: "s:" + sid, name: A(sid).name || A(sid).friendly_name || sid, loose: true, sid: sid, scenes: [sid] };
      })
    );
}

/* A scene dragged out of a folder's card is outside every folder from then on. */
function hpMakeLoose(room, sid, close) {
  hpSetLoose(room, sid, true);
  close();
  showPopup("app-room:" + room, false);
}

/* Dropping a scene on another makes a folder of the two (named by the person). */
function hpMakeFolder(room, a, b, close) {
  var list = hpUserFolders(room).map(function (f) {
    return { id: f.id, name: f.name, scenes: f.scenes.filter(function (s) { return s !== a && s !== b; }) };
  });
  var folder = { id: Date.now().toString(36), name: _T("app_new_folder"), scenes: [b, a] };
  list.push(folder);
  hpSaveUserFolders(room, list);
  close();
  showPopup("app-room:" + room, false);
  hpPrompt(_T("app_group_name"), folder.name, function (name) {
    folder.name = name;
    hpSaveUserFolders(room, list);
    showPopup("app-room:" + room, false);
  });
}

/* A question with a line to write the answer in, as the app asks a folder's name. */
function hpPrompt(title, value, done) {
  var scrim = mk("div", "scrim"),
    box = mk("div", "dlg", "<p></p><input class='sq pin' type='text' maxlength='40'><div class='rrow'></div>"),
    input = box.querySelector("input"),
    close = null;
  box.querySelector("p").textContent = title;
  input.value = value;
  var go = mk("div", "rbtn go");
  go.textContent = _T("done");
  go.addEventListener("click", function () {
    var v = input.value.trim();
    close();
    if (v) done(v);
  });
  var no = mk("div", "rbtn");
  no.textContent = _T("cancel");
  no.addEventListener("click", function () {
    close();
  });
  box.querySelector(".rrow").appendChild(no);
  box.querySelector(".rrow").appendChild(go);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") go.click();
  });
  close = hpSheetOpen(scrim, box, function () {
    input.focus();
    input.select();
  });
}

/* ---- the folders of a room: two rows, scrolling sideways ---- */

function hpFolderTile(folder, room) {
  var t = mk("div", "ftile", "<div class='dots'></div><b></b>");
  t.dataset.key = folder.key;
  t.querySelector("b").textContent = folder.name;
  t.setAttribute("aria-label", folder.name);
  var dots = t.querySelector(".dots");
  folder.scenes.slice(0, 6).forEach(function (sid) {
    dots.appendChild(hpDisc(sid));
  });
  if (folder.loose) t.classList.add("loose");
  hpActive(t, function () {
    /* A scene outside the folders is played from its tile. */
    if (folder.loose) hueSceneToggle(folder.sid);
    else hpFolderCard(folder, room, t);
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
  hpOrdered(folders, "folders:" + room, function (f) {
    return f.key;
  }).forEach(function (f) {
    grid.appendChild(hpFolderTile(f, room));
  });
  /* Two rows that scroll sideways, as the app has them: the first half of the tiles along the top row, the rest along the bottom. */
  function rows() {
    var items = grid.querySelectorAll(".ftile"),
      half = Math.ceil(items.length / 2);
    Array.prototype.forEach.call(items, function (it, i) {
      it.style.gridRow = i < half ? "1" : "2";
      it.style.gridColumn = String((i < half ? i : i - half) + 1);
    });
  }
  rows();
  hpSortable(
    grid,
    ".ftile",
    function (el) {
      return el.dataset.key;
    },
    function (ids) {
      hpOrderSet("folders:" + room, ids);
      rows();
    },
    {
      live: false,
      /* A scene that is outside the folders, dropped on a folder, goes into it (one of the person's folders takes it; one of the app's own groups has it back where it belongs). */
      merge: function (a, b) {
        if (String(a).indexOf("s:") === 0 && String(b).indexOf("s:") !== 0) {
          var sid = String(a).slice(2);
          hpSetLoose(room, sid, false);
          if (String(b).indexOf("u:") === 0)
            hpSaveUserFolders(
              room,
              hpUserFolders(room).map(function (f) {
                return { id: f.id, name: f.name, scenes: "u:" + f.id === b ? f.scenes.concat([sid]) : f.scenes };
              })
            );
        }
        showPopup("app-room:" + room, false);
      },
    }
  );
  box.appendChild(grid);
}

/* ---- the folder's card ---- */

function hpSceneItem(sid, room, close) {
  var it = mk("div", "sitem", "<span class='dc'></span><b></b>");
  it.dataset.sid = sid;
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

function hpFolderCard(folder, room, from) {
  var scrim = mk("div", "fscrim"),
    wrap = mk("div", "fwrap"),
    card = mk("div", "fcard", "<div class='ft'></div><div class='fg'></div>"),
    grid = card.querySelector(".fg");
  card.querySelector(".ft").textContent = folder.name;
  if (folder.user) {
    var pen = hpRound("edit", _T("app_group_name"), function () {
      hpPrompt(_T("app_group_name"), folder.name, function (name) {
        var list = hpUserFolders(room).map(function (f) {
          return { id: f.id, name: f.id === folder.id ? name : f.name, scenes: f.scenes };
        });
        hpSaveUserFolders(room, list);
        folder.name = name;
        card.querySelector(".ft").textContent = name;
        showPopup("app-room:" + room, false);
      });
    });
    pen.classList.add("fedit");
    card.insertBefore(pen, card.firstChild);
  }
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", folder.name);
  /* The card opens out of the folder it was on and closes back into it, as the app does it (read from a screen recording): the whole card, its content too, is scaled about the middle of the folder and fades in over about a sixth of a second while
   the page behind blurs; closing is that backwards. The card is never stretched: only a uniform scale and its opacity change. */
  var OPEN = ".17s cubic-bezier(.3,0,.3,1)",
    SHUT = ".17s cubic-bezier(.7,0,.7,1)",
    pulse = null;
  /* Where the app puts it: its top where the first row of folders ends. */
  function place() {
    var rows = from && from.closest ? from.closest(".frows") : null,
      first = rows && rows.querySelector(".ftile");
    if (!first) {
      card.style.top = "30%";
      return;
    }
    card.style.top = (first.getBoundingClientRect().bottom - document.body.getBoundingClientRect().top) / hpZoom() + "px";
  }
  function aim() {
    place();
    card.style.transition = "none";
    card.style.transform = "none";
    card.style.opacity = "1";
    var cr = card.getBoundingClientRect();
    if (!from || !from.isConnected) {
      card.style.transformOrigin = "50% 50%";
      return 0.9;
    }
    var tr = from.getBoundingClientRect();
    var z = hpZoom();
    card.style.transformOrigin = (tr.left + tr.width / 2 - cr.left) / z + "px " + (tr.top + tr.height / 2 - cr.top) / z + "px";
    return Math.max(0.3, Math.min(0.6, (tr.width * 1.6) / cr.width));
  }
  function close() {
    var s = aim();
    void card.offsetHeight;
    scrim.classList.remove("in");
    card.style.transition = "transform " + SHUT + ",opacity .12s .05s";
    card.style.transform = "scale(" + s + ")";
    card.style.opacity = "0";
    if (pulse) pulse.cancel();
    setTimeout(function () {
      scrim.remove();
      wrap.remove();
    }, 200);
  }
  hpOrdered(folder.scenes, "scenes:" + room + ":" + folder.key, function (s) {
    return s;
  }).forEach(function (sid) {
    grid.appendChild(hpSceneItem(sid, room, close));
  });
  /* Two rows that scroll sideways, filled as the app fills them: the first half of the scenes along the top row, the rest along the bottom. */
  function rows() {
    var items = grid.querySelectorAll(".sitem"),
      half = Math.ceil(items.length / 2);
    Array.prototype.forEach.call(items, function (it, i) {
      it.style.gridRow = i < half ? "1" : "2";
      it.style.gridColumn = String((i < half ? i : i - half) + 1);
    });
  }
  rows();
  hpSortable(
    grid,
    ".sitem",
    function (el) {
      return el.dataset.sid;
    },
    function (ids) {
      hpOrderSet("scenes:" + room + ":" + folder.key, ids);
      folder.scenes = ids;
      rows();
      card.refresh();
    },
    {
      merge: folder.user
        ? null
        : function (a, b) {
            hpMakeFolder(room, a, b, close);
          },
      outside: function (sid) {
        hpMakeLoose(room, sid, close);
      },
      bounds: function () {
        return card;
      },
    }
  );
  /* The pencil and the three dots of the scene that plays. They come out of that scene's tile to its right; when another scene plays, the pair of the old one goes back into its tile and fades while a new pair comes out of the new
     tile. The tiles of the row after the playing one make room by sliding right, by the width of the pair and one gap, and slide back when another scene plays: from 2 playing to 4, the tiles 3 and 4 slide left and the
     others stay where they are. Only the row of the playing tile moves. */
  var SIDE_W = 34,
    GAP = 11,
    side = null; /* { el, item }: the pair that is out now */
  function sideMake() {
    var el = mk("div", "sside");
    el.appendChild(
      hpRound("edit", _T("hn_rename"), function () {
        var on = sideActiveScene();
        if (on) {
          close();
          showPopup("app-scene:" + on + "~" + room, true);
        }
      })
    );
    el.appendChild(
      hpRound("dots", _T("app_more"), function () {
        var on = sideActiveScene();
        if (on) hpSceneActions(on, room, close);
      })
    );
    return el;
  }
  function sideActiveScene() {
    return folder.scenes.filter(function (s) {
      return HUESCENES.active(H(), s);
    })[0];
  }
  /* Where the pair is when it is inside its tile (behind it, at its right edge), and where it stands when it is out. */
  function sideInside(item) {
    return item.offsetLeft + item.offsetWidth - SIDE_W + "px";
  }
  function sideOut(item) {
    return item.offsetLeft + item.offsetWidth + GAP + "px";
  }
  function sidePlace(el, item, left) {
    el.style.left = left;
    el.style.top = item.offsetTop + "px";
    el.style.height = item.offsetHeight + "px";
  }
  function sideRetract(old) {
    old.el.classList.remove("on");
    old.el.classList.add("away");
    sidePlace(old.el, old.item, sideInside(old.item));
    setTimeout(function () {
      old.el.remove();
    }, 360);
  }
  function sideEnter(item) {
    var el = sideMake();
    el.style.transition = "none";
    sidePlace(el, item, sideInside(item));
    grid.appendChild(el);
    void el.offsetWidth;
    el.style.transition = "";
    el.classList.add("on");
    el.style.left = sideOut(item);
    return { el: el, item: item };
  }
  card.refresh = function () {
    var on = sideActiveScene(),
      items = [].slice.call(grid.querySelectorAll(".sitem")),
      item =
        on &&
        items.filter(function (x) {
          return x.dataset.sid === on;
        })[0];
    if (!item) {
      if (side) sideRetract(side);
      side = null;
      items.forEach(function (it) {
        it.style.translate = "";
      });
      return;
    }
    var row = item.style.gridRow,
      col = +item.style.gridColumn;
    items.forEach(function (it) {
      it.style.translate = it.style.gridRow === row && +it.style.gridColumn > col ? SIDE_W + GAP + "px 0" : "";
    });
    if (side && side.item === item) {
      sidePlace(side.el, item, sideOut(item));
      return;
    }
    if (side) sideRetract(side);
    side = sideEnter(item);
  };
  reg(card.refresh);
  scrim.addEventListener("click", close);
  wrap.appendChild(card);
  document.body.appendChild(scrim);
  document.body.appendChild(wrap);
  refresh();
  var s0 = aim();
  card.style.transform = "scale(" + s0 + ")";
  card.style.opacity = "0";
  void card.offsetHeight;
  if (from && from.isConnected && from.animate) pulse = from.animate([{ transform: "scale(1)" }, { transform: "scale(1.1)" }], { duration: 110, fill: "forwards" });
  requestAnimationFrame(function () {
    scrim.classList.add("in");
    card.style.transition = "transform " + OPEN + ",opacity .12s";
    card.style.transform = "none";
    card.style.opacity = "1";
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


