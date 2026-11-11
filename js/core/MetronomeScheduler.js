import { SCHEDULING_CONSTANTS, beatSeconds, beatGroupSize } from '../config/constants.js';

export class MetronomeScheduler {
  constructor(stateManager, audioEngine) {
    this.state = stateManager;
    this.audio = audioEngine;
    this.schedulerInterval = null;
    this.nextNoteTime = 0;
    // Clicks and beat-highlight timers already queued ahead of time. Up to
    // HIDDEN_SCHEDULE_AHEAD_TIME (1.5 s) of them exist while the screen is off,
    // so stop() must cancel them or they'd keep sounding after a pause.
    this.pendingSources = [];
    this.pendingTimers = new Set();

    // Going to the background (screen off): immediately top the queue up to
    // the larger hidden lookahead before the browser starts throttling timers.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (this.isPlaying()) this.scheduler();
      });
    }
  }

  start() {
    if (this.isPlaying()) return; // a second start would leak another interval
    this.audio.init();
    this.state.resetRuntime();

    this.nextNoteTime = this.audio.currentTime + SCHEDULING_CONSTANTS.INITIAL_DELAY;
    this.schedulerInterval = setInterval(
      () => this.scheduler(),
      SCHEDULING_CONSTANTS.LOOKAHEAD_MS
    );

    this.state.setPlaying(true);
  }

  stop() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.cancelPending();
    this.state.setPlaying(false);
  }

  /** Cancel clicks and visual updates that were scheduled but haven't happened. */
  cancelPending() {
    const now = this.audio.currentTime;
    for (const { src, time } of this.pendingSources) {
      if (time > now) {
        try { src.stop(); } catch (e) { /* already stopped */ }
      }
    }
    this.pendingSources = [];
    this.pendingTimers.forEach(id => clearTimeout(id));
    this.pendingTimers.clear();
  }

  scheduler() {
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const ahead = hidden
      ? SCHEDULING_CONSTANTS.HIDDEN_SCHEDULE_AHEAD_TIME
      : SCHEDULING_CONSTANTS.SCHEDULE_AHEAD_TIME;
    while (this.nextNoteTime < this.audio.currentTime + ahead) {
      this.scheduleNote();
    }
  }

  scheduleNote() {
    const stateData = this.state.getState();
    const { config, runtime } = stateData;
    const subDef = this.state.getSubdivisionDef();

    // BPM counts quarter notes; the time-signature denominator scales the beat
    // (x/8 → eighth-note beats, x/2 → half-note beats, …).
    const secondsPerBeat = beatSeconds(config.bpm, config.beatUnit);
    const secondsPerSubBeat = secondsPerBeat / subDef.resolution;

    // Play sound if not in gap mode, this tick is active in the pattern, and
    // the current beat hasn't been muted by the user.
    // If the scheduler was stalled (page frozen in the background), notes that
    // are already in the past are skipped so they don't all fire at once; the
    // position still advances so the bar/beat grid stays intact.
    const late = this.nextNoteTime < this.audio.currentTime - SCHEDULING_CONSTANTS.LATE_NOTE_TOLERANCE;

    let clickType = null;
    if (!late && !runtime.isGapMode
        && subDef.pattern[runtime.currentSubBeat]
        && !this.state.isBeatMuted(runtime.currentBeat)) {
      clickType = this.determineClickType(config, runtime);
      const src = this.audio.playClick(clickType, this.nextNoteTime);
      if (src) this.trackSource(src, this.nextNoteTime);
    }

    // Announce the start of a Click bar at its exact audio time so the spoken
    // count can be scheduled sample-accurately (not via the setTimeout visual
    // path, which jitters and lagged behind the beat).
    if (!late && !runtime.isGapMode && runtime.currentBeat === 0 && runtime.currentSubBeat === 0) {
      this.state.notify('barAudioStart', {
        bar: runtime.barInPhrase + 1,   // position in the phrase → spoken count
        time: this.nextNoteTime
      });
    }

    // Schedule visual update with proper timing
    if (!late) this.scheduleVisualUpdate(runtime, config, clickType);

    // Advance time
    this.nextNoteTime += secondsPerSubBeat;

    // Advance position in state
    this.state.advanceSubBeat();
  }

  trackSource(src, time) {
    const now = this.audio.currentTime;
    // Drop entries that have already played so the list stays short.
    this.pendingSources = this.pendingSources.filter(p => p.time > now);
    this.pendingSources.push({ src, time });
  }

  determineClickType(config, runtime) {
    const isDownbeat = runtime.currentBeat === 0 && runtime.currentSubBeat === 0;
    // "Beat" accent: the first tick of each beat — or, in compound meters
    // (6/8, 9/8, 12/8…), only the first eighth of each dotted-quarter group.
    const group = beatGroupSize(config.timeSignature, config.beatUnit);
    const isQuarterBeat = runtime.currentSubBeat === 0 && runtime.currentBeat % group === 0;

    if (isDownbeat && config.accentOne) {
      return 'downbeat';
    } else if (isQuarterBeat && config.accentQuarters) {
      return 'quarter';
    } else {
      return 'subdivision';
    }
  }

  scheduleVisualUpdate(runtime, config, clickType) {
    const delay = (this.nextNoteTime - this.audio.currentTime) * 1000;
    const bar = runtime.barInPhrase + 1;
    const barTotal = config.phraseBars;
    const isGap = runtime.isGapMode;
    const id = setTimeout(() => {
      this.pendingTimers.delete(id);
      this.state.notify('beatTick', {
        beat: runtime.currentBeat,
        isGap,
        bar,
        barTotal
      });
      if (navigator.vibrate && this.state.getVibrate()) {
        if (clickType === 'downbeat')     navigator.vibrate(22);
        else if (clickType === 'quarter') navigator.vibrate(12);
      }
    }, delay);
    this.pendingTimers.add(id);
  }

  isPlaying() {
    return this.schedulerInterval !== null;
  }
}
