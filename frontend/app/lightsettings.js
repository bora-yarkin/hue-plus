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
  /* The pencil by the name opens Edit name and type. */
  if (title && hueplus.has(H(), "set_name") && A(id).hue_light_id) {
    var pen = hpRound("edit", _T("app_edit_name_and_type"), function () {
      delete HPRENAME[id];
      showPopup("app-rename:" + id, true);
    });
    pen.classList.add("hm-pen");
    title.appendChild(pen);
  }
  /* The device info is a row under Support, as in the app, and opens the details. */
  var label = [].filter.call(b.querySelectorAll(".hm-label"), function (l) {
    return l.textContent === _T("hm_device_info");
  })[0];
  var support = hmGroup([hmRow({ icon: "info", title: _T("hm_device_info"), tap: "app-devinfo:" + id })]);
  if (label) {
    var group = label.nextSibling;
    label.textContent = _T("app_support");
    group.parentNode.replaceChild(support, group);
  } else {
    /* the app always has Support with Device info, before the buttons at the end */
    var end = b.querySelector(".hm-actions");
    b.insertBefore(hmLabel(_T("app_support")), end);
    b.insertBefore(support, end);
  }
}

/* Device info, as the app lists it: device type, manufacturer, model, MAC address, hardware platform version and software, from what Home Assistant knows of the device; then the light's lowest
 brightness and its firmware update, which Hue Plus adds. */
function hpDeviceInfoPage(b, id) {
  hmBox(b);
  var ent = H().entities && H().entities[id],
    dev = ent && H().devices ? H().devices[ent.device_id] : null,
    rows = [];
  function row(title, value) {
    if (value) rows.push(hmRow({ title: title, sub: String(value), stack: true }));
  }
  if (dev) {
    var mac = (dev.connections || []).filter(function (c) {
      return c[0] === "zigbee" || c[0] === "mac";
    })[0];
    row(_T("app_device_type"), dev.model);
    row(_T("app_manufacturer"), dev.manufacturer);
    row(_T("app_model"), dev.model_id);
    row(_T("app_mac_address"), mac ? mac[1] : "");
    row(_T("app_hardware_version"), dev.hw_version);
    row(_T("app_software"), dev.sw_version);
  }
  if (rows.length) b.appendChild(hmGroup(rows));
  var extra = hpDeviceInfoRows(id);
  if (extra.length) b.appendChild(hmGroup(extra));
}

/* The pencil by the light's name: its name and its icon type, as the app's "Edit name and type" (Hue-Screenshots/IMG_0579): the icon, the name in a field, and the types in their groups. DONE
 writes both to the bridge. */
var HPRENAME = {};

function hpRenamePage(b, id) {
  hmBox(b);
  var hue = A(id).hue_light_id,
    st = HPRENAME[id] || (HPRENAME[id] = { name: hpName(id), type: hpArchetypeOf(id) }),
    big = mk("div", "rnbig");
  function paintBig() {
    big.innerHTML = svg(hpArchetypeIcon(st.type) || hpLightIcon(id));
  }
  paintBig();
  b.appendChild(big);
  var field = mk("input", "rnname");
  field.type = "text";
  field.maxLength = 32;
  field.value = st.name;
  field.setAttribute("aria-label", _T("app_name"));
  field.addEventListener("input", function () {
    st.name = field.value;
  });
  b.appendChild(field);
  HP_ARCHETYPES.forEach(function (g) {
    b.appendChild(hmLabel(_T(g[0])));
    var grid = mk("div", "rngrid");
    g[2].forEach(function (type) {
      var t = mk("button", "rntype" + (st.type === type ? " on" : ""), "<span class='ic'></span><b></b>");
      t.type = "button";
      t.querySelector(".ic").innerHTML = svg(g[1]);
      t.querySelector("b").textContent = _T("app_arch_" + type);
      t.addEventListener("click", function () {
        st.type = type;
        Array.prototype.forEach.call(b.querySelectorAll(".rntype.on"), function (x) {
          x.classList.remove("on");
        });
        t.classList.add("on");
        paintBig();
      });
      grid.appendChild(t);
    });
    b.appendChild(grid);
  });
  HC.onDone = function () {
    var name = String(st.name || "").trim();
    if (!name) {
      toast(_T("app_name_needed"));
      return;
    }
    var data = { resource: "light", id: hue, name: name };
    if (st.type) data.archetype = st.type;
    hpCall("hue_plus", "set_name", data).then(
      function () {
        delete HPRENAME[id];
        hpLoadLightStates();
        popBack();
      },
      function () {
        toast(_T("hm_the_bridge_did_not_accept_this"));
      }
    );
  };
}

HP_PAGES["hue-light"] = ["app_light_settings", "lamp", hpLightSettings];
HP_PAGES["app-devinfo"] = ["hm_device_info", "info", hpDeviceInfoPage];
HP_PAGES["app-rename"] = ["app_edit_name_and_type", "edit", hpRenamePage];

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
