# SPDX-License-Identifier: GPL-3.0-or-later
"""What a loaded Hue Plus config entry holds while it runs."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from homeassistant.config_entries import ConfigEntry

if TYPE_CHECKING:
    from .coordinator import BridgeCoordinator
    from .scenes.setup import ScenesRuntime
    from .streaming.manager import StreamingManager
    from .sync.coordinator import SyncCoordinator
    from .syncbox.coordinator import SyncBoxCoordinator
    from .zones.manager import GradientLight


@dataclass
class Runtime:
    """One Hue bridge, and the modules switched on for it."""

    hue_entry: ConfigEntry
    modules: frozenset[str]
    # What the unique ids of this bridge's entities start with: the Hue integration's own id of the bridge.
    uid: str
    bridge_name: str
    # The device registry's id of the bridge's device; the devices of lights and accessories are behind it.
    bridge_device_id: str | None = None
    coordinator: BridgeCoordinator | None = None
    zones: dict[str, GradientLight] = field(default_factory=dict)
    scenes: ScenesRuntime | None = None
    sync: SyncCoordinator | None = None
    streaming: StreamingManager | None = None


@dataclass
class SyncBoxRuntime:
    """One Hue Play HDMI Sync Box. The platform files only look at ``modules``."""

    uid: str
    coordinator: SyncBoxCoordinator
    modules: frozenset[str] = frozenset({"syncbox"})


type HuePlusConfigEntry = ConfigEntry[Runtime | SyncBoxRuntime]
