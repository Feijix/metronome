import { SUBDIVISIONS } from '../config/constants.js';
import { NoteRenderer } from '../utils/NoteRenderer.js';

export class SubdivisionControl {
  constructor(stateManager, elements) {
    this.state = stateManager;
    this.btn     = elements.subdivisionBtn;
    this.valueEl = elements.subdivisionValue;
    this.picker  = elements.subdivisionPicker;
    this.optionsEl = elements.subdivisionOptions;
    this.noteRenderer = new NoteRenderer();

    this.render();
    this.bindEvents();
    this.state.subscribe('subdivision', v => this.updateDisplay(v));
    this.updateDisplay(this.state.getSubdivision());
  }

  render() {
    this.optionsEl.innerHTML = '';
    SUBDIVISIONS.forEach(sub => {
      const btn = document.createElement('button');
      btn.className = 'picker-option';
      btn.dataset.value = sub.id;

      const img = document.createElement('img');
      img.src = this.noteRenderer.render(sub);
      img.alt = sub.label;
      img.className = 'picker-opt-img';

      btn.appendChild(img);
      btn.addEventListener('click', () => {
        this.state.setSubdivision(sub.id);
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
    this.updateOptionHighlight(this.state.getSubdivision());
  }

  close() {
    this.picker.classList.remove('open');
  }

  updateOptionHighlight(value) {
    this.optionsEl.querySelectorAll('.picker-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === value);
    });
  }

  updateDisplay(value) {
    const sub = SUBDIVISIONS.find(s => s.id === value);
    if (this.valueEl && sub) {
      const dataUrl = this.noteRenderer.render(sub);
      this.valueEl.innerHTML = `<img src="${dataUrl}" alt="${sub.label}" class="selector-note-img">`;
    }
    this.updateOptionHighlight(value);
  }
}
