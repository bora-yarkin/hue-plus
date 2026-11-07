/* What Hue Plus offers, read from Home Assistant's registry and states (so a page shows only what exists): the bridge's entities, the lights, what belongs to one light, the
 updates, and the bridge's own data (a service that answers). It was the dashboard's `Integrations.hueplus`; now it is this plugin's. */

var hueplus={
 /* The entities of the bridge, by what they are for. The registry's unique_id of one is "<bridge>_<key>"; the bridge id is read from the Zigbee
  channel sensor, which a bridge always has. Returns {key: entity_id}, or null when no bridge of Hue Plus has its bridge module on. */
 BRIDGE_KEYS:["auto_update","auto_update_time","check_update","search","zigbee_channel","matter_fabrics","authorized_apps","home_and_away","firmware","bridge_update","update_state","device_search","service_internet","service_remoteaccess"],
 bridge:function(h){
  var tail="_zigbee_channel",ids=Object.keys(h.entities||{}),uid=null;
  for(var i=0;i<ids.length&&!uid;i++){
   var e=h.entities[ids[i]];
   if(e.platform==="hue_plus"&&e.unique_id&&e.unique_id.length>tail.length&&e.unique_id.slice(-tail.length)===tail)uid=e.unique_id.slice(0,-tail.length);
  }
  if(!uid)return null;
  var out={};
  ids.forEach(function(id){
   var e=h.entities[id];
   if(e.platform!=="hue_plus"||!e.unique_id||e.unique_id.indexOf(uid+"_")!==0)return;
   var key=e.unique_id.slice(uid.length+1);
   if(hueplus.BRIDGE_KEYS.indexOf(key)>=0)out[key]=id;
  });
  return out;
 },
 /* The lights of Hue Plus (not rooms, zones or gradient zones): entity ids whose state carries the bridge's id of the light. */
 lights:function(h){
  return Object.keys(h.entities||{}).filter(function(id){
   var e=h.entities[id],s=h.states[id];
   return e.platform==="hue_plus"&&id.indexOf("light.")===0&&s&&s.attributes&&s.attributes.hue_light_id;
  });
 },
 /* What belongs to one light: its power-on select, identify button and firmware update (the registry's unique_id ends with the light's id, or with the id of its device for the update). */
 forLight:function(h,id){
  var hue=h.states[id]&&h.states[id].attributes.hue_light_id,out={};
  if(!hue)return out;
  Object.keys(h.entities||{}).forEach(function(k){
   var e=h.entities[k];
   if(e.platform!=="hue_plus"||!e.unique_id||e.device_id!==h.entities[id].device_id)return;
   if(e.unique_id.slice(-("_powerup_"+hue).length)==="_powerup_"+hue)out.powerup=k;
   else if(e.unique_id.slice(-("_identify_"+hue).length)==="_identify_"+hue)out.identify=k;
   else if(k.indexOf("update.")===0)out.update=k;
  });
  return out;
 },
 /* Firmware updates of Hue Plus's devices: update entity ids. */
 updates:function(h){
  return Object.keys(h.entities||{}).filter(function(id){return id.indexOf("update.")===0&&h.entities[id].platform==="hue_plus"});
 },
 /* What the bridge itself holds (lists of automations, entertainment areas, ...), asked for when a page opens. */
 resources:function(kinds){return window.HA.serviceResponse("hue_plus","get_resources",{kinds:kinds})},
 /* Whether the integration is installed and offers this service (its modules that are switched off register nothing extra, but the
  service list of Home Assistant only has what is loaded). */
 has:function(h,service){return !!(h&&h.services&&h.services.hue_plus&&h.services.hue_plus[service])}
};
