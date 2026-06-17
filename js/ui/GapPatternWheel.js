import { GAP_PATTERN_LIMITS } from '../config/constants.js';

/**
 * GapPatternWheel
 * Manages vertical scroll wheels for Click/Gap bar selection
 * Implements scroll-snap behavior for smooth UX
 */
export class GapPatternWheel {
  constructor(stateManager, wheelElement, type) {
    this.state = stateManager;
    this.wheelElement = wheelElement;
    this.type = type; // 'click' or 'gap'
    this.options = [];
    this.scrollTimeout = null;

    if (!this.wheelElement) return;

    this.render();
    this.bindEvents();
    this.subscribeToState();
  }

  /**
   * Render wheel options (1-8 for click, 0-8 for gap)
   */
  render() {
    const min = this.type === 'click'
      ? GAP_PATTERN_LIMITS.CLICK_MIN
      : GAP_PATTERN_LIMITS.GAP_MIN;
    const max = this.type === 'click'
      ? GAP_PATTERN_LIMITS.CLICK_MAX
      : GAP_PATTERN_LIMITS.GAP_MAX;

    this.wheelElement.innerHTML = '';

    // Add top spacer for scroll snap centering
    const topSpacer = document.createElement('div');
    topSpacer.className = 'wheel-spacer';
    this.wheelElement.appendChild(topSpacer);

    // Add value options
    for (let i = min; i <= max; i++) {
      const option = document.createElement('div');
      option.className = 'wheel-option';
      option.dataset.value = i;
      option.textContent = i;
      option.setAttribute('aria-label', `${i} bars`);
      this.wheelElement.appendChild(option);
    }

    // Add bottom spacer for scroll snap centering
    const bottomSpacer = document.createElement('div');
    bottomSpacer.className = 'wheel-spacer';
    this.wheelElement.appendChild(bottomSpacer);

    this.options = Array.from(this.wheelElement.querySelectorAll('.wheel-option'));

    // Center on current value
    this.centerOnValue(this.getCurrentValue());
  }

  /**
   * Bind events
   */
  bindEvents() {
    // Click to select
    this.options.forEach(option => {
      option.addEventListener('click', () => {
        const value = parseInt(option.dataset.value);
        this.setValue(value);
      });
    });

    // Scroll snap behavior
    this.wheelElement.addEventListener('scroll', () => {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.handleScrollEnd();
      }, 150);
    });
  }

  /**
   * Handle scroll end - find and select closest centered option
   */
  handleScrollEnd() {
    const containerRect = this.wheelElement.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let closestOption = null;
    let minDistance = Infinity;

    this.options.forEach(option => {
      const optionRect = option.getBoundingClientRect();
      const optionCenter = optionRect.top + optionRect.height / 2;
      const distance = Math.abs(containerCenter - optionCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestOption = option;
      }
    });

    if (closestOption) {
      const value = parseInt(closestOption.dataset.value);
      this.setValue(value);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribeToState() {
    const event = this.type === 'click' ? 'clickBars' : 'gapBars';
    this.state.subscribe(event, (value) => this.updateSelection(value));
  }

  /**
   * Get current value from state
   */
  getCurrentValue() {
    return this.type === 'click'
      ? this.state.getClickBars()
      : this.state.getGapBars();
  }

  /**
   * Set value in state
   */
  setValue(value) {
    if (this.type === 'click') {
      this.state.setClickBars(value);
    } else {
      this.state.setGapBars(value);
    }
  }

  /**
   * Update selection display
   */
  updateSelection(value) {
    this.options.forEach(option => {
      const optionValue = parseInt(option.dataset.value);
      option.classList.toggle('selected', optionValue === value);
    });

    // Scroll to center selected option
    this.centerOnValue(value);
  }

  /**
   * Center wheel on specific value
   */
  centerOnValue(value) {
    const option = this.wheelElement.querySelector(`[data-value="${value}"]`);
    if (option) {
      option.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }
}
