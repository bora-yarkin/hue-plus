# SPDX-License-Identifier: Apache-2.0
# Copied from Home Assistant 2026.11.0, homeassistant/components/hue/sensor.py (Apache-2.0, (c) the Home Assistant authors), for Hue
# Plus to run without the Hue integration. See NOTICE.md at the root of the repository. Changes: imports only; the v1 API branch is removed (Hue Plus needs a v2 bridge).
"""Support for Hue sensors."""

from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .bridge import HueConfigEntry
from .v2.sensor import async_setup_entry as setup_entry_v2


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: HueConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up sensor entities."""
    await setup_entry_v2(hass, config_entry, async_add_entities)
