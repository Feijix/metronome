// Simple Test Framework
export class TestFramework {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.suites = new Map();
    this.currentSuite = null;
  }

  describe(suiteName, suiteFunction) {
    this.currentSuite = suiteName;
    if (!this.suites.has(suiteName)) {
      this.suites.set(suiteName, []);
    }
    suiteFunction();
    this.currentSuite = null;
  }

  it(testName, testFunction) {
    const fullName = this.currentSuite ? `${this.currentSuite} - ${testName}` : testName;
    this.tests.push({
      name: fullName,
      suite: this.currentSuite,
      fn: testFunction
    });
  }

  async run() {
    console.log('🧪 Starting Test Suite...\n');
    this.passed = 0;
    this.failed = 0;
    const results = [];

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        results.push({
          name: test.name,
          suite: test.suite,
          status: 'passed'
        });
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.failed++;
        results.push({
          name: test.name,
          suite: test.suite,
          status: 'failed',
          error: error.message
        });
        console.error(`❌ ${test.name}`);
        console.error(`   ${error.message}`);
      }
    }

    this.printSummary(results);
    return results;
  }

  printSummary(results) {
    const total = this.passed + this.failed;
    const passRate = ((this.passed / total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Total: ${total} | Passed: ${this.passed} | Failed: ${this.failed}`);
    console.log(`Pass Rate: ${passRate}%`);

    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }

    console.log('='.repeat(50));
  }

  reset() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.suites.clear();
  }
}

// Assertions
export class Assert {
  static equal(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }

  static notEqual(actual, expected, message = '') {
    if (actual === expected) {
      throw new Error(message || `Expected values to not be equal`);
    }
  }

  static deepEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, but got ${actualStr}`);
    }
  }

  static isTrue(value, message = '') {
    if (value !== true) {
      throw new Error(message || `Expected true, but got ${value}`);
    }
  }

  static isFalse(value, message = '') {
    if (value !== false) {
      throw new Error(message || `Expected false, but got ${value}`);
    }
  }

  static throws(fn, expectedError, message = '') {
    try {
      fn();
      throw new Error(message || 'Expected function to throw an error');
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(message || `Expected error containing "${expectedError}", but got "${error.message}"`);
      }
    }
  }

  static async throwsAsync(fn, expectedError, message = '') {
    try {
      await fn();
      throw new Error(message || 'Expected async function to throw an error');
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(message || `Expected error containing "${expectedError}", but got "${error.message}"`);
      }
    }
  }

  static isNull(value, message = '') {
    if (value !== null) {
      throw new Error(message || `Expected null, but got ${value}`);
    }
  }

  static isNotNull(value, message = '') {
    if (value === null) {
      throw new Error(message || 'Expected value to not be null');
    }
  }

  static isUndefined(value, message = '') {
    if (value !== undefined) {
      throw new Error(message || `Expected undefined, but got ${value}`);
    }
  }

  static isDefined(value, message = '') {
    if (value === undefined) {
      throw new Error(message || 'Expected value to be defined');
    }
  }

  static greaterThan(actual, expected, message = '') {
    if (actual <= expected) {
      throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
  }

  static lessThan(actual, expected, message = '') {
    if (actual >= expected) {
      throw new Error(message || `Expected ${actual} to be less than ${expected}`);
    }
  }

  static includes(array, value, message = '') {
    if (!array.includes(value)) {
      throw new Error(message || `Expected array to include ${value}`);
    }
  }

  static notIncludes(array, value, message = '') {
    if (array.includes(value)) {
      throw new Error(message || `Expected array to not include ${value}`);
    }
  }

  static instanceOf(object, constructor, message = '') {
    if (!(object instanceof constructor)) {
      throw new Error(message || `Expected object to be instance of ${constructor.name}`);
    }
  }

  static match(string, regex, message = '') {
    if (!regex.test(string)) {
      throw new Error(message || `Expected "${string}" to match ${regex}`);
    }
  }
}

// Mock helpers
export class MockHelper {
  static createMockElement(id, tagName = 'div') {
    const el = document.createElement(tagName);
    el.id = id;
    return el;
  }

  static createMockElements(config) {
    const elements = {};
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        elements[key] = this.createMockElement(value);
      } else {
        elements[key] = this.createMockElement(value.id, value.tag);
      }
    }
    return elements;
  }

  static spy(obj, methodName) {
    const original = obj[methodName];
    const calls = [];

    obj[methodName] = function(...args) {
      calls.push(args);
      return original.apply(this, args);
    };

    return {
      calls,
      restore: () => {
        obj[methodName] = original;
      }
    };
  }

  static stub(obj, methodName, returnValue) {
    const original = obj[methodName];

    obj[methodName] = function() {
      return returnValue;
    };

    return {
      restore: () => {
        obj[methodName] = original;
      }
    };
  }
}
