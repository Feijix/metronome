import { TIME_SIGNATURES } from '../config/constants.js';

export class TimeSignatureWheel {
  constructor(stateManager, elements) {
    this.state = stateManager;
    this.btn    = elements.timeSigBtn;
    this.valueEl = elements.timeSigValue;
    this.picker  = elements.timeSigPicker;
    this.optionsEl = elements.timeSigOptions;

    this.render();
    this.bindEvents();
    this.state.subscribe('timeSignature', v => this.updateDisplay(v));
    this.updateDisplay(this.state.getTimeSignature());
  }

  render() {
    this.optionsEl.innerHTML = '';
    TIME_SIGNATURES.forEach(sig => {
      const btn = document.createElement('button');
      btn.className = 'picker-option';
      btn.dataset.value = sig;
      btn.textContent = `${sig}/4`;
      btn.addEventListener('click', () => {
        this.state.setTimeSignature(sig);
        this.close();
      });
      this.optionsEl.appendChild(btn);
    });
  }

  bindEvents() {
    this.btn.addEventListener('click', () => this.open());
    this.picker.addEventListener('click', e => {
      if (e.target === this.picker) this.close();
    });
  }

  open() {
    this.picker.classList.add('open');
    this.updateOptionHighlight(this.state.getTimeSignature());
  }

  close() {
    this.picker.classList.remove('open');
  }

  updateOptionHighlight(value) {
    this.optionsEl.querySelectorAll('.picker-option').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.value) === value);
    });
  }

  updateDisplay(value) {
    if (this.valueEl) this.valueEl.textContent = `${value}/4`;
    this.updateOptionHighlight(value);
  }
}
