/**
 * NativeBridge
 * Thin wrapper over the app's local Capacitor plugin ("MetronomeNative").
 * The web code isn't bundled with @capacitor/core, so we call the bridge
 * that Capacitor injects into the WebView directly. Everything is a no-op
 * (resolves false) when running as a plain web page / PWA.
 */
const PLUGIN = 'MetronomeNative';

function cap() {
  return typeof window !== 'undefined' ? window.Capacitor : undefined;
}

export const NativeBridge = {
  isAvailable() {
    const c = cap();
    if (!c || typeof c.nativePromise !== 'function') return false;
    if (typeof c.isNativePlatform === 'function' && !c.isNativePlatform()) return false;
    const headers = c.PluginHeaders;
    return Array.isArray(headers) ? headers.some(h => h.name === PLUGIN) : false;
  },

  async call(method, options = {}) {
    if (!this.isAvailable()) return false;
    try {
      await cap().nativePromise(PLUGIN, method, options);
      return true;
    } catch (err) {
      console.warn(`${PLUGIN}.${method} failed:`, err);
      return false;
    }
  }
};
