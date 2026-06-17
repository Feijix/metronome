import { TIME_SIGNATURES } from '../config/constants.js';

/**
 * ControlPanel
 * Now only handles time signature controls
 * Gap pattern and subdivisions moved to dedicated components
 */
export class ControlPanel {
  constructor(stateManager, elements) {
    this.state = stateManager;
    this.elements = elements;

    this.bindEvents();
    this.subscribeToState();
  }

  bindEvents() {
    // Time signature controls
    if (this.elements.timeUp) {
      this.elements.timeUp.addEventListener('click', () => this.incrementTimeSignature());
    }
    if (this.elements.timeDown) {
      this.elements.timeDown.addEventListener('click', () => this.decrementTimeSignature());
    }
  }

  subscribeToState() {
    this.state.subscribe('timeSignature', (value) => this.updateTimeSignatureDisplay(value));
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

  updateTimeSignatureDisplay(value) {
    if (this.elements.timeSig) {
      this.elements.timeSig.textContent = `${value}/4`;
    }
  }
}
