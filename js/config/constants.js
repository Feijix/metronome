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
  // When the page is hidden (screen off / app in background) timers get
  // throttled to ~1/s, so schedule further ahead to avoid audible gaps.
  HIDDEN_SCHEDULE_AHEAD_TIME: 1.5,
  // Notes whose time has already passed by more than this (e.g. after the
  // page was frozen) are skipped silently instead of played as a burst.
  LATE_NOTE_TOLERANCE: 0.05,
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
  { id: '8r1',  label: 'Offbeat 8th',  short: '𝄾♪', resolution: 2, pattern: [false, true] },
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

// Click sounds (see assets/sounds/CREDITS.md). clave/cowbell are CC0/PD
// recordings — SamplePlayer trims the first transient (`window` = seconds of
// the hit). digital/mechanical/block/shaker are synthesized single events
// played whole (trim:false). `levels` = per-accent gain + playbackRate.
// Pitch scheme — a C-major triad, consonant to the ear:
//   subdivision = C (root),  quarter = E (major third),  beat 1 = G (fifth).
// `tune` places each sound's root C at the octave nearest its own natural
// fundamental (measured) so nothing is over-shifted; the level `rate`s then add
// the 1 : 1.25 : 1.5 (C:E:G, 4:5:6 just intonation) triad on top. Mechanical (a
// tick) and Shaker (noise) are unpitched — tune 1, only a subtle rate accent.
//   block  613Hz→C5(523)  cowbell 658Hz→C5(523)  clave 1131Hz→C6(1047)  digital 2005Hz→C7(2093)
const TRIAD = { accent: 1.5, quarter: 1.25, sub: 1.0 }; // G / E / C
export const SAMPLE_CONFIG = {
  // trim:false → synthesized single-event samples play whole (natural envelope,
  // full transient). preHit (shaker) shifts the start so its lead-in leads into
  // the beat and the hit lands on-beat. clave/cowbell are recordings (trim on).
  digital: {
    label: 'Digital', file: 'assets/sounds/digital.wav', tune: 1.044, trim: false,
    levels: { accent: { gain: 1.00, rate: TRIAD.accent }, quarter: { gain: 0.70, rate: TRIAD.quarter }, sub: { gain: 0.42, rate: TRIAD.sub } },
  },
  mechanical: {
    // Louder gains — a very short click needs more level to match the ringing sounds.
    label: 'Mechanical', file: 'assets/sounds/mechanical.wav', tune: 1.0, trim: false,
    levels: { accent: { gain: 1.00, rate: 1.06 }, quarter: { gain: 0.80, rate: 1.0 }, sub: { gain: 0.56, rate: 0.96 } },
  },
  clave: {
    label: 'Clave', file: 'assets/sounds/clave.ogg', window: 0.11, tune: 0.925,
    levels: { accent: { gain: 1.00, rate: TRIAD.accent }, quarter: { gain: 0.74, rate: TRIAD.quarter }, sub: { gain: 0.46, rate: TRIAD.sub } },
  },
  cowbell: {
    label: 'Cowbell', file: 'assets/sounds/cowbell.ogg', window: 0.30, tune: 0.795,
    levels: { accent: { gain: 1.00, rate: TRIAD.accent }, quarter: { gain: 0.74, rate: TRIAD.quarter }, sub: { gain: 0.46, rate: TRIAD.sub } },
  },
  block: {
    label: 'Block', file: 'assets/sounds/block.wav', tune: 0.854, trim: false,
    levels: { accent: { gain: 1.00, rate: TRIAD.accent }, quarter: { gain: 0.74, rate: TRIAD.quarter }, sub: { gain: 0.46, rate: TRIAD.sub } },
  },
  shaker: {
    label: 'Shaker', file: 'assets/sounds/shaker.wav', tune: 1.0, trim: false, preHit: 0.045,
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
  voiceCount: false,      // speak the click-bar number ("one, two…") at each bar
  beatMutes: [],          // per-beat mute flags; length tracks the numerator
  flashOnChange: false,
  keepAwake: false
};
