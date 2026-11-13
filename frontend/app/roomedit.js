/* The edit mode of a room, as the Hue app has it (Hue-Screenshots/IMG_0576, 0577): the header is the room's icon and name with a pencil and DONE; every section has SELECT ALL; a tile that is tapped is
 chosen (a blue line around it); the tab bar gives way to what can be done: REARRANGE while nothing is chosen (the tiles are then held and dragged), MOVE TO, EDIT and DELETE for what is chosen. */

function hpRoomEditPage(body, id) {
  var root = body.parentNode,
    name = A(id).friendly_name,
    zone = A(id).hue_type === "zone",
    head = mk("div", "rhead edit", "<div class='rr'><span class='ic'></span><span class='nm'></span></div><div class='sl off'></div>"),
    row = head.querySelector(".rr");
  head.querySelector(".ic").innerHTML = svg(hpGroupIcon(id));
  head.querySelector(".nm").textContent = name;
  row.appendChild(
    hpRound("edit", _T(zone ? "app_edit_zone" : "app_edit_room"), function () {
      hpEditGroup(id);
    })
  );
  var done = mk("button", "act", "");
  done.type = "button";
  done.textContent = _T("done");
  done.addEventListener("click", function () {
    HPAPP.editRoom = null;
    showPopup("app-room:" + id, false);
  });
  row.appendChild(done);
  body.appendChild(head);

  var page = mk("div", "rbody editing");
  body.appendChild(page);
  page.appendChild(mk("div", "lb")).textContent = _T("app_my_scenes");
  hpFolderRows(page, id);
  hpRoomSections(page, id);

  var bar = mk("div", "editbar");
  root.appendChild(bar);

  function chosen() {
    return Array.prototype.slice.call(page.querySelectorAll(".sel"));
  }
  function tilesOf(label) {
    var box = label.nextElementSibling;
    return box ? Array.prototype.slice.call(box.querySelectorAll(".ftile,.ltile,.ctile")) : [];
  }
  function action(icon, text, fn) {
    var b = mk("button", "", svg(icon) + "<span></span>");
    b.type = "button";
    b.querySelector("span").textContent = text;
    b.addEventListener("click", fn);
    bar.appendChild(b);
  }
  function redraw() {
    showPopup("app-room:" + id, false);
  }
  function paint() {
    var sel = chosen();
    Array.prototype.forEach.call(page.querySelectorAll(".lb"), function (label) {
      var all = tilesOf(label),
        b = label.querySelector(".selall");
      if (!b) return;
      b.textContent = _T(
        all.length &&
          all.every(function (t) {
            return t.classList.contains("sel");
          })
          ? "app_deselect"
          : "app_select_all"
      );
    });
    bar.innerHTML = "";
    if (!sel.length) {
      action("swap", _T("app_rearrange"), function () {
        toast(_T("app_hold_and_drag"));
      });
      return;
    }
    action("leave", _T("app_move_to"), function () {
      hpEditMove(id, sel);
    });
    action("edit", _T("app_edit"), function () {
      hpEditOne(id, sel);
    });
    action("trash", _T("hm_delete"), function () {
      hpEditDelete(id, sel, redraw);
    });
  }

  /* The labels get SELECT ALL; the lights' label also the button that puts them back in the order of their names. */
  function dress() {
    Array.prototype.forEach.call(page.querySelectorAll(".lb"), function (label) {
      if (label.querySelector(".selall")) return;
      label.classList.add("lbrow");
      var text = mk("span", "");
      text.textContent = label.textContent;
      label.textContent = "";
      label.appendChild(text);
      var box = label.nextElementSibling;
      if (box && box.classList.contains("ltiles")) {
        var sort = hpRound("swap", _T("app_sort_by_name"), function () {
          hpOrderSet("lights:" + id, []);
          redraw();
        });
        sort.classList.add("sortb");
        label.appendChild(sort);
        hpSortable(
          box,
          ".ltile",
          function (el) {
            return el.dataset.lid;
          },
          function (ids) {
            hpOrderSet("lights:" + id, ids);
          },
          { live: false }
        );
      }
      var all = mk("button", "act selall", "");
      all.type = "button";
      all.addEventListener("click", function () {
        var tiles = tilesOf(label),
          every =
            tiles.length &&
            tiles.every(function (t) {
              return t.classList.contains("sel");
            });
        tiles.forEach(function (t) {
          t.classList.toggle("sel", !every);
        });
        paint();
      });
      label.appendChild(all);
    });
    paint();
  }
  /* A tap on a tile chooses it; nothing a tile does outside the edit mode (opening, switching a light) happens here. */
  page.addEventListener(
    "click",
    function (e) {
      var t = e.target.closest ? e.target.closest(".ftile,.ltile,.ctile") : null;
      if (!t || !page.contains(t)) return;
      e.stopPropagation();
      e.preventDefault();
      t.classList.toggle("sel");
      paint();
    },
    true
  );
  dress();
  /* The controls are drawn when the bridge has been read, which may be after this. */
  hmReady().then(dress, function () {});
}

/* What a chosen tile is: a light (its entity), a switch (its id and name on the bridge), a folder or a scene outside the folders. */
function hpEditKind(t) {
  if (t.dataset.lid) return { kind: "light", id: t.dataset.lid, name: A(t.dataset.lid).friendly_name || t.dataset.lid };
  if (t.dataset.acc) return { kind: "switch", id: t.dataset.acc, name: t.dataset.name };
  var key = String(t.dataset.key || "");
  if (key.indexOf("s:") === 0) return { kind: "scene", id: key.slice(2), name: A(key.slice(2)).name || key.slice(2) };
  return { kind: "folder", id: key, name: t.textContent };
}

/* EDIT: the settings of the one thing that is chosen. */
function hpEditOne(room, sel) {
  if (sel.length !== 1) {
    toast(_T("app_choose_one"));
    return;
  }
  var x = hpEditKind(sel[0]);
  if (x.kind === "light") showPopup("hue-light:" + x.id, true);
  else if (x.kind === "switch") showPopup("hue-switch:" + x.id, true);
  else if (x.kind === "scene") showPopup("app-scene:" + x.id + "~" + room, true);
  else if (x.id.indexOf("u:") === 0)
    hpPrompt(_T("app_group_name"), x.name, function (name) {
      hpSaveUserFolders(
        room,
        hpUserFolders(room).map(function (f) {
          return { id: f.id, name: "u:" + f.id === x.id ? name : f.name, scenes: f.scenes };
        })
      );
      showPopup("app-room:" + room, false);
    });
  else toast(_T("app_not_for_this"));
}

/* DELETE: a light or a switch leaves the bridge, a scene is deleted, a folder of the person's is undone (its scenes stay). Asked first, once. */
function hpEditDelete(room, sel, after) {
  var items = sel.map(hpEditKind).filter(function (x) {
    return x.kind !== "folder" || x.id.indexOf("u:") === 0;
  });
  if (!items.length) {
    toast(_T("app_not_for_this"));
    return;
  }
  confirmDlg(
    _T("hm_delete") +
      ": " +
      items
        .map(function (x) {
          return x.name;
        })
        .join(", ") +
      "?",
    function () {
      var job = Promise.resolve();
      items.forEach(function (x) {
        job = job.then(function () {
          if (x.kind === "light" || x.kind === "switch") return hpCall("hue_plus", "remove_device", { device: x.name, confirm: true });
          if (x.kind === "scene") return hpCall("hue_plus", "delete_scene", { scene: hueSceneUid(x.id), confirm: true });
          hpSaveUserFolders(
            room,
            hpUserFolders(room).filter(function (f) {
              return "u:" + f.id !== x.id;
            })
          );
        });
      });
      job.then(
        function () {
          HM_READY = false;
          hmReady().then(after, after);
        },
        function () {
          toast(_T("hm_the_bridge_did_not_accept_this"));
        }
      );
    }
  );
}

/* MOVE TO: the chosen lights and switches go to another room (a device is in one room: the bridge takes it out of the one it was in). */
function hpEditMove(room, sel) {
  var devices = sel.map(hpEditKind).filter(function (x) {
    return x.kind === "light" || x.kind === "switch";
  });
  if (!devices.length) {
    toast(_T("app_not_for_this"));
    return;
  }
  hmReady().then(function () {
    var here = A(room).friendly_name,
      rooms = (HM.rooms || []).filter(function (g) {
        return g.name !== here;
      });
    if (!rooms.length) {
      toast(_T("nothing_found"));
      return;
    }
    hpActions(
      rooms.map(function (g) {
        return {
          label: g.name,
          fn: function () {
            var members = (g.children || [])
              .map(function (c) {
                return c.id;
              })
              .concat(
                devices.map(function (x) {
                  return x.name;
                })
              );
            hpCall("hue_plus", "update_room", { room: g.id, members: members }).then(
              function () {
                HM_READY = false;
                HPAPP.editRoom = null;
                hmReady().then(function () {
                  showPopup("app-room:" + room, false);
                });
              },
              function () {
                toast(_T("hm_the_bridge_did_not_accept_this"));
              }
            );
          },
        };
      })
    );
  }, function () {});
}
