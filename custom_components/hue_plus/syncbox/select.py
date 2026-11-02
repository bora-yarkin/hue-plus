# SPDX-License-Identifier: GPL-3.0-or-later
"""What the sync box does (mode), which HDMI input it follows, and how strongly the lights follow the picture."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from ..runtime import HuePlusConfigEntry
from .client import INTENSITIES, MODES
from .entity import SyncBoxEntity

INPUTS = ("input1", "input2", "input3", "input4")


async def async_setup_entry(hass: HomeAssistant, entry: HuePlusConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    runtime = entry.runtime_data
    async_add_entities(
        [
            ModeSelect(runtime.coordinator, runtime.uid),
            SourceSelect(runtime.coordinator, runtime.uid),
            IntensitySelect(runtime.coordinator, runtime.uid),
        ]
    )


class ModeSelect(SyncBoxEntity, SelectEntity):
    _attr_name = "Mode"
    _attr_options = list(MODES)

    def __init__(self, coordinator, uid: str) -> None:
        super().__init__(coordinator, uid, "mode")

    @property
    def current_option(self) -> str | None:
        mode = self.execution.get("mode")
        return mode if mode in MODES else None

    async def async_select_option(self, option: str) -> None:
        await self.coordinator.async_command(self.coordinator.box.execute(mode=option))


class SourceSelect(SyncBoxEntity, SelectEntity):
    """The inputs are shown by the names set in the Hue app; two inputs with one name are told apart by their number."""

    _attr_name = "HDMI input"

    def __init__(self, coordinator, uid: str) -> None:
        super().__init__(coordinator, uid, "source")

    def _labels(self) -> dict[str, str]:
        hdmi = (self.coordinator.data or {}).get("hdmi") or {}
        names = {key: (hdmi.get(key) or {}).get("name") or key for key in INPUTS}
        taken = list(names.values())
        return {key: name if taken.count(name) == 1 else f"{name} ({key})" for key, name in names.items()}

    @property
    def options(self) -> list[str]:
        return list(self._labels().values())

    @property
    def current_option(self) -> str | None:
        return self._labels().get(self.execution.get("hdmiSource"))

    async def async_select_option(self, option: str) -> None:
        key = next((k for k, label in self._labels().items() if label == option), None)
        if key is None:
            return
        await self.coordinator.async_command(self.coordinator.box.set_hdmi_source(key))


class IntensitySelect(SyncBoxEntity, SelectEntity):
    """The intensity of the mode that is running; the box keeps one for video, game and music each."""

    _attr_name = "Intensity"
    _attr_options = list(INTENSITIES)

    def __init__(self, coordinator, uid: str) -> None:
        super().__init__(coordinator, uid, "intensity")

    @property
    def _mode(self) -> str | None:
        mode = self.execution.get("mode")
        return mode if mode in ("video", "game", "music") else None

    @property
    def available(self) -> bool:
        return super().available and self._mode is not None

    @property
    def current_option(self) -> str | None:
        value = (self.execution.get(self._mode) or {}).get("intensity") if self._mode else None
        return value if value in INTENSITIES else None

    async def async_select_option(self, option: str) -> None:
        if self._mode is None:
            return
        await self.coordinator.async_command(self.coordinator.box.set_intensity(self._mode, option))
