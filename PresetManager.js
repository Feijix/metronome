export class PresetManager {
  constructor(stateManager) {
    this.state = stateManager;
  }

  savePreset(name) {
    const currentState = this.state.getState();
    localStorage.setItem(`preset:${name}`, JSON.stringify(currentState));
  }

  loadPreset(name) {
    const presetData = localStorage.getItem(`preset:${name}`);
    if (presetData) {
      const stateData = JSON.parse(presetData);

      // Load basic configuration
      this.state.setBPM(stateData.config.bpm);
      this.state.setTimeSignature(stateData.config.timeSignature);
      this.state.setSubdivision(stateData.config.subdivision);
      this.state.setClickBars(stateData.config.clickBars);
      this.state.setGapBars(stateData.config.gapBars);

      // Load accent toggles (check current state first)
      if (this.state.getAccentOne() !== stateData.config.accentOne) {
        this.state.toggleAccentOne();
      }
      if (this.state.getAccentQuarters() !== stateData.config.accentQuarters) {
        this.state.toggleAccentQuarters();
      }

      // Load new properties with fallbacks for backward compatibility
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
