const crypto = require('node:crypto');

/**
 * CRM Field Change Audit Log Serializer with Hash Chain
 */
class AuditTrailLogger {
  static createAuditEntry(entityType, entityId, fieldName, oldValue, newValue, userId, previousHash = 'GENESIS') {
    const timestamp = new Date().toISOString();
    const dataString = `${timestamp}:${entityType}:${entityId}:${fieldName}:${oldValue}:${newValue}:${userId}:${previousHash}`;
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    return {
      timestamp,
      entityType,
      entityId,
      fieldName,
      oldValue,
      newValue,
      userId,
      previousHash,
      hash
    };
  }
}

module.exports = AuditTrailLogger;
