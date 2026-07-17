import { SCHEDULING_CONSTANTS } from '../config/constants.js';

export class MetronomeScheduler {
  constructor(stateManager, audioEngine) {
    this.state = stateManager;
    this.audio = audioEngine;
    this.schedulerInterval = null;
    this.nextNoteTime = 0;
  }

  start() {
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
    this.state.setPlaying(false);
  }

  scheduler() {
    while (this.nextNoteTime < this.audio.currentTime + SCHEDULING_CONSTANTS.SCHEDULE_AHEAD_TIME) {
      this.scheduleNote();
    }
  }

  scheduleNote() {
    const stateData = this.state.getState();
    const { config, runtime } = stateData;
    const subDef = this.state.getSubdivisionDef();

    const secondsPerBeat = 60.0 / config.bpm;
    const secondsPerSubBeat = secondsPerBeat / subDef.resolution;

    // Play sound if not in gap mode, this tick is active in the pattern, and
    // the current beat hasn't been muted by the user.
    let clickType = null;
    if (!runtime.isGapMode
        && subDef.pattern[runtime.currentSubBeat]
        && !this.state.isBeatMuted(runtime.currentBeat)) {
      clickType = this.determineClickType(config, runtime);
      this.audio.playClick(clickType, this.nextNoteTime);
    }

    // Announce the start of a Click bar at its exact audio time so the spoken
    // count can be scheduled sample-accurately (not via the setTimeout visual
    // path, which jitters and lagged behind the beat).
    if (!runtime.isGapMode && runtime.currentBeat === 0 && runtime.currentSubBeat === 0) {
      this.state.notify('barAudioStart', {
        bar: runtime.barsInCurrentMode + 1,
        time: this.nextNoteTime
      });
    }

    // Schedule visual update with proper timing
    this.scheduleVisualUpdate(runtime, config, clickType);

    // Advance time
    this.nextNoteTime += secondsPerSubBeat;

    // Advance position in state
    this.state.advanceSubBeat();
  }

  determineClickType(config, runtime) {
    const isDownbeat = runtime.currentBeat === 0 && runtime.currentSubBeat === 0;
    const isQuarterBeat = runtime.currentSubBeat === 0;

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
    const bar = runtime.barsInCurrentMode + 1;
    const barTotal = runtime.isGapMode ? config.gapBars : config.clickBars;
    const isGap = runtime.isGapMode;
    // First tick of a bar (downbeat) — used to trigger the spoken bar count.
    const isBarStart = runtime.currentBeat === 0 && runtime.currentSubBeat === 0;
    setTimeout(() => {
      this.state.notify('beatTick', {
        beat: runtime.currentBeat,
        isGap,
        bar,
        barTotal,
        isBarStart
      });
      if (navigator.vibrate && this.state.getVibrate()) {
        if (clickType === 'downbeat')     navigator.vibrate(22);
        else if (clickType === 'quarter') navigator.vibrate(12);
      }
    }, delay);
  }

  isPlaying() {
    return this.schedulerInterval !== null;
  }
}
