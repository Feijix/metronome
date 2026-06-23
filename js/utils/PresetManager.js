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
    if (presetData) {
      const stateData = JSON.parse(presetData);

      const cfg = stateData.config;
      this.state.setBPM(cfg.bpm);
      this.state.setTimeSignature(cfg.timeSignature);
      if (cfg.beatUnit) this.state.setBeatUnit(cfg.beatUnit);
      this.state.setSubdivision(PresetManager.migrateSubdivision(cfg.subdivision));
      this.state.setClickBars(cfg.clickBars);
      this.state.setGapBars(cfg.gapBars);
      this.state.setBeatMutes(cfg.beatMutes || []);

      if (this.state.getAccentOne() !== cfg.accentOne) {
        this.state.toggleAccentOne();
      }
      if (this.state.getAccentQuarters() !== cfg.accentQuarters) {
        this.state.toggleAccentQuarters();
      }

      if (SOUND_TYPES.includes(cfg.soundType)) {
        this.state.setSoundType(cfg.soundType);
      } else {
        this.state.setSoundType(DEFAULT_SOUND);
      }
      this.state.setVibrate(cfg.vibrate ?? true);
      this.state.setFlashOnChange(cfg.flashOnChange || false);
      this.state.setKeepAwake(cfg.keepAwake || false);
    }
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
