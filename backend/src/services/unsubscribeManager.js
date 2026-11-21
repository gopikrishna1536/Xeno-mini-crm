/**
 * Unsubscribe & Suppression List Manager for CAN-SPAM and GDPR Compliance.
 * Automatically filters suppressed contacts prior to campaign dispatch.
 */

class UnsubscribeManager {
  constructor() {
    this.suppressionMap = new Map(); // key: channel:identifier -> { reason, timestamp }
  }

  static makeKey(identifier, channel = 'EMAIL') {
    return `${channel.toUpperCase()}:${String(identifier).trim().toLowerCase()}`;
  }

  /**
   * Adds an email or phone number to the suppression list.
   */
  optOut(identifier, channel = 'EMAIL', reason = 'USER_UNSUBSCRIBE') {
    if (!identifier) return false;
    const key = UnsubscribeManager.makeKey(identifier, channel);
    this.suppressionMap.set(key, {
      identifier: String(identifier).trim().toLowerCase(),
      channel: channel.toUpperCase(),
      reason,
      timestamp: new Date().toISOString()
    });
    return true;
  }

  /**
   * Checks if an identifier is suppressed.
   */
  isSuppressed(identifier, channel = 'EMAIL') {
    if (!identifier) return false;
    const key = UnsubscribeManager.makeKey(identifier, channel);
    return this.suppressionMap.has(key);
  }

  /**
   * Scrubs a recipient audience list by removing suppressed users.
   */
  scrubAudience(recipients = [], channel = 'EMAIL') {
    if (!Array.isArray(recipients)) return { allowed: [], suppressedCount: 0 };

    const allowed = [];
    let suppressedCount = 0;

    recipients.forEach(contact => {
      const id = channel === 'EMAIL' ? contact.email : contact.phone;
      if (this.isSuppressed(id, channel)) {
        suppressedCount++;
      } else {
        allowed.push(contact);
      }
    });

    return {
      allowed,
      suppressedCount,
      originalCount: recipients.length
    };
  }

  getSuppressionCount() {
    return this.suppressionMap.size;
  }
}

module.exports = { UnsubscribeManager };
