/* The styles of a Hue light made of zones (a gradient tube or strip), as in the Hue app: pins with a smooth blend (Linear, Mirrored) or colours of their own
 (Scattered, Segmented). The dashboard shows a Style button on a light panel when a registered light style applies to the light (see epilogue.js). */

/* Whether the light has styles to choose: Hue Plus lists them in the light's gradient_modes. */
function hueStyleApplies(id) {
  return !!A(id).gradient_modes;
}

/* Whether the zones are blended into a line (the Linear and Mirrored styles); in Scattered and Segmented every zone is a colour of its own. */
function hueStyleBlends(id) {
  var m = A(id).gradient_mode;
  return !m || m === "interpolated_palette" || m === "interpolated_palette_mirrored";
}

/* The styles of a light made of zones, as in the Hue app: pins with a smooth blend (Linear, Mirrored) or colours of their own (Scattered, Segmented). */
var LP_STYLES = [
  ["interpolated_palette", "linear", "<circle cx='5' cy='8' r='2.4'/><circle cx='12' cy='8' r='2.4'/><circle cx='19' cy='8' r='2.4'/><path d='M3 16h18'/>"],
  ["interpolated_palette_mirrored", "mirrored", "<circle cx='6' cy='8' r='2.4'/><circle cx='18' cy='8' r='2.4'/><path d='M12 3v16M3 16h18'/>"],
  ["random_pixelated", "scattered", "<circle cx='5' cy='11' r='2.4'/><circle cx='12' cy='6' r='2.4'/><circle cx='19' cy='12' r='2.4'/>"],
  ["segmented_palette", "segmented", "<circle cx='5' cy='8' r='2.4'/><circle cx='12' cy='8' r='2.4'/><circle cx='19' cy='8' r='2.4'/><path d='M3 16h4M10 16h4M17 16h4'/>"],
];

function lpStyleIcon(mode) {
  var s = LP_STYLES.filter(function (x) {
    return x[0] === mode;
  })[0];
  return "<svg viewBox='0 0 24 24'>" + (s ? s[2] : LP_STYLES[0][2]) + "</svg>";
}

/* The popup of the style button. Tapping a style changes the light at once; the orientation turns the zones around (Linear and Mirrored). */
function lpStylePopup(b, id) {
  var box = mk("div"),
    tiles = {};
  b.appendChild(sep(_T("mode"), "palette"));
  var g = mk("div", "gridl g2 lp-modes");
  LP_STYLES.forEach(function (s) {
    var el = mk("div", "lp-mode", "<svg viewBox='0 0 24 24'>" + s[2] + "</svg>");
    el.appendChild(mk("div", "lp-mode-n")).textContent = _T(s[1]);
    el.setAttribute("role", "button");
    el.addEventListener("click", function () {
      call("hue_plus", "set_style", { light: A(id).hue_light_id, style: s[1] });
    });
    tiles[s[0]] = el;
    g.appendChild(el);
  });
  b.appendChild(g);
  b.appendChild(box);
  function paint() {
    var mode = A(id).gradient_mode,
      offered = A(id).gradient_modes || [];
    Object.keys(tiles).forEach(function (k) {
      tiles[k].classList.toggle("picked", k === mode);
      tiles[k].style.display = offered.indexOf(k) < 0 ? "none" : "";
    });
    box.innerHTML = "";
    if (mode === "interpolated_palette" || mode === "interpolated_palette_mirrored") {
      box.appendChild(sep(_T("orientation"), "swap"));
      box.appendChild(
        pill("swap", _T("turn_the_colours_around"), {
          tap: function () {
            call("hue_plus", "set_style", { light: A(id).hue_light_id, flip: true });
          },
        })
      );
    }
  }
  paint();
  reg(function () {
    if (b.isConnected) paint();
  });
}
