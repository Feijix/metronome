import { TestFramework, Assert } from '../lib/test-framework.js';
import { MetronomeScheduler } from '../../js/core/MetronomeScheduler.js';
import { StateManager } from '../../js/core/StateManager.js';
import { MetronomeAudio } from '../../js/core/MetronomeAudio.js';

export function registerMetronomeSchedulerTests(test) {
  test.describe('MetronomeScheduler', () => {
    let scheduler, state, audio;

    const createScheduler = () => {
      state = new StateManager();
      audio = new MetronomeAudio();
      return new MetronomeScheduler(state, audio);
    };

    test.it('initializes with null interval', () => {
      scheduler = createScheduler();
      Assert.isNull(scheduler.schedulerInterval);
      Assert.equal(scheduler.nextNoteTime, 0);
    });

    test.it('isPlaying returns false initially', () => {
      scheduler = createScheduler();
      Assert.isFalse(scheduler.isPlaying());
    });

    test.it('start initializes audio and state', () => {
      scheduler = createScheduler();
      scheduler.start();

      Assert.isNotNull(audio.audioContext);
      Assert.isTrue(state.isPlaying());
      Assert.isTrue(scheduler.isPlaying());
      Assert.greaterThan(scheduler.nextNoteTime, 0);

      scheduler.stop(); // Cleanup
    });

    test.it('stop clears interval and updates state', () => {
      scheduler = createScheduler();
      scheduler.start();

      Assert.isTrue(scheduler.isPlaying());

      scheduler.stop();

      Assert.isFalse(scheduler.isPlaying());
      Assert.isNull(scheduler.schedulerInterval);
      Assert.isFalse(state.isPlaying());
    });

    test.it('determineClickType returns downbeat for first beat', () => {
      scheduler = createScheduler();
      const config = { accentOne: true, accentQuarters: true };
      const runtime = { currentBeat: 0, currentSubBeat: 0 };

      const type = scheduler.determineClickType(config, runtime);
      Assert.equal(type, 'downbeat');
    });

    test.it('determineClickType returns quarter for quarter beats', () => {
      scheduler = createScheduler();
      const config = { accentOne: false, accentQuarters: true };
      const runtime = { currentBeat: 1, currentSubBeat: 0 };

      const type = scheduler.determineClickType(config, runtime);
      Assert.equal(type, 'quarter');
    });

    test.it('determineClickType returns subdivision for subdivisions', () => {
      scheduler = createScheduler();
      const config = { accentOne: false, accentQuarters: false };
      const runtime = { currentBeat: 1, currentSubBeat: 1 };

      const type = scheduler.determineClickType(config, runtime);
      Assert.equal(type, 'subdivision');
    });

    test.it('determineClickType respects accent settings', () => {
      scheduler = createScheduler();

      // Downbeat without accent
      let config = { accentOne: false, accentQuarters: true };
      let runtime = { currentBeat: 0, currentSubBeat: 0 };
      Assert.equal(scheduler.determineClickType(config, runtime), 'quarter');

      // Quarter beat without accent
      config = { accentOne: false, accentQuarters: false };
      runtime = { currentBeat: 1, currentSubBeat: 0 };
      Assert.equal(scheduler.determineClickType(config, runtime), 'subdivision');
    });

    test.it('scheduleNote advances state', () => {
      scheduler = createScheduler();
      audio.init();
      state.setSubdivision(4);

      const initialSubBeat = state.runtime.currentSubBeat;
      scheduler.nextNoteTime = audio.currentTime + 0.1;

      scheduler.scheduleNote();

      Assert.equal(state.runtime.currentSubBeat, initialSubBeat + 1);
    });

    test.it('scheduler loops correctly', () => {
      scheduler = createScheduler();
      audio.init();

      // Set nextNoteTime behind schedule to test catch-up logic
      scheduler.nextNoteTime = audio.currentTime - 1;

      let scheduleCount = 0;
      // Mock scheduleNote to avoid actual audio playback with negative time
      scheduler.scheduleNote = () => {
        scheduleCount++;
        // Advance time to simulate scheduling
        scheduler.nextNoteTime += 0.1;
      };

      scheduler.scheduler();

      // Should have called scheduleNote multiple times to catch up
      Assert.greaterThan(scheduleCount, 0);
    });

    test.it('stop is safe when not started', () => {
      scheduler = createScheduler();
      // Should not throw
      scheduler.stop();
      Assert.isTrue(true);
    });
  });
}
