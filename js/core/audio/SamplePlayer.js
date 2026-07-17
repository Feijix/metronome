/**
 * SamplePlayer plays a click from an audio buffer. Two modes:
 *  - trim (default): for multi-hit CC0/PD recordings — find the first transient
 *    and play a short windowed slice so the recording renders as one clean hit.
 *  - whole (trim:false): for clean single-event synthesized samples — play the
 *    entire buffer with its own natural envelope (no onset trim, no fade that
 *    would dull a sharp transient). `preHit` shifts the start earlier so a
 *    lead-in (e.g. the shaker's "beads already moving") leads into the beat and
 *    the hit lands exactly on `time`.
 */
export class SamplePlayer {
  constructor(context, url, opts = {}) {
    this.context = context;
    this.url     = url;
    this.window  = opts.window ?? 0.2; // seconds of the hit to sound (trim mode)
    this.preroll = opts.preroll ?? 0.006; // back up slightly to catch the attack
    this.trim    = opts.trim !== false; // false → play whole synthesized buffer
    this.preHit  = opts.preHit ?? 0;    // seconds from buffer start to the hit
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
        this.offset = this.trim ? this._detectOnset(audio) : 0;
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
   * Play the hit at `time`.
   * @param {number} time  Web Audio start time (when the hit should land)
   * @param {number} gain  peak gain (0–1+)
   * @param {number} rate  playbackRate (pitch); >1 brighter, <1 darker
   */
  play(time, gain = 1, rate = 1) {
    if (!this.buffer) return;
    const ctx  = this.context;
    const t0   = time || ctx.currentTime;
    const peak = Math.max(0.0002, gain);
    const src  = ctx.createBufferSource();
    src.buffer = this.buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();

    if (!this.trim) {
      // Whole synthesized sample: preserve its natural envelope, apply gain flat
      // (no fade-in that would dull the transient). Start `preHit` earlier so
      // any lead-in leads into the beat and the hit is on `time`.
      let startAt = t0 - this.preHit / rate;
      let bufOff  = 0; // seconds into the buffer to begin at
      // If there isn't enough lead time to fit the whole lead-in, skip that far
      // INTO the buffer instead of delaying the start — this keeps the hit
      // exactly on `time` (only the lead-in shortens) so timing stays rock-solid.
      if (startAt < ctx.currentTime) {
        bufOff  = (ctx.currentTime - startAt) * rate;
        startAt = ctx.currentTime;
      }
      const bufDur = (this.buffer.duration - bufOff) / rate;
      g.gain.setValueAtTime(peak, startAt);
      g.gain.setValueAtTime(peak, startAt + Math.max(0, bufDur - 0.015));
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + bufDur); // tail anti-click
      src.connect(g).connect(ctx.destination);
      src.start(startAt, bufOff);
      src.stop(startAt + bufDur + 0.02);
      return;
    }

    // Recording: play a short windowed slice from the detected onset, with a
    // gain envelope that trims the tail (and any following hits) cleanly.
    const dur = this.window / rate;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.004);
    g.gain.setValueAtTime(peak, t0 + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(g).connect(ctx.destination);
    src.start(t0, this.offset);
    src.stop(t0 + dur + 0.03);
  }
}
