/**
 * Customer Lifecycle Stage Transition State Machine
 */
class CustomerJourneyMilestones {
  static STAGES = ['SUBSCRIBER', 'LEAD', 'MQL', 'SQL', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'];

  static canTransition(currentStage, nextStage) {
    const currIdx = CustomerJourneyMilestones.STAGES.indexOf(currentStage);
    const nextIdx = CustomerJourneyMilestones.STAGES.indexOf(nextStage);

    if (currIdx === -1 || nextIdx === -1) return false;
    // Allow forward progression or transition to CHURNED
    return nextIdx > currIdx || nextStage === 'CHURNED';
  }
}

module.exports = CustomerJourneyMilestones;
