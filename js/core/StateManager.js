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
      barInPhrase: 0,      // 0-based bar position within the phrase
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
      if (raw) {
        const saved = JSON.parse(raw);
        // Migrate BEFORE merging defaults (DEFAULT_STATE has a phraseBars, which
        // would otherwise hide that this save predates phrases).
        if (saved.phraseBars == null && saved.clickBars != null) {
          saved.phraseBars = (saved.clickBars | 0) + (saved.gapBars | 0);
        }
        this.config = { ...DEFAULT_STATE, ...saved };
      }
    } catch(e) {}
    this.sanitizeConfig();
  }

  // Repair values from older/invalid saves so the UI and audio stay consistent.
  sanitizeConfig() {
    // Migration: 'drumstick' was renamed to 'clave' (same sample).
    if (this.config.soundType === 'drumstick') this.config.soundType = 'clave';
    if (!SOUND_TYPES.includes(this.config.soundType)) {
      this.config.soundType = DEFAULT_SOUND;
    }
    if (!TIME_SIG.DENOMINATORS.includes(this.config.beatUnit)) {
      this.config.beatUnit = TIME_SIG.DEFAULT_DEN;
    }
    const num = Math.round(Number(this.config.timeSignature));
    this.config.timeSignature = Number.isFinite(num) && num > 0
      ? Math.min(TIME_SIG.NUM_MAX, num)
      : TIME_SIG.DEFAULT_NUM;
    const bpm = Math.round(Number(this.config.bpm));
    this.config.bpm = Number.isFinite(bpm)
      ? Math.max(BPM_CONSTANTS.MIN, Math.min(BPM_CONSTANTS.MAX, bpm))
      : BPM_CONSTANTS.DEFAULT;
    if (!SUBDIVISION_MAP[this.config.subdivision]) this.config.subdivision = DEFAULT_STATE.subdivision;
    for (const k of ['accentOne', 'accentQuarters']) {
      if (typeof this.config[k] !== 'boolean') this.config[k] = DEFAULT_STATE[k];
    }
    if (typeof this.config.vibrate !== 'boolean') this.config.vibrate = true;
    if (typeof this.config.voiceCount !== 'boolean') this.config.voiceCount = false;
    // Migration: the old model was "clickBars then gapBars"; a phrase is now
    // the whole cycle, so phrase = click + gap (same rhythm as before).
    if (this.config.phraseBars == null && this.config.clickBars != null) {
      this.config.phraseBars = (this.config.clickBars | 0) + (this.config.gapBars | 0);
    }
    delete this.config.clickBars;
    this.config.phraseBars = this.clampPhrase(this.config.phraseBars);
    this.config.gapBars = this.clampGap(this.config.gapBars, this.config.phraseBars);
    this.ensureBeatMutesLength();
  }

  // BPM Management with validation
  setBPM(value) {
    // Ignore non-numbers (a missing preset field, NaN): NaN would survive the
    // clamp below and silence the scheduler.
    if (!Number.isFinite(Number(value))) return this.config.bpm;
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
    // NaN would mean the bar never ends (currentBeat >= NaN is always false).
    if (!Number.isFinite(Number(value))) return this.config.timeSignature;
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

  // Time signature denominator (beat note value). Sets the beat length relative
  // to the quarter-note BPM (see beatSeconds). Must be one of TIME_SIG.DENOMINATORS.
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

  // Spoken bar-count on/off — announces the click-bar number at each bar start.
  setVoiceCount(value) {
    this.config.voiceCount = !!value;
    this.notify('voiceCount', this.config.voiceCount);
    this.saveToStorage();
  }

  getVoiceCount() {
    return this.config.voiceCount;
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

  // ── Phrase / gap ─────────────────────────────────────────────────────────
  // A phrase is `phraseBars` long; its last `gapBars` bars are silent.
  clampPhrase(v) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return GAP_PATTERN_LIMITS.PHRASE_DEFAULT;
    return Math.max(GAP_PATTERN_LIMITS.PHRASE_MIN, Math.min(GAP_PATTERN_LIMITS.PHRASE_MAX, n));
  }

  clampGap(v, phrase = this.config.phraseBars) {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) return Math.min(GAP_PATTERN_LIMITS.GAP_DEFAULT, phrase - 1);
    return Math.max(GAP_PATTERN_LIMITS.GAP_MIN, Math.min(phrase - 1, n));
  }

  setPhraseBars(value) {
    const validated = this.clampPhrase(value);
    this.config.phraseBars = validated;
    this.notify('phraseBars', validated);
    // Keep at least one click bar: shrink the gap if it no longer fits.
    if (this.config.gapBars > validated - 1) {
      this.config.gapBars = validated - 1;
      this.notify('gapBars', this.config.gapBars);
    }
    this.saveToStorage();
    return validated;
  }

  getPhraseBars() {
    return this.config.phraseBars;
  }

  setGapBars(value) {
    const validated = this.clampGap(value);
    this.config.gapBars = validated;
    this.notify('gapBars', validated);
    this.saveToStorage();
    return validated;
  }

  getGapBars() {
    return this.config.gapBars;
  }

  /** Number of sounding bars per phrase. */
  getClickBars() {
    return this.config.phraseBars - this.config.gapBars;
  }

  /** Whether bar `index` (0-based within the phrase) is a gap bar. */
  isGapBar(index) {
    return index >= this.config.phraseBars - this.config.gapBars;
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
      barInPhrase: 0,      // 0-based bar position within the phrase
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
    const phrase = this.config.phraseBars;
    // Wrap at the phrase end (also if the phrase was shortened mid-play).
    this.runtime.barInPhrase = (this.runtime.barInPhrase + 1) % phrase;
    const isGap = this.isGapBar(this.runtime.barInPhrase);
    if (isGap !== this.runtime.isGapMode) {
      this.runtime.isGapMode = isGap;
      this.notify('modeSwitch', isGap);
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
