# SPDX-License-Identifier: GPL-3.0-or-later
"""White temperature and xy colours.

The bridge stores gradient points as xy colours. The zone lights also accept a
white temperature (Kelvin): it is turned into the xy colour of that white, and a
zone (or the whole tube) whose colour is that of a white is reported with its
Kelvin again, so white-temperature presets and scenes can recognise it, also
when the white was set from the Hue app.

The xy colour of a white is a point on the colour of a glowing black body
(Kim et al., a standard cubic approximation). It agrees with the whites Hue
lights use, for example 2403 K is (0.485, 0.415).
"""

from __future__ import annotations

import itertools

MIN_KELVIN = 2000
MAX_KELVIN = 6535
_STEP = 10
# How close (in xy) a colour must be to a white to count as that white.
_TOLERANCE = 0.006

XY = tuple[float, float]


def kelvin_to_xy(kelvin: float) -> XY:
    """The xy colour of a white temperature."""
    t = max(MIN_KELVIN, min(MAX_KELVIN, float(kelvin)))
    if t <= 4000:
        x = -0.2661239e9 / t**3 - 0.2343589e6 / t**2 + 0.8776956e3 / t + 0.179910
    else:
        x = -3.0258469e9 / t**3 + 2.1070379e6 / t**2 + 0.2226347e3 / t + 0.240390
    if t <= 2222:
        y = -1.1063814 * x**3 - 1.34811020 * x**2 + 2.18555832 * x - 0.20219683
    elif t <= 4000:
        y = -0.9549476 * x**3 - 1.37418593 * x**2 + 2.09137015 * x - 0.16748867
    else:
        y = 3.0817580 * x**3 - 5.87338670 * x**2 + 3.75112997 * x - 0.37001483
    return (round(x, 4), round(y, 4))


_TABLE: list[tuple[int, XY]] = [(k, kelvin_to_xy(k)) for k in range(MIN_KELVIN, MAX_KELVIN + 1, _STEP)]


def xy_to_kelvin(xy: XY) -> int | None:
    """The white temperature of an xy colour, or None when it is not a white."""
    kelvin, best = min(_TABLE, key=lambda item: (item[1][0] - xy[0]) ** 2 + (item[1][1] - xy[1]) ** 2)
    distance = ((best[0] - xy[0]) ** 2 + (best[1] - xy[1]) ** 2) ** 0.5
    return kelvin if distance <= _TOLERANCE else None


# --- arcs between zone colours ---------------------------------------------
#
# The Hue app does not let the bridge blend straight between two pins: it adds a
# point between them on an arc of the colour wheel, so the blend stays vivid
# (pink to violet goes through purple, not through grey). The wheel is
# hue (angle) and saturation (distance from the middle).


def _srgb_to_linear(v: float) -> float:
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(v: float) -> float:
    v = max(0.0, v)
    return 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055


def hs_to_xy(hue: float, sat: float) -> XY:
    """The xy colour of a hue (0 to 360) and saturation (0 to 100) at full brightness."""
    s = sat / 100
    hp = (hue % 360) / 60
    x = s * (1 - abs(hp % 2 - 1))
    m = 1 - s
    r, g, b = [(s, x, 0), (x, s, 0), (0, s, x), (0, x, s), (x, 0, s), (s, 0, x)][min(int(hp), 5)]
    r, g, b = (_srgb_to_linear(v + m) for v in (r, g, b))
    big_x = r * 0.664511 + g * 0.154324 + b * 0.162028
    big_y = r * 0.283881 + g * 0.668433 + b * 0.047685
    big_z = r * 0.000088 + g * 0.07231 + b * 0.986039
    total = (big_x + big_y + big_z) or 1.0
    return (big_x / total, big_y / total)


def xy_to_hs(x: float, y: float) -> tuple[float, float]:
    """The hue and saturation of an xy colour."""
    y = y or 1e-6
    big_x, big_z = x / y, (1 - x - y) / y
    rgb = [
        big_x * 1.656492 - 0.354851 - big_z * 0.255038,
        -big_x * 0.707196 + 1.655397 + big_z * 0.036152,
        big_x * 0.051713 - 0.121364 + big_z * 1.01153,
    ]
    rgb = [_linear_to_srgb(v) for v in rgb]
    top = max(rgb) or 1.0
    r, g, b = (v / top for v in rgb)
    span = 1 - min(r, g, b)
    hue = 0.0
    if span > 0:
        if r == 1:
            hue = ((g - b) / span + 6) % 6
        elif g == 1:
            hue = (b - r) / span + 2
        else:
            hue = (r - g) / span + 4
    return ((hue * 60) % 360, span * 100)


def arc_points(pins: list[XY]) -> list[XY]:
    """The zone colours with a colour on the wheel between each two of them, as the Hue app
    does. The hue turns the way the first stretch turns the short way round, and keeps
    turning that way along the whole line, the saturation changes evenly. A colour with
    almost no saturation has no hue of its own and takes its neighbour's. Two colours
    that are (nearly) the same give that colour."""
    out: list[XY] = []
    direction = 0
    for first, second in itertools.pairwise(pins):
        out.append(first)
        if abs(first[0] - second[0]) < 0.002 and abs(first[1] - second[1]) < 0.002:
            out.append(first)
            continue
        ha, sa = xy_to_hs(*first)
        hb, sb = xy_to_hs(*second)
        # What the conversion to the wheel and back gets wrong for the two colours is
        # taken off the result.
        back_a, back_b = hs_to_xy(ha, sa), hs_to_xy(hb, sb)
        err_x = ((first[0] - back_a[0]) + (second[0] - back_b[0])) / 2
        err_y = ((first[1] - back_a[1]) + (second[1] - back_b[1])) / 2
        if sa < 3:
            ha = hb
        if sb < 3:
            hb = ha
        turn = (hb - ha) % 360
        if not direction:
            direction = 1 if turn <= 180 else -1
        if direction < 0 and turn > 0:
            turn -= 360
        x, y = hs_to_xy(ha + turn / 2, (sa + sb) / 2)
        out.append((round(x + err_x, 4), round(y + err_y, 4)))
    out.append(pins[-1])
    return out


# --- the colours a light can show ------------------------------------------
#
# A Hue light shows the colours inside the triangle (its "gamut") the bridge
# reports for it, and the bridge moves any other colour onto the nearest edge. A
# colour outside the triangle is therefore moved here, before it is written, so
# the state shown is the state the light really has.

GAMUT_C: tuple[XY, XY, XY] = ((0.6915, 0.3083), (0.17, 0.7), (0.1532, 0.0475))


# The corners the bridge reports are the textbook ones. Writing them to a Hue Play
# gradient tube and reading them back showed the light stops a little inside: red
# (0.6915, 0.3083) came back as (0.6900, 0.3061), green (0.17, 0.7) as (0.1701, 0.6923).
# So the triangle is pulled in by this fraction towards its middle; a colour at the
# rim is then one the light really shows, and the state does not move afterwards.
GAMUT_INSET = 0.025


def gamut_of(light: dict) -> tuple[XY, XY, XY]:
    """The red, green and blue corners of what a light can show: the corners the bridge
    reports (gamut C if it reports none), pulled in a little as explained above."""
    gamut = (light.get("color") or {}).get("gamut") or {}
    try:
        corners = [(float(gamut[c]["x"]), float(gamut[c]["y"])) for c in ("red", "green", "blue")]
    except KeyError, TypeError, ValueError:
        corners = list(GAMUT_C)
    mx = sum(c[0] for c in corners) / 3
    my = sum(c[1] for c in corners) / 3
    r, g, b = ((c[0] + (mx - c[0]) * GAMUT_INSET, c[1] + (my - c[1]) * GAMUT_INSET) for c in corners)
    return (r, g, b)


def _side(p: XY, a: XY, b: XY) -> float:
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])


def _closest_on_segment(p: XY, a: XY, b: XY) -> XY:
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return (a[0] + t * dx, a[1] + t * dy)


def clamp_to_gamut(xy: XY, gamut: tuple[XY, XY, XY]) -> XY:
    """The colour itself when the light can show it, otherwise the nearest colour it can."""
    r, g, b = gamut
    signs = [_side(xy, r, g), _side(xy, g, b), _side(xy, b, r)]
    if all(v >= 0 for v in signs) or all(v <= 0 for v in signs):
        return xy
    best = min(
        (_closest_on_segment(xy, a, c) for a, c in ((r, g), (g, b), (b, r))),
        key=lambda q: (q[0] - xy[0]) ** 2 + (q[1] - xy[1]) ** 2,
    )
    return (round(best[0], 4), round(best[1], 4))
