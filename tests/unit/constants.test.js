import { TestFramework, Assert } from '../lib/test-framework.js';
import {
  AUDIO_CONSTANTS,
  BPM_CONSTANTS,
  SCHEDULING_CONSTANTS,
  TIME_SIGNATURES,
  SUBDIVISIONS,
  SUBDIVISION_SYMBOLS,
  SOUND_TYPES,
  GAP_PATTERN_LIMITS,
  TAP_TEMPO_CONSTANTS,
  DEFAULT_STATE
} from '../../js/config/constants.js';

export function registerConstantsTests(test) {
  test.describe('Constants Module', () => {
    test.it('AUDIO_CONSTANTS has all required properties', () => {
      Assert.isDefined(AUDIO_CONSTANTS.FREQUENCIES);
      Assert.isDefined(AUDIO_CONSTANTS.VOLUMES);
      Assert.isDefined(AUDIO_CONSTANTS.DECAY_TIMES);
    });

    test.it('AUDIO_CONSTANTS frequencies are positive numbers', () => {
      Assert.greaterThan(AUDIO_CONSTANTS.FREQUENCIES.DOWNBEAT, 0);
      Assert.greaterThan(AUDIO_CONSTANTS.FREQUENCIES.QUARTER, 0);
      Assert.greaterThan(AUDIO_CONSTANTS.FREQUENCIES.SUBDIVISION, 0);
      Assert.greaterThan(AUDIO_CONSTANTS.FREQUENCIES.NORMAL, 0);
    });

    test.it('AUDIO_CONSTANTS volumes are between 0 and 1', () => {
      Assert.greaterThan(AUDIO_CONSTANTS.VOLUMES.DOWNBEAT, 0);
      Assert.lessThan(AUDIO_CONSTANTS.VOLUMES.DOWNBEAT, 1);
      Assert.greaterThan(AUDIO_CONSTANTS.VOLUMES.QUARTER, 0);
      Assert.lessThan(AUDIO_CONSTANTS.VOLUMES.QUARTER, 1);
    });

    test.it('BPM_CONSTANTS has valid range', () => {
      Assert.equal(BPM_CONSTANTS.MIN, 30);
      Assert.equal(BPM_CONSTANTS.MAX, 300);
      Assert.equal(BPM_CONSTANTS.DEFAULT, 120);
      Assert.greaterThan(BPM_CONSTANTS.DEFAULT, BPM_CONSTANTS.MIN);
      Assert.lessThan(BPM_CONSTANTS.DEFAULT, BPM_CONSTANTS.MAX);
    });

    test.it('SCHEDULING_CONSTANTS has positive values', () => {
      Assert.greaterThan(SCHEDULING_CONSTANTS.SCHEDULE_AHEAD_TIME, 0);
      Assert.greaterThan(SCHEDULING_CONSTANTS.LOOKAHEAD_MS, 0);
      Assert.greaterThan(SCHEDULING_CONSTANTS.INITIAL_DELAY, 0);
    });

    test.it('TIME_SIGNATURES is an array of valid signatures', () => {
      Assert.isTrue(Array.isArray(TIME_SIGNATURES));
      Assert.greaterThan(TIME_SIGNATURES.length, 0);
      Assert.includes(TIME_SIGNATURES, 4);
      TIME_SIGNATURES.forEach(sig => {
        Assert.greaterThan(sig, 0);
      });
    });

    test.it('SUBDIVISIONS is an array of valid values', () => {
      Assert.isTrue(Array.isArray(SUBDIVISIONS));
      Assert.equal(SUBDIVISIONS.length, 7);
      Assert.includes(SUBDIVISIONS, 1);
      Assert.includes(SUBDIVISIONS, 2);
      Assert.includes(SUBDIVISIONS, 3);
      Assert.includes(SUBDIVISIONS, 4);
      Assert.includes(SUBDIVISIONS, 6);
      Assert.includes(SUBDIVISIONS, 8);
      Assert.includes(SUBDIVISIONS, 12);
    });

    test.it('SUBDIVISION_SYMBOLS maps all subdivisions to symbols', () => {
      Assert.isDefined(SUBDIVISION_SYMBOLS);
      SUBDIVISIONS.forEach(sub => {
        Assert.isDefined(SUBDIVISION_SYMBOLS[sub]);
        Assert.isTrue(typeof SUBDIVISION_SYMBOLS[sub] === 'string');
        Assert.greaterThan(SUBDIVISION_SYMBOLS[sub].length, 0);
      });
    });

    test.it('SOUND_TYPES is an array of valid sound types', () => {
      Assert.isTrue(Array.isArray(SOUND_TYPES));
      Assert.equal(SOUND_TYPES.length, 7);
      Assert.includes(SOUND_TYPES, 'clave');
      Assert.includes(SOUND_TYPES, 'digital');
      Assert.includes(SOUND_TYPES, 'rimshot');
      Assert.includes(SOUND_TYPES, 'agogo');
      Assert.includes(SOUND_TYPES, 'hihat');
      Assert.includes(SOUND_TYPES, 'kick');
      Assert.includes(SOUND_TYPES, 'cowbell');
    });

    test.it('GAP_PATTERN_LIMITS has valid min/max ranges', () => {
      Assert.greaterThan(GAP_PATTERN_LIMITS.CLICK_MIN, 0);
      Assert.greaterThan(GAP_PATTERN_LIMITS.CLICK_MAX, GAP_PATTERN_LIMITS.CLICK_MIN);
      Assert.greaterThan(GAP_PATTERN_LIMITS.GAP_MAX, GAP_PATTERN_LIMITS.GAP_MIN);
      Assert.equal(GAP_PATTERN_LIMITS.CLICK_MAX, 8);
      Assert.equal(GAP_PATTERN_LIMITS.GAP_MAX, 8);
    });

    test.it('DEFAULT_STATE has all required properties', () => {
      Assert.equal(DEFAULT_STATE.bpm, BPM_CONSTANTS.DEFAULT);
      Assert.includes(TIME_SIGNATURES, DEFAULT_STATE.timeSignature);
      Assert.includes(SUBDIVISIONS, DEFAULT_STATE.subdivision);
      Assert.isTrue(typeof DEFAULT_STATE.accentOne === 'boolean');
      Assert.isTrue(typeof DEFAULT_STATE.accentQuarters === 'boolean');
      Assert.includes(SOUND_TYPES, DEFAULT_STATE.soundType);
      Assert.isTrue(typeof DEFAULT_STATE.flashOnChange === 'boolean');
      Assert.isTrue(typeof DEFAULT_STATE.keepAwake === 'boolean');
    });

    test.it('TAP_TEMPO_CONSTANTS has valid values', () => {
      Assert.greaterThan(TAP_TEMPO_CONSTANTS.MAX_INTERVAL_MS, 0);
      Assert.greaterThan(TAP_TEMPO_CONSTANTS.MAX_TAPS, 1);
      Assert.greaterThan(TAP_TEMPO_CONSTANTS.MIN_TAPS_FOR_BPM, 0);
      Assert.lessThan(TAP_TEMPO_CONSTANTS.MIN_TAPS_FOR_BPM, TAP_TEMPO_CONSTANTS.MAX_TAPS);
    });
  });
}
