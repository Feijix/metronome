import { TestFramework, Assert } from '../lib/test-framework.js';
import {
  AUDIO_CONSTANTS,
  BPM_CONSTANTS,
  SCHEDULING_CONSTANTS,
  TIME_SIG,
  SUBDIVISIONS,
  SUBDIVISION_MAP,
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
      Assert.equal(BPM_CONSTANTS.MIN, 20);
      Assert.equal(BPM_CONSTANTS.MAX, 400);
      Assert.equal(BPM_CONSTANTS.DEFAULT, 120);
      Assert.greaterThan(BPM_CONSTANTS.DEFAULT, BPM_CONSTANTS.MIN);
      Assert.lessThan(BPM_CONSTANTS.DEFAULT, BPM_CONSTANTS.MAX);
    });

    test.it('SCHEDULING_CONSTANTS has positive values', () => {
      Assert.greaterThan(SCHEDULING_CONSTANTS.SCHEDULE_AHEAD_TIME, 0);
      Assert.greaterThan(SCHEDULING_CONSTANTS.LOOKAHEAD_MS, 0);
      Assert.greaterThan(SCHEDULING_CONSTANTS.INITIAL_DELAY, 0);
    });

    test.it('TIME_SIG has a valid numerator range and denominators', () => {
      Assert.equal(TIME_SIG.NUM_MIN, 1);
      Assert.greaterThan(TIME_SIG.NUM_MAX, TIME_SIG.NUM_MIN);
      Assert.equal(TIME_SIG.DENOMINATORS.join(','), '1,2,4,8');
      Assert.includes(TIME_SIG.DENOMINATORS, TIME_SIG.DEFAULT_DEN);
    });

    test.it('SUBDIVISIONS have unique ids and patterns matching their resolution', () => {
      Assert.isTrue(Array.isArray(SUBDIVISIONS));
      Assert.greaterThan(SUBDIVISIONS.length, 0);
      const ids = SUBDIVISIONS.map(s => s.id);
      Assert.equal(new Set(ids).size, ids.length);
      SUBDIVISIONS.forEach(s => {
        Assert.equal(s.pattern.length, s.resolution);
        Assert.isTrue(s.pattern.some(Boolean));
        Assert.equal(SUBDIVISION_MAP[s.id], s);
      });
    });

    test.it('SOUND_TYPES is an array of valid sound types', () => {
      Assert.isTrue(Array.isArray(SOUND_TYPES));
      Assert.equal(SOUND_TYPES.join(','), 'digital,mechanical,clave,cowbell,block,shaker');
    });

    test.it('GAP_PATTERN_LIMITS has valid min/max ranges', () => {
      Assert.equal(GAP_PATTERN_LIMITS.PHRASE_MIN, 1);
      Assert.equal(GAP_PATTERN_LIMITS.PHRASE_MAX, 16); // matches the recorded voice numbers
      Assert.equal(GAP_PATTERN_LIMITS.GAP_MIN, 0);
      Assert.lessThan(GAP_PATTERN_LIMITS.GAP_DEFAULT, GAP_PATTERN_LIMITS.PHRASE_DEFAULT);
    });

    test.it('DEFAULT_STATE has all required properties', () => {
      Assert.equal(DEFAULT_STATE.bpm, BPM_CONSTANTS.DEFAULT);
      Assert.isTrue(DEFAULT_STATE.timeSignature >= TIME_SIG.NUM_MIN && DEFAULT_STATE.timeSignature <= TIME_SIG.NUM_MAX);
      Assert.isDefined(SUBDIVISION_MAP[DEFAULT_STATE.subdivision]);
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
