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
      this.state.setBPM(stateData.config.bpm);
      this.state.setTimeSignature(stateData.config.timeSignature);
      this.state.setSubdivision(stateData.config.subdivision);
      this.state.setClickBars(stateData.config.clickBars);
      this.state.setGapBars(stateData.config.gapBars);
      this.state.toggleAccentOne(stateData.config.accentOne);
      this.state.toggleAccentQuarters(stateData.config.accentQuarters);
    }
  }

  getPresetNames() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('preset:'))
      .map(key => key.replace(/^preset:/, ''));
  }
}
