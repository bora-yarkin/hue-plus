/* Home Control's Hue Plus menu, in the dashboard's Settings: the panel's tabs, Automations, Sync and Settings (Home is the dashboard's own, with its own lights and colour wheel), each drawn by the
 panel's own page builder in Home Control's theme. */

var HP_ROOT_TAB = "settings";

/* Sync: the Spotify sync and the HDMI sync box, which open their own pages (the same ones the Lights section opens). */
function hpSyncMenuTab(box) {
  var inner = mk("div");
  box.appendChild(inner);
  hmBox(inner);
  var sync = hpSyncEntities(function (h, id) {
      return HUESYNC.isSync(h, id);
    }),
    boxes = hpSyncEntities(function (h, id) {
      return HUESYNCBOX.isBox(h, id);
    });
  inner.appendChild(hmLabel(_T("app_music")));
  if (sync.length) inner.appendChild(hsyncRow({ id: sync[0], name: _T("spotify_sync"), icon: "syncring" }));
  else inner.appendChild(hmCallout(_T("app_no_spotify_sync")));
  inner.appendChild(hmLabel(_T("app_tv_and_games")));
  if (boxes.length)
    boxes.forEach(function (id) {
      inner.appendChild(hsboxRow({ id: id, name: _T("hue_play_hdmi_sync_box"), icon: "syncring" }));
    });
  else inner.appendChild(hmCallout(_T("app_no_sync_box")));
}

function hpRootTabs() {
  return [
    { id: "automations", title: _T("automations"), build: hpAutomationsTab },
    { id: "sync", title: _T("app_sync"), build: hpSyncMenuTab },
    { id: "settings", title: _T("app_settings"), build: hpSettingsTab },
  ];
}

function hpRootPage(b) {
  hmBox(b);
  var bar = mk("div", "htabs"),
    body = mk("div", "htab"),
    buttons = {};
  function show(id) {
    HP_ROOT_TAB = id;
    body.innerHTML = "";
    hpRootTabs()
      .filter(function (t) {
        return t.id === id;
      })[0]
      .build(body);
    Object.keys(buttons).forEach(function (k) {
      buttons[k].classList.toggle("on", k === id);
      buttons[k].setAttribute("aria-pressed", k === id ? "true" : "false");
    });
    refresh();
  }
  hpRootTabs().forEach(function (t) {
    var button = mk("button", "htabb");
    button.type = "button";
    button.textContent = t.title;
    button.addEventListener("click", function () {
      show(t.id);
    });
    buttons[t.id] = button;
    bar.appendChild(button);
  });
  b.appendChild(bar);
  b.appendChild(body);
  show(HP_ROOT_TAB);
}

HP_PAGES["stg-hue"] = ["hue_plus", HP_ICON, hpRootPage];
