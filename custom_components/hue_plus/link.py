# SPDX-License-Identifier: GPL-3.0-or-later
"""How one Hue Plus entry reaches its bridge: through the Hue integration's connection, or through one of its own.

Everything else in Hue Plus asks the link for the bridge object (the one the Hue integration's platforms are written for:
``.api`` is the aiohue client), the bridge's address and the app key, and never needs to know which of the two it is.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from homeassistant.config_entries import ConfigEntry

from .bridge.api import BridgeError


class BridgeLink:
    def __init__(
        self,
        *,
        uid: str,
        title: str,
        host: Callable[[], str],
        app_key: Callable[[], str],
        bridge: Callable[[], Any | None],
        hue_entry: ConfigEntry | None,
        tls: Callable[[], Any],
    ) -> None:
        self.uid = uid
        self.title = title
        self._host, self._app_key, self._bridge, self._tls = host, app_key, bridge, tls
        # The Hue integration's config entry, when Hue Plus rides on it; None for a connection of its own.
        self.hue_entry = hue_entry

    @classmethod
    def of_hue_entry(cls, hue_entry: ConfigEntry) -> BridgeLink:
        """Rides on the Hue integration's connection. The Hue entry is looked at every time, so a reload of it is followed."""
        return cls(
            uid=hue_entry.unique_id or hue_entry.entry_id,
            title=hue_entry.title,
            host=lambda: hue_entry.data["host"],
            app_key=lambda: hue_entry.data["api_key"],
            bridge=lambda: getattr(hue_entry, "runtime_data", None),
            hue_entry=hue_entry,
            tls=lambda: False,
        )

    @property
    def hue_entry_id(self) -> str | None:
        return self.hue_entry.entry_id if self.hue_entry else None

    @property
    def host(self) -> str:
        return self._host()

    @property
    def app_key(self) -> str:
        return self._app_key()

    @property
    def tls(self) -> Any:
        """aiohttp's ``ssl`` argument for a request of Hue Plus's own to this bridge: not checked on the Hue integration's, pinned on its own."""
        return self._tls()

    @property
    def bridge(self) -> Any:
        bridge = self._bridge()
        if bridge is None:
            raise BridgeError("The connection to the bridge is not up")
        return bridge

    @property
    def api(self) -> Any:
        api = getattr(self.bridge, "api", None)
        if api is None:
            raise BridgeError("The connection to the bridge is not using the bridge's v2 API")
        return api
