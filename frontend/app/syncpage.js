/* The Sync tab: what the Hue app's Sync tab has that Hue Plus can do: the Spotify sync (music), the Hue Play HDMI Sync Box (TV and games), and the bridge's entertainment areas.
 The rows and their pages are the ones the Hue Plus menu already has (huesync.js, huemenu.js). */

function hpSyncEntities(test) {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      var e = h.entities[id];
      return test(h, id) && !(e && e.hidden);
    })
    .sort();
}

function hpSyncTab(box) {
  var sync = hpSyncEntities(function (h, id) {
      return HUESYNC.isSync(h, id);
    }),
    boxes = hpSyncEntities(function (h, id) {
      return HUESYNCBOX.isBox(h, id);
    });
  box.appendChild(hmLabel(_T("app_music")));
  if (sync.length) {
    sync.forEach(function (id) {
      box.appendChild(hsyncRow({ id: id, name: _T("spotify_sync"), icon: "syncring" }));
    });
  } else box.appendChild(hmCallout(_T("app_no_spotify_sync")));
  box.appendChild(hmLabel(_T("app_tv_and_games")));
  if (boxes.length) {
    boxes.forEach(function (id) {
      box.appendChild(hsboxRow({ id: id, name: _T("hue_play_hdmi_sync_box"), icon: "syncring" }));
    });
  } else box.appendChild(hmCallout(_T("app_no_sync_box")));
  box.appendChild(hmLabel(_T("entertainment_areas")));
  hmLoad(box, ["entertainment_areas"], function (inner, r) {
    var list = r.entertainment_areas || [];
    if (!list.length) {
      inner.appendChild(hmCallout(_T("app_no_entertainment_areas")));
      return;
    }
    inner.appendChild(
      hmGroup(
        list.map(function (x) {
          return hmRow({
            icon: "eq",
            title: x.name,
            sub: cntS((x.lights || []).length, _T("hm_light"), _T("hm_lights")),
            tap: "hue-area:" + x.id,
          });
        })
      )
    );
  });
}
