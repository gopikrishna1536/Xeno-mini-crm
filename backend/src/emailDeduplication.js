/**
 * Contact Email Normalization & Deduplication Filter
 * Strips Gmail dots and plus-addressing (e.g. john.doe+promo@gmail.com -> johndoe@gmail.com)
 */
class EmailDeduplication {
  static normalizeEmail(email) {
    if (!email) return '';
    const clean = email.trim().toLowerCase();
    const [localPart, domain] = clean.split('@');
    if (!domain) return clean;

    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      const strippedDots = localPart.replace(/\./g, '');
      const withoutPlus = strippedDots.split('+')[0];
      return `${withoutPlus}@gmail.com`;
    }

    return clean;
  }

  static deduplicateContacts(contacts) {
    const seen = new Set();
    const unique = [];
    const duplicates = [];

    for (const c of contacts) {
      const norm = EmailDeduplication.normalizeEmail(c.email);
      if (seen.has(norm)) {
        duplicates.push(c);
      } else {
        seen.add(norm);
        unique.push({ ...c, normalizedEmail: norm });
      }
    }

    return {
      originalCount: contacts.length,
      uniqueCount: unique.length,
      duplicateCount: duplicates.length,
      uniqueContacts: unique
    };
  }
}

module.exports = EmailDeduplication;
