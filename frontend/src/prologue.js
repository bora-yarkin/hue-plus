/* Hue Plus in the dashboard: its pages in Settings (the bridge, lights, switches, MotionAware areas, entertainment areas, updates and more), the entertainment areas in the
 area editor, and the Hue effects page's data are Hue Plus's own, not the dashboard's (decision D-25). Home Control loads this file for administrators when Hue Plus is
 installed (`menu` in home_control.json) and it uses the dashboard only through `window.HomeControl` (the plugin API, version 1).
 Built by scripts/build_menu.py from custom_components/hue_plus/frontend/src; edit those files, not this one. */
(function () {
  var HC = window.HomeControl;
  if (!HC || HC.version !== 1) return; /* a dashboard that has no plugin API, or another version of it */

  /* The dashboard's functions, under the names the sources use. */
  var H = HC.hass,
    A = HC.attrs,
    V_ = HC.state,
    isOn = HC.isOn,
    reg = HC.registry,
    call = HC.call,
    callRaw = HC.callRaw,
    toggleEnt = HC.toggle,
    toast = HC.toast,
    refresh = HC.refresh,
    mk = HC.el,
    svg = HC.icon,
    pill = HC.row,
    cntS = HC.count,
    confirmDlg = HC.confirm,
    showPopup = HC.open,
    popBack = HC.back,
    closeLayer = HC.closeLayer,
    guardUnsaved = HC.guard,
    _T = HC.t,
    eaRoomLights = HC.areas.roomLights,
    eaClamp = HC.areas.clamp,
    eaIdentifyOff = HC.areas.identifyOff,
    attachSlide = HC.ui.attachSlide,
    briControl = HC.ui.briControl,
    callLive = HC.ui.callLive,
    cap = HC.ui.cap,
    closeSheet = HC.ui.closeSheet,
    cssRgb = HC.ui.cssRgb,
    cssToRgb = HC.ui.cssToRgb,
    deviceGet = HC.ui.deviceGet,
    deviceSet = HC.ui.deviceSet,
    dom = HC.ui.dom,
    dropRow = HC.ui.dropRow,
    ic = HC.ui.ic,
    inkRow = HC.ui.inkRow,
    kelvinRgb = HC.ui.kelvinRgb,
    lightMembers = HC.ui.lightMembers,
    liveStopOn = HC.ui.liveStopOn,
    liveXyRgb = HC.ui.liveXyRgb,
    pinPop = HC.ui.pinPop,
    pop = HC.ui.pop,
    sep = HC.ui.sep,
    sliderRow = HC.ui.sliderRow,
    switchPill = HC.ui.switchPill,
    roomById = HC.room,
    serviceResponse = HC.serviceResponse,
    sceneEntHidden = HC.scenes.hidden,
    sceneEntSetHidden = HC.scenes.setHidden,
    importLiveScene = HC.scenes.importFrom;

  /* What the dashboard keeps in variables is read when it is needed. */
  function isAdmin() {
    return HC.isAdmin;
  }
  function isEditing() {
    return HC.editing();
  }
  function pageFill() {
    return HC.ui.pageFill;
  }
  function currentSheet() {
    return HC.sheet;
  }
  function setPopGuard(value) {
    HC.popGuard = value;
  }
  function areaEditor() {
    return HC.areas.editor;
  }
  function rebuildArea() {
    HC.areas.rebuild();
  }
  function openArea(room, area, seed) {
    return HC.areas.open(room, area, seed);
  }
  function openExternalArea(plugin, draft, extra) {
    return HC.areas.openExternal(plugin, draft, extra);
  }
