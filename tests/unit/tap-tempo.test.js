import { TestFramework, Assert } from '../lib/test-framework.js';
import { TapTempo } from '../../js/features/TapTempo.js';
import { StateManager } from '../../js/core/StateManager.js';
import { MetronomeAudio } from '../../js/core/MetronomeAudio.js';
import { TAP_TEMPO_CONSTANTS, BPM_CONSTANTS } from '../../js/config/constants.js';

export function registerTapTempoTests(test) {
  test.describe('TapTempo', () => {
    let tapTempo, state, audio;

    const createTapTempo = () => {
      state = new StateManager();
      audio = new MetronomeAudio();
      return new TapTempo(state, audio);
    };

    test.it('initializes with empty tap times', () => {
      tapTempo = createTapTempo();
      Assert.equal(tapTempo.tapTimes.length, 0);
    });

    test.it('recordTap adds timestamp', () => {
      tapTempo = createTapTempo();
      const now = Date.now();

      tapTempo.recordTap(now);
      Assert.equal(tapTempo.tapTimes.length, 1);
      Assert.equal(tapTempo.tapTimes[0], now);
    });

    test.it('recordTap limits to MAX_TAPS', () => {
      tapTempo = createTapTempo();

      // Add more than MAX_TAPS
      for (let i = 0; i < TAP_TEMPO_CONSTANTS.MAX_TAPS + 3; i++) {
        tapTempo.recordTap(Date.now() + i);
      }

      Assert.equal(tapTempo.tapTimes.length, TAP_TEMPO_CONSTANTS.MAX_TAPS);
    });

    test.it('calculateIntervals returns correct intervals', () => {
      tapTempo = createTapTempo();
      tapTempo.tapTimes = [1000, 1500, 2000, 2500];

      const intervals = tapTempo.calculateIntervals();

      Assert.equal(intervals.length, 3);
      Assert.equal(intervals[0], 500);
      Assert.equal(intervals[1], 500);
      Assert.equal(intervals[2], 500);
    });

    test.it('average calculates correctly', () => {
      tapTempo = createTapTempo();

      Assert.equal(tapTempo.average([100, 200, 300]), 200);
      Assert.equal(tapTempo.average([500, 500]), 500);
      Assert.equal(tapTempo.average([100, 300, 500]), 300);
    });

    test.it('calculateAndUpdateBPM does nothing with insufficient taps', () => {
      tapTempo = createTapTempo();
      const initialBPM = state.getBPM();

      tapTempo.tapTimes = [1000]; // Only one tap
      tapTempo.calculateAndUpdateBPM();

      Assert.equal(state.getBPM(), initialBPM);
    });

    test.it('calculateAndUpdateBPM updates BPM with valid taps', () => {
      tapTempo = createTapTempo();

      // 500ms intervals = 120 BPM (60000ms / 500ms = 120)
      tapTempo.tapTimes = [1000, 1500, 2000];
      tapTempo.calculateAndUpdateBPM();

      Assert.equal(state.getBPM(), 120);
    });

    test.it('calculateAndUpdateBPM clamps BPM to valid range', () => {
      tapTempo = createTapTempo();

      // Very short intervals = high BPM (should clamp to max)
      tapTempo.tapTimes = [1000, 1100, 1200];
      tapTempo.calculateAndUpdateBPM();

      Assert.equal(state.getBPM(), BPM_CONSTANTS.MAX);
    });

    test.it('resetIfStale clears old taps', () => {
      tapTempo = createTapTempo();
      const now = Date.now();

      tapTempo.tapTimes = [now - 3000]; // 3 seconds ago
      tapTempo.resetIfStale(now);

      Assert.equal(tapTempo.tapTimes.length, 0);
    });

    test.it('resetIfStale keeps recent taps', () => {
      tapTempo = createTapTempo();
      const now = Date.now();

      tapTempo.tapTimes = [now - 1000]; // 1 second ago
      tapTempo.resetIfStale(now);

      Assert.equal(tapTempo.tapTimes.length, 1);
    });

    test.it('reset clears tap times', () => {
      tapTempo = createTapTempo();
      tapTempo.tapTimes = [1000, 2000, 3000];

      tapTempo.reset();

      Assert.equal(tapTempo.tapTimes.length, 0);
    });

    test.it('handleTap integrates all functionality', () => {
      tapTempo = createTapTempo();
      audio.init(); // Initialize for feedback

      // Simulate rapid taps at 150 BPM (400ms intervals)
      const basetime = Date.now();

      // Override Date.now for testing
      let currentTime = basetime;
      const originalNow = Date.now;
      Date.now = () => currentTime;

      tapTempo.handleTap();
      currentTime += 400;

      tapTempo.handleTap();
      currentTime += 400;

      tapTempo.handleTap();

      // Restore Date.now
      Date.now = originalNow;

      // Should have calculated BPM (400ms intervals = 150 BPM)
      Assert.equal(state.getBPM(), 150);
      Assert.equal(tapTempo.tapTimes.length, 3);
    });
  });
}
