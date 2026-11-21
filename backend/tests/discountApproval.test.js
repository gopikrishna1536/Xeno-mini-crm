const test = require('node:test');
const assert = require('node:assert/strict');
const DiscountApprovalHierarchy = require('../src/discountApprovalHierarchy');

test('Discount Approval Hierarchy Tests', async (t) => {
  await t.test('should escalate 30% enterprise discount to VP of Sales', () => {
    const res = DiscountApprovalHierarchy.getRequiredApprover(30);
    assert.equal(res.tier, 'VP_SALES');
    assert.equal(res.requiresEscalation, true);
  });
});
