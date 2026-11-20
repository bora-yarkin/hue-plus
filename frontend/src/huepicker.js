/* The lights picker of the Hue app: "Choose your lights" and "Edit lights". My entire home is a row of its own, and the rooms and zones are rows with a round check on the left and a chevron on the right; the row opens to show
   its lights as tiles, each with a round check, so a room is chosen whole or by single lights. Used wherever the app asks for lights (a button's lights, an automation's lights).
   What is chosen is `state`: { home: boolean, picked: { <room or zone id>: [light ids] } }, and hpkTargets(state, groups) turns it into the `targets` the services take. */

/* The rooms and zones of what the menu read, each with its lights as { id, name, archetype }. A group the bridge answered without its lights (an older Hue Plus) has none and can only be chosen whole. */
function hpkGroups(r) {
  var out = [];
  [
    ["room", r.rooms],
    ["zone", r.zones],
  ].forEach(function (t) {
    (t[1] || []).forEach(function (g) {
      out.push({
        id: g.id,
        name: g.name,
        type: t[0],
        archetype: g.archetype,
        lights: g.light_items || (g.lights || []).map(function (id) {
          return { id: id, name: id, archetype: null };
        }),
        whole: !g.light_items && (g.lights || []).length > 0,
      });
    });
  });
  return out;
}

/* What the services take: the whole home, or one entry for each room or zone with a light chosen: the group alone when every light of it is chosen, else its chosen lights. */
function hpkTargets(state, groups) {
  if (state.home) return [{ group_type: "home" }];
  var out = [];
  groups.forEach(function (g) {
    var ids = state.picked[g.id] || [];
    if (!ids.length) return;
    var every = g.lights.every(function (l) {
      return ids.indexOf(l.id) >= 0;
    });
    out.push(every ? { group: g.name, group_type: g.type } : { group: g.name, group_type: g.type, lights: ids.map(function (id) {
      return (g.lights.filter(function (l) { return l.id === id; })[0] || {}).name || id;
    }) });
  });
  return out;
}

/* The state that matches what an automation or a button has now: its `where` as the bridge keeps it ([{group: {rid, rtype}, items: [{rid}]}]), with the lights of the rooms and zones to fill what a group alone means. */
function hpkStateOf(where, groups) {
  var st = { home: false, picked: {} };
  (where || []).forEach(function (w) {
    var rid = ((w || {}).group || {}).rid,
      type = ((w || {}).group || {}).rtype;
    if (type === "bridge_home") st.home = true;
    var g = groups.filter(function (x) {
      return x.id === rid;
    })[0];
    if (!g) return;
    st.picked[g.id] = (w.items || []).length
      ? w.items.map(function (i) {
          return i.rid;
        })
      : g.lights.map(function (l) {
          return l.id;
        });
  });
  return st;
}

/* Draws the picker into `box`. o = { groups, state, one: only one room or zone, whole (no single lights), change() }: `change` is called after every choice. */
function hpkPicker(box, o) {
  var open = {};
  function circle(on, partial) {
    var c = mk("span", "hpk-ck" + (on ? " on" : partial ? " part" : ""));
    if (on) c.innerHTML = svg("check");
    return c;
  }
  function chosen(g) {
    return o.state.home ? g.lights.length : (o.state.picked[g.id] || []).length;
  }
  function setHome() {
    o.state.home = !o.state.home;
    if (o.state.home) o.state.picked = {};
    done();
  }
  function setGroup(g) {
    var all = chosen(g) === g.lights.length && g.lights.length > 0;
    if (o.state.home) {
      o.state.home = false;
      o.state.picked = {};
    }
    if (o.one) o.state.picked = {};
    o.state.picked[g.id] = all ? [] : g.lights.map(function (l) {
      return l.id;
    });
    if (!o.state.picked[g.id].length) delete o.state.picked[g.id];
    done();
  }
  function setLight(g, l) {
    if (o.state.home) {
      o.state.home = false;
      o.state.picked = {};
    }
    var ids = (o.state.picked[g.id] || []).slice(),
      at = ids.indexOf(l.id);
    if (at >= 0) ids.splice(at, 1);
    else ids.push(l.id);
    if (ids.length) o.state.picked[g.id] = ids;
    else delete o.state.picked[g.id];
    done();
  }
  function done() {
    draw();
    if (o.change) o.change();
  }
  function sub(g) {
    var n = chosen(g);
    if (!n) return "";
    return n === g.lights.length ? _T("hpk_entire_" + g.type) : cntS(n, _T("hm_light"), _T("hm_lights"));
  }
  function groupRow(g) {
    var n = chosen(g),
      canOpen = !o.whole && !g.whole && g.lights.length > 0,
      row = mk("div", "hpk-row" + (open[g.id] ? " open" : "")),
      head = mk("div", "hpk-head", "<span class='hpk-t'><span class='hpk-n'></span><span class='hpk-s'></span></span>");
    head.querySelector(".hpk-n").textContent = g.name;
    head.querySelector(".hpk-s").textContent = sub(g);
    var ck = circle(n > 0 && n === g.lights.length, n > 0 && n < g.lights.length);
    ck.setAttribute("role", "checkbox");
    ck.setAttribute("aria-checked", n > 0 ? "true" : "false");
    ck.setAttribute("aria-label", g.name);
    ck.tabIndex = 0;
    ck.addEventListener("click", function (e) {
      e.stopPropagation();
      setGroup(g);
    });
    head.insertBefore(ck, head.firstChild);
    if (canOpen) {
      var chev = mk("span", "hpk-chev");
      chev.innerHTML = svg("chev");
      head.appendChild(chev);
    }
    head.addEventListener("click", function () {
      if (!canOpen) return setGroup(g);
      open[g.id] = !open[g.id];
      draw();
    });
    row.appendChild(head);
    if (canOpen && open[g.id]) {
      var tiles = mk("div", "hpk-tiles");
      g.lights.forEach(function (l) {
        var on = o.state.home || (o.state.picked[g.id] || []).indexOf(l.id) >= 0,
          t = mk("div", "hpk-tile", "<span class='hpk-ic'></span><b></b>");
        var icon = hpArchetypeIcon(l.archetype) || "lamp";
        t.querySelector(".hpk-ic").innerHTML = svg(icon);
        t.querySelector("b").textContent = l.name;
        t.appendChild(circle(on, false));
        t.setAttribute("role", "checkbox");
        t.setAttribute("aria-checked", on ? "true" : "false");
        t.tabIndex = 0;
        t.addEventListener("click", function () {
          setLight(g, l);
        });
        tiles.appendChild(t);
      });
      row.appendChild(tiles);
    }
    return row;
  }
  function draw() {
    box.innerHTML = "";
    if (!o.one) {
      var home = mk("div", "hpk-row"),
        head = mk("div", "hpk-head", "<span class='hpk-t'><span class='hpk-n'></span></span>");
      head.querySelector(".hpk-n").textContent = _T("hpk_my_entire_home");
      head.insertBefore(circle(o.state.home, false), head.firstChild);
      head.addEventListener("click", setHome);
      home.appendChild(head);
      box.appendChild(home);
    }
    [
      ["room", "hn_rooms"],
      ["zone", "hn_zones"],
    ].forEach(function (t) {
      var list = o.groups.filter(function (g) {
        return g.type === t[0];
      });
      if (!list.length) return;
      box.appendChild(hmLabel(_T(t[1])));
      var wrap = mk("div", "hpk-list");
      list.forEach(function (g) {
        wrap.appendChild(groupRow(g));
      });
      box.appendChild(wrap);
    });
  }
  draw();
}
