# SPDX-License-Identifier: GPL-3.0-or-later
"""Gradient lights: the zones are written to the bridge as one list of points."""

import pytest
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from custom_components.hue_plus.const import DOMAIN

from .fake_hue import LAMP, TUBE
from .helpers import call


async def test_turning_a_zone_on_with_a_colour_writes_the_whole_gradient(hass, make_entry, bridge):
    await make_entry(["zones"])
    zone = er.async_get(hass).async_get_entity_id("light", DOMAIN, f"{TUBE}_zone_1")
    await hass.services.async_call("light", "turn_on", {"entity_id": zone, "xy_color": [0.55, 0.35]}, blocking=True)
    method, path, body = bridge.writes[-1]
    assert (method, path) == ("PUT", f"clip/v2/resource/light/{TUBE}")
    points = body["gradient"]["points"]
    assert body["gradient"]["mode"] == "interpolated_palette" and len(points) >= 2
    assert points[0]["color"]["xy"] == pytest.approx({"x": 0.55, "y": 0.35}, abs=0.02)


async def test_set_style_accepts_the_light_by_entity_and_changes_the_mode(hass, make_entry, bridge):
    await make_entry(["zones"])
    zone = er.async_get(hass).async_get_entity_id("light", DOMAIN, f"{TUBE}_zone_1")
    await call(hass, "set_style", {"light": zone, "style": "segmented"})
    assert bridge.writes[-1][2]["gradient"]["mode"] == "segmented_palette"


async def test_the_call_the_dashboard_makes_to_separate_the_zones_is_one_that_works_and_gives_every_zone(hass, make_entry, bridge):
    """home_control.json says how a scene makes every zone of a strip a light of its own: the service, the field for a zone and the data."""
    import json
    from pathlib import Path

    how = json.loads((Path(__file__).parents[2] / "custom_components" / "hue_plus" / "home_control.json").read_text())["separate_zones"]
    await make_entry(["zones"])
    registry = er.async_get(hass)
    zone = registry.async_get_entity_id("light", DOMAIN, f"{TUBE}_zone_1")
    await call(hass, how["service"], {how["field"]: zone, **how["data"]})
    assert bridge.writes[-1][2]["gradient"]["mode"] == "segmented_palette"
    states = [hass.states.get(registry.async_get_entity_id("light", DOMAIN, f"{TUBE}_zone_{i}")) for i in range(1, 6)]
    assert all(state is not None and state.state != "unavailable" for state in states)  # all five zones are lights of their own


async def test_set_style_needs_a_style_or_flip(hass, make_entry):
    await make_entry(["zones"])
    with pytest.raises(ServiceValidationError, match="style"):
        await call(hass, "set_style", {"light": TUBE})


async def test_a_light_that_is_not_a_gradient_light_is_refused(hass, make_entry):
    await make_entry(["zones"])
    with pytest.raises(ServiceValidationError, match="No gradient light"):
        await call(hass, "set_style", {"light": "a0000000-0000-4000-8000-000000000002", "style": "linear"})


async def test_an_effect_can_be_started_on_a_light_given_as_a_hue_entity(hass, make_entry, bridge):
    await make_entry(["zones"])
    er.async_get(hass).async_get_or_create("light", "hue", LAMP, suggested_object_id="floor_light")
    await call(hass, "set_effect", {"lights": ["light.floor_light"], "effect": "candle", "hs_color": [30, 80], "speed": 0.5})
    method, path, body = bridge.writes[-1]
    assert (method, path) == ("PUT", f"clip/v2/resource/light/{LAMP}")
    assert body["effects_v2"]["action"]["effect"] == "candle" and body["effects_v2"]["action"]["parameters"]["speed"] == 0.5


async def test_an_effect_is_refused_for_something_that_is_not_a_hue_light(hass, make_entry):
    await make_entry(["zones"])
    er.async_get(hass).async_get_or_create("light", "other", "x", suggested_object_id="lamp")
    with pytest.raises(ServiceValidationError, match="not a Hue light"):
        await call(hass, "set_effect", {"lights": ["light.lamp"], "effect": "candle"})
