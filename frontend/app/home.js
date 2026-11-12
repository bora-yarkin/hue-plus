/* The Home tab: the bridge's rooms and zones as cards (on or off, how bright), and a room's page with its scenes and lights, as in the Hue app. The Hue scenes are played, stopped and
 adjusted with the same functions the dashboard's scene rows use (huescenes.js); making one is the Hue app's "Add a scene" (huenewscene.js). */

var HP_ROOM_ICONS = {
  bedroom: "bed",
  kids_bedroom: "bed",
  guest_room: "bed",
  living_room: "sofa",
  lounge: "sofa",
  family_room: "sofa",
  bathroom: "drop",
  toilet: "drop",
  media_room: "tv",
  home_theater: "tv",
  recreation: "tv",
  garage: "home",
};

/* The Hue lights that stand for a room or a zone: one entity each. When Hue Plus hides the Hue integration's own, the visible one is used; with both visible, Hue Plus's. */
function hpGroups() {
  var h = H(),
    by = {};
  Object.keys(h.states).forEach(function (id) {
    var a = h.states[id].attributes,
      e = h.entities[id];
    if (id.indexOf("light.") !== 0 || !a.is_hue_group || (a.hue_type !== "room" && a.hue_type !== "zone") || (e && e.hidden)) return;
    var key = a.hue_type + "|" + a.friendly_name;
    if (!by[key] || (e && e.platform === "hue_plus")) by[key] = id;
  });
  return Object.keys(by)
    .map(function (k) {
      return by[k];
    })
    .sort(function (x, y) {
      return A(x).hue_type === A(y).hue_type ? String(A(x).friendly_name).localeCompare(String(A(y).friendly_name)) : A(x).hue_type === "room" ? -1 : 1;
    });
}

function hpGroupLights(id) {
  return (A(id).entity_id || []).filter(function (m) {
    return m.indexOf("light.") === 0 && H().states[m];
  });
}

function hpLightsOn(id) {
  return hpGroupLights(id).filter(isOn).length;
}

function hpGroupIcon(id) {
  var kind = HP_ROOM_ARCHETYPES[A(id).hue_type + "|" + A(id).friendly_name];
  return A(id).hue_type === "zone" ? "target" : HP_ROOM_ICONS[kind] || "home";
}

/* The icon type of each room and zone, read from the bridge once. */
var HP_ROOM_ARCHETYPES = {};

function hpLoadArchetypes() {
  if (!hueplus.has(H(), "get_resources")) return;
  hueplus.resources(["rooms", "zones"]).then(function (r) {
    (r.rooms || []).forEach(function (g) {
      HP_ROOM_ARCHETYPES["room|" + g.name] = g.archetype;
    });
    (r.zones || []).forEach(function (g) {
      HP_ROOM_ARCHETYPES["zone|" + g.name] = g.archetype;
    });
    refresh();
  }, function () {});
}

function hpPct(id) {
  return isOn(id) ? Math.max(1, Math.round((A(id).brightness || 0) / 2.55)) : 0;
}

function hpSub(id) {
  var n = hpLightsOn(id),
    all = hpGroupLights(id).length;
  if (!n) return _T("off");
  return all > 1 ? n + " " + _T("app_of") + " " + all + " " + _T("app_lights_on") : cntS(n, _T("app_light_on"), _T("app_lights_on"));
}

/* A switch that turns a light or a group on or off. */
function hpSwitch(id, label) {
  var s = mk("button", "sw", "<i></i>");
  s.type = "button";
  s.setAttribute("role", "switch");
  s.setAttribute("aria-label", label);
  s.addEventListener("click", function (e) {
    e.stopPropagation();
    call("light", "toggle", { entity_id: id });
  });
  s.refresh = function () {
    var on = isOn(id);
    s.classList.toggle("on", on);
    s.setAttribute("aria-checked", on ? "true" : "false");
  };
  reg(s.refresh);
  return s;
}

/* The brightness of a light or a group as a bar: a drag sets it, a tap on it sets that brightness. */
function hpBrightness(id) {
  var bar = briControl({
    pct: function () {
      return hpPct(id);
    },
    lit: function () {
      return isOn(id);
    },
    live: function (v) {
      callLive("hp-bri-" + id, "light", "turn_on", { entity_id: id, brightness_pct: v });
    },
    commit: function (v) {
      call("light", "turn_on", { entity_id: id, brightness_pct: v });
    },
    stage: function () {
      return bar;
    },
  });
  bar.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  return bar;
}

function hpRoomCard(id) {
  var card = mk("div", "rcard", "<div class='rh'><span class='ic'></span><span class='rn'><b></b><i></i></span></div>");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.querySelector(".ic").innerHTML = svg(hpGroupIcon(id));
  card.querySelector("b").textContent = A(id).friendly_name;
  card.setAttribute("aria-label", A(id).friendly_name);
  card.querySelector(".rh").appendChild(hpSwitch(id, A(id).friendly_name));
  card.appendChild(hpBrightness(id));
  var sub = card.querySelector("i"),
    ico = card.querySelector(".ic");
  function open() {
    showPopup("app-room:" + id, true);
  }
  card.addEventListener("click", function (e) {
    if (!e.target.closest(".bar,.sw")) open();
  });
  card.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target === card) {
      e.preventDefault();
      open();
    }
  });
  card.refresh = function () {
    card.classList.toggle("on", isOn(id));
    sub.textContent = hpSub(id);
    ico.innerHTML = svg(hpGroupIcon(id));
  };
  reg(card.refresh);
  return card;
}

function hpHomeTab(box) {
  hpLoadArchetypes();
  var groups = hpGroups();
  HPAPP.sigOf = function () {
    return hpGroups().join("|");
  };
  if (!groups.length) {
    box.appendChild(mk("div", "hp-empty")).textContent = _T("app_no_rooms");
    return;
  }
  [["room", "rooms"], ["zone", "hn_zones"]].forEach(function (t) {
    var list = groups.filter(function (id) {
      return A(id).hue_type === t[0];
    });
    if (!list.length) return;
    box.appendChild(mk("div", "hp-label")).textContent = _T(t[1]);
    var grid = mk("div", "hp-rooms");
    list.forEach(function (id) {
      grid.appendChild(hpRoomCard(id));
    });
    box.appendChild(grid);
  });
}

/* ---- a room's page ---- */

/* The scenes of the bridge that belong to a room or zone. */
function hpScenesOf(id) {
  var h = H(),
    a = A(id);
  return Object.keys(h.states)
    .filter(function (s) {
      return HUESCENES.isHue(h, s) && A(s).group_name === a.friendly_name && A(s).group_type === a.hue_type && !(h.entities[s] && h.entities[s].hidden);
    })
    .sort(function (x, y) {
      return String(A(x).name || x).localeCompare(String(A(y).name || y));
    });
}

function hpSceneTile(sid) {
  var t = mk("div", "stile", "<div class='sw2'></div><b></b>");
  t.tabIndex = 0;
  t.setAttribute("role", "button");
  t.querySelector("b").textContent = A(sid).name || sid;
  t.setAttribute("aria-label", A(sid).name || sid);
  var dots = t.querySelector(".sw2");
  hueScenePalette(sid, function (cols) {
    dots.innerHTML = "";
    cols.slice(0, 3).forEach(function (c) {
      var d = mk("i");
      d.style.setProperty("--c", c);
      dots.appendChild(d);
    });
  });
  var more = mk("button", "rb more", svg("tune"));
  more.type = "button";
  more.setAttribute("aria-label", _T("app_scene_settings"));
  more.style.cssText = "position:absolute;right:8px;top:8px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer";
  more.querySelector("svg").style.cssText = "width:16px;height:16px";
  more.addEventListener("click", function (e) {
    e.stopPropagation();
    showPopup("hue-scene:" + sid + "~", true);
  });
  t.appendChild(more);
  function play() {
    hueSceneToggle(sid);
  }
  t.addEventListener("click", play);
  t.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target === t) {
      e.preventDefault();
      play();
    }
  });
  t.refresh = function () {
    t.classList.toggle("on", HUESCENES.active(H(), sid));
  };
  reg(t.refresh);
  return t;
}

function hpLightTile(lid) {
  var t = mk("div", "ltile", "<div class='top2'><span class='ic'></span></div><div><b></b><i></i></div>");
  t.tabIndex = 0;
  t.setAttribute("role", "button");
  t.querySelector(".ic").innerHTML = svg(hpLightIcon(lid));
  t.querySelector("b").textContent = A(lid).friendly_name || lid;
  t.setAttribute("aria-label", A(lid).friendly_name || lid);
  t.querySelector(".top2").appendChild(hpSwitch(lid, A(lid).friendly_name || lid));
  var sub = t.querySelector("i");
  function open() {
    showPopup("app-light:" + lid, true);
  }
  t.addEventListener("click", function (e) {
    if (!e.target.closest(".sw")) open();
  });
  t.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target === t) {
      e.preventDefault();
      open();
    }
  });
  t.refresh = function () {
    var gone = V_(lid) === "unavailable";
    t.classList.toggle("on", isOn(lid));
    t.classList.toggle("gone", gone);
    sub.textContent = gone ? _T("hm_unreachable") : isOn(lid) ? hpPct(lid) + "%" : _T("off");
  };
  reg(t.refresh);
  return t;
}

/* The icon of a light from the shape the Hue app draws for its archetype (a name check: the bridge's archetype is not on the entity). */
function hpLightIcon(lid) {
  var n = String(A(lid).friendly_name || "").toLowerCase();
  if (/strip|tube|play|gradient/.test(n)) return "strip";
  if (/ceiling|pendant|top/.test(n)) return "ceiling";
  if (/floor/.test(n)) return "floor";
  if (/desk|table|lamp/.test(n)) return "lamp";
  return "light";
}

function hpRoomPage(body, id) {
  if (!H().states[id]) {
    body.appendChild(mk("div", "hp-empty")).textContent = _T("nothing_found");
    return;
  }
  hmBox(body);
  body.appendChild(hmTitle(hpGroupIcon(id), function () {
    return A(id).friendly_name || id;
  }, function () {
    return hpSub(id);
  }));
  var big = hmGroup([
    hmRow({
      title: function () {
        return isOn(id) ? _T("on_2") : _T("off");
      },
      toggle: {
        get: function () {
          return isOn(id);
        },
        set: function () {
          call("light", "toggle", { entity_id: id });
        },
      },
    }),
  ]);
  body.appendChild(big);
  var barBox = mk("div");
  barBox.style.margin = "0 0 8px";
  barBox.appendChild(hpBrightness(id));
  body.appendChild(barBox);

  var scenes = hpScenesOf(id),
    canMake = hueplus.has(H(), "create_scene") && isAdmin();
  body.appendChild(hmLabel(_T("scenes")));
  var grid = mk("div", "stiles");
  scenes.forEach(function (sid) {
    grid.appendChild(hpSceneTile(sid));
  });
  if (canMake) {
    var add = mk("button", "stile add", ic("plus") + "<b></b>");
    add.type = "button";
    add.querySelector("b").textContent = _T("hn_add_a_scene");
    add.addEventListener("click", function () {
      hueStartMaker("app:" + id);
    });
    grid.appendChild(add);
  }
  if (!scenes.length && !canMake) grid.appendChild(mk("div", "hp-empty")).textContent = _T("hw_no_scenes_here");
  body.appendChild(grid);

  body.appendChild(hmLabel(_T("lights")));
  var tiles = mk("div", "ltiles");
  hpGroupLights(id).forEach(function (lid) {
    tiles.appendChild(hpLightTile(lid));
  });
  body.appendChild(tiles);

  if (isAdmin() && hueplus.has(H(), "update_room"))
    body.appendChild(
      hmGroup([
        hmRow({
          icon: "edit",
          title: _T(A(id).hue_type === "zone" ? "app_edit_zone" : "app_edit_room"),
          tap: function () {
            hpEditGroup(id);
          },
        }),
      ])
    );
}

/* The room's or zone's own page for changing its name, devices or lights, and deleting it (the Hue Plus menu's, huerooms.js). */
function hpEditGroup(id) {
  hueplus.resources(["rooms", "zones"]).then(
    function (r) {
      var type = A(id).hue_type,
        g = (type === "zone" ? r.zones : r.rooms || []).filter(function (x) {
          return x.name === A(id).friendly_name;
        })[0];
      if (g) hrwStart(type, g);
      else toast(_T("nothing_found"));
    },
    function () {
      toast(_T("hn_couldn_t_read_the_hue_bridge"));
    }
  );
}

HC.registerPage(
  "app-room",
  function (id) {
    return A(id).friendly_name || _T("home");
  },
  "home",
  hpRoomPage
);
