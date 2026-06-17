/**
 * Hi-Hat Synthesizer
 * Produces a hi-hat-like sound using high-pass filtered white noise
 * Short, crisp, with different cutoff frequencies for variation
 */
export class HiHatSynthesizer {
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
   * Lower cutoff frequency (more body), longer decay
   */
  playAccent(startTime) {
    const time = startTime || this.context.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.08);
    const noiseSource = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    noiseSource.buffer = noiseBuffer;

    // High-pass filter at 5kHz
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, time);
    filter.Q.setValueAtTime(1, time);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noiseSource.connect(filter).connect(gain).connect(this.context.destination);

    noiseSource.start(time);
  }

  /**
   * Play quarter beat sound
   * Medium cutoff frequency
   */
  playQuarter(startTime) {
    const time = startTime || this.context.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.06);
    const noiseSource = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    noiseSource.buffer = noiseBuffer;

    // High-pass filter at 6kHz
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);
    filter.Q.setValueAtTime(1, time);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    noiseSource.connect(filter).connect(gain).connect(this.context.destination);

    noiseSource.start(time);
  }

  /**
   * Play subdivision sound
   * Higher cutoff frequency (thinner), short decay
   */
  playSubdivision(startTime) {
    const time = startTime || this.context.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.04);
    const noiseSource = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    noiseSource.buffer = noiseBuffer;

    // High-pass filter at 7kHz
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);
    filter.Q.setValueAtTime(1, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noiseSource.connect(filter).connect(gain).connect(this.context.destination);

    noiseSource.start(time);
  }
}
