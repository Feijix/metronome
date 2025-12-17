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

    const secondsPerBeat = 60.0 / config.bpm;
    const secondsPerSubBeat = secondsPerBeat / config.subdivision;

    // Determine click type
    const clickType = this.determineClickType(config, runtime);

    // Play sound if not in gap mode
    if (!runtime.isGapMode) {
      this.audio.playClick(clickType, this.nextNoteTime);
    }

    // Schedule visual update with proper timing
    this.scheduleVisualUpdate(runtime);

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

  scheduleVisualUpdate(runtime) {
    const delay = (this.nextNoteTime - this.audio.currentTime) * 1000;
    setTimeout(() => {
      this.state.notify('beatTick', {
        beat: runtime.currentBeat,
        isGap: runtime.isGapMode
      });
    }, delay);
  }

  isPlaying() {
    return this.schedulerInterval !== null;
  }
}
