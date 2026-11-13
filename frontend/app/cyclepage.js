/* A scene cycle, as the app lays it out: the kind of press on top, then BEHAVIOR with the presses in order (each with the picture of its scene, and a blue plus that adds one), a line saying the rows
 can be dragged, and ADVANCED. DONE keeps the cycle (it is staged and written when the switch is saved). The draft is the menu's (HM_CYCLE); only the page is the app's. */

function hpCyclePage(b, id) {
  hmBox(b);
  hmGuard(hmdKey("acc", hmBtnKey(id).acc), true);
  hmLoad(b, ["accessories", "scenes", "rooms", "zones"], function (box, r) {
    var k = hmBtnKey(id),
      f = hmBtnFind(r, k);
    if (!f.acc || !f.btn) {
      box.appendChild(hmCallout(_T("nothing_found")));
      return;
    }
    var scenes = hmBtnScenes(r, hmBtnTargets(r, f.acc, f.btn));
    if (!HM_CYCLE || HM_CYCLE.id !== id) {
      var cfg = (f.spec && f.spec.scene_cycle_extended) || {};
      HM_CYCLE = {
        id: id,
        scenes: hmPressScenes(f.spec).slice(),
        with_off: hmPressWithOff(f.spec),
        timeout: (cfg.repeat_timeout && cfg.repeat_timeout.seconds) || 3,
        names: r,
        pool: scenes,
      };
    }
    HM_CYCLE.names = r;
    HM_CYCLE.pool = scenes;
    var d = HM_CYCLE,
      ords = ["hm_first", "hm_second", "hm_third", "hm_fourth", "hm_fifth", "hm_sixth", "hm_seventh", "hm_eighth", "hm_ninth", "hm_tenth"];
    HC.onDone = function () {
      if (d.scenes.length < 2) {
        toast(_T("hm_a_cycle_needs_two_scenes"));
        return;
      }
      hmStagePress(k, f, { action: "scene_cycle", scenes: d.scenes.slice(), with_off: d.with_off, repeat_timeout: d.timeout });
      HM_CYCLE = null;
      popBack();
      popBack();
    };
    box.appendChild(
      hmGroup([
        hpDiscRow({
          title: _T(HM_PRESSES.filter(function (p) { return p[0] === k.press; })[0][1]),
          val: _T("hm_scene_cycle"),
          icon: "swap",
          tap: "hue-press:" + id,
        }),
      ])
    );
    var label = mk("div", "lbrow"),
      text = hmLabel(_T("hm_behavior"));
    label.appendChild(text);
    if (d.scenes.length < 10) {
      var plus = hpRound("plus", _T("hm_add_a_scene"), function () {
        showPopup("hue-cslot:" + id + "|" + d.scenes.length, true);
      });
      plus.classList.add("blue");
      label.appendChild(plus);
    }
    box.appendChild(label);
    var list = mk("div", "hm-group cyc");
    d.scenes.forEach(function (sid, i) {
      var scene = (r.scenes || []).filter(function (s) {
        return s.id === sid;
      })[0];
      var row = hpDiscRow({
        title: _T(ords[i]) + " " + _T("hm_press_word"),
        val: scene ? scene.name : _T("hm_unknown_scene"),
        disc: hpDiscOf(scene && scene.colours),
        tap: "hue-cslot:" + id + "|" + i,
      });
      row.dataset.sid = sid;
      row.dataset.slot = String(i);
      list.appendChild(row);
    });
    box.appendChild(list);
    /* Hold a press and drag it to another place: the order of the presses is the order of the scenes. */
    hpSortable(
      list,
      ".hm-row",
      function (el) {
        return el.dataset.sid + "|" + el.dataset.slot;
      },
      function (ids) {
        d.scenes = ids.map(function (x) {
          return x.split("|")[0];
        });
        showPopup("hue-cycle:" + id, false);
      }
    );
    var hint = mk("div", "pintro small");
    hint.textContent = _T("app_drag_to_order");
    box.appendChild(hint);
    box.appendChild(hmLabel(_T("hm_advanced")));
    box.appendChild(
      hmGroup([
        hmRow({
          title: _T("hm_smart_on_off"),
          toggle: {
            get: function () {
              return d.with_off;
            },
            set: function () {
              d.with_off = !d.with_off;
              refresh();
            },
          },
        }),
      ])
    );
  });
}

HP_PAGES["hue-cycle"] = ["hm_scene_cycle", "swap", hpCyclePage];
