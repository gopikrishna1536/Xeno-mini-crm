const test = require('node:test');
const assert = require('node:assert/strict');
const ChurnProbabilityScore = require('../src/churnProbabilityScore');

test('Churn Risk Model Tests', async (t) => {
  await t.test('should flag dormant detractor customer with critical churn warning', () => {
    // 70 days inactive (40), 100 days no purchase (30), NPS 4 (15) -> 85%
    const res = ChurnProbabilityScore.evaluateRisk(70, 100, 1, 4);
    assert.equal(res.churnProbabilityPercent, 85);
    assert.equal(res.riskTier, 'CRITICAL_CHURN_RISK');
    assert.equal(res.interventionRecommended, true);
  });
});
