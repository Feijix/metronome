/**
 * VoiceCounter speaks the click-bar number ("one", "two", …) at the start of
 * each Click bar. The Web Speech API is unreliable inside the Android WebView,
 * so this plays pre-recorded number samples (assets/sounds/voice/N.wav) through
 * the metronome's AudioContext — which is already unlocked by the play gesture
 * and works offline. Leading silence is trimmed so the word lands on the beat.
 */
const MAX_NUMBER = 16;

export class VoiceCounter {
  constructor(stateManager, audioEngine) {
    this.state = stateManager;
    this.audio = audioEngine;
    this.buffers = new Map();   // n -> { buffer, offset }
    this.loading = null;
    this.current = null;

    // barAudioStart carries the exact AudioContext time of the bar's downbeat,
    // so the count is scheduled sample-accurately (aligned with the click).
    this.state.subscribe('barAudioStart', data => this._onBar(data));
    // Preload as soon as it's relevant (context exists after the play gesture).
    this.state.subscribe('voiceCount', on => { if (on) this._ensureLoaded(); });
    this.state.subscribe('playState', playing => { if (playing && this.state.getVoiceCount()) this._ensureLoaded(); });
  }

  _ctx() { return this.audio ? this.audio.audioContext : null; }

  _ensureLoaded() {
    if (this.loading) return this.loading;
    const ctx = this._ctx();
    if (!ctx) return null; // audio not initialised yet; retry on next trigger
    this.loading = (async () => {
      for (let n = 1; n <= MAX_NUMBER; n++) {
        if (this.buffers.has(n)) continue;
        try {
          const res = await fetch(`assets/sounds/voice/${n}.wav`);
          if (!res.ok) continue;
          const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
          this.buffers.set(n, { buffer, ...this._analyze(buffer) });
        } catch (e) { /* ignore a missing/failed file */ }
      }
    })();
    return this.loading;
  }

  // Find both the audible onset and the perceptual onset (p-center) of the word.
  // Words like "five/six/seven" begin with a low-energy fricative (f/s) before
  // the stressed vowel — aligning the fricative to the beat makes the emphasis
  // land late. So we also locate the loud (vowel) onset and return:
  //   offset  – where in the buffer to start playing (just before the sound)
  //   preroll – how long before the beat to start, so the emphasis is on-beat
  _analyze(buffer) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const n = data.length;
    const w = Math.max(1, Math.floor(sr * 0.004)); // 4ms moving-average window
    const env = new Float32Array(n);
    let sum = 0, peak = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.abs(data[i]);
      if (i >= w) sum -= Math.abs(data[i - w]);
      const e = sum / Math.min(i + 1, w);
      env[i] = e;
      if (e > peak) peak = e;
    }
    if (peak <= 0) return { offset: 0, preroll: 0 };

    const lowT = Math.max(0.01, peak * 0.08); // start of any sound
    const empT = peak * 0.5;                   // stressed vowel / emphasis
    let onset = 0, emph = 0;
    for (let i = 0; i < n; i++) { if (env[i] > lowT) { onset = i; break; } }
    for (let i = onset; i < n; i++) { if (env[i] >= empT) { emph = i; break; } }

    const offset = Math.max(0, onset / sr - 0.006); // begin a hair before the sound
    const preroll = Math.min(0.2, Math.max(0, emph / sr - offset));
    return { offset, preroll };
  }

  _onBar(data) {
    if (!data) return;
    if (!this.state.getVoiceCount()) return;
    this._speak(data.bar, data.time);
  }

  // Schedule the number so its emphasis (p-center) lands on the bar's exact
  // audio time (`when`): start `preroll` seconds early, from `offset` into the
  // buffer, so the fricative leads in and the vowel hits the beat.
  _speak(n, when) {
    const ctx = this._ctx();
    if (!ctx) return;
    const entry = this.buffers.get(n);
    if (!entry) { this._ensureLoaded(); return; } // not ready yet — next bar will speak
    if (this.current) { try { this.current.stop(); } catch (e) {} }
    const at = Math.max((when || ctx.currentTime) - entry.preroll, ctx.currentTime);
    const src = ctx.createBufferSource();
    src.buffer = entry.buffer;
    src.connect(ctx.destination);
    src.start(at, entry.offset);
    this.current = src;
  }
}
