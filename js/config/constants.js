// Audio synthesis constants
export const AUDIO_CONSTANTS = {
  FREQUENCIES: {
    DOWNBEAT: 1200,
    QUARTER: 900,
    SUBDIVISION: 700,
    NORMAL: 800
  },
  VOLUMES: {
    DOWNBEAT: 0.8,
    QUARTER: 0.6,
    SUBDIVISION: 0.35,
    NORMAL: 0.5
  },
  DECAY_TIMES: {
    DOWNBEAT: 0.08,
    QUARTER: 0.06,
    SUBDIVISION: 0.04,
    NORMAL: 0.05
  }
};

// BPM range and defaults
export const BPM_CONSTANTS = {
  MIN: 30,
  MAX: 300,
  DEFAULT: 120,
  LONG_PRESS_INTERVAL: 100
};

// Scheduling precision constants
export const SCHEDULING_CONSTANTS = {
  SCHEDULE_AHEAD_TIME: 0.1,
  LOOKAHEAD_MS: 25,
  INITIAL_DELAY: 0.05
};

// Available time signatures
export const TIME_SIGNATURES = [3, 4, 5, 7];

// Available subdivisions
export const SUBDIVISIONS = [1, 2, 4];

// Gap pattern limits
export const GAP_PATTERN_LIMITS = {
  CLICK_MIN: 1,
  CLICK_MAX: 16,
  CLICK_DEFAULT: 4,
  GAP_MIN: 0,
  GAP_MAX: 16,
  GAP_DEFAULT: 2
};

// Tap tempo constants
export const TAP_TEMPO_CONSTANTS = {
  MAX_INTERVAL_MS: 2000,
  MAX_TAPS: 5,
  MIN_TAPS_FOR_BPM: 2
};

// Default state configuration
export const DEFAULT_STATE = {
  bpm: BPM_CONSTANTS.DEFAULT,
  timeSignature: 4,
  subdivision: 1,
  clickBars: GAP_PATTERN_LIMITS.CLICK_DEFAULT,
  gapBars: GAP_PATTERN_LIMITS.GAP_DEFAULT,
  accentOne: true,
  accentQuarters: true
};
