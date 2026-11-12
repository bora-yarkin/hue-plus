/* The Hue dashboard panel (Hue Plus, dashboard module): a heading, the tab, and a tab bar like the Hue app's. Home and its light pages are in home.js and light.js, Sync in
 syncpage.js; Automations and Settings are the Hue Plus menu pages themselves, drawn in the tab instead of in a sheet. Everything sits inside the plugin's scope, so it uses the
 same pages and helpers as the menu. */

HOST_ICONS.bolt = "<path d='M13 2L5 14h6l-1 8 8-12h-6z'/>";

var HPAPP = { tab: "", el: null, bridge: "", modules: null, sigOf: null, lastSig: "" };
var HPAPI = window.HueHost && window.HueHost.api;

/* The tabs, in the order of the Hue app's tab bar (its Explore tab, a gallery from Signify's cloud, has nothing behind it here). */
function hpTabs() {
  return [
    { id: "home", title: _T("home"), icon: "home", build: hpHomeTab },
    { id: "automations", title: _T("automations"), icon: "bolt", build: hpAutomationsTab },
    { id: "sync", title: _T("app_sync"), icon: "syncring", build: hpSyncTab },
    { id: "settings", title: _T("app_settings"), icon: "cog", build: hpSettingsTab },
  ];
}

function hpAutomationsTab(box) {
  HP_PAGES["hue-routines"][2](box);
}

function hpSettingsTab(box) {
  HP_PAGES["stg-hue"][2](box);
}

function hpShowTab(id) {
  var tab = hpTabs().filter(function (t) {
    return t.id === id;
  })[0];
  if (!tab) return;
  HPAPP.tab = id;
  HPAPP.sigOf = null;
  HPAPI.tabList.length = 0;
  HPAPI.resetSession();
  HPAPP.main.innerHTML = "";
  HPAPP.title.textContent = tab.title;
  HPAPP.sub.textContent = HPAPP.bridge;
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

function hpStart() {
  HPAPI.ws({ type: "hue_plus/capabilities" }).then(
    function (r) {
      var b = ((r && r.bridges) || [])[0];
      HPAPP.bridge = b ? b.name : "";
      HPAPP.modules = b ? b.modules : null;
      HPAPP.sub.textContent = HPAPP.bridge;
    },
    function () {}
  );
  var tabs = hpTabs();
  tabs.forEach(function (t) {
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
  window.HueHost.onSheetClosed = function () {
    hpShowTab(HPAPP.tab);
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
    el.innerHTML =
      "<div id='hp'><header class='top'><div><h1></h1><div class='sub'></div></div></header><main></main><nav class='tabs' aria-label='" +
      _T("app_tabs") +
      "'><div class='in'></div></nav></div>";
    HPAPP.el = el;
    HPAPP.title = el.querySelector("h1");
    HPAPP.sub = el.querySelector(".sub");
    HPAPP.main = el.querySelector("main");
    HPAPP.nav = el.querySelector("nav");
    HPAPP.main.appendChild(hmCallout(_T("loading")));
    /* The panel starts when the registries are in, or after a short wait; the lists fill in by themselves. */
    Promise.race([
      HPAPI.ready(),
      new Promise(function (resolve) {
        setTimeout(resolve, 6000);
      }),
    ]).then(hpStart);
  },
};
