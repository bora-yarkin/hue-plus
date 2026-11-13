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
}

HP_PAGES["hue-light"] = ["app_light_settings", "lamp", hpLightSettings];

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
