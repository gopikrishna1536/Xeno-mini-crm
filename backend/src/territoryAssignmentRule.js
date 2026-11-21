/**
 * Sales Territory Round-Robin Lead Assigner
 */
class TerritoryAssignmentRule {
  static assignLead(leadRegion, salesReps) {
    const eligibleReps = salesReps.filter(r => r.regions.includes(leadRegion) && r.isActive);
    if (eligibleReps.length === 0) {
      return { assignedRepId: null, message: 'No active rep available in region' };
    }

    // Assign to rep with lowest active lead count
    eligibleReps.sort((a, b) => a.activeLeadCount - b.activeLeadCount);
    const chosen = eligibleReps[0];
    chosen.activeLeadCount += 1;

    return {
      assignedRepId: chosen.id,
      repName: chosen.name,
      region: leadRegion
    };
  }
}

module.exports = TerritoryAssignmentRule;
