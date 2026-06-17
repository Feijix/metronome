/**
 * Clave (Wood Block) Synthesizer
 * Produces a wooden percussion sound using dual oscillators for accent
 * This matches the original metronome sound
 */
export class ClaveSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  /**
   * Play accent sound (beat 1)
   * Dual oscillator for richer tone
   */
  playAccent(startTime) {
    const time = startTime || this.context.currentTime;

    // Primary oscillator
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, time);
    osc1.frequency.exponentialRampToValueAtTime(400, time + 0.08);

    gain1.gain.setValueAtTime(0.5, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    // Secondary oscillator for brightness
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, time);
    osc2.frequency.exponentialRampToValueAtTime(600, time + 0.08);

    gain2.gain.setValueAtTime(0.3, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    // Connect and play
    osc1.connect(gain1).connect(this.context.destination);
    osc2.connect(gain2).connect(this.context.destination);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.08);
    osc2.stop(time + 0.08);
  }

  /**
   * Play quarter beat sound
   * Single oscillator, medium volume
   */
  playQuarter(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.06);

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  /**
   * Play subdivision sound
   * Single oscillator, lower frequency and volume
   */
  playSubdivision(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, time);
    osc.frequency.exponentialRampToValueAtTime(350, time + 0.04);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.04);
  }
}
