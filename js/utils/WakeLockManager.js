import { NativeBridge } from './NativeBridge.js';

/**
 * WakeLockManager
 * Keeps the screen awake while enabled.
 *  - In the Android app: native FLAG_KEEP_SCREEN_ON (the web Wake Lock API
 *    isn't reliable inside Android WebView). The flag only affects the
 *    screen timeout; the power button still turns the screen off.
 *  - In a browser / PWA: the Screen Wake Lock API. Browsers release that lock
 *    automatically whenever the page is hidden, so it is re-acquired when the
 *    page becomes visible again.
 */
export class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.enabled = false;
    this.native = NativeBridge.isAvailable();
    this.isSupported = this.native || (typeof navigator !== 'undefined' && 'wakeLock' in navigator);

    if (!this.native && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (this.enabled && document.visibilityState === 'visible' && !this.wakeLock) {
          this._requestWeb();
        }
      });
    }
  }

  /**
   * Turn keep-awake on.
   * @returns {Promise<boolean>} True if the screen will be kept awake
   */
  async request() {
    if (!this.isSupported) {
      console.warn('Wake Lock not supported on this platform');
      return false;
    }
    this.enabled = true;
    if (this.native) return NativeBridge.call('setKeepScreenOn', { enabled: true });
    // A hidden page can't take the lock yet; visibilitychange will retry.
    if (document.visibilityState !== 'visible') return true;
    return this._requestWeb();
  }

  async _requestWeb() {
    if (this.wakeLock) return true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      this.wakeLock = lock;
      lock.addEventListener('release', () => {
        if (this.wakeLock === lock) this.wakeLock = null;
      });
      // Disabled while the request was pending
      if (!this.enabled) await this.release();
      return true;
    } catch (err) {
      console.error('Wake lock request failed:', err);
      return false;
    }
  }

  /**
   * Turn keep-awake off.
   * @returns {Promise<void>}
   */
  async release() {
    this.enabled = false;
    if (this.native) {
      await NativeBridge.call('setKeepScreenOn', { enabled: false });
      return;
    }
    const lock = this.wakeLock;
    this.wakeLock = null;
    if (lock) {
      try {
        await lock.release();
      } catch (err) {
        console.error('Wake lock release failed:', err);
      }
    }
  }

  /**
   * Whether keep-awake is currently switched on
   * @returns {boolean}
   */
  isActive() {
    return this.enabled;
  }

  /**
   * @returns {boolean}
   */
  isAPISupported() {
    return this.isSupported;
  }
}
