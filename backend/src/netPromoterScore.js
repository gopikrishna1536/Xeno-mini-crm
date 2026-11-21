/**
 * Net Promoter Score (NPS) Categorizer
 * NPS = % Promoters (9-10) - % Detractors (0-6)
 */
class NetPromoterScore {
  static calculateNPS(ratings) {
    if (!ratings || ratings.length === 0) return { nps: 0, count: 0 };

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    for (const r of ratings) {
      if (r >= 9) promoters++;
      else if (r >= 7) passives++;
      else detractors++;
    }

    const n = ratings.length;
    const promoterPct = (promoters / n) * 100;
    const detractorPct = (detractors / n) * 100;
    const nps = Math.round(promoterPct - detractorPct);

    return {
      sampleSize: n,
      promotersCount: promoters,
      passivesCount: passives,
      detractorsCount: detractors,
      netPromoterScore: nps
    };
  }
}

module.exports = NetPromoterScore;
