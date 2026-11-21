/**
 * RFM Segmentation, Churn Probability, and Customer Lifetime Value (CLV) Predictor.
 */

class ClvPredictor {
  /**
   * Computes RFM scores (1 to 5) for a customer based on distribution thresholds.
   */
  static computeRfmScores(customer, options = {}) {
    const {
      daysSinceLastOrder,
      orderCount,
      totalSpend
    } = customer;

    // Recency: Fewer days = Higher score
    let rScore = 1;
    if (daysSinceLastOrder <= 15) rScore = 5;
    else if (daysSinceLastOrder <= 30) rScore = 4;
    else if (daysSinceLastOrder <= 60) rScore = 3;
    else if (daysSinceLastOrder <= 90) rScore = 2;

    // Frequency: More orders = Higher score
    let fScore = 1;
    if (orderCount >= 10) fScore = 5;
    else if (orderCount >= 6) fScore = 4;
    else if (orderCount >= 3) fScore = 3;
    else if (orderCount >= 2) fScore = 2;

    // Monetary: Higher spend = Higher score
    let mScore = 1;
    if (totalSpend >= 2500) mScore = 5;
    else if (totalSpend >= 1000) mScore = 4;
    else if (totalSpend >= 500) mScore = 3;
    else if (totalSpend >= 200) mScore = 2;

    const rfmCode = `${rScore}${fScore}${mScore}`;
    let segment = 'HIBERNATING';

    if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
      segment = 'CHAMPIONS';
    } else if (rScore >= 3 && fScore >= 3 && mScore >= 3) {
      segment = 'LOYAL_CUSTOMERS';
    } else if (rScore >= 4 && fScore <= 2) {
      segment = 'POTENTIAL_LOYALISTS';
    } else if (rScore <= 2 && fScore >= 3) {
      segment = 'AT_RISK_HIGH_VALUE';
    } else if (rScore === 1 && fScore <= 2) {
      segment = 'LOST_CHURNED';
    }

    return {
      rScore,
      fScore,
      mScore,
      rfmCode,
      segment
    };
  }

  /**
   * Estimates probability of churn (0% - 100%) based on purchase inactivity.
   */
  static estimateChurnRisk(daysSinceLastOrder, averageCycleDays = 30) {
    if (daysSinceLastOrder <= 0) return 0;
    const ratio = daysSinceLastOrder / averageCycleDays;
    // Logistic decay curve modeling
    const churnProb = 1.0 / (1.0 + Math.exp(-1.5 * (ratio - 1.8)));
    return Math.round(churnProb * 1000) / 10;
  }

  /**
   * Projects 12-month forward Customer Lifetime Value (CLV).
   */
  static project12MonthClv(customer, options = {}) {
    const { profitMargin = 0.25, averageCycleDays = 30 } = options;
    const { totalSpend, orderCount, daysSinceLastOrder } = customer;

    if (orderCount <= 0 || totalSpend <= 0) {
      return {
        projected12MonthSpend: 0,
        projected12MonthClv: 0,
        churnProbabilityPct: 100,
        segment: 'INACTIVE'
      };
    }

    const aov = totalSpend / orderCount; // Average Order Value
    const annualPurchases = (365 / averageCycleDays);
    const churnProbPct = ClvPredictor.estimateChurnRisk(daysSinceLastOrder, averageCycleDays);
    const retentionRate = Math.max(0.05, 1.0 - (churnProbPct / 100.0));

    const projectedSpend = Math.round(aov * annualPurchases * retentionRate * 100) / 100;
    const projectedClv = Math.round(projectedSpend * profitMargin * 100) / 100;

    const rfm = ClvPredictor.computeRfmScores(customer);

    return {
      averageOrderValue: Math.round(aov * 100) / 100,
      annualizedPurchaseRate: Math.round(annualPurchases * 10) / 10,
      churnProbabilityPct: churnProbPct,
      retentionRatePct: Math.round(retentionRate * 1000) / 10,
      projected12MonthSpend: projectedSpend,
      projected12MonthClv: projectedClv,
      rfm
    };
  }
}

module.exports = { ClvPredictor };
