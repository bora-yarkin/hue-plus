/* Light placement in the Hue dashboard panel: Home Control's area editor (the room in three dimensions, the lights to drag, their tray) run in the light frame under the page's bar. In Home Control's own
 menu the area page opens that editor on the bridge's area instead (hpEditOnBridge). */

/* Light placement is Home Control's area editor (the room in three dimensions, the lights to drag, their tray), run in the light frame under this page's bar and drawn as the app draws it. DONE takes what it holds
 back into the area's draft; it goes to the bridge with SAVE on the area, like the rest of the area's changes. */
var HPPLACE = null;

function hpPlacePage(b, id) {
  hmBox(b);
  hmGuard(hpAreaKey(id), true);
  var wait = mk("div", "empty"),
    token = (HPPLACE = {});
  wait.textContent = _T("loading");
  b.appendChild(wait);
  hmLoad(b, ["entertainment_areas"], function (box) {
    var x = hmEntArea(id);
    if (!x) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var area = {
        id: id,
        name: hpAreaName(x),
        lights: hpAreaLights(x).map(function (l) {
          return { light_id: l.light, name: l.name, x: l.x, y: l.y, z: l.z, positions: l.positions, balance: l.balance };
        }),
      },
      names = {};
    area.lights.forEach(function (l) {
      names[l.light_id] = l.name;
    });
    hpLightFrame(function (win) {
      if (HPPLACE !== token) return;
      wait.remove();
      win.HuePopup.hide();
      hpFrameShow(true);
      win.HuePopup.area(area);
      HC.onDone = function () {
        var d = JSON.parse(win.HuePopup.areaDraft() || "null");
        if (d) {
          var lights = (d.kept || []).map(function (k) {
            return { light: k.light, name: names[k.light] || String(k.light), x: k.x, y: k.y, z: k.z, balance: typeof k.balance === "number" ? k.balance : 1 };
          });
          (d.lights || []).forEach(function (l) {
            var every = hpBarPositions(l),
              first = every ? every[0] : { x: l.x, y: hpFlip(l.y), z: l.z };
            lights.push({ light: hpHueId(l.id), name: hpName(l.id), x: first.x, y: first.y, z: first.z, positions: every || undefined, balance: typeof l.balance === "number" ? l.balance : 1 });
          });
          if (lights.length) hpStageLights(x, lights);
        }
        popBack();
      };
    });
  });
}

HP_PAGES["app-place"] = ["hm_light_placement", "target", hpPlacePage];
