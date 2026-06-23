import { TIME_SIG } from '../config/constants.js';

/**
 * TimeSignatureWheel — a bottom-sheet editor with two sliders: the numerator
 * (beats per bar, 1–16) and the denominator (beat note value: 1/2/4/8). The
 * denominator is label-only and does not affect click timing.
 */
export class TimeSignatureWheel {
  constructor(stateManager, elements) {
    this.state   = stateManager;
    this.btn     = elements.timeSigBtn;
    this.valueEl = elements.timeSigValue;
    this.picker  = elements.timeSigPicker;
    this.editor  = elements.timeSigOptions;
    this.dens    = TIME_SIG.DENOMINATORS;

    this.render();
    this.bindEvents();
    this.state.subscribe('timeSignature', () => this.syncControls());
    this.state.subscribe('beatUnit',      () => this.syncControls());
    this.updateDisplay();
  }

  render() {
    this.editor.innerHTML = `
      <div class="timesig-fraction">
        <span class="ts-num">4</span>
        <span class="ts-slash">/</span>
        <span class="ts-den">4</span>
      </div>
      <div class="timesig-row">
        <span class="timesig-row-label">Beats</span>
        <div class="timesig-slider-wrap">
          <input type="range" class="timesig-slider ts-num-slider"
                 min="${TIME_SIG.NUM_MIN}" max="${TIME_SIG.NUM_MAX}" step="1">
          <div class="timesig-ticks ts-num-ticks"></div>
        </div>
      </div>
      <div class="timesig-row">
        <span class="timesig-row-label">Note value</span>
        <div class="timesig-slider-wrap">
          <input type="range" class="timesig-slider ts-den-slider"
                 min="0" max="${this.dens.length - 1}" step="1">
          <div class="timesig-ticks ts-den-ticks"></div>
        </div>
      </div>
      <button class="timesig-done">Done</button>
    `;

    this.numText   = this.editor.querySelector('.ts-num');
    this.denText   = this.editor.querySelector('.ts-den');
    this.numSlider = this.editor.querySelector('.ts-num-slider');
    this.denSlider = this.editor.querySelector('.ts-den-slider');
    this.doneBtn   = this.editor.querySelector('.timesig-done');

    // Tick marks: one per selectable position (16 beats, 4 note values).
    const fillTicks = (el, count) => {
      el.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const t = document.createElement('span');
        t.className = 'tick';
        el.appendChild(t);
      }
    };
    fillTicks(this.editor.querySelector('.ts-num-ticks'), TIME_SIG.NUM_MAX - TIME_SIG.NUM_MIN + 1);
    fillTicks(this.editor.querySelector('.ts-den-ticks'), this.dens.length);

    this.numSlider.addEventListener('input', () => {
      this.state.setTimeSignature(parseInt(this.numSlider.value, 10));
    });
    this.denSlider.addEventListener('input', () => {
      this.state.setBeatUnit(this.dens[parseInt(this.denSlider.value, 10)]);
    });
    this.doneBtn.addEventListener('click', () => this.close());
  }

  bindEvents() {
    this.btn.addEventListener('click', () => this.open());
    this.picker.addEventListener('click', e => {
      if (e.target === this.picker) this.close();
    });
  }

  open() {
    this.syncControls();
    this.picker.classList.add('open');
  }

  close() {
    this.picker.classList.remove('open');
  }

  // Push current state into the sliders + fraction display inside the sheet.
  syncControls() {
    const num = this.state.getTimeSignature();
    const den = this.state.getBeatUnit();
    if (this.numSlider) this.numSlider.value = num;
    if (this.denSlider) this.denSlider.value = Math.max(0, this.dens.indexOf(den));
    if (this.numText)   this.numText.textContent = num;
    if (this.denText)   this.denText.textContent = den;
    this.updateDisplay();
  }

  // Update the compact "N/D" value shown on the bottom selector button.
  updateDisplay() {
    if (this.valueEl) {
      this.valueEl.textContent = `${this.state.getTimeSignature()}/${this.state.getBeatUnit()}`;
    }
  }
}
