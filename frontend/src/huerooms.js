/* Rooms and zones, and the settings of the bridge itself that the Hue app lets you change: a room holds devices (a device is in one room), a zone holds lights (a light can be in several);
 the bridge's name and its Zigbee channel. The pages use the same pieces as the other wizards (huewizard.js). */

/* The devices a room can hold: every device of the bridge except the bridge itself. A zone can hold any light. */
function hrwMembers(type) {
  if (type === "zone")
    return hueplus.lights(H()).map(function (id) {
      return { id: A(id).hue_light_id, name: hpName(id) };
    });
  return hmList("devices")
    .filter(function (d) {
      return (d.services || []).indexOf("bridge") < 0;
    })
    .map(function (d) {
      return { id: d.id, name: d.name };
    });
}

function hrwStart(type, g) {
  var members = {};
  if (g)
    g.children.forEach(function (c) {
      members[c.id] = true;
    });
  hwBegin({ kind: "group", type: type, id: g ? g.id : null, name: g ? g.name : "", members: members, icon: type === "zone" ? "target" : "home" });
  HW.depth = 1;
  showPopup("hue-group", true);
}

function hrwList(b) {
  hmBox(b);
  hmLoad(b, ["rooms", "zones"], function (box, r) {
    var groups = hwGroups(r);
    [["room", "hn_rooms", "home", "hrw_create_a_room"], ["zone", "hn_zones", "target", "hrw_create_a_zone"]].forEach(function (t) {
      var list = groups.filter(function (g) {
        return g.type === t[0];
      });
      box.appendChild(hmLabel(_T(t[1])));
      box.appendChild(
        hmGroup(
          list
            .map(function (g) {
              return hmRow({
                icon: t[2],
                title: g.name,
                sub: cntS(g.lights.length, _T("hm_light"), _T("hm_lights")),
                tap: function () {
                  hrwStart(t[0], g);
                },
              });
            })
            .concat([
              hmRow({
                icon: "plus",
                title: _T(t[3]),
                tap: function () {
                  hrwStart(t[0], null);
                },
              }),
            ])
        )
      );
    });
  });
}

function hrwEditor(b) {
  if (!hwOpen(b) || HW.kind !== "group") return;
  var zone = HW.type === "zone";
  hmLoad(b, ["rooms", "zones", "devices"], function (box) {
    box.appendChild(
      hmTitle(HW.icon, function () {
        return HW.name || _T(zone ? "hrw_new_zone" : "hrw_new_room");
      })
    );
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hw_name"),
          val: function () {
            return HW.name;
          },
          tap: "hue-gname",
        }),
      ])
    );
    box.appendChild(hmLabel(_T(zone ? "hrw_lights" : "hrw_devices")));
    var members = hrwMembers(HW.type);
    if (!members.length) box.appendChild(hmCallout(_T("nothing_found")));
    box.appendChild(
      hmGroup(
        members.map(function (m) {
          return hmRow({
            icon: zone ? "lamp" : "cog",
            title: m.name,
            check: function () {
              return !!HW.members[m.id];
            },
            tap: function () {
              HW.members[m.id] = !HW.members[m.id];
              refresh();
            },
          });
        })
      )
    );
    var actions = [hmButton(_T("hw_save"), "primary", hrwSave)];
    if (HW.id)
      actions.push(
        hmButton(_T("hm_delete"), "danger", function () {
          confirmDlg(_T(zone ? "hrw_delete_this_zone" : "hrw_delete_this_room"), function () {
            var d = HW,
              body = { confirm: true };
            body[d.type] = d.id;
            hpCall("hue_plus", "delete_" + d.type, body).then(
              function () {
                HM_READY = false;
                hwLeave();
                hmEnsure();
              },
              function () {
                toast(_T("hrw_couldn_t_save"));
              }
            );
          });
        })
      );
    box.appendChild(hmActions(actions));
  });
}

function hrwSave() {
  var d = HW,
    chosen = Object.keys(d.members).filter(function (k) {
      return d.members[k];
    });
  if (!d.name.trim()) {
    toast(_T("hw_give_it_a_name"));
    return;
  }
  var body = { name: d.name.trim(), members: chosen };
  if (d.id) body[d.type] = d.id;
  hpCall("hue_plus", (d.id ? "update_" : "create_") + d.type, body).then(
    function () {
      HM_READY = false;
      hwLeave();
      hmEnsure();
    },
    function () {
      toast(_T("hrw_couldn_t_save"));
    }
  );
}

/* A name on its own page: for a room or zone it is kept in the wizard state, for the bridge it is sent when Done is pressed. */
function hrwNamePage(b) {
  if (!hwOpen(b) || HW.kind !== "group") return;
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.value = HW.name;
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    hmActions([
      hmButton(_T("hm_done"), "primary", function () {
        var v = inp.value.trim();
        if (!v) {
          toast(_T("hw_give_it_a_name"));
          return;
        }
        HW.name = v;
        popBack();
      }),
    ])
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* ---- the bridge: its name and Zigbee channel ---- */

function hrwBridgeName(b) {
  hmBox(b);
  var w = mk("div", "sqw pane"),
    inp = mk("input", "sq");
  inp.type = "text";
  inp.maxLength = 32;
  inp.value = (HM.bridge && HM.bridge.name) || "";
  w.appendChild(inp);
  b.appendChild(w);
  b.appendChild(
    hmActions([
      hmButton(_T("hm_done"), "primary", function () {
        var v = inp.value.trim();
        if (!v) {
          toast(_T("hw_give_it_a_name"));
          return;
        }
        hpCall("hue_plus", "configure_bridge", { name: v }).then(
          function () {
            if (HM.bridge) HM.bridge.name = v;
            popBack();
          },
          function () {
            toast(_T("hrw_couldn_t_save"));
          }
        );
      }),
    ])
  );
  setTimeout(function () {
    inp.focus();
  }, 150);
}

/* The channels the bridge accepts; 11, 15, 20 and 25 are the ones that keep clear of Wi-Fi. */
var HRW_CHANNELS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
var HRW_CLEAR = [11, 15, 20, 25];

function hrwZigbeeChannel(b) {
  hmBox(b);
  hmEnsure();
  var E = hpBridgeEnts(),
    cur = function () {
      return E.zigbee_channel ? Number(V_(E.zigbee_channel)) : 0;
    };
  hwHint(b, _T("hrw_zigbee_hint"));
  b.appendChild(
    hmGroup(
      HRW_CHANNELS.map(function (c) {
        return hmRow({
          title: String(c),
          sub: HRW_CLEAR.indexOf(c) >= 0 ? _T("hrw_keeps_clear_of_wifi") : "",
          check: function () {
            return cur() === c;
          },
          tap: function () {
            if (cur() === c) return;
            confirmDlg(_T("hrw_change_the_zigbee_channel"), function () {
              hpCall("hue_plus", "set_zigbee_channel", { channel: c, confirm: true }).then(
                function () {
                  popBack();
                },
                function () {
                  toast(_T("hrw_couldn_t_save"));
                }
              );
            });
          },
        });
      })
    )
  );
}

/* The bridge's home location, from Home Assistant's own, after asking: the bridge needs it for sunrise and sunset and for the automations that depend on where home is. */
function hrwSetHomeLocation() {
  var c = H().config || {};
  if (typeof c.latitude !== "number" || typeof c.longitude !== "number") {
    toast(_T("hrw_no_home_location_in_home_assistant"));
    return;
  }
  confirmDlg(_T("hrw_set_the_home_location"), function () {
    hpCall("hue_plus", "set_home_location", { latitude: c.latitude, longitude: c.longitude }).then(
      function () {
        toast(_T("hrw_home_location_set"));
        hueplus.resources(["home_and_away"]).then(function (r) {
          HM.home_and_away = r.home_and_away;
          refresh();
        });
      },
      function () {
        toast(_T("hrw_couldn_t_save"));
      }
    );
  });
}

HP_PAGES["hue-groups"] = ["hrw_rooms_and_zones", "home", hrwList];
HP_PAGES["hue-group"] = ["hrw_rooms_and_zones", "home", hrwEditor];
HP_PAGES["hue-gname"] = ["hw_name", "edit", hrwNamePage];
HP_PAGES["hue-bname"] = ["hw_name", "edit", hrwBridgeName];
HP_PAGES["hue-zch"] = ["zigbee_channel", "plug", hrwZigbeeChannel];
