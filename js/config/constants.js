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
  MIN: 20,
  MAX: 400,
  DEFAULT: 120,
  LONG_PRESS_DELAY: 400,
  LONG_PRESS_INTERVAL: 80
};

// Scheduling precision constants
export const SCHEDULING_CONSTANTS = {
  SCHEDULE_AHEAD_TIME: 0.1,
  LOOKAHEAD_MS: 25,
  INITIAL_DELAY: 0.05
};

// Time signature: numerator (beats per bar) is a free range; denominator
// (beat note value) is a fixed set. Denominator is label-only — the numerator
// drives the beat count and BPM is the beat rate.
export const TIME_SIG = {
  NUM_MIN: 1,
  NUM_MAX: 16,
  DENOMINATORS: [1, 2, 4, 8],
  DEFAULT_NUM: 4,
  DEFAULT_DEN: 4,
};

// Subdivisions: each entry defines a rhythmic pattern within one beat.
// resolution = ticks per beat (grid); pattern = which ticks produce a sound.
export const SUBDIVISIONS = [
  { id: 'q',    label: 'Quarter',      short: '♩',  resolution: 1, pattern: [true] },
  { id: '8',    label: '8th',          short: '♫',  resolution: 2, pattern: [true, true] },
  { id: '8t',   label: '8th Triplet',  short: '8T', resolution: 3, pattern: [true, true, true] },
  { id: '16',   label: '16th',         short: '♬',  resolution: 4, pattern: [true, true, true, true] },
  { id: '16t',  label: '16th Triplet', short: '16T',resolution: 6, pattern: [true, true, true, true, true, true] },
  { id: '32',   label: '32nd',         short: '32', resolution: 8, pattern: [true, true, true, true, true, true, true, true] },
  { id: 'd8',   label: 'Dotted 8th',   short: '♪.', resolution: 4, pattern: [true, false, false, true] },
  { id: '16r1', label: '16th –1',      short: '►1', resolution: 4, pattern: [false, true, true, true] },
  { id: '16r2', label: '16th –2',      short: '►2', resolution: 4, pattern: [true, false, true, true] },
  { id: '16r3', label: '16th –3',      short: '►3', resolution: 4, pattern: [true, true, false, true] },
  { id: '16r4', label: '16th –4',      short: '►4', resolution: 4, pattern: [true, true, true, false] },
  { id: '8tr1',  label: 'Trip –1',     short: '3►1',resolution: 3, pattern: [false, true, true] },
  { id: '8tr2',  label: 'Trip –2',     short: '3►2',resolution: 3, pattern: [true, false, true] },
  { id: '8tr3',  label: 'Trip –3',     short: '3►3',resolution: 3, pattern: [true, true, false] },
  { id: '8tr13', label: 'Trip 2 only', short: '3►m',resolution: 3, pattern: [false, true, false] },
  { id: '8tr12', label: 'Trip 3 only', short: '3►e',resolution: 3, pattern: [false, false, true] },
];

export const SUBDIVISION_MAP = Object.fromEntries(SUBDIVISIONS.map(s => [s.id, s]));

// Gap pattern limits
export const GAP_PATTERN_LIMITS = {
  CLICK_MIN: 1,
  CLICK_MAX: 8,
  CLICK_DEFAULT: 4,
  GAP_MIN: 0,
  GAP_MAX: 8,
  GAP_DEFAULT: 2
};

// Sample-backed click sounds. Each plays the first transient of a CC0/PD
// recording (see assets/sounds/CREDITS.md). `window` = seconds of the hit to
// play; `levels` = per-accent gain + playbackRate (rate gives hi/lo pitch).
export const SAMPLE_CONFIG = {
  digital: {
    label: 'Digital', file: 'assets/sounds/digital.wav', window: 0.12,
    levels: { accent: { gain: 1.00, rate: 1.18 }, quarter: { gain: 0.70, rate: 1.0 }, sub: { gain: 0.42, rate: 0.9 } },
  },
  mechanical: {
    label: 'Mechanical', file: 'assets/sounds/mechanical.ogg', window: 0.11,
    levels: { accent: { gain: 1.00, rate: 1.06 }, quarter: { gain: 0.78, rate: 1.0 }, sub: { gain: 0.52, rate: 1.0 } },
  },
  drumstick: {
    label: 'Drumstick', file: 'assets/sounds/drumstick.ogg', window: 0.11,
    levels: { accent: { gain: 1.00, rate: 1.08 }, quarter: { gain: 0.74, rate: 1.0 }, sub: { gain: 0.46, rate: 0.95 } },
  },
  cowbell: {
    label: 'Cowbell', file: 'assets/sounds/cowbell.ogg', window: 0.30,
    levels: { accent: { gain: 1.00, rate: 1.10 }, quarter: { gain: 0.74, rate: 1.0 }, sub: { gain: 0.46, rate: 1.0 } },
  },
  block: {
    label: 'Block', file: 'assets/sounds/block.wav', window: 0.13,
    levels: { accent: { gain: 1.00, rate: 1.12 }, quarter: { gain: 0.74, rate: 1.0 }, sub: { gain: 0.46, rate: 0.92 } },
  },
  shaker: {
    label: 'Shaker', file: 'assets/sounds/shaker.ogg', window: 0.28,
    levels: { accent: { gain: 1.00, rate: 1.03 }, quarter: { gain: 0.72, rate: 1.0 }, sub: { gain: 0.48, rate: 1.0 } },
  },
};

export const SOUND_TYPES = Object.keys(SAMPLE_CONFIG);
export const DEFAULT_SOUND = 'mechanical';

// Tap tempo constants
export const TAP_TEMPO_CONSTANTS = {
  MAX_INTERVAL_MS: 2000,
  MAX_TAPS: 5,
  MIN_TAPS_FOR_BPM: 2
};

// Italian tempo markings by BPM threshold (ascending)
export const TEMPO_MARKINGS = [
  { name: 'Largo',       max: 59  },
  { name: 'Adagio',      max: 75  },
  { name: 'Andante',     max: 107 },
  { name: 'Moderato',    max: 119 },
  { name: 'Allegro',     max: 155 },
  { name: 'Vivace',      max: 175 },
  { name: 'Presto',      max: 199 },
  { name: 'Prestissimo', max: 300 },
];

// Default state configuration
export const DEFAULT_STATE = {
  bpm: BPM_CONSTANTS.DEFAULT,
  timeSignature: TIME_SIG.DEFAULT_NUM, // numerator: beats per bar
  beatUnit: TIME_SIG.DEFAULT_DEN,      // denominator: beat note value (label only)
  subdivision: 'q',
  clickBars: GAP_PATTERN_LIMITS.CLICK_DEFAULT,
  gapBars: GAP_PATTERN_LIMITS.GAP_DEFAULT,
  accentOne: true,
  accentQuarters: true,
  soundType: DEFAULT_SOUND,
  vibrate: true,
  beatMutes: [],          // per-beat mute flags; length tracks the numerator
  flashOnChange: false,
  keepAwake: false
};
