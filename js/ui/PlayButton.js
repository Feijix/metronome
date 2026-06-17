export class PlayButton {
  constructor(scheduler, element) {
    this.scheduler = scheduler;
    this.element = element;

    this.bindEvents();
  }

  bindEvents() {
    this.element.addEventListener('click', () => this.toggle());
  }

  toggle() {
    if (this.scheduler.isPlaying()) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.scheduler.start();
    this.updateDisplay(true);
  }

  stop() {
    this.scheduler.stop();
    this.updateDisplay(false);
  }

  updateDisplay(isPlaying) {
    // Just toggle the 'playing' class - CSS handles icon change
    if (isPlaying) {
      this.element.classList.add('playing');
      this.element.setAttribute('aria-label', 'Stop metronome');
    } else {
      this.element.classList.remove('playing');
      this.element.setAttribute('aria-label', 'Start metronome');
    }
  }
}
