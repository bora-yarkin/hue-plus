
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
