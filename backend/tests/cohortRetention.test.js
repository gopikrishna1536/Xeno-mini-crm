const test = require('node:test');
const assert = require('node:assert/strict');
const CohortRetentionMatrix = require('../src/cohortRetentionMatrix');

test('Cohort Retention Tests', async (t) => {
  await t.test('should compute monthly retention percentages', () => {
    // 1000 users: M1=800 (80%), M2=600 (60%), M3=500 (50%)
    const res = CohortRetentionMatrix.computeRetention(1000, [800, 600, 500]);
    assert.deepEqual(res.retentionPercentages, [80.0, 60.0, 50.0]);
  });
});
