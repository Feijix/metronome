import { TestFramework, Assert } from '../lib/test-framework.js';
import { StateManager } from '../../js/core/StateManager.js';
import { MetronomeAudio } from '../../js/core/MetronomeAudio.js';
import { MetronomeScheduler } from '../../js/core/MetronomeScheduler.js';
import { TapTempo } from '../../js/features/TapTempo.js';

export function registerIntegrationTests(test) {
  test.describe('Integration Tests', () => {
    let state, audio, scheduler, tapTempo;

    const setupIntegration = () => {
      state = new StateManager();
      audio = new MetronomeAudio();
      scheduler = new MetronomeScheduler(state, audio);
      tapTempo = new TapTempo(state, audio);
      return { state, audio, scheduler, tapTempo };
    };

    const cleanup = () => {
      if (scheduler && scheduler.isPlaying()) {
        scheduler.stop();
      }
      if (audio && audio.audioContext) {
        audio.cleanup();
      }
    };

    test.it('StateManager and Scheduler integration', () => {
      const { state, audio, scheduler } = setupIntegration();

      // Start scheduler
      scheduler.start();

      Assert.isTrue(state.isPlaying());
      Assert.isNotNull(audio.audioContext);
      Assert.isTrue(scheduler.isPlaying());

      // Stop scheduler
      scheduler.stop();

      Assert.isFalse(state.isPlaying());
      Assert.isFalse(scheduler.isPlaying());

      cleanup();
    });

    test.it('StateManager observer pattern with BPM changes', () => {
      const { state } = setupIntegration();

      let notificationCount = 0;
      let lastValue = null;

      state.subscribe('bpm', (value) => {
        notificationCount++;
        lastValue = value;
      });

      state.setBPM(140);
      Assert.equal(notificationCount, 1);
      Assert.equal(lastValue, 140);

      state.setBPM(160);
      Assert.equal(notificationCount, 2);
      Assert.equal(lastValue, 160);

      cleanup();
    });

    test.it('TapTempo updates StateManager BPM', () => {
      const { state, tapTempo, audio } = setupIntegration();
      audio.init();

      const initialBPM = state.getBPM(); // Default is 120

      // Simulate taps at 400ms intervals = 150 BPM (60000ms / 400ms = 150)
      const basetime = Date.now();
      let currentTime = basetime;
      const originalNow = Date.now;
      Date.now = () => currentTime;

      tapTempo.handleTap();
      currentTime += 400;

      tapTempo.handleTap();
      currentTime += 400;

      tapTempo.handleTap();

      Date.now = originalNow;

      Assert.equal(state.getBPM(), 150);
      Assert.notEqual(state.getBPM(), initialBPM);

      cleanup();
    });

    test.it('Scheduler respects state configuration', () => {
      const { state, audio, scheduler } = setupIntegration();

      // Set custom configuration
      state.setBPM(100);
      state.setTimeSignature(3);
      state.setSubdivision('8');

      scheduler.start();

      const stateData = state.getState();
      Assert.equal(stateData.config.bpm, 100);
      Assert.equal(stateData.config.timeSignature, 3);
      Assert.equal(stateData.config.subdivision, '8');

      scheduler.stop();
      cleanup();
    });

    test.it('State advancement through full cycle', () => {
      const { state } = setupIntegration();

      state.setTimeSignature(4);
      state.setSubdivision('8');
      state.setPhraseBars(3);   // 2 click bars + 1 gap bar
      state.setGapBars(1);

      // Advance through subdivisions -> beats -> bars -> mode switch
      state.resetRuntime();

      // First bar, first beat, subdivisions
      Assert.equal(state.runtime.currentBeat, 0);
      Assert.equal(state.runtime.currentSubBeat, 0);
      Assert.isFalse(state.runtime.isGapMode);

      // Advance subdivisions
      state.advanceSubBeat(); // sub=1
      state.advanceSubBeat(); // sub=0, beat=1

      Assert.equal(state.runtime.currentBeat, 1);
      Assert.equal(state.runtime.currentSubBeat, 0);

      // Complete first bar (4 beats total)
      for (let i = 0; i < 6; i++) { // 3 beats * 2 subs = 6
        state.advanceSubBeat();
      }

      Assert.equal(state.runtime.currentBeat, 0);
      Assert.equal(state.runtime.barInPhrase, 1);

      // Complete second bar (should switch to gap mode)
      for (let i = 0; i < 8; i++) { // 4 beats * 2 subs = 8
        state.advanceSubBeat();
      }

      // Bar 3 of the 3-bar phrase is the gap bar.
      Assert.isTrue(state.runtime.isGapMode);
      Assert.equal(state.runtime.barInPhrase, 2);

      cleanup();
    });

    test.it('Multiple observers receive notifications', () => {
      const { state } = setupIntegration();

      const observer1Calls = [];
      const observer2Calls = [];

      state.subscribe('bpm', (value) => observer1Calls.push(value));
      state.subscribe('bpm', (value) => observer2Calls.push(value));

      state.setBPM(150);
      state.setBPM(180);

      Assert.equal(observer1Calls.length, 2);
      Assert.equal(observer2Calls.length, 2);
      Assert.deepEqual(observer1Calls, observer2Calls);

      cleanup();
    });

    test.it('Mode switch notification', () => {
      const { state } = setupIntegration();

      let modeSwitchCalls = 0;
      let lastMode = null;

      state.subscribe('modeSwitch', (isGapMode) => {
        modeSwitchCalls++;
        lastMode = isGapMode;
      });

      state.setPhraseBars(2);   // 1 click bar + 1 gap bar
      state.setGapBars(1);
      state.runtime.barInPhrase = 0;

      // Complete first bar
      state.advanceBar();

      Assert.equal(modeSwitchCalls, 1);
      Assert.isTrue(lastMode);

      cleanup();
    });

    test.it('Scheduler and State synchronization', () => {
      const { state, audio, scheduler } = setupIntegration();

      scheduler.start();

      // Wait a brief moment for scheduler to run
      return new Promise(resolve => {
        setTimeout(() => {
          // State should be advancing
          const stateData = state.getState();

          Assert.isTrue(state.isPlaying());

          scheduler.stop();
          cleanup();
          resolve();
        }, 100);
      });
    });

    test.it('Configuration changes during playback', () => {
      const { state, audio, scheduler } = setupIntegration();

      scheduler.start();

      // Change BPM while playing
      state.setBPM(180);
      Assert.equal(state.getBPM(), 180);

      // Change time signature
      state.setTimeSignature(3);
      Assert.equal(state.getTimeSignature(), 3);

      scheduler.stop();
      cleanup();
    });

    test.it('Zero gap bars skips gap mode completely', () => {
      const { state } = setupIntegration();

      state.setPhraseBars(2);
      state.setGapBars(0);
      state.setTimeSignature(4);
      state.resetRuntime();

      // Simulate completing 2 bars of clicks
      for (let bar = 0; bar < 2; bar++) {
        for (let beat = 0; beat < 4; beat++) {
          state.advanceBeat();
        }
      }

      // Should still be in click mode, never entered gap mode
      Assert.isFalse(state.runtime.isGapMode);
      Assert.equal(state.runtime.barInPhrase, 0);

      cleanup();
    });
  });
}
