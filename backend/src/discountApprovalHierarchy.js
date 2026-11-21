/**
 * Sales Quote Discount Delegation Authority Validator
 * Rep: <= 10%
 * Sales Manager: <= 25%
 * VP of Sales: <= 40%
 * CEO / Board: > 40%
 */
class DiscountApprovalHierarchy {
  static getRequiredApprover(discountPercent) {
    if (discountPercent <= 10) return { tier: 'SALES_REP', requiresEscalation: false };
    if (discountPercent <= 25) return { tier: 'SALES_MANAGER', requiresEscalation: true };
    if (discountPercent <= 40) return { tier: 'VP_SALES', requiresEscalation: true };
    return { tier: 'CEO_BOARD', requiresEscalation: true };
  }
}

module.exports = DiscountApprovalHierarchy;
