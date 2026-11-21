/**
 * Behavioral Lead Scoring & Sales Qualification Engine
 */
class LeadScoringEngine {
  static scoreLead(events) {
    let score = 0;

    for (const ev of events) {
      if (ev.type === 'EMAIL_OPEN') score += 2;
      else if (ev.type === 'EMAIL_CLICK') score += 5;
      else if (ev.type === 'PRICING_PAGE_VIEW') score += 15;
      else if (ev.type === 'DEMO_REQUEST') score += 40;
      else if (ev.type === 'WEBINAR_ATTENDED') score += 20;
    }

    let tier = 'COLD';
    if (score >= 60) tier = 'MARKETING_QUALIFIED_LEAD';
    else if (score >= 25) tier = 'WARM';

    return {
      totalScore: score,
      qualificationTier: tier,
      isSalesReady: score >= 60
    };
  }
}

module.exports = LeadScoringEngine;
