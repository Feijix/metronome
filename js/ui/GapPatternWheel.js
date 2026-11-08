import { GAP_PATTERN_LIMITS } from '../config/constants.js';

/**
 * GapPatternWheel
 * Vertical scroll wheel for the Phrase / Gap selectors.
 *  - 'phrase': bars per phrase (1–16)
 *  - 'gap':    silent bars at the end of the phrase (0 … phrase−1), so the
 *              options shrink/grow when the phrase length changes.
 * Implements scroll-snap behavior for smooth UX.
 */
export class GapPatternWheel {
  constructor(stateManager, wheelElement, type) {
    this.state = stateManager;
    this.wheelElement = wheelElement;
    this.type = type; // 'phrase' or 'gap'
    this.options = [];
    this.scrollTimeout = null;

    if (!this.wheelElement) return;

    this.render();
    this.bindEvents();
    this.subscribeToState();
  }

  range() {
    if (this.type === 'phrase') {
      return [GAP_PATTERN_LIMITS.PHRASE_MIN, GAP_PATTERN_LIMITS.PHRASE_MAX];
    }
    return [GAP_PATTERN_LIMITS.GAP_MIN, this.state.getPhraseBars() - 1];
  }

  /**
   * Render wheel options for the current range
   */
  render() {
    const [min, max] = this.range();
    this.renderedRange = `${min}-${max}`;
    this.wheelElement.innerHTML = '';

    // Top/bottom spacers let the first/last option snap to the centre.
    const spacer = () => {
      const el = document.createElement('div');
      el.className = 'wheel-spacer';
      return el;
    };

    this.wheelElement.appendChild(spacer());
    for (let i = min; i <= max; i++) {
      const option = document.createElement('div');
      option.className = 'wheel-option';
      option.dataset.value = i;
      option.textContent = i;
      option.setAttribute('aria-label', `${i} ${i === 1 ? 'bar' : 'bars'}`);
      this.wheelElement.appendChild(option);
    }
    this.wheelElement.appendChild(spacer());

    this.options = Array.from(this.wheelElement.querySelectorAll('.wheel-option'));
    this.updateSelection(this.getCurrentValue());
  }

  /**
   * Bind events (once — delegated, so re-rendering doesn't duplicate them)
   */
  bindEvents() {
    this.wheelElement.addEventListener('click', (e) => {
      const option = e.target.closest('.wheel-option');
      if (option) this.setValue(parseInt(option.dataset.value, 10));
    });

    this.wheelElement.addEventListener('scroll', () => {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => this.handleScrollEnd(), 150);
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
      const value = parseInt(closestOption.dataset.value, 10);
      if (value !== this.getCurrentValue()) this.setValue(value);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribeToState() {
    if (this.type === 'phrase') {
      this.state.subscribe('phraseBars', (value) => this.updateSelection(value));
    } else {
      this.state.subscribe('gapBars', (value) => this.updateSelection(value));
      // The gap can be at most phrase−1: rebuild the options when that changes.
      this.state.subscribe('phraseBars', () => {
        const [min, max] = this.range();
        if (this.renderedRange !== `${min}-${max}`) this.render();
      });
    }
  }

  getCurrentValue() {
    return this.type === 'phrase'
      ? this.state.getPhraseBars()
      : this.state.getGapBars();
  }

  setValue(value) {
    if (this.type === 'phrase') {
      this.state.setPhraseBars(value);
    } else {
      this.state.setGapBars(value);
    }
  }

  /**
   * Update selection display
   */
  updateSelection(value) {
    this.options.forEach(option => {
      option.classList.toggle('selected', parseInt(option.dataset.value, 10) === value);
    });
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
