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
    if (isPlaying) {
      this.element.textContent = 'Stop';
      this.element.classList.add('playing');
    } else {
      this.element.textContent = 'Start';
      this.element.classList.remove('playing');
    }
  }
}
