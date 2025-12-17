import { BPM_CONSTANTS } from '../config/constants.js';

export class BPMDisplay {
  constructor(stateManager, elements) {
    this.state = stateManager;
    this.elements = elements;
    this.longPressInterval = null;

    this.bindEvents();
    this.subscribeToState();
  }

  bindEvents() {
    // Simple increment/decrement
    this.elements.bpmUp.addEventListener('click', () => this.increment());
    this.elements.bpmDown.addEventListener('click', () => this.decrement());

    // Long press for continuous change
    this.elements.bpmUp.addEventListener('mousedown', () => this.startContinuous(1));
    this.elements.bpmDown.addEventListener('mousedown', () => this.startContinuous(-1));
    document.addEventListener('mouseup', () => this.stopContinuous());
  }

  subscribeToState() {
    this.state.subscribe('bpm', (value) => this.updateDisplay(value));
  }

  increment() {
    const current = this.state.getBPM();
    this.state.setBPM(current + 1);
  }

  decrement() {
    const current = this.state.getBPM();
    this.state.setBPM(current - 1);
  }

  startContinuous(direction) {
    this.longPressInterval = setInterval(() => {
      const current = this.state.getBPM();
      this.state.setBPM(current + direction);
    }, BPM_CONSTANTS.LONG_PRESS_INTERVAL);
  }

  stopContinuous() {
    if (this.longPressInterval) {
      clearInterval(this.longPressInterval);
      this.longPressInterval = null;
    }
  }

  updateDisplay(value) {
    this.elements.bpmDisplay.textContent = value;
  }

  destroy() {
    this.stopContinuous();
  }
}
