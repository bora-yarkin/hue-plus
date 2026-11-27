# Actions

Every action and its fields is listed in Developer tools → Actions, search for `hue_plus`. Actions that can't be undone need `confirm: true`, and bridge actions are for administrators.

```yaml
action: hue_plus.delete_scene
data:
  scene: Relax
  confirm: true
```

| Action | What it does |
|---|---|
| `hue_plus.get_resources` | Get resources |
| `hue_plus.timed_effect` | Timed effect |
| `hue_plus.signal` | Signal |
| `hue_plus.set_power_on` | Set power on |
| `hue_plus.set_motion_area` | Set motion area |
| `hue_plus.create_motion_area` | Create motion area |
| `hue_plus.set_motion_area_lights` | Set motion area lights |
| `hue_plus.delete_motion_area` | Delete motion area |
| `hue_plus.set_streaming_end_state` | Set streaming end state |
| `hue_plus.configure_light` | Configure light |
| `hue_plus.identify` | Identify |
| `hue_plus.set_name` | Set name |
| `hue_plus.create_scene` | Create scene |
| `hue_plus.update_scene` | Update scene |
| `hue_plus.delete_scene` | Delete scene |
| `hue_plus.set_smart_scene` | Set smart scene |
| `hue_plus.create_smart_scene` | Create smart scene |
| `hue_plus.delete_smart_scene` | Delete smart scene |
| `hue_plus.create_room` | Create room |
| `hue_plus.update_room` | Update room |
| `hue_plus.delete_room` | Delete room |
| `hue_plus.create_zone` | Create zone |
| `hue_plus.update_zone` | Update zone |
| `hue_plus.delete_zone` | Delete zone |
| `hue_plus.create_entertainment_area` | Create entertainment area |
| `hue_plus.update_entertainment_area` | Update entertainment area |
| `hue_plus.delete_entertainment_area` | Delete entertainment area |
| `hue_plus.control_entertainment_area` | Control entertainment area |
| `hue_plus.create_automation` | Create automation |
| `hue_plus.update_automation` | Update automation |
| `hue_plus.trigger_automation` | Trigger automation |
| `hue_plus.delete_automation` | Delete automation |
| `hue_plus.revoke_app` | Revoke app |
| `hue_plus.configure_bridge` | Configure bridge |
| `hue_plus.set_auto_update` | Set auto update |
| `hue_plus.check_for_update` | Check for update |
| `hue_plus.install_bridge_update` | Install bridge update |
| `hue_plus.set_home_location` | Set home location |
| `hue_plus.set_zigbee_channel` | Set zigbee channel |
| `hue_plus.press_link_button` | Press link button |
| `hue_plus.search_for_devices` | Search for devices |
| `hue_plus.remove_device` | Remove device |
| `hue_plus.create_routine` | Create routine |
| `hue_plus.update_routine` | Update routine |
| `hue_plus.set_button_lights` | Set button lights |
| `hue_plus.configure_button` | Configure button |
| `hue_plus.create_daily_smart_scene` | Create daily smart scene |
| `hue_plus.light_step` | Light step |
| `hue_plus.configure_sensor` | Configure sensor |
| `hue_plus.remove_matter_fabric` | Remove matter fabric |
| `hue_plus.raw_request` | Raw request |
| `hue_plus.set_style` | Set style |
| `hue_plus.set_effect` | Set effect |
| `hue_plus.set_gradient` | Set gradient |
| `hue_plus.import_hue_scene` | Import hue scene |
| `hue_plus.stream_colors` | Stream colors |
| `hue_plus.stop_streaming` | Stop streaming |
| `hue_plus.activate_scene` | Activate scene |
| `hue_plus.play_effect` | Play effect |
