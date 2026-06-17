import { TestFramework, Assert } from '../lib/test-framework.js';
import { StateManager } from '../../js/core/StateManager.js';
import { BPM_CONSTANTS, TIME_SIGNATURES, SUBDIVISIONS, SOUND_TYPES } from '../../js/config/constants.js';

export function registerStateManagerTests(test) {
  test.describe('StateManager', () => {
    let state;

    // Helper to create fresh state for each test
    const createState = () => new StateManager();

    test.it('initializes with default state', () => {
      state = createState();
      Assert.equal(state.getBPM(), 120);
      Assert.equal(state.getTimeSignature(), 4);
      Assert.equal(state.getSubdivision(), 1);
      Assert.equal(state.getClickBars(), 4);
      Assert.equal(state.getGapBars(), 2);
      Assert.isTrue(state.getAccentOne());
      Assert.isTrue(state.getAccentQuarters());
    });

    test.it('setBPM validates and clamps values', () => {
      state = createState();

      // Valid value
      Assert.equal(state.setBPM(140), 140);
      Assert.equal(state.getBPM(), 140);

      // Below minimum
      Assert.equal(state.setBPM(20), BPM_CONSTANTS.MIN);
      Assert.equal(state.getBPM(), BPM_CONSTANTS.MIN);

      // Above maximum
      Assert.equal(state.setBPM(400), BPM_CONSTANTS.MAX);
      Assert.equal(state.getBPM(), BPM_CONSTANTS.MAX);

      // Decimal values should be rounded
      Assert.equal(state.setBPM(125.7), 126);
      Assert.equal(state.getBPM(), 126);
    });

    test.it('setBPM notifies observers', () => {
      state = createState();
      let notified = false;
      let notifiedValue = null;

      state.subscribe('bpm', (value) => {
        notified = true;
        notifiedValue = value;
      });

      state.setBPM(150);
      Assert.isTrue(notified);
      Assert.equal(notifiedValue, 150);
    });

    test.it('setBPM does not notify if value unchanged', () => {
      state = createState();
      state.setBPM(120); // Set to default

      let callCount = 0;
      state.subscribe('bpm', () => {
        callCount++;
      });

      state.setBPM(120); // Same value
      Assert.equal(callCount, 0);
    });

    test.it('setTimeSignature validates against allowed signatures', () => {
      state = createState();

      // Valid signatures
      state.setTimeSignature(3);
      Assert.equal(state.getTimeSignature(), 3);

      state.setTimeSignature(7);
      Assert.equal(state.getTimeSignature(), 7);
    });

    test.it('setTimeSignature throws on invalid signature', () => {
      state = createState();

      Assert.throws(() => {
        state.setTimeSignature(6);
      }, 'Invalid time signature');

      Assert.throws(() => {
        state.setTimeSignature(2);
      }, 'Invalid time signature');
    });

    test.it('setSubdivision validates against allowed subdivisions', () => {
      state = createState();

      state.setSubdivision(2);
      Assert.equal(state.getSubdivision(), 2);

      state.setSubdivision(3);
      Assert.equal(state.getSubdivision(), 3);

      state.setSubdivision(4);
      Assert.equal(state.getSubdivision(), 4);

      state.setSubdivision(12);
      Assert.equal(state.getSubdivision(), 12);
    });

    test.it('setSubdivision throws on invalid subdivision', () => {
      state = createState();

      Assert.throws(() => {
        state.setSubdivision(5);
      }, 'Invalid subdivision');

      Assert.throws(() => {
        state.setSubdivision(7);
      }, 'Invalid subdivision');
    });

    test.it('setClickBars clamps to valid range', () => {
      state = createState();

      state.setClickBars(8);
      Assert.equal(state.getClickBars(), 8);

      // Below minimum
      Assert.equal(state.setClickBars(0), 1);

      // Above maximum
      Assert.equal(state.setClickBars(20), 8);
    });

    test.it('setGapBars allows zero and clamps to maximum', () => {
      state = createState();

      // Zero is valid
      Assert.equal(state.setGapBars(0), 0);

      // Normal value
      Assert.equal(state.setGapBars(5), 5);

      // Above maximum
      Assert.equal(state.setGapBars(20), 8);
    });

    test.it('toggleAccentOne switches value', () => {
      state = createState();

      const initial = state.getAccentOne();
      const toggled = state.toggleAccentOne();

      Assert.equal(toggled, !initial);
      Assert.equal(state.getAccentOne(), toggled);

      // Toggle again
      const toggledAgain = state.toggleAccentOne();
      Assert.equal(toggledAgain, initial);
    });

    test.it('toggleAccentQuarters switches value', () => {
      state = createState();

      const initial = state.getAccentQuarters();
      const toggled = state.toggleAccentQuarters();

      Assert.equal(toggled, !initial);
      Assert.equal(state.getAccentQuarters(), toggled);
    });

    test.it('resetRuntime clears runtime state', () => {
      state = createState();

      // Modify runtime state
      state.runtime.currentBeat = 3;
      state.runtime.currentSubBeat = 2;
      state.runtime.isGapMode = true;
      state.runtime.barsInCurrentMode = 5;

      state.resetRuntime();

      Assert.equal(state.runtime.currentBeat, 0);
      Assert.equal(state.runtime.currentSubBeat, 0);
      Assert.equal(state.runtime.currentBar, 1);
      Assert.isFalse(state.runtime.isGapMode);
      Assert.equal(state.runtime.barsInCurrentMode, 0);
      Assert.isFalse(state.runtime.isPlaying);
    });

    test.it('advanceSubBeat advances correctly', () => {
      state = createState();
      state.setSubdivision(4);

      Assert.equal(state.runtime.currentSubBeat, 0);

      state.advanceSubBeat();
      Assert.equal(state.runtime.currentSubBeat, 1);

      state.advanceSubBeat();
      Assert.equal(state.runtime.currentSubBeat, 2);
    });

    test.it('advanceSubBeat wraps and advances beat', () => {
      state = createState();
      state.setSubdivision(2);
      state.runtime.currentSubBeat = 1;

      state.advanceSubBeat();

      Assert.equal(state.runtime.currentSubBeat, 0);
      Assert.equal(state.runtime.currentBeat, 1);
    });

    test.it('advanceBeat advances correctly', () => {
      state = createState();

      Assert.equal(state.runtime.currentBeat, 0);

      state.advanceBeat();
      Assert.equal(state.runtime.currentBeat, 1);
    });

    test.it('advanceBeat wraps at time signature', () => {
      state = createState();
      state.setTimeSignature(4);
      state.runtime.currentBeat = 3;

      state.advanceBeat();

      Assert.equal(state.runtime.currentBeat, 0);
      Assert.equal(state.runtime.barsInCurrentMode, 1);
    });

    test.it('advanceBar switches mode after click bars', () => {
      state = createState();
      state.setClickBars(2);
      state.runtime.barsInCurrentMode = 1;
      state.runtime.isGapMode = false;

      state.advanceBar();

      Assert.equal(state.runtime.barsInCurrentMode, 0);
      Assert.isTrue(state.runtime.isGapMode);
    });

    test.it('advanceBar switches mode after gap bars', () => {
      state = createState();
      state.setGapBars(3);
      state.runtime.barsInCurrentMode = 2;
      state.runtime.isGapMode = true;

      state.advanceBar();

      Assert.equal(state.runtime.barsInCurrentMode, 0);
      Assert.isFalse(state.runtime.isGapMode);
    });

    test.it('advanceBar skips gap mode when gapBars is 0', () => {
      state = createState();
      state.setGapBars(0);
      state.setClickBars(2);
      state.runtime.barsInCurrentMode = 1;
      state.runtime.isGapMode = false;

      // Complete click bars, should skip gap mode entirely
      state.advanceBar();

      Assert.equal(state.runtime.barsInCurrentMode, 0);
      Assert.isFalse(state.runtime.isGapMode); // Should NOT enter gap mode
    });

    test.it('observer pattern works correctly', () => {
      state = createState();

      const calls = [];
      const callback = (data) => calls.push(data);

      state.subscribe('test-event', callback);
      state.notify('test-event', 'data1');
      state.notify('test-event', 'data2');

      Assert.equal(calls.length, 2);
      Assert.equal(calls[0], 'data1');
      Assert.equal(calls[1], 'data2');
    });

    test.it('unsubscribe removes callback', () => {
      state = createState();

      let callCount = 0;
      const callback = () => callCount++;

      state.subscribe('test-event', callback);
      state.notify('test-event');
      Assert.equal(callCount, 1);

      state.unsubscribe('test-event', callback);
      state.notify('test-event');
      Assert.equal(callCount, 1); // Should not increase
    });

    test.it('getState returns copy of state', () => {
      state = createState();

      const stateCopy = state.getState();

      Assert.isDefined(stateCopy.config);
      Assert.isDefined(stateCopy.runtime);
      Assert.equal(stateCopy.config.bpm, state.getBPM());

      // Verify it's a copy, not reference
      stateCopy.config.bpm = 999;
      Assert.notEqual(state.getBPM(), 999);
    });

    test.it('setPlaying updates and notifies', () => {
      state = createState();

      let notified = false;
      state.subscribe('playState', (playing) => {
        notified = true;
        Assert.isTrue(playing);
      });

      state.setPlaying(true);
      Assert.isTrue(notified);
      Assert.isTrue(state.isPlaying());
    });

    test.it('setSoundType validates and sets sound type', () => {
      state = createState();

      // Valid sound types
      state.setSoundType('digital');
      Assert.equal(state.getSoundType(), 'digital');

      state.setSoundType('rimshot');
      Assert.equal(state.getSoundType(), 'rimshot');

      state.setSoundType('clave');
      Assert.equal(state.getSoundType(), 'clave');
    });

    test.it('setSoundType throws on invalid sound type', () => {
      state = createState();

      Assert.throws(() => {
        state.setSoundType('invalid');
      }, 'Invalid sound type');

      Assert.throws(() => {
        state.setSoundType('beep');
      }, 'Invalid sound type');
    });

    test.it('setSoundType notifies observers', () => {
      state = createState();
      let notified = false;
      let notifiedValue = null;

      state.subscribe('soundType', (value) => {
        notified = true;
        notifiedValue = value;
      });

      state.setSoundType('hihat');
      Assert.isTrue(notified);
      Assert.equal(notifiedValue, 'hihat');
    });

    test.it('setFlashOnChange sets flash toggle', () => {
      state = createState();

      state.setFlashOnChange(true);
      Assert.isTrue(state.getFlashOnChange());

      state.setFlashOnChange(false);
      Assert.isFalse(state.getFlashOnChange());
    });

    test.it('setFlashOnChange notifies observers', () => {
      state = createState();
      let notified = false;
      let notifiedValue = null;

      state.subscribe('flashOnChange', (value) => {
        notified = true;
        notifiedValue = value;
      });

      state.setFlashOnChange(true);
      Assert.isTrue(notified);
      Assert.isTrue(notifiedValue);
    });

    test.it('setKeepAwake sets wake lock toggle', () => {
      state = createState();

      state.setKeepAwake(true);
      Assert.isTrue(state.getKeepAwake());

      state.setKeepAwake(false);
      Assert.isFalse(state.getKeepAwake());
    });

    test.it('setKeepAwake notifies observers', () => {
      state = createState();
      let notified = false;
      let notifiedValue = null;

      state.subscribe('keepAwake', (value) => {
        notified = true;
        notifiedValue = value;
      });

      state.setKeepAwake(true);
      Assert.isTrue(notified);
      Assert.isTrue(notifiedValue);
    });
  });
}
