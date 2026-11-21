const test = require('node:test');
const assert = require('node:assert/strict');
const SalesPipelineVelocity = require('../src/salesPipelineVelocity');

test('Pipeline Velocity Tests', async (t) => {
  await t.test('should calculate daily and monthly pipeline velocity', () => {
    // 50 opps * 20% win (10 wins) * $10,000 avg ($100k) / 50 days = $2,000/day ($60,000/month)
    const res = SalesPipelineVelocity.computeVelocity(50, 20, 10000, 50);
    assert.equal(res.revenueVelocityPerDay, 2000.0);
    assert.equal(res.projectedMonthlyRevenuePipeline, 60000.0);
  });
});
