/**
 * WakeLockManager
 * Manages screen wake lock using the Wake Lock API
 * Prevents screen from sleeping during metronome use
 */
export class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
  }

  /**
   * Request a wake lock to keep the screen awake
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async request() {
    if (!this.isSupported) {
      console.warn('Wake Lock API not supported in this browser');
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake lock acquired');

      // Handle wake lock release (e.g., when tab becomes inactive)
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake lock released');
      });

      return true;
    } catch (err) {
      // Wake lock request can fail for various reasons:
      // - User denied permission
      // - Battery is too low
      // - Document is not visible
      console.error('Wake lock request failed:', err);
      return false;
    }
  }

  /**
   * Release the wake lock
   * @returns {Promise<void>}
   */
  async release() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('Wake lock manually released');
      } catch (err) {
        console.error('Wake lock release failed:', err);
      }
    }
  }

  /**
   * Check if wake lock is currently active
   * @returns {boolean}
   */
  isActive() {
    return this.wakeLock !== null;
  }

  /**
   * Check if Wake Lock API is supported
   * @returns {boolean}
   */
  isAPISupported() {
    return this.isSupported;
  }
}
