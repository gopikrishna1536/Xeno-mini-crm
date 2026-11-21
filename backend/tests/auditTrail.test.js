const test = require('node:test');
const assert = require('node:assert/strict');
const AuditTrailLogger = require('../src/auditTrailLogger');

test('Audit Trail Tests', async (t) => {
  await t.test('should create verifiable audit log with SHA-256 hash', () => {
    const entry = AuditTrailLogger.createAuditEntry('DEAL', 'D-1', 'stage', 'PROSPECT', 'CLOSED_WON', 'USER-1');
    assert.equal(entry.entityType, 'DEAL');
    assert.ok(entry.hash.length === 64);
  });
});
