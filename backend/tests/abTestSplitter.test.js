const test = require('node:test');
const assert = require('node:assert/strict');
const AbTestSplitter = require('../src/abTestSplitter');

test('A/B Test Splitter Tests', async (t) => {
  await t.test('should assign deterministic variant for same customer and experiment', () => {
    const v1 = AbTestSplitter.assignVariant('CUST-100', 'EXP-SUMMER');
    const v2 = AbTestSplitter.assignVariant('CUST-100', 'EXP-SUMMER');
    assert.equal(v1, v2);
  });
});
