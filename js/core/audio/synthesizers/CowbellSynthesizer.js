/**
 * Cowbell Synthesizer
 * Produces a metallic cowbell sound using FM synthesis with dual carriers
 * Creates a distinctive metallic timbre
 */
export class CowbellSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  /**
   * Play accent sound (beat 1)
   * Dual carrier FM synthesis for rich metallic tone
   */
  playAccent(startTime) {
    const time = startTime || this.context.currentTime;

    // Modulator for FM synthesis
    const modulator = this.context.createOscillator();
    const modulatorGain = this.context.createGain();

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(540 * 5.1, time);

    modulatorGain.gain.setValueAtTime(540 * 0.8, time);
    modulatorGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    // First carrier (lower frequency)
    const carrier1 = this.context.createOscillator();
    const gain1 = this.context.createGain();

    carrier1.type = 'sine';
    carrier1.frequency.setValueAtTime(540, time);

    gain1.gain.setValueAtTime(0.4, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    // Second carrier (higher frequency)
    const carrier2 = this.context.createOscillator();
    const gain2 = this.context.createGain();

    carrier2.type = 'sine';
    carrier2.frequency.setValueAtTime(800, time);

    gain2.gain.setValueAtTime(0.3, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    // Connect: modulator modulates both carriers
    modulator.connect(modulatorGain);
    modulatorGain.connect(carrier1.frequency);
    modulatorGain.connect(carrier2.frequency);

    carrier1.connect(gain1).connect(this.context.destination);
    carrier2.connect(gain2).connect(this.context.destination);

    modulator.start(time);
    carrier1.start(time);
    carrier2.start(time);
    modulator.stop(time + 0.12);
    carrier1.stop(time + 0.12);
    carrier2.stop(time + 0.12);
  }

  /**
   * Play quarter beat sound
   * Single carrier FM synthesis
   */
  playQuarter(startTime) {
    const time = startTime || this.context.currentTime;

    // Modulator
    const modulator = this.context.createOscillator();
    const modulatorGain = this.context.createGain();

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(500 * 5.1, time);

    modulatorGain.gain.setValueAtTime(500 * 0.6, time);
    modulatorGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    // Carrier
    const carrier = this.context.createOscillator();
    const gain = this.context.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(500, time);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    modulator.connect(modulatorGain).connect(carrier.frequency);
    carrier.connect(gain).connect(this.context.destination);

    modulator.start(time);
    carrier.start(time);
    modulator.stop(time + 0.1);
    carrier.stop(time + 0.1);
  }

  /**
   * Play subdivision sound
   * Simple sine tone for subtle click
   */
  playSubdivision(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, time);
    osc.frequency.exponentialRampToValueAtTime(240, time + 0.06);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }
}
