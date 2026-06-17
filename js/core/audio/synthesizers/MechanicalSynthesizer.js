// Pendulum metronome tick: short noise snap + wooden resonance + overtone.
export class MechanicalSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  _tick(time, freq, gain, dur) {
    const ctx = this.context;

    // Mechanical snap: 4ms of decaying noise filtered above 900 Hz
    const snapLen = Math.ceil(ctx.sampleRate * 0.004);
    const snapBuf = ctx.createBuffer(1, snapLen, ctx.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    for (let i = 0; i < snapLen; i++) {
      snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snapLen * 0.25));
    }
    const snap = ctx.createBufferSource();
    snap.buffer = snapBuf;

    const snapHpf = ctx.createBiquadFilter();
    snapHpf.type = 'highpass';
    snapHpf.frequency.value = 900;

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(gain * 0.55, time);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.008);

    snap.connect(snapHpf).connect(snapGain).connect(ctx.destination);
    snap.start(time);
    snap.stop(time + 0.008);

    // Primary wooden resonance: slight pitch drop as energy dissipates
    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(freq * 1.06, time);
    body.frequency.exponentialRampToValueAtTime(freq * 0.93, time + dur * 0.5);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(gain * 0.42, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    body.connect(bodyGain).connect(ctx.destination);
    body.start(time);
    body.stop(time + dur);

    // Overtone (~2× fundamental) for brightness, dies quickly
    const ot = ctx.createOscillator();
    ot.type = 'sine';
    ot.frequency.setValueAtTime(freq * 2.08, time);

    const otGain = ctx.createGain();
    otGain.gain.setValueAtTime(gain * 0.12, time);
    otGain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.45);

    ot.connect(otGain).connect(ctx.destination);
    ot.start(time);
    ot.stop(time + dur * 0.45);

    // Lower register: the wooden box cavity resonance
    const box = ctx.createOscillator();
    box.type = 'sine';
    box.frequency.setValueAtTime(freq * 0.52, time);

    const boxGain = ctx.createGain();
    boxGain.gain.setValueAtTime(gain * 0.18, time);
    boxGain.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.6);

    box.connect(boxGain).connect(ctx.destination);
    box.start(time);
    box.stop(time + dur * 0.6);
  }

  playAccent(startTime) {
    const t = startTime || this.context.currentTime;
    this._tick(t, 1060, 0.68, 0.145);
  }

  playQuarter(startTime) {
    const t = startTime || this.context.currentTime;
    this._tick(t, 900, 0.52, 0.120);
  }

  playSubdivision(startTime) {
    const t = startTime || this.context.currentTime;
    this._tick(t, 820, 0.33, 0.085);
  }
}
