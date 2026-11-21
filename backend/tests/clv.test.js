const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { ClvPredictor } = require('../src/services/clvPredictor');

describe('RFM Segmentation & Customer Lifetime Value (CLV) Tests', () => {
  test('should classify high-frequency, recent, high-spend customer as CHAMPIONS', () => {
    const customer = {
      daysSinceLastOrder: 5,
      orderCount: 15,
      totalSpend: 3500
    };

    const rfm = ClvPredictor.computeRfmScores(customer);
    assert.equal(rfm.rScore, 5);
    assert.equal(rfm.fScore, 5);
    assert.equal(rfm.mScore, 5);
    assert.equal(rfm.rfmCode, '555');
    assert.equal(rfm.segment, 'CHAMPIONS');
  });

  test('should classify lapsed valuable customer as AT_RISK_HIGH_VALUE', () => {
    const customer = {
      daysSinceLastOrder: 95,
      orderCount: 8,
      totalSpend: 2200
    };

    const rfm = ClvPredictor.computeRfmScores(customer);
    assert.equal(rfm.rScore, 1);
    assert.equal(rfm.fScore, 4);
    assert.equal(rfm.segment, 'AT_RISK_HIGH_VALUE');
  });

  test('should estimate low churn risk for active customers and high churn for lapsed customers', () => {
    const activeRisk = ClvPredictor.estimateChurnRisk(10, 30);
    const lapsedRisk = ClvPredictor.estimateChurnRisk(120, 30);

    assert.ok(activeRisk < 20); // Low churn risk
    assert.ok(lapsedRisk > 80); // High churn risk
  });

  test('should project 12-month forward CLV with profit margin adjustment', () => {
    const customer = {
      daysSinceLastOrder: 14,
      orderCount: 4,
      totalSpend: 800 // AOV = $200
    };

    const projection = ClvPredictor.project12MonthClv(customer, { profitMargin: 0.20, averageCycleDays: 30 });
    assert.equal(projection.averageOrderValue, 200);
    assert.ok(projection.projected12MonthSpend > 0);
    assert.ok(projection.projected12MonthClv > 0);
    assert.equal(projection.rfm.segment, 'LOYAL_CUSTOMERS');
  });
});
