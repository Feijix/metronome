export class BeatsVisualizer {
  constructor(stateManager, container, barDisplayElement, barTotalElement, modeDisplayElement) {
    this.state = stateManager;
    this.container = container;
    this.barDisplayElement = barDisplayElement;
    this.barTotalElement = barTotalElement;
    this.modeDisplayElement = modeDisplayElement;
    this.beatElements = [];

    this.subscribeToState();
  }

  subscribeToState() {
    this.state.subscribe('timeSignature', () => this.rebuild());
    this.state.subscribe('beatTick', (data) => this.highlightBeat(data));
    this.state.subscribe('playState', (isPlaying) => {
      if (!isPlaying) this.clearHighlights();
    });
    this.state.subscribe('modeSwitch', () => this.updateModeDisplay());
    this.state.subscribe('clickBars', () => this.updateBarTotal());
    this.state.subscribe('gapBars', () => this.updateBarTotal());
  }

  rebuild() {
    const timeSignature = this.state.getState().config.timeSignature;
    this.container.innerHTML = '';
    this.beatElements = [];

    for (let i = 0; i < timeSignature; i++) {
      const beat = this.createBeatElement(i);
      this.container.appendChild(beat);
      this.beatElements.push(beat);
    }
  }

  createBeatElement(index) {
    const beat = document.createElement('div');
    beat.className = 'beat' + (index === 0 ? ' downbeat' : '');
    beat.dataset.beat = index;
    return beat;
  }

  highlightBeat(data) {
    const { beat, isGap } = data;

    this.beatElements.forEach((element, index) => {
      element.classList.remove('active', 'gap-mode');
      if (index === beat) {
        element.classList.add('active');
        if (isGap) {
          element.classList.add('gap-mode');
        }
      }
    });

    this.updateModeDisplay();
  }

  clearHighlights() {
    this.beatElements.forEach(element => {
      element.classList.remove('active', 'gap-mode');
    });
    this.updateModeDisplay();
  }

  updateModeDisplay() {
    const { runtime } = this.state.getState();
    this.modeDisplayElement.textContent = runtime.isGapMode ? 'GAP' : 'CLICK';
    this.modeDisplayElement.className = 'mode' + (runtime.isGapMode ? ' gap' : '');
    this.barDisplayElement.textContent = runtime.barsInCurrentMode + 1;
    this.updateBarTotal();
  }

  updateBarTotal() {
    const { config, runtime } = this.state.getState();
    const total = runtime.isGapMode ? config.gapBars : config.clickBars;
    this.barTotalElement.textContent = total;
  }

  init() {
    this.rebuild();
    this.updateModeDisplay();
  }
}
