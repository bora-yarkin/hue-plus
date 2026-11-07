/* Hue scenes (the scene entities of the Hue integration and of Hue Plus): playing one live at a speed, freezing it, its popup, reading its colours from the bridge to
 import it as a live scene, and the room's scenes in the light panel. A scene kind and a scene import source registered with the dashboard (see epilogue.js). */

var HUESCENES = {
 /* Philips Hue: a scene entity says nothing about being on, but the room has a "Scene" select entity (same device) whose state is the name of the scene that is on. */
 /* Hue Plus runs the Hue integration's scenes itself (platform hue_plus), with the same attributes, and its own activate_scene service. */
 isHue:function(h,id){var e=h.entities[id];return id.indexOf("scene.")===0&&!!e&&(e.platform==="hue"||e.platform==="hue_plus")},
 /* The light that stands for the whole room of a Hue scene: the Hue group light on the same device. Its "dynamics" attribute says whether a live scene is playing. */
 group:function(h,id){
  var e=h.entities[id];
  if(!e||!e.device_id)return null;
  return Object.keys(h.states).filter(function(k){var x=h.entities[k];return k.indexOf("light.")===0&&x&&x.device_id===e.device_id&&h.states[k].attributes.is_hue_group})[0]||null;
 },
 /* The service call that starts a scene live, at a speed (0 to 100) and brightness (1 to 255). It is the only way to change a scene's speed; dynamic:false does not stop a live scene. */
 start:function(h,id,speed,brightness){
  return[h.entities[id].platform==="hue_plus"?"hue_plus":"hue","activate_scene",{entity_id:id,dynamic:true,speed:Math.max(0,Math.min(100,Math.round(speed))),brightness:Math.max(1,Math.min(255,Math.round(brightness)))}];
 },
 /* The Hue app sets a scene's speed in 12 steps. The service takes 0 to 100, so step 1 is 0 and step 12 is 100. */
 speedSteps:12,
 stepToSpeed:function(step){return Math.round((step-1)/(this.speedSteps-1)*100)},
 speedToStep:function(speed){return Math.max(1,Math.min(this.speedSteps,Math.round(speed/100*(this.speedSteps-1))+1))},
 /* Each Hue light reports "dynamic_palette" in its dynamics attribute while a live scene plays on it (an off light keeps the word). */
 playing:function(h,grp){
  return !!grp&&(h.states[grp].attributes.entity_id||[]).some(function(m){var s=h.states[m];return s&&s.state==="on"&&s.attributes.dynamics==="dynamic_palette"});
 },
 /* Freezing a live scene: every light that is on is told the colour and brightness it shows right now, as a plain command. Hue then stops animating it. Returns service calls as [domain, service, data]. */
 freeze:function(h,grp){
  var out=[];
  (h.states[grp].attributes.entity_id||[]).forEach(function(m){
   var s=h.states[m];
   if(!s||s.state!=="on")return;
   var a=s.attributes,d={entity_id:m,transition:0};
   if(a.brightness)d.brightness=a.brightness;
   if(a.color_mode==="color_temp"&&a.color_temp_kelvin)d.color_temp_kelvin=a.color_temp_kelvin;
   else if(a.xy_color)d.xy_color=a.xy_color;
   else if(a.hs_color)d.hs_color=a.hs_color;
   out.push(["light","turn_on",d]);
  });
  return out;
 },
 active:function(h,id){
  var nm=h.states[id]&&h.states[id].attributes.name,e=h.entities[id];
  if(!nm||!e||(e.platform!=="hue"&&e.platform!=="hue_plus")||!e.device_id)return false;
  return Object.keys(h.states).some(function(k){
   var se=h.entities[k];
   return k.indexOf("select.")===0&&se&&se.platform===e.platform&&se.device_id===e.device_id&&(h.states[k].attributes.options||[]).indexOf(nm)>=0&&h.states[k].state===nm;
  });
 }
};

/* The Hue live scenes of the home: the ones that can be imported, by room. */
function hueLiveScenes() {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      return HUESCENES.isHue(h, id) && A(id).is_dynamic !== false;
    })
    .sort(function (x, y) {
      return (
        String(A(x).group_name || "").localeCompare(String(A(y).group_name || "")) ||
        String(A(x).name || x).localeCompare(String(A(y).name || y))
      );
    });
}

/* The Hue static scenes of the home (the bridge says a scene does not play by itself): the ones that can be imported as classic scenes, by room. */
function hueStaticScenes() {
  var h = H();
  return Object.keys(h.states)
    .filter(function (id) {
      return HUESCENES.isHue(h, id) && A(id).is_dynamic === false;
    })
    .sort(function (x, y) {
      return (
        String(A(x).group_name || "").localeCompare(String(A(y).group_name || "")) ||
        String(A(x).name || x).localeCompare(String(A(y).name || y))
      );
    });
}

/* Reading a Hue scene from the bridge, to import it, is a service of Hue Plus. */
function hueImportable() {
  var s = H().services;
  return !!(s && s.hue_plus && s.hue_plus.import_hue_scene);
}

/* The colours of a Hue scene, read once from the bridge, as CSS colours for the light panel's scene tiles. */
var LP_SCENEPAL = {};

function hueScenePalette(id, done) {
  if (LP_SCENEPAL[id]) return done(LP_SCENEPAL[id]);
  if (!hueImportable()) return;
  serviceResponse("hue_plus", "import_hue_scene", { entity_id: id })
    .then(function (r) {
      if (!r || !r.palette || !r.palette.length) return;
      LP_SCENEPAL[id] = r.palette.map(function (c) {
        return cssRgb(c.k ? kelvinRgb(c.k) : liveXyRgb(c.xy[0], c.xy[1]));
      });
      done(LP_SCENEPAL[id]);
    })
    .catch(function () {});
}

/* Speed and brightness a Hue scene is started with, kept on this device. */
function hueSceneSet(id) {
  var s = deviceGet("db_hsc_" + id, {});
  return {
    speed: typeof s.speed === "number" ? s.speed : Math.round((A(id).speed || 0.5) * 100),
    bri: typeof s.bri === "number" ? s.bri : Math.round((A(id).brightness || 255) / 2.55),
  };
}

function hueSceneSave(id, st) {
  deviceSet("db_hsc_" + id, st);
}

/* The room's Hue group light of the scene that was frozen last, so the Freeze button can show it. */
var HFROZEN = {};

/* Starts the scene live with the saved speed, keeping the brightness the room has now. */
function hueSceneStart(id) {
  var st = hueSceneSet(id),
    grp = HUESCENES.group(H(), id),
    bri = grp && V_(grp) === "on" ? (A(grp).brightness || 0) / 2.55 : st.bri;
  if (grp) {
    delete HFROZEN[grp];
    liveStopOn([grp]);
  }
  var c = HUESCENES.start(H(), id, st.speed, Math.max(1, bri) * 2.55);
  call(c[0], c[1], c[2]);
}

/* Freezes the scene where it is: the lights keep the colours they show now. */
function hueSceneFreeze(id) {
  var grp = HUESCENES.group(H(), id);
  if (!grp || V_(grp) !== "on") return;
  HUESCENES.freeze(H(), grp).forEach(function (c) {
    call(c[0], c[1], c[2]);
  });
  HFROZEN[grp] = id;
}

/* A static scene is switched on as a classic scene is: it sets its lights, with no speed. */
function hueSceneToggle(id) {
  var grp = HUESCENES.group(H(), id);
  if (HUESCENES.active(H(), id)) {
    if (grp) call("light", "turn_off", { entity_id: grp });
  } else if (A(id).is_dynamic === false) call("scene", "turn_on", { entity_id: id });
  else hueSceneStart(id);
}

/* The popup of a Hue scene. A static scene has only what a classic scene has (importing it as one, hiding it); a live one has: brightness (follows the room live), speed (starts the scene again at the new speed), play (live) and freeze (a still picture). */
function hueScenePopup(b, id, room) {
  var P = HUESCENES,
    stat = A(id).is_dynamic === false;
  function grp() {
    return P.group(H(), id);
  }
  function playing() {
    return P.active(H(), id) && P.playing(H(), grp());
  }
  function live() {
    var g = grp();
    return P.active(H(), id) && !!g && V_(g) === "on";
  }
  if (!stat) {
    b.appendChild(
      sliderRow({
        icon: "bright",
        name: _T("brightness"),
        min: 1,
        max: 100,
        step: 1,
        get: function () {
          var g = grp();
          return g && V_(g) === "on" ? Math.max(1, Math.round((A(g).brightness || 0) / 2.55)) : hueSceneSet(id).bri;
        },
        fmt: function (v) {
          return v + "%";
        },
        on: function () {
          return P.active(H(), id);
        },
        live: function (v) {
          if (live()) callLive(grp(), "light", "turn_on", { entity_id: grp(), brightness_pct: v });
        },
        commit: function (v) {
          var st = hueSceneSet(id);
          st.bri = v;
          hueSceneSave(id, st);
          if (live()) call("light", "turn_on", { entity_id: grp(), brightness_pct: v });
        },
      })
    );
    b.appendChild(
      sliderRow({
        icon: "tune",
        name: _T("speed"),
        min: 1,
        max: P.speedSteps,
        step: 1,
        get: function () {
          return P.speedToStep(hueSceneSet(id).speed);
        },
        fmt: function (v) {
          return v + " / " + P.speedSteps;
        },
        on: function () {
          return P.active(H(), id);
        },
        commit: function (v) {
          var st = hueSceneSet(id);
          st.speed = P.stepToSpeed(v);
          hueSceneSave(id, st);
          if (playing()) hueSceneStart(id);
        },
      })
    );
    var g2 = mk("div", "gridl g2");
    g2.appendChild(
      pill("play", _T("play"), {
        on: playing,
        tap: function () {
          hueSceneStart(id);
        },
      })
    );
    g2.appendChild(
      pill("pause", _T("freeze"), {
        on: function () {
          var g = grp();
          return !!g && HFROZEN[g] === id && V_(g) === "on" && !P.playing(H(), g);
        },
        tap: function () {
          hueSceneFreeze(id);
        },
      })
    );
    b.appendChild(g2);
  }
  if (isAdmin() && hueImportable())
    b.appendChild(
      pill(stat ? "scene" : "palette", _T(stat ? "import_as_a_classic_scene" : "import_as_a_live_scene"), {
        sub: function () {
          return _T(stat ? "a_copy_you_can_edit_with_the_lights_as_it_sets_them" : "a_copy_you_can_edit_and_place_on_your_lights");
        },
        tap: function () {
          importLiveScene(stat ? "hue-classic" : "hue", id);
        },
      })
    );
  if (isEditing() && room)
    b.appendChild(
      pill("eye", sceneEntHidden(room, id) ? _T("show_this_scene") : _T("hide_this_scene"), {
        sub: function () {
          return sceneEntHidden(room, id) ? _T("hidden") : _T("visible");
        },
        tap: function () {
          sceneEntSetHidden(room, id, !sceneEntHidden(room, id));
          closeSheet();
        },
      })
    );
}
