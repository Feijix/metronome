import { AUDIO_CONSTANTS } from '../config/constants.js';

export class MetronomeAudio {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isInitialized = true;
  }

  playClick(type = 'normal', time = 0) {
    if (!this.audioContext) return;

    const now = time || this.audioContext.currentTime;
    const params = this.getClickParameters(type);

    this.createAndPlayOscillator(params, now);
  }

  getClickParameters(type) {
    const { FREQUENCIES, VOLUMES, DECAY_TIMES } = AUDIO_CONSTANTS;

    switch (type) {
      case 'downbeat':
        return {
          frequency: FREQUENCIES.DOWNBEAT,
          volume: VOLUMES.DOWNBEAT,
          decay: DECAY_TIMES.DOWNBEAT
        };
      case 'quarter':
        return {
          frequency: FREQUENCIES.QUARTER,
          volume: VOLUMES.QUARTER,
          decay: DECAY_TIMES.QUARTER
        };
      case 'subdivision':
        return {
          frequency: FREQUENCIES.SUBDIVISION,
          volume: VOLUMES.SUBDIVISION,
          decay: DECAY_TIMES.SUBDIVISION
        };
      default:
        return {
          frequency: FREQUENCIES.NORMAL,
          volume: VOLUMES.NORMAL,
          decay: DECAY_TIMES.NORMAL
        };
    }
  }

  createAndPlayOscillator(params, startTime) {
    const { frequency, volume, decay } = params;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);
    osc.frequency.exponentialRampToValueAtTime(
      frequency * 0.5,
      startTime + decay
    );

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(startTime);
    osc.stop(startTime + decay);
  }

  get currentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
    }
  }
}
