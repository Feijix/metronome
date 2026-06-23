import {
  BPM_CONSTANTS,
  TIME_SIG,
  SUBDIVISIONS,
  SUBDIVISION_MAP,
  GAP_PATTERN_LIMITS,
  SOUND_TYPES,
  DEFAULT_SOUND,
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
    this.sanitizeConfig();
  }

  // Repair values from older/invalid saves so the UI and audio stay consistent.
  sanitizeConfig() {
    if (!SOUND_TYPES.includes(this.config.soundType)) {
      this.config.soundType = DEFAULT_SOUND;
    }
    if (!TIME_SIG.DENOMINATORS.includes(this.config.beatUnit)) {
      this.config.beatUnit = TIME_SIG.DEFAULT_DEN;
    }
    const n = Math.max(TIME_SIG.NUM_MIN, Math.min(TIME_SIG.NUM_MAX, this.config.timeSignature | 0));
    this.config.timeSignature = n || TIME_SIG.DEFAULT_NUM;
    if (typeof this.config.vibrate !== 'boolean') this.config.vibrate = true;
    this.ensureBeatMutesLength();
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

  // Time signature numerator (beats per bar). Clamped to [NUM_MIN, NUM_MAX].
  setTimeSignature(value) {
    const v = Math.max(TIME_SIG.NUM_MIN, Math.min(TIME_SIG.NUM_MAX, Math.round(value)));
    if (this.config.timeSignature !== v) {
      this.config.timeSignature = v;
      this.ensureBeatMutesLength();
      this.notify('timeSignature', v);
      this.saveToStorage();
    }
    return v;
  }

  getTimeSignature() {
    return this.config.timeSignature;
  }

  // Time signature denominator (beat note value). Label-only — does not affect
  // click timing. Must be one of TIME_SIG.DENOMINATORS.
  setBeatUnit(value) {
    if (TIME_SIG.DENOMINATORS.includes(value) && this.config.beatUnit !== value) {
      this.config.beatUnit = value;
      this.notify('beatUnit', value);
      this.saveToStorage();
    }
    return this.config.beatUnit;
  }

  getBeatUnit() {
    return this.config.beatUnit;
  }

  // ── Per-beat mute ────────────────────────────────────────────────────────
  // beatMutes[i] === true means beat i is silenced. Length tracks the numerator.
  ensureBeatMutesLength() {
    const n = this.config.timeSignature;
    let m = Array.isArray(this.config.beatMutes) ? this.config.beatMutes.slice(0, n) : [];
    while (m.length < n) m.push(false);
    this.config.beatMutes = m.map(Boolean);
  }

  getBeatMutes() {
    this.ensureBeatMutesLength();
    return this.config.beatMutes;
  }

  isBeatMuted(index) {
    return !!this.config.beatMutes[index];
  }

  setBeatMutes(arr) {
    this.config.beatMutes = Array.isArray(arr) ? arr.map(Boolean) : [];
    this.ensureBeatMutesLength();
    this.notify('beatMutes', this.config.beatMutes);
    this.saveToStorage();
  }

  toggleBeatMute(index) {
    this.ensureBeatMutesLength();
    if (index < 0 || index >= this.config.beatMutes.length) return;
    this.config.beatMutes[index] = !this.config.beatMutes[index];
    this.notify('beatMutes', this.config.beatMutes);
    this.saveToStorage();
    return this.config.beatMutes[index];
  }

  // Vibration (haptics) on/off — independent of the click sound.
  setVibrate(value) {
    this.config.vibrate = !!value;
    this.notify('vibrate', this.config.vibrate);
    this.saveToStorage();
  }

  getVibrate() {
    return this.config.vibrate;
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
