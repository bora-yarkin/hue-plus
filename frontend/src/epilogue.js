
  /* Registration with the dashboard. */
  HC.addStrings(PLUGIN_STRINGS);
  Object.keys(HP_PAGES).forEach(function (key) {
    HC.registerPage(key, HP_PAGES[key][0], HP_PAGES[key][1], HP_PAGES[key][2]);
  });
  HC.registerSettings({
    id: "hue",
    title: "hue_plus",
    icon: "lights",
    page: "stg-hue",
    sub: function () {
      return _T("firmware_zigbee_matter_and_apps");
    },
    visible: hpShown,
    keywords: "hue plus bridge firmware updates zigbee matter routines automations entertainment motion lights",
  });
  /* The Spotify sync and the Hue Play HDMI Sync Box: rows of the Lights section that look like lights, their popups, and what plays on a light. */
  HC.addStyles(HUE_PLUS_CSS);
  HC.registerPage("hsync", "spotify_sync", "syncring", function (body, id) {
    hsyncPopup(body, id);
  });
  HC.registerPage("hsbox", "hue_play_hdmi_sync_box", "syncring", function (body, id) {
    hsboxPopup(body, id);
  });
  Object.keys(HS_PICK).forEach(function (key) {
    HC.registerPage(key, HS_PICK[key][0], HS_PICK[key][1], HS_PICK[key][2]);
  });
  HC.registerDeviceKind({
    match: function (id) {
      return HUESYNC.isSync(H(), id);
    },
    pop: "hsync",
    icon: "syncring",
    search: "light",
    row: hsyncRow,
  });
  HC.registerDeviceKind({
    match: function (id) {
      return HUESYNCBOX.isBox(H(), id);
    },
    pop: "hsbox",
    icon: "syncring",
    search: "light",
    row: hsboxRow,
  });
  HC.registerPlayback({
    plays: function (id) {
      var sw = lightSyncPlays(id);
      return sw
        ? {
            entity: sw,
            label: _T("spotify_sync"),
            pct: function () {
              return hsyncPct(sw);
            },
          }
        : null;
    },
  });

  /* Hue's scenes: the room's scene rows, their popup, the scene tiles of the light panel, and importing one as a live scene. */
  HC.registerPage(
    "hue-scene",
    function (id) {
      return A(id.split("~")[0]).name || A(id.split("~")[0]).friendly_name || _T("scenes");
    },
    "palette",
    function (body, id) {
      var q = id.split("~");
      hueScenePopup(body, q[0], q[1] ? roomById(q[1]) : null);
    }
  );
  HC.registerSceneKind({
    match: function (id) {
      return HUESCENES.isHue(H(), id);
    },
    icon: "palette",
    popup: "hue-scene",
    active: function (id) {
      return HUESCENES.active(H(), id);
    },
    toggle: hueSceneToggle,
    start: hueSceneStart,
    dynamic: function (id) {
      return A(id).is_dynamic !== false;
    },
    palette: hueScenePalette,
  });
  HC.registerSceneImport({
    id: "hue",
    title: "import_a_live_scene_from_hue",
    sub: "copies_its_colours_and_speed",
    unavailable: "importing_a_hue_scene_needs_hue_plus",
    empty: "no_hue_scenes_found",
    failed: "couldn_t_read_that_scene_from_the_hue_bridge",
    available: hueImportable,
    list: function () {
      return hueLiveScenes().map(function (id) {
        return { id: id, name: A(id).name || id, group: A(id).group_name || "" };
      });
    },
    read: function (id) {
      return serviceResponse("hue_plus", "import_hue_scene", { entity_id: id });
    },
  });

  /* The styles of a Hue light made of zones. */
  HC.registerLightStyle({
    applies: hueStyleApplies,
    blends: hueStyleBlends,
    icon: function (id) {
      return lpStyleIcon(A(id).gradient_mode);
    },
    popup: lpStylePopup,
  });

  HC.registerAreaHooks("hue_plus", {
    importRow: hpAreaImport,
    actions: hpAreaActions,
    lights: hpBridgeLights,
    save: hpSaveBridge,
    /* What the area editor shows for each light of an area on the bridge: how bright it is next to the others. */
    lightRows: function () {
      return [
        {
          field: "balance",
          label: "hm_brightness_balance",
          min: 0.2,
          max: 2,
          step: 0.1,
          def: 1,
          round: function (v) {
            return Math.round(v * 10) / 10;
          },
          fmt: function (v) {
            return v.toFixed(1) + "×";
          },
        },
      ];
    },
  });
})();
