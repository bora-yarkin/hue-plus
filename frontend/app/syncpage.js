/* The Sync tab, as the Hue app draws it: the whole screen takes its colour from the cover of what plays; the Spotify mark at the top, the cover, where it plays, the title and the artist, Style, Intensity, Color
 and Brightness as four round-ended buttons (each opens a card over the screen, Brightness a slider that rises out of its button), and the bar with what is synced (WHAT), the button that starts and stops the
 sync and where it plays (WHERE, the entertainment area). The entities and what they accept are Hue Plus's own (the sync module: huesync.js). Without a Spotify sync the tab lists what there is as rows. */

function hpSyncEntities(test) {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      var e = h.entities[id];
      return test(h, id) && !(e && e.hidden);
    })
    .sort();
}

var HP_SPOTIFY_MARK =
  "<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='12' cy='12' r='11' fill='#fff'/><path d='M5.6 9.3c4.2-1.2 9.2-.8 12.8 1.3M6.4 12.6c3.4-.9 7.1-.6 10 1M7.2 15.6c2.6-.7 5.2-.4 7.6.9' fill='none' stroke='#1b1c20' stroke-width='1.9' stroke-linecap='round'/></svg>";
var HP_AUTO_MARK =
  "<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='12' cy='12' r='9' fill='none' stroke='currentColor' stroke-width='2'/><path d='M8.6 16 12 7.5l3.4 8.5M9.8 13.4h4.4' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>";

var HPSY = { art: "", colors: null };

/* The colours the screen takes from a cover: the cover's own colour, brighter at the top and darker towards the bottom. Read from a small copy of the picture; a cover that cannot be read leaves the screen as it was. */
function hpSyColors(url, apply) {
  var img = new Image();
  img.crossOrigin = "anonymous";
  img.referrerPolicy = "no-referrer";
  img.onload = function () {
    try {
      var c = document.createElement("canvas");
      c.width = c.height = 24;
      var g = c.getContext("2d");
      g.drawImage(img, 0, 0, 24, 24);
      var d = g.getImageData(0, 0, 24, 24).data,
        sum = [0, 0, 0],
        weight = 0;
      for (var i = 0; i < d.length; i += 4) {
        var mx = Math.max(d[i], d[i + 1], d[i + 2]),
          mn = Math.min(d[i], d[i + 1], d[i + 2]),
          w = 0.05 + ((mx - mn) / 255) * (mx / 255);
        sum[0] += d[i] * w;
        sum[1] += d[i + 1] * w;
        sum[2] += d[i + 2] * w;
        weight += w;
      }
      var rgb = sum.map(function (v) {
          return v / weight;
        }),
        top = Math.max.apply(null, rgb) || 1,
        lift = 150 / top;
      apply(
        rgb.map(function (v) {
          return Math.min(255, Math.round(v * lift));
        }),
        rgb.map(function (v) {
          return Math.round(v * lift * 0.42);
        })
      );
    } catch (e) {}
  };
  img.src = url;
}

function hpSyKnown(id) {
  var v = V_(id);
  return v !== "unknown" && v !== "unavailable" && v !== "";
}

/* A card over the Sync screen (Style, Intensity, Color) or the slider of Brightness: the screen is dimmed, a tap outside takes it away, and it comes up from the bottom of the screen. */
function hpSyPop(build, dim) {
  var scrim = mk("div", "sypop");
  scrim.style.background = "rgba(0,0,0," + (dim || 0.55) + ")";
  var card = build(function close() {
    scrim.classList.remove("in");
    setTimeout(function () {
      scrim.remove();
    }, 420);
  });
  scrim.appendChild(card);
  scrim.addEventListener("click", function (e) {
    if (e.target === scrim) scrim.querySelector(".sycard,.sybri").dispatchEvent(new CustomEvent("away"));
  });
  document.body.appendChild(scrim);
  requestAnimationFrame(function () {
    scrim.classList.add("in");
  });
  return scrim;
}

function hpSyCard(title, body, close) {
  var card = mk("div", "sycard");
  card.appendChild(mk("div", "syt")).textContent = title;
  card.appendChild(body);
  card.addEventListener("away", close);
  return card;
}

function hpSyChoice(icon, label, picked, fn) {
  var b = mk("button", "sychoice" + (picked ? " on" : ""), icon + "<span></span>");
  b.type = "button";
  b.querySelector("span").textContent = label;
  b.addEventListener("click", fn);
  return b;
}

function hpSyWaveIcon(name, options) {
  var i = options.indexOf(name);
  return name === "auto" ? HP_AUTO_MARK : svg("wave" + Math.max(1, Math.min(4, i)));
}

function hpSyStyleCard(E) {
  hpSyPop(function (close) {
    var row = mk("div", "syrow");
    (A(E.style).options || []).forEach(function (name) {
      row.appendChild(
        hpSyChoice(svg(HS_STYLE_ICON[name] || "eq"), name, V_(E.style) === name, function () {
          call("select", "select_option", { entity_id: E.style, option: name });
          close();
          refresh();
        })
      );
    });
    return hpSyCard(_T("style"), row, close);
  });
}

function hpSyIntensityCard(E) {
  hpSyPop(function (close) {
    var box = mk("div"),
      options = A(E.intensity).options || [],
      pick = function (name) {
        return function () {
          call("select", "select_option", { entity_id: E.intensity, option: name });
          close();
          refresh();
        };
      };
    if (options.indexOf("auto") >= 0) {
      var auto = hpSyChoice(HP_AUTO_MARK, _T("app_automatic"), V_(E.intensity) === "auto", pick("auto"));
      auto.classList.add("wide");
      box.appendChild(auto);
    }
    var row = mk("div", "syrow");
    options
      .filter(function (n) {
        return n !== "auto";
      })
      .forEach(function (name) {
        var b = hpSyChoice(hpSyWaveIcon(name, options), "", V_(E.intensity) === name, pick(name));
        b.setAttribute("aria-label", cap(name));
        row.appendChild(b);
      });
    box.appendChild(row);
    return hpSyCard(_T("intensity"), box, close);
  });
}

function hpSyColorCard(E) {
  hpSyPop(function (close) {
    var grid = mk("div", "sygrid");
    (A(E.palette).options || []).forEach(function (name) {
      var grad = hsGradient((A(E.palette).colors || {})[name] || []),
        t = mk("div", "sytile" + (V_(E.palette) === name ? " on" : ""), "<span class='dc'></span><b></b>"),
        dc = t.querySelector(".dc");
      t.querySelector("b").textContent = name === "auto" ? _T("app_automatic") : cap(name);
      if (name === "auto") dc.innerHTML = HP_AUTO_MARK;
      else dc.style.background = grad || "#555";
      if (V_(E.palette) === name) t.style.background = name === "auto" ? "linear-gradient(160deg,#9ee8c8,#a58cf0 55%,#b0366f)" : grad ? grad.replace("90deg", "160deg") : "";
      hpActive(t, function () {
        call("select", "select_option", { entity_id: E.palette, option: name });
        close();
        refresh();
      });
      grid.appendChild(t);
    });
    return hpSyCard(_T("app_color"), grid, close);
  });
}

/* The brightness slider rises out of its button: the same width, the button at its foot, the percentage above it. */
function hpSyBrightness(E, button) {
  /* The slider is placed inside the phone (the page's body), which on a wide screen is not the window. */
  var r = button.getBoundingClientRect(),
    phone = document.body.getBoundingClientRect(),
    z = hpZoom(),
    tall = Math.min((phone.height / z) * 0.45, 210 * hpFrameScale());
  hpSyPop(function (close) {
    var bar = mk("div", "sybri", "<span class='pc'></span><div class='fillb'></div><span class='ic'></span>"),
      fill = bar.querySelector(".fillb"),
      pc = bar.querySelector(".pc"),
      value = hsNumber(E.brightness) || 0;
    bar.querySelector(".ic").innerHTML = svg("bright");
    bar.style.left = (r.left - phone.left) / z + "px";
    bar.style.width = r.width / z + "px";
    bar.style.bottom = (phone.bottom - r.bottom) / z + "px";
    bar.style.height = tall + "px";
    function paint(v) {
      value = v;
      fill.style.height = Math.max(r.height / z, (v / 100) * tall) + "px";
      pc.textContent = Math.round(v) + "%";
    }
    paint(value);
    function at(e) {
      var box = bar.getBoundingClientRect();
      return Math.max(1, Math.min(100, Math.round(((box.bottom - e.clientY) / box.height) * 100)));
    }
    bar.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      bar.setPointerCapture(e.pointerId);
      paint(at(e));
      callLive("hs-bri", "number", "set_value", { entity_id: E.brightness, value: value });
      var move = function (ev) {
        paint(at(ev));
        callLive("hs-bri", "number", "set_value", { entity_id: E.brightness, value: value });
      };
      var up = function () {
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
        bar.removeEventListener("pointercancel", up);
        call("number", "set_value", { entity_id: E.brightness, value: Math.max(1, value) });
      };
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
      bar.addEventListener("pointercancel", up);
    });
    bar.addEventListener("away", close);
    return bar;
  }, 0.78);
}

/* One of the four buttons, with its caption above. */
function hpSyTile(caption, paint, open) {
  var col = mk("div", "sycol"),
    b = mk("button", "sytilebtn");
  b.type = "button";
  col.appendChild(mk("div", "sycap")).textContent = caption;
  b.addEventListener("click", function () {
    open(b);
  });
  col.appendChild(b);
  reg(function () {
    b.setAttribute("aria-label", caption + ": " + paint(b));
  });
  return col;
}

function hpSpotifyScreen(outer, id, E) {
  var root = mk("div", "spp"),
    top = mk("div", "sytop", "<span class='mark'>" + HP_SPOTIFY_MARK + "</span><b>Spotify</b>"),
    art = mk("div", "syart", svg("note")),
    where = mk("div", "syplay"),
    title = mk("div", "sytitle"),
    sub = mk("div", "sysub"),
    set = mk("div", "syset");
  [top, art, where, title, sub, set].forEach(function (el) {
    root.appendChild(el);
  });
  set.appendChild(
    hpSyTile(
      _T("style"),
      function (b) {
        var s = V_(E.style);
        b.innerHTML = svg(HS_STYLE_ICON[s] || "eq");
        return hpSyKnown(E.style) ? s : "–";
      },
      function () {
        hpSyStyleCard(E);
      }
    )
  );
  set.appendChild(
    hpSyTile(
      _T("intensity"),
      function (b) {
        var s = V_(E.intensity);
        b.innerHTML = hpSyWaveIcon(s, A(E.intensity).options || []);
        return hpSyKnown(E.intensity) ? cap(s) : "–";
      },
      function () {
        hpSyIntensityCard(E);
      }
    )
  );
  set.appendChild(
    hpSyTile(
      _T("app_color"),
      function (b) {
        var s = V_(E.palette),
          grad = hsGradient((A(E.palette).colors || {})[s] || []);
        b.style.background = grad || "";
        b.classList.toggle("grad", !!grad);
        b.innerHTML = s === "auto" || !grad ? HP_AUTO_MARK : "";
        if (s === "auto") b.style.background = "linear-gradient(90deg,#8de8c0,#a58cf0 55%,#f0457f)";
        return hpSyKnown(E.palette) ? cap(s) : "–";
      },
      function () {
        hpSyColorCard(E);
      }
    )
  );
  set.appendChild(
    hpSyTile(
      _T("brightness"),
      function (b) {
        b.innerHTML = svg("bright");
        return (hsNumber(E.brightness) || 0) + "%";
      },
      function (b) {
        hpSyBrightness(E, b);
      }
    )
  );
  var bar = mk("div", "sybar"),
    what = mk("div", "sywhat", "<span class='sc'>" + HP_SPOTIFY_MARK + "</span><i></i><b></b>"),
    go = mk("button", "sygo", svg("syncring")),
    wh = mk("button", "sywhere", "<span class='sc'>" + svg("lights") + "</span><i></i><b></b>");
  what.querySelector("i").textContent = _T("app_what");
  what.querySelector("b").textContent = "Spotify";
  wh.querySelector("i").textContent = _T("app_where");
  go.type = "button";
  go.setAttribute("role", "switch");
  go.setAttribute("aria-label", _T("spotify_sync"));
  wh.type = "button";
  go.addEventListener("click", function () {
    call("switch", isOn(E.sync) ? "turn_off" : "turn_on", { entity_id: E.sync });
  });
  wh.addEventListener("click", function () {
    showPopup("app-syncarea:" + id, true);
  });
  bar.appendChild(what);
  bar.appendChild(go);
  bar.appendChild(wh);
  root.appendChild(bar);
  outer.appendChild(root);
  var hp = HPAPP.el.querySelector("#hp");
  reg(function () {
    var a = A(E.now_playing),
      has = hpSyKnown(E.now_playing),
      on = isOn(E.sync);
    go.classList.toggle("on", on);
    go.setAttribute("aria-checked", on ? "true" : "false");
    where.textContent = has && a.playback_device ? _T("playing_on") + " " + a.playback_device : "";
    title.textContent = has ? V_(E.now_playing) : _T("nothing_playing");
    sub.textContent = has ? [(a.artists || []).join(", "), a.album].filter(Boolean).join(" • ") : "";
    wh.querySelector("b").textContent = hpSyKnown(E.area) ? V_(E.area) : "–";
    hsArt(art, has ? a.album_art_url : "");
    var url = art.dataset.art || "";
    if (url !== HPSY.art) {
      HPSY.art = url;
      if (!url) {
        HPSY.colors = null;
        hp.style.removeProperty("--sy1");
        hp.style.removeProperty("--sy2");
      } else
        hpSyColors(url, function (c1, c2) {
          if (HPSY.art !== url) return;
          HPSY.colors = [c1, c2];
          hp.style.setProperty("--sy1", "rgb(" + c1.join(",") + ")");
          hp.style.setProperty("--sy2", "rgb(" + c2.join(",") + ")");
        });
    }
  });
  if (HPSY.colors) {
    hp.style.setProperty("--sy1", "rgb(" + HPSY.colors[0].join(",") + ")");
    hp.style.setProperty("--sy2", "rgb(" + HPSY.colors[1].join(",") + ")");
  }
}

/* WHERE: which entertainment area the sync plays on, one to choose, and a blue plus for a new one. */
function hpSyncAreaPage(b, id) {
  hmBox(b);
  var E = HUESYNC.entities(H(), id);
  hpBarPlus(b, _T("app_new_area"), function () {
    showPopup("app-newarea", true);
  });
  if (!E || !E.area) {
    b.appendChild(hmCallout(_T("nothing_found")));
    return;
  }
  b.appendChild(mk("div", "pintro")).textContent = _T("app_which_area");
  b.appendChild(
    hmGroup(
      (A(E.area).options || []).map(function (name) {
        return hmRow({
          title: name,
          check: function () {
            return V_(E.area) === name;
          },
          tap: function () {
            call("select", "select_option", { entity_id: E.area, option: name });
            popBack();
          },
        });
      })
    )
  );
}

function hpSyncTab(outer) {
  var sync = hpSyncEntities(function (h, id) {
      return HUESYNC.isSync(h, id);
    }),
    E = sync.length ? HUESYNC.entities(H(), sync[0]) : null;
  if (E) {
    hpSpotifyScreen(outer, sync[0], E);
    return;
  }
  var head = mk("div", "hd", "<h1></h1>");
  head.querySelector("h1").textContent = _T("app_sync");
  outer.appendChild(head);
  var box = mk("div");
  outer.appendChild(box);
  hmBox(box);
  var boxes = hpSyncEntities(function (h, id) {
    return HUESYNCBOX.isBox(h, id);
  });
  box.appendChild(hmLabel(_T("app_music")));
  box.appendChild(hmCallout(_T("app_no_spotify_sync")));
  box.appendChild(hmLabel(_T("app_tv_and_games")));
  if (boxes.length) {
    boxes.forEach(function (id) {
      box.appendChild(hsboxRow({ id: id, name: _T("hue_play_hdmi_sync_box"), icon: "syncring" }));
    });
  } else box.appendChild(hmCallout(_T("app_no_sync_box")));
}

HP_PAGES["app-syncarea"] = ["app_entertainment_area", "target", hpSyncAreaPage];
