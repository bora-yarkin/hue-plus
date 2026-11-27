# Setting up

## Choosing a connection

When you add the integration you're asked what you're connecting:

- **A bridge the Hue integration already has.** Hue Plus uses that connection, so you don't press anything.
- **A bridge, connected directly.** Enter its address and press the round button on top of the bridge. The Hue integration isn't needed. Hue Plus remembers the bridge's certificate and refuses one that shows a different one.
- **A Hue Play HDMI Sync Box.** See [sync](sync.md).

If the bridge's address changes, use Reconfigure. Later you can also switch from the Hue integration's connection to Hue Plus's own (Reconfigure → Use my own connection) and remove the Hue integration without losing anything.

## What happens to the Hue integration's entities

If the Hue integration is set up, you're asked once:

- **Leave them alone** (default). Nothing changes. Hue Plus makes its own entities with the same names ending in `_plus`, and keeps their area, name, icon, labels and hidden state matched to the Hue ones. That copying only goes from Hue to Hue Plus.
- **Hide and rename them.** The Hue entities are hidden and renamed to end in `_hue`, and Hue Plus's entities take their old names, so your dashboards and automations now use Hue Plus. Removing Hue Plus puts the names back.

To change your mind, remove Hue Plus and add it again.

## Devices

Home Assistant lets a device belong to one integration only, so Hue Plus makes its own devices, named like the Hue ones and linked to the bridge.
