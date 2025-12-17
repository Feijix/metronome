import {
  BPM_CONSTANTS,
  TIME_SIGNATURES,
  SUBDIVISIONS,
  GAP_PATTERN_LIMITS,
  DEFAULT_STATE
} from '../config/constants.js';

export class StateManager {
  constructor() {
    // Configuration state
    this.config = { ...DEFAULT_STATE };

    // Runtime state
    this.runtime = {
      currentBeat: 0,
      currentSubBeat: 0,
      currentBar: 1,
      isGapMode: false,
      barsInCurrentMode: 0,
      isPlaying: false
    };

    // Observers for state changes
    this.observers = new Map();
  }

  // BPM Management with validation
  setBPM(value) {
    const validated = Math.max(
      BPM_CONSTANTS.MIN,
      Math.min(BPM_CONSTANTS.MAX, Math.round(value))
    );
    if (this.config.bpm !== validated) {
      this.config.bpm = validated;
      this.notify('bpm', validated);
    }
    return validated;
  }

  getBPM() {
    return this.config.bpm;
  }

  // Time Signature with validation
  setTimeSignature(value) {
    if (TIME_SIGNATURES.includes(value)) {
      this.config.timeSignature = value;
      this.notify('timeSignature', value);
    } else {
      throw new Error(`Invalid time signature: ${value}`);
    }
  }

  getTimeSignature() {
    return this.config.timeSignature;
  }

  // Subdivision with validation
  setSubdivision(value) {
    if (SUBDIVISIONS.includes(value)) {
      this.config.subdivision = value;
      this.notify('subdivision', value);
    } else {
      throw new Error(`Invalid subdivision: ${value}`);
    }
  }

  getSubdivision() {
    return this.config.subdivision;
  }

  // Gap pattern controls with validation
  setClickBars(value) {
    const validated = Math.max(
      GAP_PATTERN_LIMITS.CLICK_MIN,
      Math.min(GAP_PATTERN_LIMITS.CLICK_MAX, value)
    );
    this.config.clickBars = validated;
    this.notify('clickBars', validated);
    return validated;
  }

  getClickBars() {
    return this.config.clickBars;
  }

  setGapBars(value) {
    const validated = Math.max(
      GAP_PATTERN_LIMITS.GAP_MIN,
      Math.min(GAP_PATTERN_LIMITS.GAP_MAX, value)
    );
    this.config.gapBars = validated;
    this.notify('gapBars', validated);
    return validated;
  }

  getGapBars() {
    return this.config.gapBars;
  }

  // Accent toggles
  toggleAccentOne() {
    this.config.accentOne = !this.config.accentOne;
    this.notify('accentOne', this.config.accentOne);
    return this.config.accentOne;
  }

  getAccentOne() {
    return this.config.accentOne;
  }

  toggleAccentQuarters() {
    this.config.accentQuarters = !this.config.accentQuarters;
    this.notify('accentQuarters', this.config.accentQuarters);
    return this.config.accentQuarters;
  }

  getAccentQuarters() {
    return this.config.accentQuarters;
  }

  // Runtime state management
  resetRuntime() {
    this.runtime = {
      currentBeat: 0,
      currentSubBeat: 0,
      currentBar: 1,
      isGapMode: false,
      barsInCurrentMode: 0,
      isPlaying: false
    };
    this.notify('runtime', this.runtime);
  }

  advanceSubBeat() {
    this.runtime.currentSubBeat++;
    if (this.runtime.currentSubBeat >= this.config.subdivision) {
      this.runtime.currentSubBeat = 0;
      this.advanceBeat();
    }
  }

  advanceBeat() {
    this.runtime.currentBeat++;
    if (this.runtime.currentBeat >= this.config.timeSignature) {
      this.runtime.currentBeat = 0;
      this.advanceBar();
    }
  }

  advanceBar() {
    this.runtime.barsInCurrentMode++;
    const targetBars = this.runtime.isGapMode
      ? this.config.gapBars
      : this.config.clickBars;

    if (this.runtime.barsInCurrentMode >= targetBars) {
      this.runtime.barsInCurrentMode = 0;
      this.runtime.isGapMode = !this.runtime.isGapMode;
      this.notify('modeSwitch', this.runtime.isGapMode);
    }
  }

  setPlaying(isPlaying) {
    this.runtime.isPlaying = isPlaying;
    this.notify('playState', isPlaying);
  }

  isPlaying() {
    return this.runtime.isPlaying;
  }

  // Observer pattern for UI updates
  subscribe(event, callback) {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }
    this.observers.get(event).push(callback);
  }

  unsubscribe(event, callback) {
    if (this.observers.has(event)) {
      const callbacks = this.observers.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notify(event, data) {
    if (this.observers.has(event)) {
      this.observers.get(event).forEach(callback => callback(data));
    }
  }

  // Export state for debugging
  getState() {
    return {
      config: { ...this.config },
      runtime: { ...this.runtime }
    };
  }
}
