/* The Home tab and a room's page, as in the Hue app: the home's name over a card for each room and zone (its icon, name, a switch and a brightness bar, gold while the lights are on), and a room's page with
 its coloured header, its scenes, its lights and its controls. The scenes are played, stopped and adjusted with the functions the dashboard's scene rows use (huescenes.js); making one is the app's "Add a scene"
 (huenewscene.js); a light opens as the colour screen (light.js). Everything shown is what the bridge says; nothing is kept in Home Assistant. */

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

/* The lights of a room or zone. The group lists them by entity when it can; the bridge's rooms list them by name (the `lights` attribute), and then the Hue Plus lights of those names are the room's. */
function hpGroupLights(id) {
  var h = H(),
    a = A(id),
    listed = (a.entity_id || []).filter(function (m) {
      return m.indexOf("light.") === 0 && h.states[m];
    });
  if (listed.length) return listed;
  var names = Array.isArray(a.lights) ? a.lights : [];
  return Object.keys(h.states)
    .filter(function (m) {
      var b = h.states[m].attributes,
        e = h.entities[m];
      return m.indexOf("light.") === 0 && b.hue_light_id && !b.is_hue_group && !(e && e.hidden) && names.indexOf(b.friendly_name) >= 0;
    })
    .sort();
}

function hpGroupIcon(id) {
  var kind = HP_ROOM_ARCHETYPES[A(id).hue_type + "|" + A(id).friendly_name];
  return A(id).hue_type === "zone" ? "target" : HP_ROOM_ICONS[kind] || "home";
}

/* The icon type of each room and zone, read from the bridge once. */
var HP_ROOM_ARCHETYPES = {};

function hpLoadArchetypes() {
  if (!hueplus.has(H(), "get_resources")) return;
  hueplus.resources(["rooms", "zones"]).then(
    function (r) {
      (r.rooms || []).forEach(function (g) {
        HP_ROOM_ARCHETYPES["room|" + g.name] = g.archetype;
      });
      (r.zones || []).forEach(function (g) {
        HP_ROOM_ARCHETYPES["zone|" + g.name] = g.archetype;
      });
      refresh();
    },
    function () {}
  );
}

function hpPct(id) {
  return isOn(id) ? Math.max(1, Math.round((A(id).brightness || 0) / 2.55)) : 0;
}

/* ---- the colour a lit card takes: the light's own, lightened at the top and deepened at the bottom, as the app draws it ---- */

function hpMix(a, b, t) {
  return [0, 1, 2].map(function (i) {
    return Math.round(a[i] + (b[i] - a[i]) * t);
  });
}

function hpRgbOf(id) {
  var a = A(id);
  if (a.color_mode === "color_temp" || !a.hs_color) return a.color_temp_kelvin ? HC.ui.kelvinRgb(a.color_temp_kelvin) : [246, 205, 114];
  var hs = a.hs_color,
    c = (hs[1] / 100) * 0.8,
    h = hs[0] / 60,
    x = c * (1 - Math.abs((h % 2) - 1)),
    t = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ][Math.floor(h) % 6],
    m = 0.95 - c;
  return t.map(function (v) {
    return Math.round((v + m) * 255);
  });
}

/* Gives a card or a tile the two colours of its gradient from the lights that are on in it, and tells whether it is lit. A white light is the app's gold; a coloured one takes its colour. */
function hpGold(el, ids) {
  var on = ids.filter(isOn);
  el.classList.toggle("on-gold", on.length > 0);
  if (!on.length) return;
  var a = A(on[0]),
    white = a.color_mode === "color_temp" || !a.hs_color;
  if (white) {
    el.style.removeProperty("--gold1");
    el.style.removeProperty("--gold2");
    return;
  }
  var rgb = hpRgbOf(on[0]);
  el.style.setProperty("--gold1", "rgb(" + hpMix(rgb, [255, 255, 255], 0.38).join(",") + ")");
  el.style.setProperty("--gold2", "rgb(" + hpMix(rgb, [90, 70, 30], 0.2).join(",") + ")");
}

/* ---- the parts ---- */

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

function hpLightToggle(id, label) {
  return hpToggle(
    label,
    function () {
      return isOn(id);
    },
    function () {
      call("light", "toggle", { entity_id: id });
    }
  );
}

/* A light's or a group's brightness: a drag sets it, a tap on the bar sets that brightness. */
function hpSlider(id) {
  var s = mk("div", "sl", "<span class='kn'></span>"),
    kn = s.querySelector(".kn"),
    drag = false,
    at = 0;
  s.setAttribute("role", "slider");
  s.setAttribute("aria-label", _T("brightness"));
  s.tabIndex = 0;
  function put(p) {
    kn.style.left = p + "%";
    s.setAttribute("aria-valuenow", Math.round(p));
  }
  attachSlide(s, {
    onMove: function (f) {
      drag = true;
      var v = Math.max(1, Math.round(f * 100));
      put(v);
      if (Date.now() - at > 150) {
        at = Date.now();
        callLive("hp-bri-" + id, "light", "turn_on", { entity_id: id, brightness_pct: v });
      }
    },
    onCommit: function (f) {
      var v = Math.max(1, Math.round(f * 100));
      put(v);
      call("light", "turn_on", { entity_id: id, brightness_pct: v });
      setTimeout(function () {
        drag = false;
      }, 600);
    },
    onCancel: function () {
      drag = false;
    },
  });
  s.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  s.refresh = function () {
    if (!drag) put(hpPct(id));
  };
  reg(s.refresh);
  return s;
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

/* ---- Home ---- */

function hpRoomCard(id) {
  var name = A(id).friendly_name,
    card = mk("div", "room", "<div class='rh'><span class='ic'></span><span class='rn'></span></div>"),
    ico = card.querySelector(".ic");
  card.querySelector(".rn").textContent = name;
  card.setAttribute("aria-label", name);
  card.querySelector(".rh").appendChild(hpLightToggle(id, name));
  card.appendChild(hpSlider(id));
  hpActive(card, function () {
    showPopup("app-room:" + id, true);
  });
  card.refresh = function () {
    hpGold(card, [id]);
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
  var rooms = groups.filter(function (id) {
    return A(id).hue_type === "room";
  });
  var head = mk("div", "hd", "<h1></h1><div class='acts'></div>");
  head.querySelector("h1").textContent = _T("home");
  if (rooms.length)
    head.querySelector(".acts").appendChild(
      hpToggle(
        _T("app_all_lights"),
        function () {
          return rooms.some(isOn);
        },
        function () {
          call("light", rooms.some(isOn) ? "turn_off" : "turn_on", { entity_id: rooms });
        }
      )
    );
  box.appendChild(head);
  if (!groups.length) {
    box.appendChild(mk("div", "empty")).textContent = _T("app_no_rooms");
    return;
  }
  [
    ["room", "rooms"],
    ["zone", "hn_zones"],
  ].forEach(function (t) {
    var list = groups.filter(function (id) {
      return A(id).hue_type === t[0];
    });
    if (!list.length) return;
    box.appendChild(mk("div", "lb")).textContent = _T(t[1]);
    var grid = mk("div", "rooms");
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

/* The icon of a light from the shape the Hue app draws for its archetype (a name check: the bridge's archetype is not on the entity). */
function hpLightIcon(lid) {
  var n = String(A(lid).friendly_name || "").toLowerCase();
  if (/strip|tube|play|gradient/.test(n)) return "strip";
  if (/ceiling|pendant|top/.test(n)) return "ceiling";
  if (/floor/.test(n)) return "floor";
  if (/desk|table|lamp/.test(n)) return "lamp";
  return "light";
}

function hpLightTile(lid, room) {
  var name = A(lid).friendly_name || lid,
    t = mk("div", "ltile", "<div class='up'><span class='ic'></span><b></b></div><div class='dn'></div>");
  t.querySelector(".ic").innerHTML = svg(hpLightIcon(lid));
  t.querySelector("b").textContent = name;
  t.setAttribute("aria-label", name);
  t.querySelector(".dn").appendChild(hpLightToggle(lid, name));
  hpActive(t, function () {
    HPAPP.lightFrom = t.getBoundingClientRect().top;
    showPopup("app-lights:" + room + "~" + lid, true);
  });
  t.refresh = function () {
    hpGold(t, [lid]);
    t.classList.toggle("gone", V_(lid) === "unavailable");
  };
  reg(t.refresh);
  return t;
}

/* When a switch was last pressed: the newest state of the event entities of its device ("Nov 11, 18:33"). */
function hpLastUsed(deviceName) {
  var h = H(),
    newest = 0;
  Object.keys(h.states).forEach(function (id) {
    if (id.indexOf("event.") !== 0) return;
    var e = h.entities[id],
      dev = e && e.device_id && h.devices[e.device_id],
      t = Date.parse(h.states[id].state);
    if (dev && dev.name === deviceName && t > newest) newest = t;
  });
  return newest ? new Date(newest).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : "";
}

/* The switches and dials the bridge has in this room: the app lists them under Controls. */
function hpControls(box, id) {
  if (!hueplus.has(H(), "get_resources")) return;
  /* Read before the room opens (hpStart asks for it), so the controls are there when the page is, not after. */
  function draw() {
    var type = A(id).hue_type,
      group = (type === "zone" ? HM.zones : HM.rooms || []).filter(function (x) {
        return x.name === A(id).friendly_name;
      })[0],
      inside = {};
    if (group)
      (group.children || []).forEach(function (c) {
        inside[c.id] = true;
      });
    var list = (HM.accessories || []).filter(function (x) {
      return inside[x.id];
    });
    if (!list.length) return;
    box.appendChild(mk("div", "lb")).textContent = _T("app_controls");
    var tiles = mk("div", "ctiles");
    list.forEach(function (x) {
      var c = mk("div", "ctile", "<span class='ic'></span><div><b></b><i></i></div>");
      c.querySelector(".ic").innerHTML = svg("switch");
      c.querySelector("b").textContent = x.name;
      c.querySelector("i").textContent = hpLastUsed(x.name) || cntS((x.buttons || []).length, _T("hm_button"), _T("hm_buttons"));
      hpActive(c, function () {
        showPopup("hue-switch:" + x.id, true);
      });
      tiles.appendChild(c);
    });
    box.appendChild(tiles);
  }
  if (HM_READY) draw();
  else hmReady().then(draw, function () {});
}

/* The list under the three dots of the room's page, as the app's: a sheet from the bottom with its choices and Cancel. */
function hpActions(items) {
  var scrim = mk("div", "scrim"),
    sheet = mk("div", "asheet");
  items.concat([{ label: _T("cancel") }]).forEach(function (it, i, all) {
    var b = mk("button", "arow" + (it.danger ? " danger" : "") + (i === all.length - 1 ? " cancel" : ""));
    b.type = "button";
    b.textContent = it.label;
    b.addEventListener("click", function () {
      scrim.remove();
      sheet.remove();
      if (it.fn) it.fn();
    });
    sheet.appendChild(b);
  });
  scrim.addEventListener("click", function () {
    scrim.remove();
    sheet.remove();
  });
  document.body.appendChild(scrim);
  document.body.appendChild(sheet);
  requestAnimationFrame(function () {
    scrim.classList.add("in");
  });
}

function hpRoomPage(body, id) {
  if (!H().states[id]) {
    body.appendChild(mk("div", "empty")).textContent = _T("nothing_found");
    return;
  }
  body.parentNode.classList.add("roompg");
  var name = A(id).friendly_name,
    zone = A(id).hue_type === "zone",
    admin = isAdmin(),
    head = mk("div", "rhead", "<div class='rr'><span class='nm'></span></div>"),
    row = head.querySelector(".rr");
  head.querySelector(".nm").textContent = name;
  row.insertBefore(hpRound("back", _T("back"), popBack), row.firstChild);
  if (admin) {
    row.appendChild(
      hpRound("plus", _T("app_add"), function () {
        showPopup("app-add:" + id, true);
      })
    );
    row.appendChild(
      hpRound("dots", _T("app_more"), function () {
        hpActions([
          {
            label: _T(zone ? "app_edit_zone" : "app_edit_room"),
            fn: function () {
              hpEditGroup(id);
            },
          },
          {
            label: _T(zone ? "app_delete_zone" : "app_delete_room"),
            danger: true,
            fn: function () {
              hpDeleteGroup(id);
            },
          },
        ]);
      })
    );
  }
  row.appendChild(hpLightToggle(id, name));
  head.appendChild(hpSlider(id));
  head.refresh = function () {
    hpGold(head, [id]);
  };
  reg(head.refresh);
  body.appendChild(head);

  var page = mk("div", "rbody");
  body.appendChild(page);

  page.appendChild(mk("div", "lb")).textContent = _T("app_my_scenes");
  hpFolderRows(page, id);
  if (!hpScenesOf(id).length) page.appendChild(mk("div", "empty")).textContent = _T("hw_no_scenes_here");

  page.appendChild(mk("div", "lb")).textContent = _T("lights");
  var tiles = mk("div", "ltiles");
  hpGroupLights(id).forEach(function (lid) {
    tiles.appendChild(hpLightTile(lid, id));
  });
  page.appendChild(tiles);

  hpControls(page, id);
}

/* What can be added to a room, as the app asks it: a scene, devices, an automation, a MotionAware area. */
function hpAddPage(body, id) {
  var items = [
    [
      "palette",
      _T("app_add_scene"),
      function () {
        hueStartMaker("app:" + id);
      },
    ],
    [
      "plus",
      _T("app_add_devices"),
      function () {
        showPopup("hue-devices", true);
      },
    ],
    [
      "bolt",
      _T("app_add_automation"),
      function () {
        showPopup("hue-newauto", true);
      },
    ],
    [
      "motion",
      _T("app_add_motionaware"),
      function () {
        showPopup("hue-mw-intro", true);
      },
    ],
  ];
  var title = mk("div", "lb");
  title.textContent = _T("app_tap_to_add") + A(id).friendly_name;
  title.style.margin = "22px 20px 12px";
  body.appendChild(title);
  var grid = mk("div", "addgrid");
  items.forEach(function (it) {
    var t = mk("div", "atile", "<span class='ci'></span><span></span>");
    t.querySelector(".ci").innerHTML = svg(it[0]);
    t.lastChild.textContent = it[1];
    hpActive(t, it[2]);
    grid.appendChild(t);
  });
  body.appendChild(grid);
}

/* The room's or zone's own page for changing its name, devices or lights (the Hue Plus menu's, huerooms.js). */
function hpFindGroup(id, then) {
  hueplus.resources(["rooms", "zones"]).then(
    function (r) {
      var type = A(id).hue_type,
        g = (type === "zone" ? r.zones : r.rooms || []).filter(function (x) {
          return x.name === A(id).friendly_name;
        })[0];
      if (g) then(type, g);
      else toast(_T("nothing_found"));
    },
    function () {
      toast(_T("hn_couldn_t_read_the_hue_bridge"));
    }
  );
}

function hpEditGroup(id) {
  hpFindGroup(id, hrwStart);
}

function hpDeleteGroup(id) {
  hpFindGroup(id, function (type, g) {
    confirmDlg(_T(type === "zone" ? "hrw_delete_this_zone" : "hrw_delete_this_room"), function () {
      var data = { confirm: true };
      data[type] = g.id;
      callRaw("hue_plus", "delete_" + type, data).then(
        function () {
          closeSheet();
        },
        function () {
          toast(_T("hrw_couldn_t_save"));
        }
      );
    });
  });
}

HC.registerPage(
  "app-room",
  function (id) {
    return A(id).friendly_name || _T("home");
  },
  "home",
  hpRoomPage
);
HC.registerPage(
  "app-add",
  function (id) {
    return A(id).friendly_name || _T("home");
  },
  "plus",
  hpAddPage
);
