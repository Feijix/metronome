import {
  BPM_CONSTANTS,
  TIME_SIGNATURES,
  SUBDIVISIONS,
  SUBDIVISION_MAP,
  GAP_PATTERN_LIMITS,
  SOUND_TYPES,
  DEFAULT_STATE
} from '../config/constants.js';

export class StateManager {
  constructor() {
    // Configuration state
    this.config = { ...DEFAULT_STATE };
    this.loadFromStorage();

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

  saveToStorage() {
    try { localStorage.setItem('gm-config', JSON.stringify(this.config)); } catch(e) {}
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem('gm-config');
      if (raw) this.config = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch(e) {}
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
      this.saveToStorage();
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
      this.saveToStorage();
    } else {
      throw new Error(`Invalid time signature: ${value}`);
    }
  }

  getTimeSignature() {
    return this.config.timeSignature;
  }

  // Subdivision with validation
  setSubdivision(id) {
    if (SUBDIVISION_MAP[id]) {
      this.config.subdivision = id;
      this.notify('subdivision', id);
      this.saveToStorage();
    } else {
      throw new Error(`Invalid subdivision: ${id}`);
    }
  }

  getSubdivision() {
    return this.config.subdivision;
  }

  getSubdivisionDef() {
    return SUBDIVISION_MAP[this.config.subdivision] || SUBDIVISIONS[0];
  }

  // Gap pattern controls with validation
  setClickBars(value) {
    const validated = Math.max(
      GAP_PATTERN_LIMITS.CLICK_MIN,
      Math.min(GAP_PATTERN_LIMITS.CLICK_MAX, value)
    );
    this.config.clickBars = validated;
    this.notify('clickBars', validated);
    this.saveToStorage();
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
    this.saveToStorage();
    return validated;
  }

  getGapBars() {
    return this.config.gapBars;
  }

  // Accent toggles
  toggleAccentOne() {
    this.config.accentOne = !this.config.accentOne;
    this.notify('accentOne', this.config.accentOne);
    this.saveToStorage();
    return this.config.accentOne;
  }

  getAccentOne() {
    return this.config.accentOne;
  }

  toggleAccentQuarters() {
    this.config.accentQuarters = !this.config.accentQuarters;
    this.notify('accentQuarters', this.config.accentQuarters);
    this.saveToStorage();
    return this.config.accentQuarters;
  }

  getAccentQuarters() {
    return this.config.accentQuarters;
  }

  // Sound type selection with validation
  setSoundType(value) {
    if (SOUND_TYPES.includes(value)) {
      this.config.soundType = value;
      this.notify('soundType', value);
      this.saveToStorage();
    } else {
      throw new Error(`Invalid sound type: ${value}`);
    }
  }

  getSoundType() {
    return this.config.soundType;
  }

  // Flash on pattern change toggle
  setFlashOnChange(value) {
    this.config.flashOnChange = value;
    this.notify('flashOnChange', value);
    this.saveToStorage();
  }

  getFlashOnChange() {
    return this.config.flashOnChange;
  }

  // Keep screen awake toggle
  setKeepAwake(value) {
    this.config.keepAwake = value;
    this.notify('keepAwake', value);
    this.saveToStorage();
  }

  getKeepAwake() {
    return this.config.keepAwake;
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
    if (this.runtime.currentSubBeat >= this.getSubdivisionDef().resolution) {
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

      // If switching to gap mode but gapBars is 0, immediately switch back to click mode
      if (this.runtime.isGapMode && this.config.gapBars === 0) {
        this.runtime.isGapMode = false;
      }

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
