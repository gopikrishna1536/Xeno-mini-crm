const test = require('node:test');
const assert = require('node:assert/strict');
const CustomerJourneyMilestones = require('../src/customerJourneyMilestones');

test('Customer Journey Milestones Tests', async (t) => {
  await t.test('should validate forward lifecycle progression', () => {
    assert.equal(CustomerJourneyMilestones.canTransition('LEAD', 'MQL'), true);
    assert.equal(CustomerJourneyMilestones.canTransition('CUSTOMER', 'MQL'), false);
    assert.equal(CustomerJourneyMilestones.canTransition('CUSTOMER', 'CHURNED'), true);
  });
});
