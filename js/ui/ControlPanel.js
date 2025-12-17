import { TIME_SIGNATURES } from '../config/constants.js';

export class ControlPanel {
  constructor(stateManager, elements) {
    this.state = stateManager;
    this.elements = elements;

    this.bindEvents();
    this.subscribeToState();
  }

  bindEvents() {
    // Time signature
    this.elements.timeUp.addEventListener('click', () => this.incrementTimeSignature());
    this.elements.timeDown.addEventListener('click', () => this.decrementTimeSignature());

    // Gap pattern
    this.elements.clickUp.addEventListener('click', () => this.incrementClickBars());
    this.elements.clickDown.addEventListener('click', () => this.decrementClickBars());
    this.elements.gapUp.addEventListener('click', () => this.incrementGapBars());
    this.elements.gapDown.addEventListener('click', () => this.decrementGapBars());

    // Subdivisions
    this.elements.subdivisionPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const sub = parseInt(pill.dataset.sub);
        this.state.setSubdivision(sub);
      });
    });
  }

  subscribeToState() {
    this.state.subscribe('timeSignature', (value) => this.updateTimeSignatureDisplay(value));
    this.state.subscribe('clickBars', (value) => this.updateClickBarsDisplay(value));
    this.state.subscribe('gapBars', (value) => this.updateGapBarsDisplay(value));
    this.state.subscribe('subdivision', (value) => this.updateSubdivisionPills(value));
  }

  incrementTimeSignature() {
    const current = this.state.getTimeSignature();
    const currentIndex = TIME_SIGNATURES.indexOf(current);
    if (currentIndex < TIME_SIGNATURES.length - 1) {
      this.state.setTimeSignature(TIME_SIGNATURES[currentIndex + 1]);
    }
  }

  decrementTimeSignature() {
    const current = this.state.getTimeSignature();
    const currentIndex = TIME_SIGNATURES.indexOf(current);
    if (currentIndex > 0) {
      this.state.setTimeSignature(TIME_SIGNATURES[currentIndex - 1]);
    }
  }

  incrementClickBars() {
    const current = this.state.getClickBars();
    this.state.setClickBars(current + 1);
  }

  decrementClickBars() {
    const current = this.state.getClickBars();
    this.state.setClickBars(current - 1);
  }

  incrementGapBars() {
    const current = this.state.getGapBars();
    this.state.setGapBars(current + 1);
  }

  decrementGapBars() {
    const current = this.state.getGapBars();
    this.state.setGapBars(current - 1);
  }

  updateTimeSignatureDisplay(value) {
    this.elements.timeSig.textContent = `${value}/4`;
  }

  updateClickBarsDisplay(value) {
    this.elements.clickBars.textContent = value;
  }

  updateGapBarsDisplay(value) {
    this.elements.gapBars.textContent = value;
  }

  updateSubdivisionPills(value) {
    this.elements.subdivisionPills.forEach(pill => {
      const pillValue = parseInt(pill.dataset.sub);
      pill.classList.toggle('active', pillValue === value);
    });
  }
}
