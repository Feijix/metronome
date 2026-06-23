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
    this.state.subscribe('beatMutes', () => this.applyMutes());
    this.state.subscribe('beatTick', (data) => this.highlightBeat(data));
    this.state.subscribe('playState', (isPlaying) => {
      if (!isPlaying) this.clearHighlights();
    });
    // clickBars/gapBars only matter while stopped; during playback beatTick
    // carries the correct snapshotted totals so we don't update live state here.
    this.state.subscribe('clickBars', () => { if (!this.state.isPlaying()) this.updateModeDisplay(); });
    this.state.subscribe('gapBars',   () => { if (!this.state.isPlaying()) this.updateModeDisplay(); });
  }

  rebuild() {
    const n = this.state.getState().config.timeSignature;
    this.container.innerHTML = '';
    this.beatElements = [];

    // Shrink dots + gap as the beat count grows so up to 16 fit in one row.
    const size = n <= 6 ? 48 : n <= 9 ? 38 : n <= 12 ? 30 : 22;
    const gap  = n <= 6 ? 12 : n <= 12 ? 8 : 5;
    this.container.style.gap = `${gap}px`;

    for (let i = 0; i < n; i++) {
      const beat = this.createBeatElement(i, size);
      this.container.appendChild(beat);
      this.beatElements.push(beat);
    }
  }

  createBeatElement(index, size) {
    const beat = document.createElement('div');
    beat.className = 'beat' + (index === 0 ? ' downbeat' : '');
    beat.dataset.beat = index;
    beat.style.width = beat.style.height = `${size}px`;
    if (this.state.isBeatMuted(index)) beat.classList.add('muted');
    // Tap a beat to silence it / re-enable its sound.
    beat.addEventListener('click', () => this.state.toggleBeatMute(index));
    return beat;
  }

  // Re-apply muted classes after a mute toggle (no full rebuild).
  applyMutes() {
    this.beatElements.forEach((el, i) => {
      el.classList.toggle('muted', this.state.isBeatMuted(i));
    });
  }

  highlightBeat(data) {
    const { beat, isGap, bar, barTotal } = data;

    // Only update dots when the beat index changes (not on every sub-beat)
    if (beat !== this._lastBeat || isGap !== this._lastIsGap) {
      this._lastBeat = beat;
      this._lastIsGap = isGap;
      this.beatElements.forEach((element, index) => {
        element.classList.remove('active', 'gap-mode');
        if (index === beat) {
          element.classList.add('active');
          if (isGap) element.classList.add('gap-mode');
        }
      });
    }

    // Only write to DOM when value actually changes to avoid repaint flicker
    const modeText = isGap ? 'GAP' : 'CLICK';
    if (this.modeDisplayElement.textContent !== modeText) {
      this.modeDisplayElement.textContent = modeText;
      this.modeDisplayElement.className = 'mode' + (isGap ? ' gap' : '');
    }
    if (this.barDisplayElement.textContent !== String(bar)) {
      this.barDisplayElement.textContent = bar;
    }
    if (this.barTotalElement.textContent !== String(barTotal)) {
      this.barTotalElement.textContent = barTotal;
    }
  }

  clearHighlights() {
    this._lastBeat = -1;
    this._lastIsGap = undefined;
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
