"""What a screen can ask Hue Plus about the bridge."""

from homeassistant.helpers import entity_registry as er

from .fake_hue import LAMP, TUBE


async def test_a_screen_learns_the_modules_the_lights_and_their_abilities(hass, make_entry, hass_ws_client):
    await make_entry(["bridge", "zones"])
    er.async_get(hass).async_get_or_create("light", "hue", LAMP, suggested_object_id="floor_light")
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "hue_plus/capabilities"})
    reply = (await client.receive_json())["result"]
    (bridge,) = reply["bridges"]
    assert bridge["modules"] == ["bridge", "zones"] and "set_style" in bridge["services"] and "scene_start" not in bridge["services"]
    lamp = bridge["lights"]["light.floor_light"]
    assert lamp["effects"] == ["candle", "prism"] and lamp["colour"] and lamp["gradient"] is None
    assert isinstance(lamp["setup"], dict)
    tube = bridge["lights"][TUBE]
    assert tube["gradient"]["points_capable"] == 5 and "segmented_palette" in tube["gradient"]["modes"]
    assert "scenes_sensor" not in bridge and bridge["sync_entity"] is None
