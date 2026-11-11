import { SOUND_TYPES, DEFAULT_SOUND } from '../config/constants.js';

export class PresetManager {
  constructor(stateManager) {
    this.state = stateManager;
  }

  savePreset(name) {
    const currentState = this.state.getState();
    localStorage.setItem(`preset:${name}`, JSON.stringify(currentState));
  }

  // Maps old numeric subdivision values (pre-refactor) to new string IDs
  static migrateSubdivision(value) {
    const legacy = { 1: 'q', 2: '8', 3: '8t', 4: '16', 6: '16t', 8: '32', 12: '32' };
    return legacy[value] ?? value;
  }

  loadPreset(name) {
    const presetData = localStorage.getItem(`preset:${name}`);
    if (!presetData) return false;
    let cfg;
    try {
      cfg = JSON.parse(presetData).config;
    } catch (e) {
      console.warn(`Preset "${name}" is unreadable`, e);
      return false;
    }
    if (!cfg || typeof cfg !== 'object') return false;

    // Apply each field independently: one bad or missing value (e.g. from an
    // old version) must not abort the load halfway and leave settings mixed.
    const apply = (label, fn) => {
      try { fn(); } catch (e) { console.warn(`Preset "${name}": skipped ${label}`, e); }
    };
    apply('bpm', () => this.state.setBPM(cfg.bpm));
    apply('timeSignature', () => this.state.setTimeSignature(cfg.timeSignature));
    apply('beatUnit', () => { if (cfg.beatUnit) this.state.setBeatUnit(cfg.beatUnit); });
    apply('subdivision', () => this.state.setSubdivision(PresetManager.migrateSubdivision(cfg.subdivision)));
    // Old presets stored clickBars (+ gapBars); a phrase is click + gap.
    apply('phraseBars', () => this.state.setPhraseBars(cfg.phraseBars ?? ((cfg.clickBars | 0) + (cfg.gapBars | 0))));
    apply('gapBars', () => this.state.setGapBars(cfg.gapBars));
    apply('beatMutes', () => this.state.setBeatMutes(cfg.beatMutes || []));
    apply('accents', () => {
      if (typeof cfg.accentOne === 'boolean' && this.state.getAccentOne() !== cfg.accentOne) {
        this.state.toggleAccentOne();
      }
      if (typeof cfg.accentQuarters === 'boolean' && this.state.getAccentQuarters() !== cfg.accentQuarters) {
        this.state.toggleAccentQuarters();
      }
    });
    apply('soundType', () => this.state.setSoundType(
      SOUND_TYPES.includes(cfg.soundType) ? cfg.soundType : DEFAULT_SOUND));
    apply('vibrate', () => this.state.setVibrate(cfg.vibrate ?? true));
    apply('voiceCount', () => { if (typeof cfg.voiceCount === 'boolean') this.state.setVoiceCount(cfg.voiceCount); });
    apply('flashOnChange', () => this.state.setFlashOnChange(cfg.flashOnChange || false));
    apply('keepAwake', () => this.state.setKeepAwake(cfg.keepAwake || false));
    return true;
  }

  deletePreset(name) {
    localStorage.removeItem(`preset:${name}`);
  }

  getPresetNames() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('preset:'))
      .map(key => key.replace(/^preset:/, ''));
  }
}
