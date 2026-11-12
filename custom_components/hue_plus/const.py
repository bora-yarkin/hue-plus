# SPDX-License-Identifier: GPL-3.0-or-later
"""Constants shared by every module of Philips Hue Plus."""

DOMAIN = "hue_plus"
HUE_DOMAIN = "hue"

CONF_HUE_ENTRY = "hue_entry_id"
# An entry that has no ``CONF_HUE_ENTRY`` talks to its bridge itself: it has registered with the bridge (link button), and keeps the
# bridge's address, its own app key and the SHA-256 fingerprint of the certificate the bridge showed while registering (every
# later connection must show the same one; the bridge's certificate is signed by Signify's private authority, so it has no public chain).
CONF_HOST = "host"
CONF_APP_KEY = "app_key"
CONF_CERT_SHA256 = "certificate_sha256"
CONF_MODULES = "modules"
# What Hue Plus does with the Hue integration's own entities. "replace" hides each one and gives its entity id to Hue Plus's
# entity (the Hue one becomes ``<id>_hue``); "alongside" leaves the Hue integration exactly as it was, and Hue Plus's entities
# get ``<id>_plus``. An entry made before this choice existed has none stored, and is "replace".
CONF_TAKEOVER = "takeover"
TAKEOVER_REPLACE = "replace"
TAKEOVER_ALONGSIDE = "alongside"
CONF_STREAM_APP_KEY = "stream_app_key"
CONF_STREAM_CLIENT_KEY = "stream_client_key"
CONF_STREAM_APP_ID = "stream_application_id"
CONF_AUTH = "auth"
CONF_SYNC_APP_ID = "sync_app_id"
CONF_SYNC_CLIENT_ID = "sync_client_id"
CONF_SYNC_CLIENT_SECRET = "sync_client_secret"
CONF_AUTH_IMPLEMENTATION = "auth_implementation"
CONF_OAUTH_TOKEN = "token"
CONF_UUID = "uuid"

# A Hue Play HDMI Sync Box is a second kind of entry: it has no bridge and no modules to choose. Its entry has these keys.
CONF_SYNCBOX_HOST = "syncbox_host"
CONF_SYNCBOX_TOKEN = "syncbox_token"
CONF_SYNCBOX_REGISTRATION = "syncbox_registration_id"
# What ``Runtime.modules`` holds for a sync box entry, so the platform files set up its entities and none of the bridge's.
MODULE_SYNCBOX = "syncbox"

MODULE_BRIDGE = "bridge"
MODULE_LIGHTS = "lights"
MODULE_DEVICES = "devices"
MODULE_ZONES = "zones"
MODULE_SYNC = "sync"
MODULE_STREAMING = "streaming"
# A sidebar panel of its own that looks like the Hue app (``dashboard.py``). It is off until it is switched on.
MODULE_DASHBOARD = "dashboard"
MODULES = (MODULE_BRIDGE, MODULE_LIGHTS, MODULE_DEVICES, MODULE_ZONES, MODULE_SYNC, MODULE_STREAMING, MODULE_DASHBOARD)
# The Spotify sync and the local streaming need credentials, so they are off until they are given; the dashboard is off until it is chosen.
DEFAULT_MODULES = (MODULE_BRIDGE, MODULE_LIGHTS, MODULE_DEVICES, MODULE_ZONES)

# Seconds between two reads of the bridge by the bridge module (about 17 requests; the bridge allows three at a time).
UPDATE_INTERVAL_S = 60

SYNC_URL = "wss://genesis-ws.meethue.com/"

MANUFACTURER = "Signify"


def connects_directly(entry) -> bool:
    """Whether this bridge entry has its own connection to the bridge instead of using the Hue integration's."""
    return CONF_HUE_ENTRY not in entry.data


def replaces_hue(entry) -> bool:
    """Whether this Hue Plus entry hides and renames the Hue integration's entities (see ``CONF_TAKEOVER``).

    An entry with its own connection has no Hue entities of that bridge to hide, so it never does.
    """
    return not connects_directly(entry) and entry.data.get(CONF_TAKEOVER, TAKEOVER_REPLACE) == TAKEOVER_REPLACE


# The Hue lights' own effects that can be played with a colour (``home_control.json`` declares the same list to the dashboard).
PLAY_EFFECTS = ("candle", "fire", "sparkle", "glisten", "opal", "prism", "underwater", "cosmos", "sunbeam", "enchant")
