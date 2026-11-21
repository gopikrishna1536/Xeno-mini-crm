/**
 * Customer Dormancy & Churn Risk Predictor
 */
class ChurnProbabilityScore {
  static evaluateRisk(daysSinceLastLogin, daysSinceLastPurchase, supportTicketsOpenedLast30Days, npsScore) {
    let riskPoints = 0;

    if (daysSinceLastLogin > 60) riskPoints += 40;
    else if (daysSinceLastLogin > 30) riskPoints += 20;

    if (daysSinceLastPurchase > 90) riskPoints += 30;
    else if (daysSinceLastPurchase > 45) riskPoints += 15;

    if (supportTicketsOpenedLast30Days >= 3) riskPoints += 15;
    if (npsScore !== null && npsScore <= 6) riskPoints += 15;

    const churnProbabilityPercent = Math.min(100, riskPoints);
    let riskTier = 'LOW';
    if (churnProbabilityPercent >= 70) riskTier = 'CRITICAL_CHURN_RISK';
    else if (churnProbabilityPercent >= 40) riskTier = 'MODERATE';

    return {
      churnProbabilityPercent,
      riskTier,
      interventionRecommended: churnProbabilityPercent >= 40
    };
  }
}

module.exports = ChurnProbabilityScore;
