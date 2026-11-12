/* The host of the Hue dashboard panel: what the Hue Plus pages expect of the dashboard they run in (the plugin API, version 1, which Home Control also offers), made for this panel.
 It gives them Home Assistant's states and registries, service calls, rows and sliders, sheets that open over the tab (with the "unsaved changes" question), dialogs and toasts, in the Hue app's look.
 The pages themselves (the Hue Plus menu, the wizards, the Spotify sync and the sync box) are the very same files Home Control loads; nothing here knows about them except the registration they make.
 Home Control's dashboard is not loaded here: its light panel runs in a frame of its own (light.js, popup.html). */
(function () {
  var EN = {
    brightness: "Brightness",
    colour: "Colour",
    freeze: "Freeze",
    hidden: "Hidden",
    mode: "Mode",
    palette: "Palette",
    paused: "Paused",
    play: "Play",
    playing: "Playing",
    speed: "Speed",
    style: "Style",
    visible: "Visible",
    now_playing: "Now playing",
    nothing_playing: "Nothing playing",
    speaker: "Speaker",
    tv: "TV",
    note: "Note",
    add_at_least_one_light: "Add at least one light",
    all_off: "All off",
    area: "Area",
    auto: "Auto",
    automations: "Automations",
    button: "Button",
    clock: "Clock",
    firmware: "Firmware",
    give_the_area_a_name: "Give the area a name",
    home: "Home",
    home_and_away: "Home and Away",
    hue_plus: "Hue Plus",
    in_this_room: "in this room.",
    light: "Light",
    lights: "Lights",
    loading: "Loading…",
    lock: "Lock",
    manual: "Manual",
    no_effect: "No effect",
    none: "None",
    nothing_found: "Nothing found",
    number: "Number",
    off: "Off",
    on_2: "On",
    other: "Other",
    pause: "Pause",
    power: "Power",
    press: "Press",
    rooms: "Rooms",
    safety: "Safety",
    scene: "Scene",
    scenes: "Scenes",
    switch: "Switch",
    time: "Time",
    unavailable: "Unavailable",
    zigbee_channel: "Zigbee channel",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    discard_changes: "Discard changes",
    unsaved_changes: "Unsaved changes",
    done: "Done",
    back: "Back",
    close: "Close",
  };

  function T(key) {
    if (EN[key] !== undefined) return EN[key];
    return key;
  }

  /* ---- drawing ---- */

  function mk(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function svg(name) {
    return "<svg viewBox='0 0 24 24'>" + (HOST_ICONS[name] || HOST_ICONS.info) + "</svg>";
  }

  function ic(name) {
    return "<span class='ic'>" + svg(name) + "</span>";
  }

  function cap(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function cntS(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }

  /* ---- Home Assistant: states, registries, calls ---- */

  var HASS = null;
  var REGISTRY = { entities: {}, devices: {}, areas: {} };
  var REGISTRY_SOURCES = [
    {
      key: "entities",
      list: "config/entity_registry/list",
      event: "entity_registry_updated",
      pick: function (e) {
        return e.disabled_by
          ? null
          : { entity_id: e.entity_id, device_id: e.device_id || null, area_id: e.area_id || null, platform: e.platform, unique_id: e.unique_id || null, entity_category: e.entity_category || null, hidden: !!e.hidden_by };
      },
      id: function (e) {
        return e.entity_id;
      },
    },
    {
      key: "devices",
      list: "config/device_registry/list",
      event: "device_registry_updated",
      pick: function (d) {
        return { id: d.id, name: d.name, name_by_user: d.name_by_user || null, area_id: d.area_id || null, manufacturer: d.manufacturer || null, model: d.model || null };
      },
      id: function (d) {
        return d.id;
      },
    },
    {
      key: "areas",
      list: "config/area_registry/list",
      event: "area_registry_updated",
      pick: function (a) {
        return { area_id: a.area_id, name: a.name };
      },
      id: function (a) {
        return a.area_id;
      },
    },
  ];
  var FACADE = {
    get states() {
      return HASS.states;
    },
    get services() {
      return HASS.services;
    },
    get config() {
      return HASS.config;
    },
    get user() {
      return HASS.user;
    },
    get locale() {
      return HASS.locale;
    },
    get entities() {
      return REGISTRY.entities;
    },
    get devices() {
      return REGISTRY.devices;
    },
    get areas() {
      return REGISTRY.areas;
    },
    callService: function (domain, service, data) {
      return HASS.callService(domain, service, data);
    },
  };
  var REGISTRIES_READY = null;

  function loadRegistry(src) {
    return HASS.callWS({ type: src.list }).then(
      function (rows) {
        var out = {};
        (rows || []).forEach(function (r) {
          var v = src.pick(r);
          if (v) out[src.id(r)] = v;
        });
        REGISTRY[src.key] = out;
        schedule();
      },
      function (err) {
        console.warn("[hue-plus] could not read " + src.list, err);
      }
    );
  }

  function watchRegistry(src) {
    var timer = 0;
    HASS.connection.subscribeEvents(function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        loadRegistry(src);
      }, 400);
    }, src.event);
  }

  function attach(h) {
    var first = !HASS;
    HASS = h;
    if (first)
      REGISTRIES_READY = Promise.all(REGISTRY_SOURCES.map(loadRegistry)).then(function () {
        REGISTRY_SOURCES.forEach(watchRegistry);
      });
    if (HOST.onHass) HOST.onHass(h);
    schedule();
  }

  function H() {
    return FACADE;
  }

  function A(id) {
    var s = HASS && HASS.states[id];
    return (s && s.attributes) || {};
  }

  function V_(id) {
    var s = HASS && HASS.states[id];
    return s ? s.state : "unavailable";
  }

  function isOn(id) {
    return V_(id) === "on";
  }

  function errorText(e) {
    return (e && (e.message || e.error || (e.body && e.body.message))) || T("unavailable");
  }

  function callRaw(domain, service, data) {
    if (!HASS) return undefined;
    var p = Promise.resolve(HASS.callService(domain, service, data));
    p.catch(function (e) {
      toast(errorText(e));
    });
    return p;
  }

  function call(domain, service, data) {
    callRaw(domain, service, data);
  }

  /* The same call, for a slider that sends many: a failure is not shown each time. */
  function callLive(key, domain, service, data) {
    if (HASS)
      Promise.resolve(HASS.callService(domain, service, data)).catch(function () {});
  }

  function serviceResponse(domain, service, data) {
    return HASS.callWS({ type: "call_service", domain: domain, service: service, service_data: data, return_response: true }).then(function (r) {
      return r && r.response;
    });
  }

  function toggleEnt(id) {
    var domain = id.split(".")[0];
    if (domain === "light" || domain === "switch" || domain === "input_boolean") call(domain, "toggle", { entity_id: id });
    else call("homeassistant", "toggle", { entity_id: id });
  }

  /* ---- what redraws: functions a page registers, called again whenever Home Assistant changes ---- */

  var TAB_LIST = [];
  var SHEET_LIST = [];
  var BUILDING = null;
  var QUEUED = false;

  function reg(f) {
    (BUILDING || SHEET_LIST).push(f);
  }

  function refresh() {
    /* SAVE is dim until what the page shows has been changed. */
    if (typeof SHEET !== "undefined" && SHEET && CHECK && CHECK.dirty) SHEET.root.querySelector(".ok").disabled = !CHECK.dirty();
    TAB_LIST.concat(SHEET_LIST).forEach(function (f) {
      try {
        f();
      } catch (e) {
        console.error("[hue-plus]", e);
      }
    });
  }

  /* One redraw per frame, however many changes arrive. */
  function schedule() {
    if (QUEUED) return;
    QUEUED = true;
    requestAnimationFrame(function () {
      QUEUED = false;
      refresh();
      if (HOST.onUpdate) HOST.onUpdate();
    });
  }

  /* ---- toasts and questions ---- */

  function toast(text) {
    var t = mk("div", "toast");
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add("in");
    });
    setTimeout(function () {
      t.classList.remove("in");
      setTimeout(function () {
        t.remove();
      }, 300);
    }, 2400);
  }

  /* A question with buttons: [{label, fn, primary}]; Cancel is always there. */
  function ask(text, buttons) {
    var bg = mk("div", "scrim"),
      d = mk("div", "dlg"),
      row = mk("div", "rrow");
    bg.style.zIndex = 69;
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.appendChild(mk("p")).textContent = text;
    function close() {
      bg.remove();
      d.remove();
    }
    buttons = [{ label: T("cancel") }].concat(buttons);
    d.style.display = "block";
    row.style.gridTemplateColumns = "repeat(" + buttons.length + ",1fr)";
    buttons.forEach(function (b, i) {
      var r = mk("div", "rbtn" + (i === buttons.length - 1 ? " go" : ""));
      r.textContent = b.label;
      r.tabIndex = 0;
      r.setAttribute("role", "button");
      function act() {
        close();
        if (b.fn) b.fn();
      }
      r.addEventListener("click", act);
      r.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          act();
        }
      });
      row.appendChild(r);
    });
    d.appendChild(row);
    bg.addEventListener("click", close);
    document.body.appendChild(bg);
    document.body.appendChild(d);
    requestAnimationFrame(function () {
      bg.classList.add("in");
    });
  }

  function confirmDlg(text, fn) {
    ask(text, [{ label: T("confirm"), fn: fn }]);
  }

  /* ---- rows and sliders ---- */

  function pill(icon, name, o) {
    o = o || {};
    var r = mk("div", "pill" + (o.tap ? "" : " static") + (o.on ? " tg" : ""));
    r.innerHTML = ic(icon) + "<span class='tx'><span class='nm'></span><span class='sb'></span></span><span class='vl'></span>";
    r.querySelector(".nm").textContent = name;
    var sb = r.querySelector(".sb"),
      vl = r.querySelector(".vl");
    if (o.check) {
      r.classList.add("chk");
      r.setAttribute("role", "checkbox");
      r.appendChild(mk("span", "ck", svg("check")));
    }
    if (o.tap) {
      r.tabIndex = 0;
      if (!o.check) r.setAttribute("role", "button");
      var act = function (e) {
        if (o.iconTap && e && e.target.closest && e.target.closest(".ic")) {
          o.iconTap();
          return;
        }
        o.tap();
      };
      r.addEventListener("click", act);
      r.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          o.tap();
        }
      });
    }
    r.refresh = function () {
      if (o.check) {
        var ck = !!o.check();
        r.classList.toggle("checked", ck);
        r.setAttribute("aria-checked", ck ? "true" : "false");
      }
      r.classList.toggle("on", o.on ? !!o.on() : false);
      var t = o.sub ? o.sub() : "";
      sb.textContent = t || "";
      sb.style.display = t ? "" : "none";
      vl.textContent = o.val ? o.val() : "";
    };
    reg(r.refresh);
    return r;
  }

  function sep(name, icon) {
    var s = mk("div", "sep", svg(icon || "info") + "<span></span>");
    s.querySelector("span").textContent = name;
    return s;
  }

  /* Horizontal drag on an element: h = {onMove(fraction), onCommit(fraction), onCancel(), onTap()}. A mostly vertical move is a scroll and is left alone. */
  function attachSlide(el, h) {
    var sx = 0,
      sy = 0,
      down = false,
      moved = false,
      scrolling = false,
      rect = null;
    function frac(e) {
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    }
    el.addEventListener("pointerdown", function (e) {
      down = true;
      moved = false;
      scrolling = false;
      sx = e.clientX;
      sy = e.clientY;
      rect = (h.rectOf ? h.rectOf() : el).getBoundingClientRect();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (x) {}
    });
    el.addEventListener("pointermove", function (e) {
      if (!down || scrolling) return;
      if (!moved) {
        var dx = Math.abs(e.clientX - sx),
          dy = Math.abs(e.clientY - sy);
        if (dy > 8 && dy >= dx) {
          scrolling = true;
          return;
        }
        if (dx > 6) moved = true;
      }
      if (moved) h.onMove(frac(e));
    });
    function finish(e, cancelled) {
      if (!down) return;
      down = false;
      if (cancelled || scrolling) {
        if (h.onCancel) h.onCancel();
        return;
      }
      if (moved) h.onCommit(frac(e));
      else if (h.onTap) h.onTap(e);
      else h.onCommit(frac(e));
    }
    el.addEventListener("pointerup", function (e) {
      finish(e, false);
    });
    el.addEventListener("pointercancel", function (e) {
      finish(e, true);
    });
  }

  /* A row that is a slider: o = {icon, name, min, max, step, get(), fmt(v), on(), live(v), commit(v), readonly}. */
  function sliderRow(o) {
    var r = mk("div", "pill slide");
    r.innerHTML = (o.icon ? ic(o.icon) : "") + "<span class='tx'><span class='nm'></span><span class='sb'></span></span><span class='vl'></span><div class='trk'><div class='fill'></div><i class='kn'></i></div>";
    r.querySelector(".nm").textContent = o.name;
    var fill = r.querySelector(".fill"),
      knob = r.querySelector(".kn"),
      track = r.querySelector(".trk"),
      vl = r.querySelector(".vl"),
      drag = false,
      liveAt = 0;
    if (!o.readonly) {
      r.tabIndex = 0;
      r.setAttribute("role", "slider");
      r.setAttribute("aria-label", o.name);
      r.setAttribute("aria-valuemin", o.min);
      r.setAttribute("aria-valuemax", o.max);
    }
    function snap(f) {
      var v = o.min + f * (o.max - o.min),
        st = o.step || 1;
      v = Math.round((v - o.min) / st) * st + o.min;
      return Math.max(o.min, Math.min(o.max, Number(v.toFixed(2))));
    }
    function paint(v) {
      var f = Math.max(0, Math.min(1, (v - o.min) / (o.max - o.min)));
      fill.style.width = f * 100 + "%";
      knob.style.left = f * 100 + "%";
      vl.textContent = o.fmt ? o.fmt(v) : v;
      r.setAttribute("aria-valuenow", v);
    }
    if (!o.readonly)
      attachSlide(r, {
        rectOf: function () {
          return track;
        },
        onMove: function (f) {
          drag = true;
          var v = snap(f);
          paint(v);
          if (o.live && Date.now() - liveAt > 150) {
            liveAt = Date.now();
            o.live(v);
          }
        },
        onCommit: function (f) {
          var v = snap(f);
          paint(v);
          o.commit(v);
          setTimeout(function () {
            drag = false;
          }, 600);
        },
        onCancel: function () {
          drag = false;
        },
      });
    r.addEventListener("keydown", function (e) {
      if (o.readonly) return;
      var d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var v = Math.max(o.min, Math.min(o.max, o.get() + d * (o.step || 1)));
      paint(v);
      o.commit(v);
    });
    r.refresh = function () {
      if (drag) return;
      paint(o.get());
      r.classList.toggle("on", o.on ? !!o.on() : false);
    };
    reg(r.refresh);
    return r;
  }

  /* A brightness button: a slider bar showing a percentage. o = {pct(), lit(), fmt(v), live(v), commit(v)}. */
  function briControl(o) {
    var bar = mk("div", "bar live");
    bar.innerHTML = "<div class='fill'></div><span class='vl'></span>";
    bar.tabIndex = 0;
    bar.setAttribute("role", "slider");
    bar.setAttribute("aria-label", T("brightness"));
    var fill = bar.querySelector(".fill"),
      vl = bar.querySelector(".vl"),
      drag = false,
      liveAt = 0;
    function paint(v) {
      fill.style.width = v + "%";
      vl.textContent = o.fmt ? o.fmt(v) : v + "%";
      bar.setAttribute("aria-valuenow", v);
    }
    function snap(f) {
      return Math.max(1, Math.round(f * 100));
    }
    attachSlide(bar, {
      onMove: function (f) {
        drag = true;
        var v = snap(f);
        paint(v);
        if (o.live && Date.now() - liveAt > 150) {
          liveAt = Date.now();
          o.live(v);
        }
      },
      onCommit: function (f) {
        var v = snap(f);
        paint(v);
        o.commit(v);
        setTimeout(function () {
          drag = false;
        }, 600);
      },
      onCancel: function () {
        drag = false;
      },
    });
    bar.refresh = function () {
      if (drag) return;
      paint(o.pct());
      bar.classList.toggle("off", o.lit ? !o.lit() : false);
    };
    reg(bar.refresh);
    return bar;
  }

  /* A row that chooses one of some options with the device's own chooser: dropRow(label, options(), value(), set(v), icon). */
  function dropRow(label, options, value, set, icon) {
    var r = pill(icon || "tune", label, {
        val: function () {
          return value() || "";
        },
      }),
      sel = mk("select");
    sel.setAttribute("aria-label", label);
    sel.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer";
    r.classList.add("selrow");
    r.appendChild(sel);
    sel.addEventListener("change", function () {
      set(sel.value);
    });
    var base = r.refresh;
    r.refresh = function () {
      base();
      var list = options() || [],
        cur = value();
      if (sel.dataset.sig !== list.join("|")) {
        sel.innerHTML = "";
        list.forEach(function (o) {
          var op = mk("option");
          op.value = o;
          op.textContent = o;
          sel.appendChild(op);
        });
        sel.dataset.sig = list.join("|");
      }
      sel.value = cur;
    };
    reg(r.refresh);
    return r;
  }

  function switchPill(icon, name, id) {
    return pill(icon, name, {
      on: function () {
        return isOn(id);
      },
      tap: function () {
        toggleEnt(id);
      },
    });
  }

  function pop(el) {
    if (el && el.animate) el.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 220 });
  }

  /* ---- colours (for the colour of a scene, the pill of a light) ---- */

  function cssToRgb(s) {
    if (!s) return null;
    var m = String(s).match(/[\d.]+/g);
    if (/^#/.test(s)) {
      var h = s.slice(1);
      if (h.length === 3) h = h.replace(/(.)/g, "$1$1");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    return m && m.length >= 3 ? m.slice(0, 3).map(Number) : null;
  }

  function cssRgb(rgb) {
    return rgb ? "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")" : "";
  }

  /* The colour of a white at a temperature in kelvin (Tanner Helland's approximation). */
  function kelvinRgb(k) {
    var t = Math.max(1000, Math.min(40000, k)) / 100,
      r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592),
      g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492),
      b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    function c(v) {
      return Math.max(0, Math.min(255, v));
    }
    return [c(r), c(g), c(b)];
  }

  /* The colour of an xy pair at full brightness (the wide RGB D65 conversion that Hue documents). */
  function liveXyRgb(x, y) {
    if (!y) return [255, 255, 255];
    var z = 1 - x - y,
      X = x / y,
      Z = z / y,
      r = X * 1.656492 - 0.354851 - Z * 0.255038,
      g = -X * 0.707196 + 1.655397 + Z * 0.036152,
      b = X * 0.051713 - 0.121364 + Z * 1.01153;
    function gamma(v) {
      v = Math.max(0, v);
      return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    }
    var rgb = [gamma(r), gamma(g), gamma(b)],
      m = Math.max(rgb[0], rgb[1], rgb[2], 1e-6);
    return rgb.map(function (v) {
      return Math.round((Math.max(0, v) / m) * 255);
    });
  }

  function lightMembers(id) {
    var m = A(id).entity_id;
    return Array.isArray(m) && m.length ? m.slice() : [id];
  }

  function dom(id) {
    return String(id).split(".")[0];
  }

  /* ---- sheets: pages that open over the tab ---- */

  var PAGES = {};
  /* The pages the app opens as a popup over the page behind (it slides up, with an X and DONE or SAVE): a switch and what its buttons do, a light's settings, a scene's. The rest are pushed, with an arrow. */
  var MODAL = { "hue-switch": 1, "hue-button": 1, "hue-press": 1, "hue-cycle": 1, "hue-time": 1, "hue-tslot": 1, "hue-cslot": 1, "hue-scene": 1, "hue-light": 1, "hue-pw": 1, "hue-fn": 1, "hue-or": 1, "hue-od": 1, "hue-perf": 1, "hue-end": 1, "hue-escene": 1, "app-scene": 1, "app-press": 1, "app-smart": 1, "hue-bridge": 1, "hue-area": 1, "hue-marea": 1, "hue-group": 1, "hue-routine": 1, "hue-bname": 1, "hue-gname": 1, "hue-mname": 1, "hue-zch": 1 };
  var SHEET = null; /* {root, body}: the page that is open, while there is one */
  var SESSION = {}; /* what the pages ask HC.sheet for: it changes whenever the sheet closes or the tab changes, which is when what they read is read again */
  var STACK = [];
  var CURRENT = null;
  var POPGUARD = null;
  var CHECK = null; /* the guard whose checkmark the header shows */

  function pageOf(key) {
    var name = String(key).split(":")[0];
    return { def: PAGES[name], id: String(key).slice(name.length + 1) };
  }

  /* A page of the Hue app: it covers the screen, with a bar of an X (or an arrow when it was opened from another page), the title, and SAVE when what it shows is to be saved. */
  function buildSheet() {
    var root = mk("div", "pg");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.innerHTML =
      "<div class='pbar'><button type='button' class='rbt back' aria-label='" +
      T("back") +
      "'>" +
      svg("back") +
      "</button><button type='button' class='rbt x' aria-label='" +
      T("close") +
      "'>" +
      svg("close") +
      "</button><div class='ttl'><span class='tt'></span></div><button type='button' class='act ok' style='display:none'>" +
      T("save") +
      "</button><div class='lbar'></div></div><div class='pbody'></div>";
    var s = { root: root, body: root.querySelector(".pbody") };
    root.querySelector(".back").addEventListener("click", function () {
      popBack();
    });
    root.querySelector(".x").addEventListener("click", function () {
      /* The X of a popup closes the popup, with every page that was opened inside it, and shows the page it was opened from. */
      closePopup();
    });
    root.querySelector(".ok").addEventListener("click", function () {
      if (DONEFN) DONEFN();
      else if (CHECK) CHECK.save(CHECK.done);
      else closePopup();
    });
    document.body.appendChild(root);
    requestAnimationFrame(function () {
      root.classList.add("in");
    });
    return s;
  }

  function title(def, id) {
    return typeof def[0] === "function" ? def[0](id) : T(def[0]);
  }

  function render(key) {
    var p = pageOf(key);
    if (!p.def) return false;
    if (HOST.onRender) HOST.onRender();
    DONEFN = null;
    SHEET.root.classList.remove("roompg", "lightpg", "scenepg", "modalpg", "wizpg");
    /* The wizards (a new automation, a MotionAware area, a scene) have the app's blue top and a Next at the bottom. */
    if (/^(hue-(wz|mw)-|hue-newauto$|hue-add-scene$)/.test(String(key).split(":")[0])) SHEET.root.classList.add("wizpg");
    var okb = SHEET.root.querySelector(".ok");
    if (MODAL[String(key).split(":")[0]]) {
      SHEET.root.classList.add("modalpg");
      okb.textContent = T("done");
      okb.disabled = false;
    } else okb.textContent = T("save");
    SHEET.root.querySelector(".lbar").innerHTML = "";
    CURRENT = key;
    POPGUARD = null;
    CHECK = null;
    SHEET_LIST.length = 0;
    SHEET.root.querySelector(".ok").style.display = MODAL[String(key).split(":")[0]] ? "" : "none";
    SHEET.root.querySelector(".tt").textContent = title(p.def, p.id);
    SHEET.root.querySelector(".back").style.display = STACK.length ? "" : "none";
    SHEET.root.querySelector(".x").style.display = STACK.length ? "none" : "";
    SHEET.body.innerHTML = "";
    SHEET.body.scrollTop = 0;
    p.def[2](SHEET.body, p.id);
    refresh();
    return true;
  }

  function showPopup(key, push) {
    var p = pageOf(key);
    if (!p.def) return;
    if (!SHEET) SHEET = buildSheet();
    else if (push && CURRENT) STACK.push(CURRENT);
    else if (!push) {
      /* replaces the page; the pages before it stay */
    }
    render(key);
  }

  var DONEFN = null;

  function isModalKey(key) {
    return !!MODAL[String(key).split(":")[0]];
  }

  /* Closes the popup that is open: back through its pages to the page it was opened from, or all the way when it was the first. */
  function closePopup() {
    if (!isModalKey(CURRENT)) {
      if (STACK.length) popBack();
      else closeSheet();
      return;
    }
    if (POPGUARD && POPGUARD(closePopup)) return;
    while (STACK.length && isModalKey(CURRENT)) {
      var prev = STACK.pop();
      render(prev);
    }
    if (isModalKey(CURRENT)) closeSheet();
  }

  function popBack() {
    if (POPGUARD && POPGUARD(popBack)) return;
    var prev = STACK.pop();
    if (prev) render(prev);
    else closeSheet();
  }

  function closeSheet() {
    if (POPGUARD && POPGUARD(closeSheet)) return;
    POPGUARD = null;
    CHECK = null;
    if (!SHEET) return;
    var s = SHEET;
    SHEET = null;
    STACK = [];
    CURRENT = null;
    SHEET_LIST.length = 0;
    s.root.classList.remove("in");
    setTimeout(function () {
      s.root.remove();
    }, 250);
    SESSION = {};
    if (HOST.onSheetClosed) HOST.onSheetClosed();
  }

  /* An editor that asks before it is left with changes that are not saved: o = {dirty(), save(leave), discard(), inner, done}. The checkmark of the header saves. */
  function guardUnsaved(o) {
    function guard(leave) {
      if (!o.dirty()) return false;
      if (o.inner && leave === popBack) return false;
      ask(T("unsaved_changes"), [
        {
          label: T("discard_changes"),
          fn: function () {
            POPGUARD = null;
            if (o.discard) o.discard();
            leave();
          },
        },
        {
          label: T("save"),
          fn: function () {
            guard.save(leave);
          },
        },
      ]);
      return true;
    }
    guard.save = function (leave) {
      POPGUARD = null;
      var done = o.save(leave);
      if (done === false) POPGUARD = guard;
      else if (done && done.then)
        done.then(function (ok) {
          if (ok === false) POPGUARD = guard;
        });
    };
    guard.dirty = o.dirty;
    guard.done = o.done || popBack;
    POPGUARD = guard;
    if (!o.inner && SHEET) {
      CHECK = guard;
      SHEET.root.classList.add("modalpg");
      SHEET.root.querySelector(".ok").style.display = "";
      SHEET.root.querySelector(".ok").textContent = T("save");
      SHEET.root.querySelector(".ok").disabled = true;
    }
  }

  /* ---- what the pages register: kept, for the parts of this panel that use them ---- */

  var REGISTERED = { sceneKinds: [], sceneMakers: [], sceneImports: [], deviceKinds: [], playback: [], lightStyles: [], areaHooks: {} };

  var HOST = {
    pages: PAGES,
    registered: REGISTERED,
    onUpdate: null,
    onSheetClosed: null,
    onRender: null,
    onHass: null,
    editLights: function () {
      toast(T("unavailable"));
    },
  };

  window.HueHost = HOST;
  /* The Hue Plus pages read bridge lists through the dashboard's HA object. */
  window.HA = { serviceResponse: serviceResponse };
  window.HomeControl = {
    version: 1,
    hass: H,
    t: T,
    attrs: A,
    state: V_,
    isOn: isOn,
    registry: reg,
    get isAdmin() {
      return !!(HASS && HASS.user && HASS.user.is_admin);
    },
    call: call,
    callRaw: callRaw,
    toggle: toggleEnt,
    toast: toast,
    refresh: refresh,
    el: mk,
    icon: svg,
    row: pill,
    count: cntS,
    confirm: confirmDlg,
    open: showPopup,
    back: popBack,
    closeLayer: closeSheet,
    guard: guardUnsaved,
    get sheet() {
      return SESSION;
    },
    get popGuard() {
      return POPGUARD;
    },
    set popGuard(value) {
      POPGUARD = value;
    },
    editing: function () {
      return false;
    },
    ui: {
      attachSlide: attachSlide,
      briControl: briControl,
      callLive: callLive,
      cap: cap,
      closeSheet: closeSheet,
      cssRgb: cssRgb,
      cssToRgb: cssToRgb,
      deviceGet: function (key, fallback) {
        try {
          var v = JSON.parse(localStorage.getItem("hue_plus_panel_" + key));
          return v === null ? fallback : v;
        } catch (e) {
          return fallback;
        }
      },
      deviceSet: function (key, value) {
        try {
          localStorage.setItem("hue_plus_panel_" + key, JSON.stringify(value));
        } catch (e) {}
      },
      dom: dom,
      dropRow: dropRow,
      ic: ic,
      inkRow: function (row, rgb, pct) {
        row.style.setProperty("--ink-pct", pct + "%");
      },
      kelvinRgb: kelvinRgb,
      lightMembers: lightMembers,
      liveStopOn: function () {},
      liveXyRgb: liveXyRgb,
      pinPop: function () {
        return null;
      },
      pop: pop,
      sep: sep,
      sliderRow: sliderRow,
      switchPill: switchPill,
      get pageFill() {
        return "rgb(255,193,90)";
      },
    },
    /* A "room" of this panel is a Hue room or zone, named "app:<its light entity>"; the Hue pages ask for it by name to start from it. */
    room: function (scope) {
      var id = String(scope || "").indexOf("app:") === 0 ? scope.slice(4) : null;
      return id && HASS && HASS.states[id] ? { id: scope, area: null, name: A(id).friendly_name } : null;
    },
    serviceResponse: serviceResponse,
    scenes: {
      hidden: function () {
        return false;
      },
      setHidden: function () {},
      importFrom: function () {},
      editLights: function (o) {
        return HOST.editLights(o);
      },
    },
    areas: {
      roomLights: function () {
        return [];
      },
      open: function () {},
      clamp: function (v) {
        return v;
      },
      identifyOff: function () {},
      rebuild: function () {},
      get editor() {
        return null;
      },
      openExternal: function () {},
    },
    addStrings: function (dict) {
      Object.keys(dict).forEach(function (k) {
        if (EN[k] === undefined) EN[k] = dict[k];
      });
    },
    set onDone(fn) {
      DONEFN = fn;
    },
    registerPage: function (key, titleKey, icon, builder) {
      PAGES[key] = [titleKey, icon, builder];
    },
    registerSettings: function () {},
    addStyles: function (css) {
      var el = document.createElement("style");
      el.textContent = css;
      document.head.appendChild(el);
    },
    registerSceneKind: function (d) {
      REGISTERED.sceneKinds.push(d);
    },
    registerSceneMaker: function (d) {
      REGISTERED.sceneMakers.push(d);
    },
    registerSceneImport: function (d) {
      REGISTERED.sceneImports.push(d);
    },
    registerDeviceKind: function (d) {
      REGISTERED.deviceKinds.push(d);
    },
    registerPlayback: function (d) {
      REGISTERED.playback.push(d);
    },
    registerLightStyle: function (d) {
      REGISTERED.lightStyles.push(d);
    },
    registerAreaHooks: function (id, d) {
      REGISTERED.areaHooks[id] = d;
    },
  };

  /* What the application uses besides the plugin API. */
  HOST.api = {
    attach: attach,
    hass: function () {
      return HASS;
    },
    ws: function (msg) {
      return HASS.callWS(msg);
    },
    ready: function () {
      return REGISTRIES_READY || Promise.resolve();
    },
    T: T,
    mk: mk,
    svg: svg,
    ic: ic,
    setBuilding: function (list) {
      BUILDING = list;
    },
    tabList: TAB_LIST,
    resetSession: function () {
      SESSION = {};
    },
    closeSheet: closeSheet,
    hasSheet: function () {
      return !!SHEET;
    },
    toast: toast,
    ask: ask,
    schedule: schedule,
    addStrings: window.HomeControl.addStrings,
  };
})();
