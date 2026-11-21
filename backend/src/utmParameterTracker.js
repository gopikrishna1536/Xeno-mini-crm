/**
 * Marketing Campaign UTM Parameter Parser & Attribution Tracker
 */
class UtmParameterTracker {
  static parseUtmParams(urlString) {
    try {
      const url = new URL(urlString);
      return {
        source: url.searchParams.get('utm_source') || 'direct',
        medium: url.searchParams.get('utm_medium') || 'none',
        campaign: url.searchParams.get('utm_campaign') || 'unspecified',
        term: url.searchParams.get('utm_term') || null,
        content: url.searchParams.get('utm_content') || null
      };
    } catch {
      return {
        source: 'direct',
        medium: 'none',
        campaign: 'unspecified',
        term: null,
        content: null
      };
    }
  }
}

module.exports = UtmParameterTracker;
