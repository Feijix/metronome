export class DigitalSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  _beep(time, freq, gain, dur) {
    const ctx = this.context;
    const osc  = ctx.createOscillator();
    const env  = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
  }

  playAccent(startTime) {
    const t = startTime || this.context.currentTime;
    this._beep(t, 1800, 0.70, 0.065);
  }

  playQuarter(startTime) {
    const t = startTime || this.context.currentTime;
    this._beep(t, 1400, 0.55, 0.055);
  }

  playSubdivision(startTime) {
    const t = startTime || this.context.currentTime;
    this._beep(t, 1050, 0.32, 0.040);
  }
}
