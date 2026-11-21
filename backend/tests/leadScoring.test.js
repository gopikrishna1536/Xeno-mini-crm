const test = require('node:test');
const assert = require('node:assert/strict');
const LeadScoringEngine = require('../src/leadScoringEngine');

test('Lead Scoring Engine Tests', async (t) => {
  await t.test('should classify high-intent prospect as MQL', () => {
    const events = [
      { type: 'EMAIL_OPEN' },       // 2
      { type: 'EMAIL_CLICK' },      // 5
      { type: 'PRICING_PAGE_VIEW' }, // 15
      { type: 'DEMO_REQUEST' }       // 40 -> Total 62
    ];
    const res = LeadScoringEngine.scoreLead(events);
    assert.equal(res.totalScore, 62);
    assert.equal(res.qualificationTier, 'MARKETING_QUALIFIED_LEAD');
    assert.equal(res.isSalesReady, true);
  });
});
