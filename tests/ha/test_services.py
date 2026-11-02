# SPDX-License-Identifier: GPL-3.0-or-later
"""The services: who may call them, what they refuse, and what they do to the bridge."""

import pytest
import voluptuous as vol
from homeassistant.core import Context
from homeassistant.exceptions import ServiceValidationError, Unauthorized

from .fake_hue import AREA, LAMP, SCENE
from .helpers import call


async def test_get_resources_reads_the_bridge_without_exposing_keys(hass, make_entry):
    await make_entry(["bridge"])
    result = await call(hass, "get_resources", {"kinds": ["rooms", "scenes", "apps", "entertainment_areas"]}, response=True)
    assert [r["name"] for r in result["rooms"]] == ["Bedroom"]
    assert result["scenes"][0]["name"] == "Relax"
    assert result["entertainment_areas"][0]["id"] == AREA
    assert len(result["apps"]) == 1 and "test-application-key" not in str(result)


async def test_only_administrators_may_use_the_bridge_services(hass, make_entry, hass_admin_user, hass_read_only_user):
    await make_entry(["bridge"])
    with pytest.raises(Unauthorized):
        await call(hass, "get_resources", context=Context(user_id=hass_read_only_user.id), response=True)
    assert await call(hass, "get_resources", {"kinds": ["rooms"]}, context=Context(user_id=hass_admin_user.id), response=True)
    assert await call(hass, "get_resources", {"kinds": ["rooms"]}, response=True)  # an automation: no user


async def test_a_destructive_service_does_nothing_without_confirm(hass, make_entry, bridge):
    await make_entry(["bridge"])
    with pytest.raises(vol.Invalid):
        await call(hass, "delete_scene", {"scene": "Relax"})
    with pytest.raises(ServiceValidationError, match="confirm"):
        await call(hass, "delete_scene", {"scene": "Relax", "confirm": False})
    assert [w for w in bridge.writes if w[0] == "DELETE"] == []


async def test_a_confirmed_delete_reaches_the_bridge(hass, make_entry, bridge):
    await make_entry(["bridge"])
    await call(hass, "delete_scene", {"scene": "Relax", "confirm": True})
    assert ("DELETE", f"clip/v2/resource/scene/{SCENE}", None) in bridge.writes


async def test_a_light_can_be_given_by_name_and_is_written_by_id(hass, make_entry, bridge):
    await make_entry(["bridge"])
    await call(hass, "timed_effect", {"light": "floor light", "effect": "sunrise", "duration": 600})
    method, path, body = bridge.writes[-1]
    assert (method, path) == ("PUT", f"clip/v2/resource/light/{LAMP}")
    assert body["timed_effects"]["effect"] == "sunrise" and body["timed_effects"]["duration"] == 600_000


async def test_the_bridge_refusing_a_request_is_reported_in_its_words(hass, make_entry):
    await make_entry(["bridge"])
    with pytest.raises(ServiceValidationError, match="Nothing called"):
        await call(hass, "timed_effect", {"light": "Nothing called this", "effect": "sunrise"})


async def test_a_service_of_a_module_that_is_off_says_so(hass, make_entry):
    await make_entry(["scenes"])
    with pytest.raises(ServiceValidationError, match="bridge module"):
        await call(hass, "get_resources", response=True)


async def test_an_action_straight_after_another_sees_what_the_first_changed(hass, make_entry, bridge):
    await make_entry(["bridge"])
    await call(hass, "update_scene", {"scene": "Relax", "name": "Evening"})
    # the fake bridge changed the name; the next action must look names up in the bridge as it is now
    await call(hass, "delete_scene", {"scene": "Evening", "confirm": True})
    assert ("DELETE", f"clip/v2/resource/scene/{SCENE}", None) in bridge.writes
