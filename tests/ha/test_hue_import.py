# SPDX-License-Identifier: GPL-3.0-or-later
"""Reading a Hue scene from the bridge to import it as a live scene."""

import pytest
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from .fake_hue import LAMP, SCENE, TUBE
from .helpers import call

PALETTE = {
    "color": [
        {"color": {"xy": {"x": 0.2072, "y": 0.4525}}, "dimming": {"brightness": 100}},
        {"color": {"xy": {"x": 0.1868, "y": 0.3328}}, "dimming": {"brightness": 50}},
    ]
}


@pytest.fixture
async def scene_entities(hass, make_entry, hue_entry, bridge):
    """The scene of the bridge as Home Assistant has it twice: the Hue integration's entity and Hue Plus's copy of it (same bridge scene, same unique id)."""
    bridge.resources["scene"][0]["palette"] = PALETTE
    plus = await make_entry(["zones"])
    registry = er.async_get(hass)
    hue = registry.async_get_or_create("scene", "hue", SCENE, config_entry=hue_entry, suggested_object_id="relax_hue")
    mirror = registry.async_get_or_create("scene", "hue_plus", SCENE, config_entry=plus, suggested_object_id="relax")
    return hue.entity_id, mirror.entity_id


async def test_the_hue_integrations_scene_is_read_from_the_bridge(hass, scene_entities):
    hue, _ = scene_entities
    scene = await call(hass, "import_hue_scene", {"entity_id": hue}, response=True)
    assert scene["name"] == "Relax"
    assert scene["palette"] == [{"xy": [0.2072, 0.4525], "b": 100.0}, {"xy": [0.1868, 0.3328], "b": 50.0}]


async def test_hue_pluss_copy_of_a_scene_is_read_like_the_scene_it_copies(hass, scene_entities):
    hue, mirror = scene_entities
    assert mirror != hue
    assert await call(hass, "import_hue_scene", {"entity_id": mirror}, response=True) == await call(
        hass, "import_hue_scene", {"entity_id": hue}, response=True
    )


async def test_hue_pluss_scene_is_read_through_its_own_bridge_without_the_hue_integrations_entity(hass, scene_entities):
    """Hue Plus runs without the Hue integration's entities: its own scene is read through its own entry's connection."""
    hue, mirror = scene_entities
    er.async_get(hass).async_remove(hue)
    scene = await call(hass, "import_hue_scene", {"entity_id": mirror}, response=True)
    assert scene["name"] == "Relax"


async def test_an_entity_that_is_not_a_scene_of_the_bridge_is_refused(hass, scene_entities, hue_entry):
    other = er.async_get(hass).async_get_or_create("scene", "homeassistant", "mine", suggested_object_id="mine")
    with pytest.raises(ServiceValidationError, match="not a Hue scene"):
        await call(hass, "import_hue_scene", {"entity_id": other.entity_id}, response=True)


async def test_what_a_static_scene_sets_each_light_to_is_read(hass, scene_entities, hue_entry, bridge):
    """A static scene is imported as the settings of its lights: off, a colour with its brightness, a white, a gradient's middle colour."""
    registry = er.async_get(hass)
    lamp = registry.async_get_or_create("light", "hue", LAMP, config_entry=hue_entry, suggested_object_id="lamp").entity_id
    tube = registry.async_get_or_create("light", "hue", TUBE, config_entry=hue_entry, suggested_object_id="tube").entity_id
    off = registry.async_get_or_create("light", "hue", "off-lamp", config_entry=hue_entry, suggested_object_id="off_lamp").entity_id
    white = registry.async_get_or_create("light", "hue", "white-lamp", config_entry=hue_entry, suggested_object_id="white_lamp").entity_id
    bridge.resources["scene"][0]["actions"] = [
        {
            "target": {"rid": LAMP, "rtype": "light"},
            "action": {"on": {"on": True}, "dimming": {"brightness": 40.0}, "color": {"xy": {"x": 0.5, "y": 0.4}}},
        },
        {
            "target": {"rid": TUBE, "rtype": "light"},
            "action": {
                "on": {"on": True},
                "gradient": {
                    "points": [
                        {"color": {"xy": {"x": 0.1, "y": 0.1}}},
                        {"color": {"xy": {"x": 0.2, "y": 0.3}}},
                        {"color": {"xy": {"x": 0.6, "y": 0.3}}},
                    ]
                },
            },
        },
        {"target": {"rid": "off-lamp", "rtype": "light"}, "action": {"on": {"on": False}}},
        {
            "target": {"rid": "white-lamp", "rtype": "light"},
            "action": {"on": {"on": True}, "dimming": {"brightness": 100.0}, "color_temperature": {"mirek": 400}},
        },
        {"target": {"rid": "x", "rtype": "room"}, "action": {}},
    ]
    hue, _ = scene_entities
    scene = await call(hass, "import_hue_scene", {"entity_id": hue}, response=True)
    assert scene["states"] == [
        {"entity_id": lamp, "on": True, "brightness": 102, "xy": [0.5, 0.4]},
        {"entity_id": tube, "on": True, "xy": [0.2, 0.3]},
        {"entity_id": off, "on": False},
        {"entity_id": white, "on": True, "brightness": 255, "k": 2500},
    ]
