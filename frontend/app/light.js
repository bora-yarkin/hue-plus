/* The light screens of the Hue app: a light's or a room's colour wheel, the white and effects pages and the brightness button, and the scene editor (the same screen with SAVE).
 The panel itself is Home Control's, run as it is in a frame of its own (popup.html, with a copy of Home Control's dashboard code in lights/); this file only gives it a page: the bar above it, and the
 frame under the bar. Nothing is kept in Home Assistant: what a change does goes to the lights, which are the bridge's. */

var HP_BASE = document.currentScript ? new URL(".", document.currentScript.src).href : "/hue_plus_static/";
var HP_VERSION = document.currentScript ? new URL(document.currentScript.src).searchParams.get("v") || "" : "";

var HPLF = { el: null, win: null, ready: false, waiting: [] };

/* The frame starts when the first light screen is asked for and stays, so the next one opens at once. */
function hpLightFrame(then) {
  if (HPLF.ready) {
    then(HPLF.win);
    return;
  }
  HPLF.waiting.push(then);
  if (HPLF.el) return;
  var f = mk("iframe", "lightframe");
  f.title = _T("app_light_panel");
  f.src = new URL("popup.html", HP_BASE).href + (HP_VERSION ? "?v=" + encodeURIComponent(HP_VERSION) : "");
  document.body.appendChild(f);
  HPLF.el = f;
  var wait = setInterval(function () {
    var w = f.contentWindow;
    if (!w || !w.HuePopup) return;
    if (!HPLF.win) {
      HPLF.win = w;
      w.HuePopup.attach(HPAPI.hass());
    }
    if (w.HuePopup.isReady()) {
      clearInterval(wait);
      HPLF.ready = true;
      HPLF.waiting.splice(0).forEach(function (fn) {
        fn(w);
      });
    }
  }, 60);
}

/* The frame gets Home Assistant's hass whenever the panel does, so the lights in it follow their states. */
window.HueHost.onHass = function (h) {
  if (HPLF.win && HPLF.win.HuePopup) HPLF.win.HuePopup.attach(h);
};

function hpFrameShow(on) {
  if (!HPLF.el) return;
  var bar = document.querySelector(".pg .pbar");
  HPLF.el.style.top = bar ? bar.offsetHeight + "px" : "0";
  HPLF.el.classList.toggle("show", !!on);
}

/* Every page that is drawn takes the frame away; a light screen puts it back. */
window.HueHost.onRender = function () {
  hpFrameShow(false);
};

function hpLightScreen(body, ids, name) {
  var wait = mk("div", "empty");
  wait.textContent = _T("loading");
  body.appendChild(wait);
  var token = (HC.sheet.light = {});
  hpLightFrame(function (win) {
    if (HC.sheet.light !== token) return;
    wait.remove();
    win.HuePopup.panel(ids, name);
    hpFrameShow(true);
  });
}

/* A light or a group: its page is the panel. */
function hpLightPage(body, id) {
  hpLightScreen(body, [id], A(id).friendly_name || id);
}

/* The editor of a scene's lights (the Hue app's "New scene" and a scene's lights): the same screen, with SAVE. The lights show what is set while it is open; leaving after a change asks, and discarding
 puts them back as they were. o = { name, lights, onSave(acts), after }; onSave answers true (or a promise of true) when it kept the scene. */
var HPEDIT = null;

function hpEditLights(o) {
  HPEDIT = { o: o, snap: null };
  call("light", "turn_on", { entity_id: o.lights });
  showPopup("app-edit", true);
}

function hpEditPage(body) {
  if (!HPEDIT) {
    body.appendChild(mk("div", "empty")).textContent = _T("nothing_found");
    return;
  }
  var E = HPEDIT,
    o = E.o,
    token = (HC.sheet.light = {}),
    wait = mk("div", "empty");
  wait.textContent = _T("loading");
  body.appendChild(wait);
  hpLightFrame(function (win) {
    if (HC.sheet.light !== token) return;
    wait.remove();
    /* The lights were just switched on: the picture is taken when they have settled, so that "changed" means changed by the person. */
    setTimeout(function () {
      if (HC.sheet.light !== token) return;
      E.snap = win.HuePopup.snapshot(o.lights);
      win.HuePopup.panel(o.lights, o.name);
      hpFrameShow(true);
    }, 700);
  });
  guardUnsaved({
    dirty: function () {
      return !!(E.snap && HPLF.win && HPLF.win.HuePopup.snapshot(o.lights) !== E.snap);
    },
    discard: function () {
      if (E.snap) HPLF.win.HuePopup.restore(E.snap);
    },
    save: function (leave) {
      return Promise.resolve(o.onSave(HPLF.win.HuePopup.acts(o.lights))).then(function (ok) {
        if (ok === false) return false;
        E.snap = null;
        if (o.after) o.after();
        else leave();
        return true;
      });
    },
  });
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
HC.registerPage(
  "app-edit",
  function () {
    return HPEDIT && HPEDIT.o.name ? HPEDIT.o.name : _T("app_edit_the_lights");
  },
  "palette",
  hpEditPage
);
