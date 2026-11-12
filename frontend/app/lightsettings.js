/* A light's settings, as the app has them: the light and its name, the room it is in (the bridge's), General (function, power on, orientation), and Support, with the light's device info one tap away. What
 this adds to the app's page, Hue Plus's own timed effects, stays at the end. It is the menu's page (hmLight) with those parts changed, so what is edited and saved is the same. */

function hpRoomOfLight(id) {
  var hue = A(id).hue_light_id,
    found = null;
  (HM.rooms || []).concat(HM.zones || []).forEach(function (g) {
    if (hue && (g.lights || []).indexOf(hue) >= 0) found = found || g;
  });
  return found;
}

function hpDeviceInfoRows(id) {
  var a = function () {
      return A(id);
    },
    X = hueplus.forLight(H(), id),
    rows = [];
  if (a().hue_min_brightness !== undefined)
    rows.push(
      hmRow({
        title: _T("lowest_brightness"),
        val: function () {
          return Math.round(a().hue_min_brightness * 100) / 100 + "%";
        },
      })
    );
  if (X.update)
    rows.push(
      hmRow({
        title: _T("firmware"),
        sub: function () {
          return A(X.update).installed_version || "";
        },
        val: function () {
          return hmUpdateText(X.update);
        },
        tap:
          V_(X.update) === "on"
            ? function () {
                confirmDlg(_T("install_this_update"), function () {
                  call("update", "install", { entity_id: X.update });
                });
              }
            : null,
      })
    );
  return rows;
}

function hpLightSettings(b, id) {
  hmLight(b, id);
  var kids = [].slice.call(b.children);
  /* The room of the light comes from the bridge, as the app shows it. */
  var title = b.querySelector(".hm-title"),
    room = hpRoomOfLight(id);
  if (title && room && !b.querySelector(".hm-group .hm-i svg + *") && !kids.some(function (k) { return /^Room\b/.test(k.textContent || ""); })) {
    var g = hmGroup([hmRow({ title: _T("hm_room"), val: room.name })]);
    b.insertBefore(g, title.nextSibling);
  }
  /* The device info is a row under Support, as in the app, and opens the details. */
  var label = [].filter.call(b.querySelectorAll(".hm-label"), function (l) {
    return l.textContent === _T("hm_device_info");
  })[0];
  if (label) {
    var group = label.nextSibling;
    label.textContent = _T("app_support");
    group.parentNode.replaceChild(
      hmGroup([hmRow({ icon: "info", title: _T("hm_device_info"), tap: "app-devinfo:" + id })]),
      group
    );
  }
}

function hpDeviceInfoPage(b, id) {
  hmBox(b);
  b.appendChild(hmTitle("lamp", hpName(id)));
  b.appendChild(hmGroup(hpDeviceInfoRows(id)));
}

HP_PAGES["hue-light"] = ["app_light_settings", "lamp", hpLightSettings];
HP_PAGES["app-devinfo"] = ["hm_device_info", "info", hpDeviceInfoPage];

/* The Bridges list of the app: the bridge, and a tap opens its settings. (The menu's Bridges row goes straight to the settings.) */
function hpBridgesPage(b) {
  hmBox(b);
  hmEnsure();
  b.appendChild(
    hmGroup([
      hmRow({
        icon: "plug",
        title: function () {
          return (HM.bridge && HM.bridge.name) || _T("hue_bridge");
        },
        tap: "hue-bridge",
      }),
    ])
  );
}

HP_PAGES["app-bridges"] = ["hm_bridges", "plug", hpBridgesPage];
HP_PAGES["hue-bridge"] = ["app_bridge_settings", "plug", hmBridge];
