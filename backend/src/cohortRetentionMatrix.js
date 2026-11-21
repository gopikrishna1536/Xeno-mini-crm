/**
 * Customer Cohort Retention Matrix Generator
 */
class CohortRetentionMatrix {
  static computeRetention(initialCohortSize, monthlyActiveCounts) {
    if (initialCohortSize <= 0) throw new Error('Initial cohort size must be positive');

    const percentages = monthlyActiveCounts.map(count => {
      return Number(((count / initialCohortSize) * 100).toFixed(1));
    });

    return {
      initialCohortSize,
      retentionPercentages: percentages
    };
  }
}

module.exports = CohortRetentionMatrix;
