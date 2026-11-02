# SPDX-License-Identifier: GPL-3.0-or-later
"""Scenes play on Hue lights only, when Hue Plus runs next to the Hue integration.

A home that keeps the Hue integration (``CONF_TAKEOVER`` "alongside") has many lights that are not Hue's, and a live scene,
an area or a located light must never reach one of them. Without that choice (Hue Plus replaces the Hue integration) the
scenes take any light, as before.
"""

from __future__ import annotations

from collections.abc import Iterable

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from ..const import DOMAIN, HUE_DOMAIN, replaces_hue
from ..runtime import HuePlusConfigEntry


def hue_only(entry: HuePlusConfigEntry) -> bool:
    return not replaces_hue(entry)


def require_hue_lights(hass: HomeAssistant, entry: HuePlusConfigEntry, entity_ids: Iterable[str]) -> None:
    """Refuses a light that is not one of the Hue bridge's (Hue Plus's own entity or the Hue integration's), when scenes are Hue-only."""
    if not hue_only(entry):
        return
    registry = er.async_get(hass)
    foreign = []
    for entity_id in entity_ids:
        row = registry.async_get(entity_id)
        if row is None or row.platform not in (DOMAIN, HUE_DOMAIN):
            foreign.append(entity_id)
    if foreign:
        raise ServiceValidationError(f"Hue Plus scenes only use Hue lights; these are not: {', '.join(sorted(set(foreign)))}")
