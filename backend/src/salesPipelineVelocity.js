/**
 * Sales Pipeline Revenue Velocity Calculator
 * Velocity = (Number of Opportunities * Win Rate * Average Deal Size) / Sales Cycle Days
 */
class SalesPipelineVelocity {
  static computeVelocity(numOpportunities, winRatePercent, avgDealSize, salesCycleDays) {
    if (salesCycleDays <= 0) throw new Error('Sales cycle days must be positive');

    const winRate = winRatePercent / 100.0;
    const velocityPerDay = (numOpportunities * winRate * avgDealSize) / salesCycleDays;
    const velocityPerMonth = velocityPerDay * 30;

    return {
      opportunities: numOpportunities,
      winRatePercent,
      avgDealSize,
      salesCycleDays,
      revenueVelocityPerDay: Number(velocityPerDay.toFixed(2)),
      projectedMonthlyRevenuePipeline: Number(velocityPerMonth.toFixed(2))
    };
  }
}

module.exports = SalesPipelineVelocity;
