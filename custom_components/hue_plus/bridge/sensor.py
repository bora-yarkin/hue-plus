# SPDX-License-Identifier: GPL-3.0-or-later
"""What the bridge knows about itself, its apps, Matter and entertainment areas."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorEntityDescription
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er

from ..entity import BridgeEntity, add_as_they_appear
from ..runtime import HuePlusConfigEntry
from . import models


@dataclass(frozen=True, kw_only=True)
class BridgeSensorDescription(SensorEntityDescription):
    value: Callable[[models.Snapshot], Any]
    attributes: Callable[[models.Snapshot], dict[str, Any]] | None = None


SENSORS = (
    BridgeSensorDescription(
        key="zigbee_channel",
        name="Zigbee channel",
        icon="mdi:zigbee",
        value=models.bridge_zigbee_channel,
        attributes=models.zigbee_network,
    ),
    BridgeSensorDescription(key="firmware", name="Firmware", icon="mdi:chip", value=lambda s: models.bridge_update(s)["installed"]),
    BridgeSensorDescription(key="update_state", name="Update state", icon="mdi:update", value=lambda s: models.bridge_update(s)["state"]),
    BridgeSensorDescription(
        key="backup_status", name="Backup status", icon="mdi:backup-restore", value=lambda s: (s.config.get("backup") or {}).get("status")
    ),
    BridgeSensorDescription(
        key="authorized_apps",
        name="Authorized apps",
        icon="mdi:key-chain",
        value=lambda s: len(models.authorized_apps(s.config)),
        attributes=lambda s: {"apps": models.authorized_apps(s.config)},
    ),
    BridgeSensorDescription(
        key="matter_fabrics",
        name="Matter fabrics",
        icon="mdi:matter",
        value=lambda s: len(s.matter_fabric),
        attributes=lambda s: {**models.matter_info(s), "fabrics": models.matter_fabrics(s)},
    ),
    BridgeSensorDescription(
        key="home_and_away",
        name="Home and Away",
        icon="mdi:home-switch",
        value=lambda s: "configured" if models.home_and_away(s)["configured"] else "not configured",
        attributes=lambda s: {"clients": models.home_and_away(s)["clients"]},
    ),
    BridgeSensorDescription(key="device_search", name="Device search", icon="mdi:magnify-scan", value=models.search_status),
)


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities) -> None:
    coordinator = entry.runtime_data.coordinator
    async_add_entities(BridgeSensor(coordinator, d) for d in SENSORS)
    entry.async_on_unload(
        add_as_they_appear(
            coordinator,
            async_add_entities,
            lambda snap: {a["id"]: (lambda a=a: AreaSensor(coordinator, a["id"])) for a in models.entertainment_areas(snap)},
        )
    )


class BridgeSensor(BridgeEntity, SensorEntity):
    entity_description: BridgeSensorDescription
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    # Lists of apps and fabrics are long and change rarely: they are shown, not kept in the history.
    _unrecorded_attributes = frozenset({"apps", "fabrics"})

    def __init__(self, coordinator, description: BridgeSensorDescription) -> None:
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> Any:
        return self.entity_description.value(self.snapshot)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        of = self.entity_description.attributes
        return of(self.snapshot) if of else None


class AreaSensor(BridgeEntity, SensorEntity):
    """One entertainment area: whether it is streaming, who streams, and where its lights are."""

    _attr_icon = "mdi:television-ambient-light"
    _unrecorded_attributes = frozenset({"lights"})

    def __init__(self, coordinator, area_id: str) -> None:
        super().__init__(coordinator, f"area_{area_id}")
        self._area_id = area_id

    def _area(self) -> dict[str, Any] | None:
        return next((a for a in models.entertainment_areas(self.snapshot) if a["id"] == self._area_id), None)

    @callback
    def _handle_coordinator_update(self) -> None:
        """An area that was deleted on the bridge takes its sensor with it, instead of leaving it unavailable for ever."""
        if self._area() is None and self.registry_entry is not None:
            er.async_get(self.hass).async_remove(self.entity_id)
            return
        super()._handle_coordinator_update()

    @property
    def available(self) -> bool:
        return super().available and self._area() is not None

    @property
    def name(self) -> str:
        area = self._area()
        return f"{area['name']} area" if area else "Entertainment area"

    @property
    def native_value(self) -> str | None:
        area = self._area()
        return area["status"] if area else None

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        area = self._area()
        if not area:
            return None
        return {
            "type": area["type"],
            "active_streamer": area["active_streamer"],
            "area_id": area["id"],
            "end_state": area["end_state"],
            "channels": area["channels"],
            "max_streams": area["max_streams"],
            "lights": area["lights"],
        }
