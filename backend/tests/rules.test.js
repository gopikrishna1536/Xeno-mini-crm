const { test, describe } = require('node:test');
const assert = require('node:assert');

// Pure segmentation logic helper for testability
function evaluateCustomerAgainstRules(customer, rules) {
  if (rules.min_spend !== undefined && customer.total_spend < rules.min_spend) return false;
  if (rules.max_spend !== undefined && customer.total_spend > rules.max_spend) return false;
  if (rules.min_orders !== undefined && customer.total_orders < rules.min_orders) return false;
  if (rules.max_orders !== undefined && customer.total_orders > rules.max_orders) return false;
  if (rules.city && customer.city.toLowerCase() !== rules.city.toLowerCase()) return false;
  if (rules.gender && customer.gender !== rules.gender) return false;
  if (rules.min_age !== undefined && customer.age < rules.min_age) return false;
  if (rules.max_age !== undefined && customer.age > rules.max_age) return false;
  if (rules.has_tag && (!customer.tags || !customer.tags.includes(rules.has_tag))) return false;
  return true;
}

function classifyCustomerLifecycle(lastOrderDate) {
  if (!lastOrderDate) return 'inactive';
  const now = new Date();
  const diffDays = (now - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24);

  if (diffDays <= 30) return 'active';
  if (diffDays <= 90) return 'atRisk';
  return 'churned';
}

describe('Xeno CRM Customer Rule Evaluation Engine', () => {
  const sampleCustomer = {
    id: 'c1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    city: 'Mumbai',
    gender: 'female',
    age: 28,
    total_spend: 15400,
    total_orders: 8,
    tags: ['vip', 'electronics'],
    last_order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  };

  test('should match customer when rules are satisfied', () => {
    const rules = {
      min_spend: 10000,
      min_orders: 5,
      city: 'mumbai',
      has_tag: 'vip'
    };
    assert.strictEqual(evaluateCustomerAgainstRules(sampleCustomer, rules), true);
  });

  test('should reject customer when min_spend threshold is not met', () => {
    const rules = { min_spend: 20000 };
    assert.strictEqual(evaluateCustomerAgainstRules(sampleCustomer, rules), false);
  });

  test('should reject customer when city does not match', () => {
    const rules = { city: 'Bengaluru' };
    assert.strictEqual(evaluateCustomerAgainstRules(sampleCustomer, rules), false);
  });

  test('should accurately classify lifecycle into active, atRisk, and churned', () => {
    const now = Date.now();
    const activeDate = new Date(now - 10 * 86400000).toISOString();
    const atRiskDate = new Date(now - 45 * 86400000).toISOString();
    const churnedDate = new Date(now - 120 * 86400000).toISOString();

    assert.strictEqual(classifyCustomerLifecycle(activeDate), 'active');
    assert.strictEqual(classifyCustomerLifecycle(atRiskDate), 'atRisk');
    assert.strictEqual(classifyCustomerLifecycle(churnedDate), 'churned');
    assert.strictEqual(classifyCustomerLifecycle(null), 'inactive');
  });
});
