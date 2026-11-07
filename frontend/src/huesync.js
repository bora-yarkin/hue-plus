/* ---- Hue Spotify sync (the sync module of the Philips Hue Plus integration) ---- */

var HUESYNC = {
 /* What each of its entities is for. The registry's unique_id of an entity is "<bridge>_sync_<key>". */
 keys:["sync","now_playing","brightness","light_delay","intensity","palette","style","area"],
 keyOf:function(h,id){
  var e=h.entities[id];
  if(!e||e.platform!=="hue_plus"||!e.unique_id)return null;
  return HUESYNC.keys.filter(function(k){var tail="_sync_"+k;return e.unique_id.length>tail.length&&e.unique_id.slice(-tail.length)===tail})[0]||null;
 },
 /* The entities of the bridge that owns entity `id`, as {sync, now_playing, brightness, light_delay, intensity, palette, style, area}
  (a key is missing when that entity is disabled), or null when `id` is not a sync entity. */
 entities:function(h,id){
  var key=HUESYNC.keyOf(h,id);
  if(!key)return null;
  var uid=h.entities[id].unique_id,bridge=uid.slice(0,uid.length-key.length-6),out={};
  Object.keys(h.entities).forEach(function(k){
   var e=h.entities[k],kk=e.platform==="hue_plus"&&e.unique_id&&e.unique_id.indexOf(bridge+"_sync_")===0?HUESYNC.keyOf(h,k):null;
   if(kk&&e.unique_id===bridge+"_sync_"+kk)out[kk]=k;
  });
  return out.sync?out:null;
 },
 isSync:function(h,id){return HUESYNC.keyOf(h,id)==="sync"}
};

/* ---- Hue Play HDMI Sync Box (an entry of the Philips Hue Plus integration) ---- */

var HUESYNCBOX = {
 /* What each of its entities is for. The registry's unique_id of an entity is "<box>_syncbox_<key>". */
 keys:["sync","mode","source","intensity","brightness","hdmi_signal"],
 keyOf:function(h,id){
  var e=h.entities[id];
  if(!e||e.platform!=="hue_plus"||!e.unique_id)return null;
  var at=e.unique_id.indexOf("_syncbox_");
  if(at<0)return null;
  var key=e.unique_id.slice(at+9);
  return HUESYNCBOX.keys.indexOf(key)>=0?key:null;
 },
 /* The entities of the box that owns entity `id`, as {sync, mode, source, intensity, brightness, hdmi_signal}, or null when `id` is not
  an entity of a sync box (or the box has no sync switch). */
 entities:function(h,id){
  var key=HUESYNCBOX.keyOf(h,id);
  if(!key)return null;
  var uid=h.entities[id].unique_id,box=uid.slice(0,uid.indexOf("_syncbox_")),out={};
  Object.keys(h.entities).forEach(function(k){
   var e=h.entities[k],kk=e.platform==="hue_plus"&&e.unique_id&&e.unique_id.indexOf(box+"_syncbox_")===0?HUESYNCBOX.keyOf(h,k):null;
   if(kk&&e.unique_id===box+"_syncbox_"+kk)out[kk]=k;
  });
  return out.sync?out:null;
 },
 isBox:function(h,id){return HUESYNCBOX.keyOf(h,id)==="sync"}
};

/* Spotify sync (the sync module of the Philips Hue Plus integration, Hue's music sync): its row, which looks like a light, its popup, laid out like the Hue app's Sync tab (what plays, four settings, the area and the button that starts and stops the sync), and which lights it plays on. A setting opens a popup over the main one, as the effect settings do over the lights popup, so that popup stays as it is underneath. */

var HS_STYLE_ICON = { Classic: "eq", Pulse: "pulsebars" };
var HS_WAVE = { auto: "sparkle", subtle: "wave1", moderate: "wave2", high: "wave3", extreme: "wave4" };

/* The popups opened over the main one: key -> [title string, icon, builder]. */
var HS_PICK = {
  "hsync-style": ["style", "eq", hsStylePopup],
  "hsync-intensity": ["intensity", "wave3", hsIntensityPopup],
  "hsync-colour": ["colour", "palette", hsColourPopup],
  "hsync-area": ["area", "lights", hsAreaPopup],
  "hsync-delay": ["light_delay", "clock", hsDelayPopup],
};

function hsKnown(id) {
  var v = V_(id);
  return v !== "unknown" && v !== "unavailable" && v !== "";
}

function hsNumber(id) {
  return hsKnown(id) && !isNaN(Number(V_(id))) ? Number(V_(id)) : null;
}

/* The colours of a palette as a CSS gradient, or "" for a palette without colours (Auto). */
function hsGradient(rgbs) {
  return rgbs && rgbs.length
    ? "linear-gradient(90deg," +
        rgbs
          .map(function (c) {
            return "rgb(" + c.join(",") + ")";
          })
          .join(",") +
        ")"
    : "";
}

function hsPick(E, key, option) {
  call("select", "select_option", { entity_id: E[key], option: option });
  closeLayer();
}

function hsOpenLayer(key, id) {
  showPopup(key + ":" + id, false, true);
}

/* A control that is not a button element: it answers Enter and Space as a click does. */
function hsPress(el, fn) {
  el.tabIndex = 0;
  el.addEventListener("click", fn);
  el.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  });
}

/* ---- the row, and the lights it plays on ---- */

/* The Spotify sync as a row of the Lights section: it looks and works like a light. The bar is the brightness, the icon starts and stops the sync (while it runs the icon shows the stop button, as while an effect plays), a tap or a press and hold opens the popup. */
function hsyncRow(d) {
  var id = d.id,
    E = HUESYNC.entities(H(), id),
    pk = "hsync:" + id,
    icon = d.icon || "syncring";
  if (!E)
    return pill(icon, d.name, {
      tap: function () {
        showPopup(pk, true);
      },
    });
  var r = mk("div", "pill pane slide");
  r.innerHTML =
    "<div class='fill'></div>" +
    ic(icon) +
    "<span class='tx'><span class='nm'></span><span class='sb'></span></span><span class='vl'></span>";
  r.dataset.pin = JSON.stringify(pinPop(pk, id, d.name, icon));
  r.querySelector(".nm").textContent = d.name;
  var fill = r.querySelector(".fill"),
    vl = r.querySelector(".vl"),
    sb = r.querySelector(".sb"),
    drag = false,
    was = null,
    liveT = 0,
    liveAt = 0;
  function pct() {
    return isOn(id) ? hsNumber(E.brightness) || 0 : 0;
  }
  /* While dragging the brightness follows: at most one command every 150 ms, and the last position always arrives. */
  function sendLive(p) {
    var wait = liveAt + 150 - Date.now();
    clearTimeout(liveT);
    function go() {
      liveAt = Date.now();
      callLive("hs-bri", "number", "set_value", { entity_id: E.brightness, value: p });
    }
    if (wait <= 0) go();
    else liveT = setTimeout(go, wait);
  }
  attachSlide(r, {
    onMove: function (f) {
      drag = true;
      var p = Math.max(1, Math.round(f * 100));
      fill.style.width = p + "%";
      vl.textContent = p + "%";
      inkRow(r, r._ink, p);
      sendLive(p);
    },
    onCommit: function (f) {
      var p = Math.max(1, Math.round(f * 100));
      clearTimeout(liveT);
      call("number", "set_value", { entity_id: E.brightness, value: p });
      if (!isOn(id)) call("switch", "turn_on", { entity_id: id });
      setTimeout(function () {
        drag = false;
      }, 800);
    },
    onCancel: function () {
      drag = false;
    },
    onHold: function () {
      showPopup(pk, true);
    },
    onTap: function (t) {
      drag = false;
      if (t && t.closest(".ic")) call("switch", isOn(id) ? "turn_off" : "turn_on", { entity_id: id });
      else showPopup(pk, true);
    },
  });
  r.refresh = function () {
    var on = isOn(id),
      i = r.querySelector(".ic"),
      cc = on && pageFill();
    i.classList.toggle("fx", on);
    if (on && !i.querySelector(".ic-stop")) i.appendChild(mk("span", "ic-stop", "<i></i>"));
    r.classList.toggle("on", on);
    if (was !== null && on !== was) pop(r);
    was = on;
    r._ink = on ? cssToRgb(pageFill()) : null;
    sb.textContent = on && hsKnown(E.now_playing) ? V_(E.now_playing) : "";
    if (cc) {
      fill.style.background =
        "linear-gradient(180deg,color-mix(in srgb," + cc + " 88%,transparent),color-mix(in srgb," + cc + " 64%,transparent))";
      fill.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.35)";
    } else {
      fill.style.background = "";
      fill.style.boxShadow = "";
    }
    if (drag) return;
    fill.style.width = pct() + "%";
    vl.textContent = on ? pct() + "%" : V_(id) === "unavailable" ? _T("unavailable") : _T("off");
    inkRow(r, r._ink, pct());
  };
  reg(r.refresh);
  return r;
}

/* The Hue ids of the lights each running Spotify sync plays on (the lights of its area): [{sw, rids}]. Every light row asks, so it is rebuilt at most every 400 ms. */
var HS_RUN = { at: 0, list: [] };

function hsRunning() {
  var now = Date.now();
  if (now - HS_RUN.at < 400) return HS_RUN.list;
  HS_RUN.at = now;
  HS_RUN.list = [];
  var h = H();
  Object.keys(h.entities || {}).forEach(function (k) {
    if (!HUESYNC.isSync(h, k) || !isOn(k)) return;
    var E = HUESYNC.entities(h, k);
    HS_RUN.list.push({ sw: k, rids: (E && E.area && A(E.area).light_ids) || [] });
  });
  return HS_RUN.list;
}

/* The id Hue knows a light by: a Hue light's own id, or the one a light made of zones (Hue gradient zones) is built on. */
function hsLightRid(id) {
  var e = (H().entities || {})[id];
  return A(id).hue_light_id || (e && e.platform === "hue" && dom(id) === "light" ? e.unique_id : null);
}

/* The Spotify sync switch that plays on light `id` (the light itself, or any member of a group), or "". */
function lightSyncPlays(id, seen) {
  var run = hsRunning();
  if (!run.length) return "";
  var rid = hsLightRid(id),
    hit = rid
      ? run.filter(function (x) {
          return x.rids.indexOf(rid) >= 0;
        })[0]
      : null;
  if (hit) return hit.sw;
  seen = seen || {};
  seen[id] = 1;
  var found = "";
  lightMembers(id).forEach(function (m) {
    if (!found && !seen[m]) found = lightSyncPlays(m, seen);
  });
  return found;
}

/* The brightness the Spotify sync `sw` plays at, for a light row that shows it. */
function hsyncPct(sw) {
  var E = HUESYNC.entities(H(), sw);
  return (E && hsNumber(E.brightness)) || 0;
}

/* ---- the popup ---- */

/* The cover comes from Spotify's own image servers; anything else is not shown. */
var HS_ART_OK = /^https:\/\/[a-z0-9.-]+\.scdn\.co\//;

function hsArt(box, url) {
  var want = url && HS_ART_OK.test(url) ? url : "";
  if (box.dataset.art === want) return;
  box.dataset.art = want;
  var img = box.querySelector("img");
  if (img) img.remove();
  box.classList.toggle("has-art", !!want);
  if (!want) return;
  img = mk("img");
  img.alt = "";
  img.referrerPolicy = "no-referrer";
  img.addEventListener("error", function () {
    img.remove();
    box.classList.remove("has-art");
  });
  img.src = want;
  box.appendChild(img);
}

function hsNow(E) {
  var box = mk("div", "hs-now"),
    art = mk("div", "hs-art", svg("note")),
    st = mk("div", "hs-st"),
    tt = mk("div", "hs-tt"),
    sub = mk("div", "hs-sub");
  [art, st, tt, sub].forEach(function (el) {
    box.appendChild(el);
  });
  reg(function () {
    var a = A(E.now_playing),
      has = hsKnown(E.now_playing);
    st.textContent =
      V_(E.sync) === "unavailable"
        ? _T("unavailable")
        : !has
          ? _T("nothing_playing")
          : a.is_playing === true
            ? _T("playing")
            : a.is_playing === false
              ? _T("paused")
              : "";
    tt.textContent = has ? V_(E.now_playing) : "";
    sub.textContent = has
      ? [(a.artists || []).join(", "), a.album].filter(Boolean).join(" • ")
      : "";
    tt.style.display = sub.style.display = has ? "" : "none";
    hsArt(art, has ? a.album_art_url : "");
  });
  return box;
}

/* One of the settings: a caption over a round-ended button that opens its popup. `paint(button, icon)` fills it and returns what it shows in words, for screen readers. */
function hsTile(caption, key, id, paint) {
  var col = mk("div", "hs-col"),
    t = mk("div", "hs-tile", "<span class='hs-i'></span>"),
    i = t.querySelector(".hs-i");
  col.appendChild(mk("div", "hs-cap")).textContent = caption;
  t.setAttribute("role", "button");
  hsPress(t, function () {
    hsOpenLayer(key, id);
  });
  reg(function () {
    var words = paint(t, i);
    t.setAttribute("aria-label", caption + ": " + words);
    t.title = words;
  });
  col.appendChild(t);
  return col;
}

/* Style, intensity and colour open a popup each; brightness is the button of the light popup, with its slider that rises from it. `root` is dimmed while that slider is open. */
function hsSettings(id, E, root) {
  var g = mk("div", "hs-set");
  g.appendChild(
    hsTile(_T("style"), "hsync-style", id, function (t, i) {
      var s = V_(E.style);
      i.innerHTML = svg(HS_STYLE_ICON[s] || "eq");
      return hsKnown(E.style) ? s : "–";
    })
  );
  g.appendChild(
    hsTile(_T("intensity"), "hsync-intensity", id, function (t, i) {
      var s = V_(E.intensity);
      i.innerHTML = svg(HS_WAVE[s] || "wave3");
      return hsKnown(E.intensity) ? cap(s) : "–";
    })
  );
  g.appendChild(
    hsTile(_T("colour"), "hsync-colour", id, function (t, i) {
      var s = V_(E.palette),
        grad = hsGradient((A(E.palette).colors || {})[s] || []);
      t.style.background = grad;
      t.classList.toggle("hs-grad", !!grad);
      i.innerHTML = grad ? "" : svg("sparkle");
      return hsKnown(E.palette) ? cap(s) : "–";
    })
  );
  var col = mk("div", "hs-col");
  col.appendChild(mk("div", "hs-cap")).textContent = _T("brightness");
  col.appendChild(
    briControl({
      pct: function () {
        return hsNumber(E.brightness) || 0;
      },
      lit: function () {
        return isOn(E.sync);
      },
      live: function (v) {
        callLive("hs-bri", "number", "set_value", { entity_id: E.brightness, value: Math.max(1, v) });
      },
      commit: function (v) {
        call("number", "set_value", { entity_id: E.brightness, value: Math.max(1, v) });
      },
      stage: function () {
        return root;
      },
    })
  );
  g.appendChild(col);
  return g;
}

/* The bar at the bottom, as in the Hue app: where the music plays, the button that starts and stops the sync, and the area. */
function hsBar(id, E) {
  var bar = mk("div", "hs-bar pane"),
    left = mk("div", "hs-side"),
    right = mk("div", "hs-side hs-btn"),
    go = mk("div", "hs-go", svg("syncring")),
    dev = mk("div", "hs-nm"),
    area = mk("div", "hs-nm");
  left.innerHTML = ic("speaker");
  left.appendChild(mk("div", "hs-cap")).textContent = _T("playing_on");
  left.appendChild(dev);
  right.innerHTML = ic("lights");
  right.appendChild(mk("div", "hs-cap")).textContent = _T("area");
  right.appendChild(area);
  right.setAttribute("role", "button");
  hsPress(right, function () {
    hsOpenLayer("hsync-area", id);
  });
  go.setAttribute("role", "switch");
  go.setAttribute("aria-label", _T("spotify_sync"));
  hsPress(go, function () {
    call("switch", isOn(E.sync) ? "turn_off" : "turn_on", { entity_id: E.sync });
  });
  var was = null;
  reg(function () {
    var on = isOn(E.sync);
    go.classList.toggle("on", on);
    go.setAttribute("aria-checked", on ? "true" : "false");
    if (was !== null && on !== was) pop(go);
    was = on;
    dev.textContent = A(E.now_playing).playback_device || "–";
    area.textContent = hsKnown(E.area) ? V_(E.area) : "–";
  });
  bar.appendChild(left);
  bar.appendChild(go);
  bar.appendChild(right);
  return bar;
}

function hsyncPopup(b, id) {
  var E = HUESYNC.entities(H(), id);
  if (!E) {
    b.appendChild(pill("info", _T("nothing_found"), {}));
    return;
  }
  var root = mk("div", "hs");
  b.appendChild(root);
  root.appendChild(hsNow(E));
  root.appendChild(hsSettings(id, E, root));
  root.appendChild(hsBar(id, E));
  if (E.light_delay)
    root.appendChild(
      pill("clock", _T("light_delay"), {
        val: function () {
          var n = hsNumber(E.light_delay);
          return n === null ? "–" : n + " s";
        },
        tap: function () {
          hsOpenLayer("hsync-delay", id);
        },
      })
    );
  reg(function () {
    root.classList.toggle("hs-off", V_(E.sync) === "unavailable");
  });
}

/* ---- the popups over the main one ---- */

function hsEnts(id) {
  return HUESYNC.entities(H(), id) || {};
}

function hsStylePopup(b, id) {
  var E = hsEnts(id),
    g = mk("div", "gridl g2 lp-modes"),
    tiles = {};
  (A(E.style).options || []).forEach(function (name) {
    var el = mk("div", "lp-mode hs-m", svg(HS_STYLE_ICON[name] || "eq"));
    el.appendChild(mk("div", "lp-mode-n")).textContent = name;
    el.setAttribute("role", "button");
    hsPress(el, function () {
      hsPick(E, "style", name);
    });
    tiles[name] = el;
    g.appendChild(el);
  });
  b.appendChild(g);
  reg(function () {
    Object.keys(tiles).forEach(function (name) {
      tiles[name].classList.toggle("picked", V_(E.style) === name);
    });
  });
}

/* One row for each option of a select entity, the chosen one checked; choosing sends it and closes this popup. */
function hsChoice(b, id, key, icon, label) {
  var E = hsEnts(id);
  (A(E[key]).options || []).forEach(function (name) {
    var row = pill(icon(name), label(name), {
      check: function () {
        return V_(E[key]) === name;
      },
      tap: function () {
        hsPick(E, key, name);
      },
    });
    b.appendChild(row);
    var grad = key === "palette" ? hsGradient((A(E.palette).colors || {})[name] || []) : "";
    if (grad) {
      var sw = mk("span", "hs-sw");
      sw.style.background = grad;
      row.insertBefore(sw, row.querySelector(".ck"));
    }
  });
}

function hsIntensityPopup(b, id) {
  hsChoice(
    b,
    id,
    "intensity",
    function (n) {
      return HS_WAVE[n] || "wave3";
    },
    cap
  );
}

function hsColourPopup(b, id) {
  hsChoice(
    b,
    id,
    "palette",
    function (n) {
      return n === "auto" ? "sparkle" : "palette";
    },
    cap
  );
}

function hsAreaPopup(b, id) {
  hsChoice(
    b,
    id,
    "area",
    function () {
      return "lights";
    },
    function (n) {
      return n;
    }
  );
}

function hsDelayPopup(b, id) {
  var E = hsEnts(id);
  b.appendChild(
    sliderRow({
      icon: "clock",
      name: _T("light_delay"),
      min: 0,
      max: 10,
      step: 1,
      off: "–",
      get: function () {
        return hsNumber(E.light_delay);
      },
      fmt: function (v) {
        return v + " s";
      },
      on: function () {
        return true;
      },
      commit: function (v) {
        call("number", "set_value", { entity_id: E.light_delay, value: v });
      },
    })
  );
}

/* Hue Play HDMI Sync Box (an entry of the Philips Hue Plus integration): its row, which looks like a light, and its popup. Built from the shared controls only. */

/* The brightness of the box runs from 0 to 200, where 100 is the normal brightness of the lights. */
var HB_MAX = 200;

function hbNumber(id) {
  var v = V_(id);
  return v !== "unknown" && v !== "unavailable" && v !== "" && !isNaN(Number(v)) ? Number(v) : null;
}

function hbBrightness(E, name, icon, onTap) {
  return sliderRow({
    onTap: onTap,
    name: name,
    icon: icon,
    min: 0,
    max: HB_MAX,
    step: 1,
    fmt: function (v) {
      return v + "%";
    },
    get: function () {
      return hbNumber(E.brightness);
    },
    on: function () {
      return isOn(E.sync);
    },
    live: function (v) {
      callLive("hb-bri", "number", "set_value", { entity_id: E.brightness, value: v });
    },
    commit: function (v) {
      call("number", "set_value", { entity_id: E.brightness, value: v });
    },
  });
}

/* The box as a row of the Lights section. The bar is the brightness, the icon starts and stops the sync, the rest of the row opens the popup. */
function hsboxRow(d) {
  var id = d.id,
    E = HUESYNCBOX.entities(H(), id),
    pk = "hsbox:" + id,
    icon = d.icon || "syncring";
  if (!E)
    return pill(icon, d.name, {
      tap: function () {
        showPopup(pk, true);
      },
    });
  var r = hbBrightness(E, d.name, icon, function (t) {
    if (t && t.closest && t.closest(".ic")) toggleEnt(id);
    else showPopup(pk, true);
  });
  r.dataset.pin = JSON.stringify(pinPop(pk, id, d.name, icon));
  return r;
}

function hsboxSelect(E, key, label, icon) {
  var t = dropRow(
    label,
    function () {
      return A(E[key]).options || [];
    },
    function () {
      return V_(E[key]);
    },
    function (v) {
      call("select", "select_option", { entity_id: E[key], option: v });
    },
    icon
  );
  return t;
}

/* The brightness of the box in the popup: the button of the light popup with the slider that rises from it, as on the Spotify sync. The slider is in percent of the box's range (0 to 200, where the middle is the normal brightness of the lights), and the number it shows is the box's own. */
function hbBrightnessButton(E, root) {
  var g = mk("div", "hs-set one"),
    col = mk("div", "hs-col");
  function toBox(v) {
    return Math.round((v * HB_MAX) / 100);
  }
  col.appendChild(mk("div", "hs-cap")).textContent = _T("brightness");
  col.appendChild(
    briControl({
      pct: function () {
        return Math.round(((hbNumber(E.brightness) || 0) * 100) / HB_MAX);
      },
      lit: function () {
        return isOn(E.sync);
      },
      fmt: function (v) {
        return toBox(v) + "%";
      },
      live: function (v) {
        callLive("hb-bri", "number", "set_value", { entity_id: E.brightness, value: toBox(v) });
      },
      commit: function (v) {
        call("number", "set_value", { entity_id: E.brightness, value: toBox(v) });
      },
      stage: function () {
        return root;
      },
    })
  );
  g.appendChild(col);
  return g;
}

function hsboxPopup(b, id) {
  var E = HUESYNCBOX.entities(H(), id);
  if (!E) {
    b.appendChild(pill("info", _T("nothing_found"), {}));
    return;
  }
  /* `hs` is what dims the rest of the popup while the brightness slider is open. */
  var root = mk("div", "hs");
  b.appendChild(root);
  root.appendChild(switchPill("syncring", _T("sync"), E.sync));
  root.appendChild(hsboxSelect(E, "mode", _T("mode"), "tv"));
  root.appendChild(hsboxSelect(E, "source", _T("hdmi_input"), "plug"));
  /* The box keeps an intensity for video, game and music only, so there is nothing to choose in the other modes. */
  var intensity = hsboxSelect(E, "intensity", _T("intensity"), "wave3");
  root.appendChild(intensity);
  reg(function () {
    intensity.style.display = V_(E.intensity) === "unavailable" ? "none" : "";
  });
  root.appendChild(hbBrightnessButton(E, root));
  root.appendChild(
    pill("tv", _T("hdmi_signal"), {
      val: function () {
        return isOn(E.hdmi_signal) ? _T("on_2") : _T("off");
      },
    })
  );
}
