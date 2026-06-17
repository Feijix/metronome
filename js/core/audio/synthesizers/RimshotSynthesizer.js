/**
 * Rimshot Synthesizer
 * Produces a rimshot-like sound with white noise burst + low tone
 * Accent has stronger noise component
 */
export class RimshotSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  /**
   * Creates a white noise buffer
   */
  createNoiseBuffer(duration) {
    const sampleRate = this.context.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Play accent sound (beat 1)
   * Strong noise burst + low tone
   */
  playAccent(startTime) {
    const time = startTime || this.context.currentTime;

    // Noise burst (10ms)
    const noiseBuffer = this.createNoiseBuffer(0.01);
    const noiseSource = this.context.createBufferSource();
    const noiseGain = this.context.createGain();

    noiseSource.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);

    noiseSource.connect(noiseGain).connect(this.context.destination);
    noiseSource.start(time);

    // Low tone
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);

    gain.gain.setValueAtTime(0.75, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  /**
   * Play quarter beat sound
   * Shorter noise burst + tone
   */
  playQuarter(startTime) {
    const time = startTime || this.context.currentTime;

    // Noise burst (5ms)
    const noiseBuffer = this.createNoiseBuffer(0.005);
    const noiseSource = this.context.createBufferSource();
    const noiseGain = this.context.createGain();

    noiseSource.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(0.35, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.005);

    noiseSource.connect(noiseGain).connect(this.context.destination);
    noiseSource.start(time);

    // Tone
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.06);

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  /**
   * Play subdivision sound
   * Tone only, no noise
   */
  playSubdivision(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.04);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.04);
  }
}
