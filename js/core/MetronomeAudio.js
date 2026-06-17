import { SoundFactory } from './audio/SoundFactory.js';

/**
 * MetronomeAudio manages audio synthesis for the metronome
 * Uses pluggable synthesizers via SoundFactory pattern
 */
export class MetronomeAudio {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.currentSynthesizer = null;
    this.soundType = 'clave'; // Default sound type
  }

  /**
   * Initialize audio context and default synthesizer
   */
  init() {
    if (this.isInitialized) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.updateSynthesizer();
    this.isInitialized = true;
  }

  /**
   * Change the sound type and update synthesizer
   * @param {string} type - Sound type ('clave', 'digital', 'rimshot', etc.)
   */
  setSoundType(type) {
    this.soundType = type;
    if (this.audioContext) {
      this.updateSynthesizer();
    }
  }

  /**
   * Create/update synthesizer instance based on current sound type
   */
  updateSynthesizer() {
    this.currentSynthesizer = SoundFactory.createSynthesizer(
      this.soundType,
      this.audioContext
    );
  }

  /**
   * Play a click sound
   * @param {string} type - Click type ('downbeat', 'quarter', 'subdivision', 'normal')
   * @param {number} time - Web Audio API time to play the sound
   */
  playClick(type = 'normal', time = 0) {
    if (!this.currentSynthesizer) return;

    const now = time || this.audioContext.currentTime;

    switch (type) {
      case 'downbeat':
        this.currentSynthesizer.playAccent(now);
        break;
      case 'quarter':
        this.currentSynthesizer.playQuarter(now);
        break;
      case 'subdivision':
        this.currentSynthesizer.playSubdivision(now);
        break;
      default:
        // Default to quarter for 'normal' type
        this.currentSynthesizer.playQuarter(now);
    }
  }

  /**
   * Get current audio context time
   */
  get currentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  /**
   * Clean up audio resources
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
      this.currentSynthesizer = null;
    }
  }
}
