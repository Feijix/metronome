import { SamplePlayer } from './audio/SamplePlayer.js';
import { SAMPLE_CONFIG, DEFAULT_SOUND } from '../config/constants.js';

/**
 * MetronomeAudio plays sample-backed click sounds. Each sound type maps to a
 * CC0/PD recording loaded and trimmed to a single hit by SamplePlayer.
 */
export class MetronomeAudio {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.soundType = DEFAULT_SOUND;
    this.players = new Map(); // soundType -> SamplePlayer
  }

  init() {
    if (this.isInitialized) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audioContext.resume) this.audioContext.resume().catch(() => {});
    this.isInitialized = true;
    this._ensurePlayer(this.soundType);
  }

  setSoundType(type) {
    if (SAMPLE_CONFIG[type]) this.soundType = type;
    if (this.audioContext) this._ensurePlayer(this.soundType);
  }

  // Create + begin loading the player for a sound type (decoding needs the
  // AudioContext, so this is a no-op until init() has run).
  _ensurePlayer(type) {
    if (this.players.has(type)) return this.players.get(type);
    const cfg = SAMPLE_CONFIG[type];
    if (!cfg) return null;
    const player = new SamplePlayer(this.audioContext, cfg.file, { window: cfg.window });
    this.players.set(type, player);
    player.load().catch(() => {}); // failures already logged; play() no-ops until loaded
    return player;
  }

  /**
   * Play a click. Silently no-ops if the sample isn't decoded yet.
   * @param {string} type - 'downbeat' | 'quarter' | 'subdivision' | 'normal'
   * @param {number} time - Web Audio time to play the sound
   */
  playClick(type = 'normal', time = 0) {
    const player = this.players.get(this.soundType);
    const cfg = SAMPLE_CONFIG[this.soundType];
    if (!player || !player.buffer || !cfg) return;

    const now = time || this.audioContext.currentTime;
    const lv = cfg.levels;
    const level = type === 'downbeat' ? lv.accent
                : type === 'subdivision' ? lv.sub
                : lv.quarter; // 'quarter' and 'normal'
    player.play(now, level.gain, level.rate);
  }

  get currentTime() {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.isInitialized = false;
      this.players.clear();
    }
  }
}
