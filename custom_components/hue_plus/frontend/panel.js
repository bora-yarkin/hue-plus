/* The Hue dashboard panel (Hue Plus, dashboard module): the element Home Assistant opens in the sidebar. It only waits for Home Assistant's `hass`
 and loads app.js, the application (built from frontend/app and frontend/src by scripts/build_menu.py), as a plain script next to this file.
 It is its own page (an iframe of Home Assistant's), separate from the Home Control dashboard. */
const BASE = new URL(".", import.meta.url);
const VERSION = new URL(import.meta.url).searchParams.get("v") || "";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = resolve;
    el.onerror = () => reject(new Error("Unable to load " + src));
    document.body.appendChild(el);
  });
}

class HuePlusPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._started = false;
  }

  set hass(value) {
    this._hass = value;
    if (window.HuePlusApp) window.HuePlusApp.attach(value);
    if (this.isConnected) this._start();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._start();
  }

  async _start() {
    if (this._started || !this._hass) return;
    this._started = true;
    try {
      const viewport = document.createElement("meta");
      viewport.name = "viewport";
      viewport.content = "width=device-width,initial-scale=1,viewport-fit=cover";
      document.head.appendChild(viewport);
      document.documentElement.lang = "en";
      await loadScript(new URL("app.js" + (VERSION ? "?v=" + VERSION : ""), BASE).href);
      window.HuePlusApp.mount(this, this._hass);
    } catch (e) {
      this.textContent = "The Hue dashboard could not start: " + e.message;
      console.error("[hue-plus]", e);
    }
  }
}

customElements.define("hue-plus-panel", HuePlusPanel);
