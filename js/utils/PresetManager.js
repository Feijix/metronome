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

      this.state.setBPM(stateData.config.bpm);
      this.state.setTimeSignature(stateData.config.timeSignature);
      this.state.setSubdivision(PresetManager.migrateSubdivision(stateData.config.subdivision));
      this.state.setClickBars(stateData.config.clickBars);
      this.state.setGapBars(stateData.config.gapBars);

      if (this.state.getAccentOne() !== stateData.config.accentOne) {
        this.state.toggleAccentOne();
      }
      if (this.state.getAccentQuarters() !== stateData.config.accentQuarters) {
        this.state.toggleAccentQuarters();
      }

      this.state.setSoundType(stateData.config.soundType || 'clave');
      this.state.setFlashOnChange(stateData.config.flashOnChange || false);
      this.state.setKeepAwake(stateData.config.keepAwake || false);
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
