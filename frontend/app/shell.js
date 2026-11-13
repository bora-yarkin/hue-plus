/* The Hue dashboard panel (Hue Plus, dashboard module): the Hue app's tabs and tab bar. Home and its pages are in home.js and light.js, Sync in syncpage.js; Automations and Settings are the Hue Plus menu
 pages themselves, drawn in the tab. Everything sits inside the plugin's scope, so it uses the same pages and helpers as the menu. The Explore tab of the app (a gallery from Signify's cloud) has nothing behind
 it here. Nothing is kept in Home Assistant: the panel shows the bridge and writes to it. */

HOST_ICONS.bolt = "<path d='M13 2L5 14h6l-1 8 8-12h-6z'/>";
HOST_ICONS.tabhome = "<path d='M12 2.6 2.4 11.4h2.8v8.8h5.3v-5.6h3v5.6h5.3v-8.8h2.8z'/>";
HOST_ICONS.tabbolt = "<path d='M14 1.8 5.2 13.6h5.4L9.2 22.2 18.8 9.6h-5.6z'/>";
HOST_ICONS.switch = "<rect x='7' y='2.5' width='10' height='19' rx='2.4'/><path d='M10 6.5h4M10 10h4M10 13.5h4M10 17h4'/>";
HOST_ICONS.dots = "<circle cx='5' cy='12' r='1.7' fill='currentColor'/><circle cx='12' cy='12' r='1.7' fill='currentColor'/><circle cx='19' cy='12' r='1.7' fill='currentColor'/>";

var HPAPP = { tab: "", el: null, bridge: "", modules: null, sigOf: null, lastSig: "" };
var HPAPI = window.HueHost && window.HueHost.api;

/* The tabs, in the order of the Hue app's tab bar. */
function hpTabs() {
  return [
    { id: "home", title: _T("home"), icon: "tabhome", build: hpHomeTab },
    { id: "automations", title: _T("automations"), icon: "tabbolt", build: hpAutomationsTab },
    { id: "sync", title: _T("app_sync"), icon: "syncring", build: hpSyncTab },
    { id: "settings", title: _T("app_settings"), icon: "cog", build: hpSettingsTab },
  ];
}

function hpShowTab(id) {
  var tab = hpTabs().filter(function (t) {
    return t.id === id;
  })[0];
  if (!tab) return;
  HPAPP.tab = id;
  HPAPP.el.querySelector("#hp").dataset.tab = id;
  HPAPP.sigOf = null;
  HPAPI.tabList.length = 0;
  HPAPI.resetSession();
  HPAPP.main.innerHTML = "";
  HPAPP.view.scrollTop = 0;
  Array.prototype.forEach.call(HPAPP.nav.querySelectorAll("button"), function (b) {
    var on = b.dataset.tab === id;
    b.classList.toggle("on", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  HPAPI.setBuilding(HPAPI.tabList);
  try {
    tab.build(HPAPP.main);
  } finally {
    HPAPI.setBuilding(null);
  }
  HPAPP.lastSig = HPAPP.sigOf ? HPAPP.sigOf() : "";
  refresh();
}

/* What the home screen is made of changes when a room or zone is added or removed: the tab draws itself again then. */
function hpWatch() {
  if (HPAPP.sigOf && HPAPP.sigOf() !== HPAPP.lastSig && !HPAPI.hasSheet()) hpShowTab(HPAPP.tab);
}

/* How much the browser has zoomed the page, when it reports what it measures (a rectangle, a pointer's place) in zoomed units while a style's px is not zoomed (Safari's page zoom): a measured length
 becomes a style's px by dividing by this. It is 1 where the two agree. */
function hpZoom() {
  var styled = parseFloat(getComputedStyle(document.body).width);
  return styled ? document.body.getBoundingClientRect().width / styled || 1 : 1;
}

/* The panel is a phone: as high as its page and 9:16 wide, or as wide as the page when that is narrower. Its size and the root font size (16px when the phone is 393 wide, the width the Hue app's screens
 were measured at; every length of the style sheet is a rem) are set here from the page's computed size, which is right in a zoomed browser too; viewport units are not (Safari, in a frame). */
function hpFit() {
  var page = getComputedStyle(document.documentElement),
    wide = parseFloat(page.width),
    high = parseFloat(page.height);
  if (!wide || !high) return;
  var phone = Math.min(wide, (high * 9) / 16);
  document.body.style.width = phone + "px";
  document.documentElement.style.fontSize = (phone / 393) * 16 + "px";
}

function hpStart() {
  HPAPI.ws({ type: "hue_plus/capabilities" }).then(
    function (r) {
      var b = ((r && r.bridges) || [])[0];
      HPAPP.bridge = b ? b.name : "";
      HPAPP.modules = b ? b.modules : null;
      if (HPAPP.tab === "home") hpShowTab("home");
    },
    function () {}
  );
  hpTabs().forEach(function (t) {
    var b = mk("button", "", svg(t.icon) + "<span></span>");
    b.type = "button";
    b.dataset.tab = t.id;
    b.querySelector("span").textContent = t.title;
    b.addEventListener("click", function () {
      if (HPAPI.hasSheet()) HPAPI.closeSheet();
      hpShowTab(t.id);
    });
    HPAPP.nav.querySelector(".in").appendChild(b);
  });
  window.HueHost.onUpdate = hpWatch;
  var closed = window.HueHost.onSheetClosed;
  window.HueHost.onSheetClosed = function () {
    if (closed) closed();
    /* The tab behind is kept as it was (it is not drawn again under the eyes of whoever closed the popup) unless the bridge was changed meanwhile. */
    if (window.HueHost.dirty) {
      window.HueHost.dirty = false;
      hpShowTab(HPAPP.tab);
    } else {
      hpWatch();
      refresh();
    }
  };
  hpShowTab("home");
}

window.HuePlusApp = {
  attach: function (hass) {
    HPAPI.attach(hass);
  },
  mount: function (el, hass) {
    HPAPI.attach(hass);
    HC.addStyles(HOST_CSS);
    hpFit();
    window.addEventListener("resize", hpFit);
    if (window.ResizeObserver) new ResizeObserver(hpFit).observe(document.documentElement);
    el.innerHTML = "<div id='hp'><div class='view'><div class='in'></div></div><nav class='tabs' aria-label='" + _T("app_tabs") + "'><div class='in'></div></nav></div>";
    HPAPP.el = el;
    HPAPP.view = el.querySelector(".view");
    HPAPP.main = el.querySelector(".view>.in");
    HPAPP.nav = el.querySelector("nav");
    HPAPP.main.appendChild(mk("div", "empty")).textContent = _T("loading");
    /* The colour panel takes a few seconds to start (it is Home Control's whole dashboard code), so it starts now, while Home is being read, and is ready when a light is tapped. */
    hpLightFrame(function () {});
    /* Everything the pages need from the bridge (rooms, scenes and their colours, controls, what each light was last set to) is read now, before anything is tapped. */
    hmReady().then(refresh, function () {});
    hpLoadLightStates();
    /* The panel starts when the registries are in, or after a short wait; the lists fill in by themselves. */
    Promise.race([
      HPAPI.ready(),
      new Promise(function (resolve) {
        setTimeout(resolve, 6000);
      }),
    ]).then(hpStart);
  },
};
