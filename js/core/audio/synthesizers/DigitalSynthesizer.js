/**
 * Digital Synthesizer
 * Produces sharp, clean sine beeps at different frequencies
 * Very short attack, crisp and precise
 */
export class DigitalSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  /**
   * Play accent sound (beat 1)
   * Highest frequency, short and sharp
   */
  playAccent(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, time);

    // Very sharp attack and decay
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  /**
   * Play quarter beat sound
   * Medium frequency
   */
  playQuarter(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, time);

    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  /**
   * Play subdivision sound
   * Lower frequency, quieter
   */
  playSubdivision(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  }
}
