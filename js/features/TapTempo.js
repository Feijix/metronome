import { TAP_TEMPO_CONSTANTS } from '../config/constants.js';

export class TapTempo {
  constructor(stateManager, audioEngine) {
    this.state = stateManager;
    this.audio = audioEngine;
    this.tapTimes = [];
  }

  handleTap() {
    const now = Date.now();

    this.resetIfStale(now);
    this.recordTap(now);
    this.calculateAndUpdateBPM();
    this.playFeedback();
  }

  resetIfStale(now) {
    if (this.tapTimes.length > 0) {
      const lastTap = this.tapTimes[this.tapTimes.length - 1];
      if (now - lastTap > TAP_TEMPO_CONSTANTS.MAX_INTERVAL_MS) {
        this.tapTimes = [];
      }
    }
  }

  recordTap(now) {
    this.tapTimes.push(now);

    // Keep only last N taps
    if (this.tapTimes.length > TAP_TEMPO_CONSTANTS.MAX_TAPS) {
      this.tapTimes.shift();
    }
  }

  calculateAndUpdateBPM() {
    if (this.tapTimes.length < TAP_TEMPO_CONSTANTS.MIN_TAPS_FOR_BPM) {
      return;
    }

    const intervals = this.calculateIntervals();
    const avgInterval = this.average(intervals);
    const newBpm = Math.round(60000 / avgInterval);

    this.state.setBPM(newBpm);
  }

  calculateIntervals() {
    const intervals = [];
    for (let i = 1; i < this.tapTimes.length; i++) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }
    return intervals;
  }

  average(numbers) {
    return numbers.reduce((a, b) => a + b) / numbers.length;
  }

  playFeedback() {
    this.audio.init();
    this.audio.playClick('quarter');
  }

  reset() {
    this.tapTimes = [];
  }
}
