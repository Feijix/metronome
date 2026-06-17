/**
 * Agogo Synthesizer
 * Produces a metallic, two-tone sound using FM synthesis
 * Uses frequency modulation for metallic timbre
 */
export class AgogoSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  /**
   * Create FM synthesis with modulator and carrier
   */
  createFMSound(carrierFreq, modulatorRatio, volume, decay, startTime) {
    const time = startTime || this.context.currentTime;

    // Modulator oscillator
    const modulator = this.context.createOscillator();
    const modulatorGain = this.context.createGain();

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(carrierFreq * modulatorRatio, time);

    // Modulation depth
    modulatorGain.gain.setValueAtTime(carrierFreq * 0.5, time);
    modulatorGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    // Carrier oscillator
    const carrier = this.context.createOscillator();
    const carrierGain = this.context.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(carrierFreq, time);

    carrierGain.gain.setValueAtTime(volume, time);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    // Connect: modulator → modulatorGain → carrier.frequency
    modulator.connect(modulatorGain).connect(carrier.frequency);
    carrier.connect(carrierGain).connect(this.context.destination);

    modulator.start(time);
    carrier.start(time);
    modulator.stop(time + decay);
    carrier.stop(time + decay);
  }

  /**
   * Play accent sound (beat 1)
   * Higher frequency, longer decay
   */
  playAccent(startTime) {
    this.createFMSound(880, 3.2, 0.7, 0.1, startTime);
  }

  /**
   * Play quarter beat sound
   * Medium frequency
   */
  playQuarter(startTime) {
    this.createFMSound(740, 3.2, 0.55, 0.08, startTime);
  }

  /**
   * Play subdivision sound
   * Lower frequency, shorter decay
   */
  playSubdivision(startTime) {
    this.createFMSound(620, 3.2, 0.35, 0.06, startTime);
  }
}
