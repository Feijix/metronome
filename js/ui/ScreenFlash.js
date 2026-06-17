/**
 * ScreenFlash
 * Creates a full-screen flash effect when pattern changes (click ↔ gap)
 * Only flashes if user has enabled the feature in settings
 */
export class ScreenFlash {
  constructor(stateManager) {
    this.state = stateManager;
    this.flashElement = null;

    this.createFlashElement();
    this.subscribeToState();
  }

  /**
   * Create the flash overlay element
   */
  createFlashElement() {
    this.flashElement = document.createElement('div');
    this.flashElement.className = 'screen-flash';
    document.body.appendChild(this.flashElement);
  }

  /**
   * Subscribe to mode switch events
   */
  subscribeToState() {
    this.state.subscribe('modeSwitch', (isGapMode) => {
      if (this.state.getFlashOnChange()) {
        this.flash(isGapMode);
      }
    });
  }

  /**
   * Trigger flash with color based on mode
   * @param {boolean} isGapMode - True if switching to gap mode, false for click mode
   */
  flash(isGapMode) {
    // Different flash colors for click vs gap
    const flashColor = isGapMode
      ? 'rgba(59, 130, 246, 0.3)'  // Blue for gap
      : 'rgba(251, 191, 36, 0.3)';  // Amber for click

    this.flashElement.style.background = flashColor;
    this.flashElement.classList.add('active');

    // Remove after 200ms
    setTimeout(() => {
      this.flashElement.classList.remove('active');
    }, 200);
  }
}
