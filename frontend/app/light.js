/* A light's page (on or off, brightness, white or colour, effects, a gradient light's style) and the editor the Hue app's "Add a scene" opens: the lights follow every change, and the
 checkmark records what they show. Home Assistant's own light services do everything here; the bridge-only settings of a light are the Hue Plus menu's page for it. */

function hpModes(id) {
  return A(id).supported_color_modes || [];
}

function hpCanColour(id) {
  return hpModes(id).some(function (m) {
    return m === "xy" || m === "hs" || m === "rgb" || m === "rgbw" || m === "rgbww";
  });
}

function hpCanWhite(id) {
  return hpModes(id).indexOf("color_temp") >= 0;
}

function hpCanDim(id) {
  return hpModes(id).some(function (m) {
    return m !== "onoff";
  });
}

/* The lights a control acts on: a function that gives entity ids, and a function called after each change. */
function hpTargets(t) {
  return typeof t === "function" ? t() : [].concat(t);
}

function hpTurnOn(t, data, live, changed) {
  var d = Object.assign({ entity_id: hpTargets(t) }, data);
  if (live) callLive("hp-light", "light", "turn_on", d);
  else call("light", "turn_on", d);
  if (changed) changed();
}

/* A track that is dragged for a value from 0 to 1. `paint(fraction)` places the knob. */
function hpTrack(cls, label, get, set, commit) {
  var tr = mk("div", "hp-track " + cls, "<div class='knob'></div>"),
    knob = tr.querySelector(".knob"),
    drag = false;
  tr.tabIndex = 0;
  tr.setAttribute("role", "slider");
  tr.setAttribute("aria-label", label);
  function paint(f) {
    knob.style.left = Math.max(0, Math.min(1, f)) * 100 + "%";
    tr.setAttribute("aria-valuenow", Math.round(f * 100));
  }
  attachSlide(tr, {
    onMove: function (f) {
      drag = true;
      paint(f);
      set(f);
    },
    onCommit: function (f) {
      paint(f);
      commit(f);
      setTimeout(function () {
        drag = false;
      }, 600);
    },
    onCancel: function () {
      drag = false;
    },
  });
  tr.addEventListener("keydown", function (e) {
    var d = e.key === "ArrowRight" ? 0.05 : e.key === "ArrowLeft" ? -0.05 : 0;
    if (!d) return;
    e.preventDefault();
    var f = Math.max(0, Math.min(1, get() + d));
    paint(f);
    commit(f);
  });
  tr.refresh = function () {
    if (!drag) paint(get());
  };
  reg(tr.refresh);
  return tr;
}

/* White: a track from warm to cool in the kelvin range of the light (the lights it acts on follow the first one's range). */
function hpWhite(id, targets, changed) {
  var a = A(id),
    lo = a.min_color_temp_kelvin || 2000,
    hi = a.max_color_temp_kelvin || 6500;
  function kelvin(f) {
    return Math.round(lo + f * (hi - lo));
  }
  return hpTrack(
    "kel",
    _T("app_white"),
    function () {
      return ((A(id).color_temp_kelvin || lo) - lo) / (hi - lo);
    },
    function (f) {
      hpTurnOn(targets, { color_temp_kelvin: kelvin(f) }, true);
    },
    function (f) {
      hpTurnOn(targets, { color_temp_kelvin: kelvin(f) }, false, changed);
    }
  );
}

/* Colour: a wheel; the angle is the hue and the distance from the middle is the saturation. */
function hpWheel(id, targets, changed) {
  var wrap = mk("div", "hp-wheel"),
    size = 300,
    canvas = mk("canvas");
  canvas.width = canvas.height = size;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", _T("colour"));
  var ctx = canvas.getContext && canvas.getContext("2d");
  if (ctx) {
    var img = ctx.createImageData(size, size),
      r = size / 2;
    for (var y = 0; y < size; y++)
      for (var x = 0; x < size; x++) {
        var dx = x - r + 0.5,
          dy = y - r + 0.5,
          d = Math.sqrt(dx * dx + dy * dy),
          i = (y * size + x) * 4;
        if (d > r) continue;
        var rgb = hpHsv(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360, d / r);
        img.data[i] = rgb[0];
        img.data[i + 1] = rgb[1];
        img.data[i + 2] = rgb[2];
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }
  var mark = mk("i");
  mark.style.cssText = "position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.5);pointer-events:none";
  wrap.style.position = "relative";
  wrap.style.width = "fit-content";
  wrap.style.margin = "0 auto";
  wrap.appendChild(canvas);
  wrap.appendChild(mark);
  function at(e) {
    var b = canvas.getBoundingClientRect(),
      dx = e.clientX - (b.left + b.width / 2),
      dy = e.clientY - (b.top + b.height / 2),
      rad = b.width / 2,
      d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / rad);
    return [Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360), Math.round(d * 100)];
  }
  function place(hs) {
    var rad = canvas.getBoundingClientRect().width / 2 || size / 2,
      a = (hs[0] * Math.PI) / 180,
      d = (hs[1] / 100) * rad;
    mark.style.left = canvas.offsetLeft + rad + Math.cos(a) * d + "px";
    mark.style.top = canvas.offsetTop + rad + Math.sin(a) * d + "px";
    var c = hpHsv(hs[0], hs[1] / 100);
    mark.style.background = cssRgb(c);
  }
  var down = false;
  canvas.addEventListener("pointerdown", function (e) {
    down = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (x) {}
    var hs = at(e);
    place(hs);
    hpTurnOn(targets, { hs_color: hs }, true);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!down) return;
    var hs = at(e);
    place(hs);
    hpTurnOn(targets, { hs_color: hs }, true);
  });
  canvas.addEventListener("pointerup", function (e) {
    if (!down) return;
    down = false;
    var hs = at(e);
    place(hs);
    hpTurnOn(targets, { hs_color: hs }, false, changed);
  });
  wrap.refresh = function () {
    if (down) return;
    var hs = A(id).hs_color;
    if (hs) place(hs);
    else mark.style.display = "none";
  };
  reg(wrap.refresh);
  setTimeout(wrap.refresh, 0);
  return wrap;
}

/* The colour at a hue (degrees) and a saturation (0 to 1) at full value. */
function hpHsv(h, s) {
  var c = s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = 1 - c,
    rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgb.map(function (v) {
    return Math.round((v + m) * 255);
  });
}

/* White or colour, as two buttons that show the matching control; the light's own mode is where it starts. */
function hpColourBox(id, targets, changed) {
  var box = mk("div"),
    can = { white: hpCanWhite(id), colour: hpCanColour(id) };
  if (!can.white && !can.colour) return box;
  var mode = A(id).color_mode === "color_temp" || !can.colour ? "white" : "colour",
    chips = mk("div", "hp-chips"),
    area = mk("div");
  function draw() {
    area.innerHTML = "";
    Array.prototype.forEach.call(chips.children, function (c) {
      c.classList.toggle("on", c.dataset.mode === mode);
      c.setAttribute("aria-pressed", c.dataset.mode === mode ? "true" : "false");
    });
    area.appendChild(mode === "white" ? hpWhite(id, targets, changed) : hpWheel(id, targets, changed));
    refresh();
  }
  [["white", "app_white"], ["colour", "colour"]].forEach(function (m) {
    if (!can[m[0]]) return;
    var c = mk("button", "hp-chip");
    c.type = "button";
    c.dataset.mode = m[0];
    c.textContent = _T(m[1]);
    c.addEventListener("click", function () {
      mode = m[0];
      draw();
    });
    chips.appendChild(c);
  });
  if (can.white && can.colour) box.appendChild(chips);
  box.appendChild(area);
  draw();
  return box;
}

function hpEffects(id) {
  var list = (A(id).effect_list || []).filter(function (e) {
    return e && e !== "no_effect";
  });
  if (!list.length) return null;
  var box = mk("div"),
    chips = mk("div", "hp-chips");
  box.appendChild(hmLabel(_T("app_effects")));
  ["no_effect"].concat(list).forEach(function (e) {
    var c = mk("button", "hp-chip");
    c.type = "button";
    c.textContent = e === "no_effect" ? _T("no_effect") : cap(String(e).replace(/_/g, " "));
    c.addEventListener("click", function () {
      call("light", "turn_on", { entity_id: id, effect: e });
    });
    c.refresh = function () {
      var cur = A(id).effect || "no_effect";
      c.classList.toggle("on", cur === e || (e === "no_effect" && (cur === "off" || cur === "none")));
    };
    reg(c.refresh);
    chips.appendChild(c);
  });
  box.appendChild(chips);
  return box;
}

function hpLightPage(body, id) {
  if (!H().states[id]) {
    body.appendChild(mk("div", "hp-empty")).textContent = _T("nothing_found");
    return;
  }
  hmBox(body);
  body.appendChild(
    hmTitle(
      hpLightIcon(id),
      function () {
        return A(id).friendly_name || id;
      },
      function () {
        return V_(id) === "unavailable" ? _T("hm_unreachable") : isOn(id) ? hpPct(id) + "%" : _T("off");
      }
    )
  );
  body.appendChild(
    hmGroup([
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
    ])
  );
  if (hpCanDim(id)) {
    var bar = mk("div");
    bar.style.margin = "0 0 8px";
    bar.appendChild(hpBrightness(id));
    body.appendChild(bar);
  }
  body.appendChild(hpColourBox(id, [id]));
  var st = hpStyleOf(id);
  if (st)
    body.appendChild(
      hmGroup([
        hmRow({
          title: _T("style"),
          tap: "app-style:" + id,
        }),
      ])
    );
  var fx = hpEffects(id);
  if (fx) body.appendChild(fx);
  if (isAdmin() && A(id).hue_light_id)
    body.appendChild(
      hmGroup([
        hmRow({
          icon: "tune",
          title: _T("light_setup"),
          tap: "hue-light:" + id,
        }),
      ])
    );
}

/* A gradient light's style, from the style the Hue Plus menu registered (huestyle.js). */
function hpStyleOf(id) {
  var list = (window.HueHost && window.HueHost.registered.lightStyles) || [];
  for (var i = 0; i < list.length; i++) if (list[i].applies(id)) return list[i];
  return null;
}

function hpStylePage(body, id) {
  var st = hpStyleOf(id);
  if (st) st.popup(body, id);
  else body.appendChild(mk("div", "hp-empty")).textContent = _T("nothing_found");
}

/* ---- the editor of the Hue app's "Add a scene": the lights follow each change, the checkmark records them ---- */

var HPEDIT = null;

function hpSnapshot(lights) {
  return lights.map(function (id) {
    var a = A(id);
    return { entity_id: id, on: isOn(id), brightness: a.brightness || null, k: a.color_mode === "color_temp" ? a.color_temp_kelvin || null : null, xy: a.color_mode !== "color_temp" ? a.xy_color || null : null, hs: a.hs_color || null };
  });
}

/* Puts the lights back as they were when the editor opened. */
function hpRestore(snap) {
  snap.forEach(function (s) {
    if (!s.on) {
      call("light", "turn_off", { entity_id: s.entity_id, transition: 0 });
      return;
    }
    var d = { entity_id: s.entity_id, transition: 0 };
    if (s.brightness) d.brightness = s.brightness;
    if (s.k) d.color_temp_kelvin = s.k;
    else if (s.xy) d.xy_color = s.xy;
    else if (s.hs) d.hs_color = s.hs;
    call("light", "turn_on", d);
  });
}

function hpEditLights(o) {
  HPEDIT = { o: o, snap: hpSnapshot(o.lights), sel: {}, dirty: false };
  call("light", "turn_on", { entity_id: o.lights });
  showPopup("app-edit", true);
}

function hpEditTargets() {
  var chosen = HPEDIT.o.lights.filter(function (id) {
    return HPEDIT.sel[id];
  });
  return chosen.length ? chosen : HPEDIT.o.lights;
}

function hpEditPage(body) {
  if (!HPEDIT) {
    body.appendChild(mk("div", "hp-empty")).textContent = _T("nothing_found");
    return;
  }
  hmBox(body);
  var E = HPEDIT,
    o = E.o,
    lead = o.lights[0];
  guardUnsaved({
    dirty: function () {
      return E.dirty;
    },
    discard: function () {
      hpRestore(E.snap);
    },
    save: function (leave) {
      var acts = hpSnapshot(o.lights);
      return Promise.resolve(o.onSave(acts)).then(function (ok) {
        if (ok === false) return false;
        E.dirty = false;
        POPGUARD_CLEAR();
        if (o.after) o.after();
        else leave();
        return true;
      });
    },
  });
  body.appendChild(hmTitle(o.icon || "palette", o.name || _T("hn_add_a_scene"), cntS(o.lights.length, _T("hm_light"), _T("hm_lights"))));
  var changed = function () {
    E.dirty = true;
  };
  var bright = briControl({
    pct: function () {
      var on = hpEditTargets().filter(isOn);
      return on.length ? Math.max(1, Math.round((A(on[0]).brightness || 0) / 2.55)) : 0;
    },
    lit: function () {
      return hpEditTargets().some(isOn);
    },
    live: function (v) {
      callLive("hp-edit", "light", "turn_on", { entity_id: hpEditTargets(), brightness_pct: v });
      changed();
    },
    commit: function (v) {
      call("light", "turn_on", { entity_id: hpEditTargets(), brightness_pct: v });
      changed();
    },
    stage: function () {
      return body;
    },
  });
  var barBox = mk("div");
  barBox.style.margin = "0 0 8px";
  barBox.appendChild(bright);
  body.appendChild(barBox);
  body.appendChild(hpColourBox(lead, hpEditTargets, changed));
  body.appendChild(hmLabel(_T("lights")));
  body.appendChild(
    hmGroup(
      o.lights.map(function (id) {
        return hmRow({
          icon: hpLightIcon(id),
          title: A(id).friendly_name || id,
          sub: function () {
            return isOn(id) ? hpPct(id) + "%" : _T("off");
          },
          check: function () {
            return !!E.sel[id];
          },
          tap: function () {
            E.sel[id] = !E.sel[id];
            refresh();
          },
        });
      })
    )
  );
  body.appendChild(hmCallout(_T("app_edit_hint")));
}

/* The page's guard is cleared before the sheet closes, or the question would come up for a change that has just been saved. */
function POPGUARD_CLEAR() {
  HC.popGuard = null;
}

window.HueHost.editLights = hpEditLights;

HC.registerPage(
  "app-light",
  function (id) {
    return A(id).friendly_name || _T("light");
  },
  "lamp",
  hpLightPage
);
HC.registerPage("app-style", "style", "palette", hpStylePage);
HC.registerPage("app-edit", "app_edit_the_lights", "palette", hpEditPage);
