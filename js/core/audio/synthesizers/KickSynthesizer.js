/**
 * Kick Synthesizer
 * Produces a kick drum-like sound with low frequency sine sweep
 * Includes a brief click transient at the start for attack
 */
export class KickSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  /**
   * Creates a brief white noise click for attack transient
   */
  createClickBuffer(duration) {
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
   * Lowest frequency sweep, longest decay, strong click
   */
  playAccent(startTime) {
    const time = startTime || this.context.currentTime;

    // Click transient (2ms)
    const clickBuffer = this.createClickBuffer(0.002);
    const clickSource = this.context.createBufferSource();
    const clickGain = this.context.createGain();

    clickSource.buffer = clickBuffer;
    clickGain.gain.setValueAtTime(0.3, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.002);

    clickSource.connect(clickGain).connect(this.context.destination);
    clickSource.start(time);

    // Low sine sweep
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);

    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  /**
   * Play quarter beat sound
   * Medium low frequency, medium decay
   */
  playQuarter(startTime) {
    const time = startTime || this.context.currentTime;

    // Lighter click
    const clickBuffer = this.createClickBuffer(0.001);
    const clickSource = this.context.createBufferSource();
    const clickGain = this.context.createGain();

    clickSource.buffer = clickBuffer;
    clickGain.gain.setValueAtTime(0.2, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.001);

    clickSource.connect(clickGain).connect(this.context.destination);
    clickSource.start(time);

    // Low sine sweep
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.12);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.12);
  }

  /**
   * Play subdivision sound
   * Higher frequency, shorter decay, no click
   */
  playSubdivision(startTime) {
    const time = startTime || this.context.currentTime;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain).connect(this.context.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  }
}
