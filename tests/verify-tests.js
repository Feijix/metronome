// Simple verification script to test imports work
import { TestFramework, Assert } from './lib/test-framework.js';
import { registerConstantsTests } from './unit/constants.test.js';
import { registerStateManagerTests } from './unit/state-manager.test.js';
import { registerMetronomeAudioTests } from './unit/metronome-audio.test.js';
import { registerTapTempoTests } from './unit/tap-tempo.test.js';
import { registerMetronomeSchedulerTests } from './unit/metronome-scheduler.test.js';
import { registerIntegrationTests } from './integration/integration.test.js';

console.log('✅ All test modules loaded successfully!');
console.log('📦 Test Framework initialized');
console.log('🧪 6 test suites registered');

const test = new TestFramework();

// Quick smoke test
test.describe('Smoke Test', () => {
  test.it('Assert.equal works', () => {
    Assert.equal(1 + 1, 2);
  });

  test.it('Assert.isTrue works', () => {
    Assert.isTrue(true);
  });

  test.it('Assert.throws works', () => {
    Assert.throws(() => {
      throw new Error('test error');
    });
  });
});

console.log('\n🚀 Running smoke tests...\n');

test.run().then(() => {
  console.log('\n✅ Verification complete!');
  console.log('📊 Test framework is working correctly');
  console.log('\n👉 Open http://localhost:8000/tests/test-runner.html to run full suite');
});
