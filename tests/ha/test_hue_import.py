# SPDX-License-Identifier: GPL-3.0-or-later
"""Reading a Hue scene from the bridge to import it as a live scene."""

import pytest
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from .fake_hue import SCENE
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
    plus = await make_entry(["scenes"])
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


async def test_a_copy_whose_hue_scene_is_gone_is_refused_with_the_reason(hass, scene_entities):
    hue, mirror = scene_entities
    er.async_get(hass).async_remove(hue)
    with pytest.raises(ServiceValidationError, match="not a Hue scene"):
        await call(hass, "import_hue_scene", {"entity_id": mirror}, response=True)


async def test_an_entity_that_is_not_a_scene_of_the_bridge_is_refused(hass, scene_entities, hue_entry):
    other = er.async_get(hass).async_get_or_create("scene", "homeassistant", "mine", suggested_object_id="mine")
    with pytest.raises(ServiceValidationError, match="not a Hue scene"):
        await call(hass, "import_hue_scene", {"entity_id": other.entity_id}, response=True)
