# SPDX-License-Identifier: GPL-3.0-or-later
"""Constants shared by every module of Philips Hue Plus."""

DOMAIN = "hue_plus"
HUE_DOMAIN = "hue"

CONF_HUE_ENTRY = "hue_entry_id"
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
MODULE_SCENES = "scenes"
MODULE_SYNC = "sync"
MODULE_STREAMING = "streaming"
MODULES = (MODULE_BRIDGE, MODULE_LIGHTS, MODULE_DEVICES, MODULE_ZONES, MODULE_SCENES, MODULE_SYNC, MODULE_STREAMING)
# The Spotify sync and the local streaming need credentials, so they are off until they are given.
DEFAULT_MODULES = (MODULE_BRIDGE, MODULE_LIGHTS, MODULE_DEVICES, MODULE_ZONES, MODULE_SCENES)

# Seconds between two reads of the bridge by the bridge module (about 17 requests; the bridge allows three at a time).
UPDATE_INTERVAL_S = 60

# A file in the Home Assistant configuration folder holding {"auth": ..., "uuid": ...}. The options flow reads it once,
# stores the values in the config entry and deletes the file, so the token never has to be typed or pasted into a form.
CREDENTIALS_FILE = "hue_plus_spotify_token.json"
SYNC_URL = "wss://genesis-ws.meethue.com/"

MANUFACTURER = "Signify"


def replaces_hue(entry) -> bool:
    """Whether this Hue Plus entry hides and renames the Hue integration's entities (see ``CONF_TAKEOVER``)."""
    return entry.data.get(CONF_TAKEOVER, TAKEOVER_REPLACE) == TAKEOVER_REPLACE
