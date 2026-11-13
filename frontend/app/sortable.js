/* Hold, then drag, to put things in another order, as the Hue app does for the scenes of a folder, the folders of a room and the presses of a cycle. The app keeps this order in the app, not on the bridge
 (the bridge has no place for it), so here it is kept on this device only, like the other choices the dashboard keeps for a device. */

/* The order kept for a list: ids in order. Anything the list has that is not in it goes last, in the order it came. */
function hpOrderGet(key) {
  var v = deviceGet("db_order_" + key, []);
  return Array.isArray(v) ? v : [];
}

function hpOrderSet(key, ids) {
  deviceSet("db_order_" + key, ids.slice(0, 200));
}

function hpOrdered(list, key, idOf) {
  var order = hpOrderGet(key);
  return list.slice().sort(function (a, b) {
    var x = order.indexOf(idOf(a)),
      y = order.indexOf(idOf(b));
    return (x < 0 ? 1e6 : x) - (y < 0 ? 1e6 : y);
  });
}

/* Makes the children of `box` that match `selector` movable: press and hold one for a moment, and it lifts; drag it over the others and they make room; let go and done(ids) is called with the new order
 (ids come from idOf(element)). A press that moves before the hold is a scroll or a tap, and is left alone. */
function hpSortable(box, selector, idOf, done, opts) {
  opts = opts || {};
  var HOLD = 380;
  box.addEventListener("pointerdown", function (e) {
    var el = e.target.closest(selector);
    if (!el || !box.contains(el) || e.button > 0) return;
    var timer = null,
      lifted = false,
      target = null,
      sx = e.clientX,
      sy = e.clientY,
      grab = null,
      endX = 0,
      endY = 0;
    function inside(node, x, y) {
      var r = node.getBoundingClientRect();
      return x > r.left && x < r.right && y > r.top && y < r.bottom;
    }
    function items() {
      return [].filter.call(box.children, function (c) {
        return c.matches(selector);
      });
    }
    function place(ev) {
      el.style.transform = "none";
      var base = el.getBoundingClientRect();
      el.style.transform = "translate(" + (ev.clientX - grab.x - base.left) + "px," + (ev.clientY - grab.y - base.top) + "px) scale(1.03)";
    }
    function lift() {
      lifted = true;
      var r = el.getBoundingClientRect();
      grab = { x: sx - r.left, y: sy - r.top };
      el.classList.add("lifting");
      /* The tile is carried over the whole page, not only over its own row. */
      box.style.overflow = "visible";
      try {
        el.setPointerCapture(e.pointerId);
      } catch (x) {}
      if (navigator.vibrate) navigator.vibrate(12);
    }
    function move(ev) {
      if (!lifted) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 9) stop(false);
        return;
      }
      ev.preventDefault();
      target = null;
      items().forEach(function (other) {
        other.classList.remove("mergeable");
        if (other === el) return;
        var r = other.getBoundingClientRect(),
          inside = ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom,
          middle =
            ev.clientX > r.left + r.width * 0.3 && ev.clientX < r.right - r.width * 0.3 && ev.clientY > r.top + r.height * 0.3 && ev.clientY < r.bottom - r.height * 0.3;
        /* The middle of another item is a drop onto it; its edges make room, as before. */
        if (opts.merge && middle) {
          target = other;
          other.classList.add("mergeable");
        } else if (inside && !(opts.merge && middle) && opts.live !== false) {
          var all = items();
          box.insertBefore(el, all.indexOf(other) > all.indexOf(el) ? other.nextSibling : other);
        }
      });
      place(ev);
    }
    /* The tile was carried over the others without them moving; where it is let go is its new place, and the tiles in between slide to theirs. */
    function dropAt(x, y) {
      var others = items().filter(function (o) {
          return o !== el;
        }),
        before = others.map(function (o) {
          return o.getBoundingClientRect();
        }),
        best = null,
        bestD = Infinity;
      others.forEach(function (o, i) {
        var r = before[i],
          d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (d < bestD) {
          bestD = d;
          best = { o: o, r: r };
        }
      });
      if (!best) return;
      var after = x > best.r.left + best.r.width / 2 && y > best.r.top - 1 ? best.o.nextSibling : best.o;
      if (y > best.r.bottom) after = best.o.nextSibling;
      box.insertBefore(el, after);
      others.forEach(function (o, i) {
        var r = o.getBoundingClientRect(),
          dx = before[i].left - r.left,
          dy = before[i].top - r.top;
        if ((dx || dy) && o.animate) o.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    }
    function stop(commit) {
      clearTimeout(timer);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", cancel, true);
      if (lifted) {
        box.style.overflow = "";
        el.classList.remove("lifting");
        el.style.transform = "";
        /* The click that ends a drag is not a tap. */
        var eat = function (c) {
          c.stopPropagation();
          c.preventDefault();
        };
        box.addEventListener("click", eat, { capture: true, once: true });
        setTimeout(function () {
          box.removeEventListener("click", eat, true);
        }, 60);
        items().forEach(function (other) {
          other.classList.remove("mergeable");
        });
        if (commit && target && opts.merge) opts.merge(idOf(el), idOf(target));
        else if (commit && opts.outside && !inside(opts.bounds ? opts.bounds() : box, endX, endY)) opts.outside(idOf(el));
        else if (commit) {
          if (opts.live === false) dropAt(endX, endY);
          done(items().map(idOf));
        }
      }
    }
    function up(ev) {
      endX = ev.clientX;
      endY = ev.clientY;
      stop(true);
    }
    function cancel() {
      stop(false);
    }
    document.addEventListener("pointermove", move, { capture: true, passive: false });
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", cancel, true);
    timer = setTimeout(lift, HOLD);
  });
  box.addEventListener("contextmenu", function (e) {
    if (e.target.closest(selector)) e.preventDefault();
  });
}
