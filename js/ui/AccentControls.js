export class AccentControls {
  constructor(stateManager, elements) {
    this.state = stateManager;
    this.elements = elements;

    this.bindEvents();
    this.subscribeToState();
  }

  bindEvents() {
    this.elements.accentOne.addEventListener('click', () => {
      this.state.toggleAccentOne();
    });

    this.elements.accentQuarters.addEventListener('click', () => {
      this.state.toggleAccentQuarters();
    });
  }

  subscribeToState() {
    this.state.subscribe('accentOne', (value) => this.updateAccentOneDisplay(value));
    this.state.subscribe('accentQuarters', (value) => this.updateAccentQuartersDisplay(value));
  }

  updateAccentOneDisplay(isActive) {
    this.elements.accentOne.classList.toggle('active', isActive);
  }

  updateAccentQuartersDisplay(isActive) {
    this.elements.accentQuarters.classList.toggle('active', isActive);
  }
}
