/**
 * SamplePlayer — loads a CC0/PD recording, finds its first transient, and plays
 * a short windowed slice of it as a single clean click. This lets multi-hit
 * source recordings (e.g. a cowbell pattern) render as one isolated hit.
 */
export class SamplePlayer {
  constructor(context, url, opts = {}) {
    this.context = context;
    this.url     = url;
    this.window  = opts.window ?? 0.2; // seconds of the hit to sound
    this.preroll = opts.preroll ?? 0.006; // back up slightly to catch the attack
    this.buffer  = null;
    this.offset  = 0;
    this._loading = null;
  }

  load() {
    if (this.buffer) return Promise.resolve(this);
    if (this._loading) return this._loading;
    this._loading = fetch(this.url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${this.url}`);
        return r.arrayBuffer();
      })
      // decodeAudioData via Promise (modern signature)
      .then(buf => this.context.decodeAudioData(buf))
      .then(audio => {
        this.buffer = audio;
        this.offset = this._detectOnset(audio);
        return this;
      })
      .catch(err => {
        console.error('SamplePlayer load failed:', this.url, err);
        this._loading = null; // allow a later retry
        throw err;
      });
    return this._loading;
  }

  // Find the first sample whose magnitude crosses a threshold — the attack of
  // the first hit. Returns a start offset (seconds) just before it.
  _detectOnset(audio) {
    const data = audio.getChannelData(0);
    const thresh = 0.06;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > thresh) {
        return Math.max(0, i / audio.sampleRate - this.preroll);
      }
    }
    return 0;
  }

  /**
   * Play the hit at `time` with a gain envelope that trims the tail (and any
   * following hits in the source recording) without an audible click.
   * @param {number} time  Web Audio start time
   * @param {number} gain  peak gain (0–1)
   * @param {number} rate  playbackRate (pitch); >1 brighter, <1 darker
   */
  play(time, gain = 1, rate = 1) {
    if (!this.buffer) return;
    const ctx = this.context;
    const t0  = time || ctx.currentTime;
    const dur = this.window / rate;

    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = rate;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.004);
    g.gain.setValueAtTime(Math.max(0.0002, gain), t0 + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(g).connect(ctx.destination);
    src.start(t0, this.offset);
    src.stop(t0 + dur + 0.03);
  }
}
