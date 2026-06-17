// Wooden drumstick click: sharp transient noise + high-frequency resonance.
export class DrumstickSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  _click(time, freq, gain, dur) {
    const ctx = this.context;

    // Impact transient: 3ms of high-passed decaying noise
    const transLen = Math.ceil(ctx.sampleRate * 0.003);
    const transBuf = ctx.createBuffer(1, transLen, ctx.sampleRate);
    const transData = transBuf.getChannelData(0);
    for (let i = 0; i < transLen; i++) {
      transData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (transLen * 0.18));
    }
    const trans = ctx.createBufferSource();
    trans.buffer = transBuf;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 1800;

    const transGain = ctx.createGain();
    transGain.gain.setValueAtTime(gain * 0.75, time);
    transGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.006);

    trans.connect(hpf).connect(transGain).connect(ctx.destination);
    trans.start(time);
    trans.stop(time + 0.006);

    // High-frequency stick resonance, decays very fast
    const hi = ctx.createOscillator();
    hi.type = 'sine';
    hi.frequency.setValueAtTime(freq, time);
    hi.frequency.exponentialRampToValueAtTime(freq * 0.84, time + dur);

    const hiGain = ctx.createGain();
    hiGain.gain.setValueAtTime(gain * 0.40, time);
    hiGain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    hi.connect(hiGain).connect(ctx.destination);
    hi.start(time);
    hi.stop(time + dur);

    // Sub-harmonic for the wood body character
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 0.48, time);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(gain * 0.18, time);
    subGain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.65);

    sub.connect(subGain).connect(ctx.destination);
    sub.start(time);
    sub.stop(time + dur * 0.65);
  }

  playAccent(startTime) {
    const t = startTime || this.context.currentTime;
    this._click(t, 2700, 0.68, 0.055);
  }

  playQuarter(startTime) {
    const t = startTime || this.context.currentTime;
    this._click(t, 2400, 0.52, 0.045);
  }

  playSubdivision(startTime) {
    const t = startTime || this.context.currentTime;
    this._click(t, 2100, 0.32, 0.035);
  }
}
