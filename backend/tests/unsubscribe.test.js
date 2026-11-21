const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { UnsubscribeManager } = require('../src/services/unsubscribeManager');

describe('Unsubscribe & Suppression List Manager Tests', () => {
  test('should record opt-outs and check suppression status with case insensitivity', () => {
    const manager = new UnsubscribeManager();

    manager.optOut('user@example.com', 'EMAIL', 'USER_REQUEST');
    assert.equal(manager.isSuppressed('user@example.com', 'EMAIL'), true);
    assert.equal(manager.isSuppressed('USER@EXAMPLE.COM', 'EMAIL'), true); // case insensitive

    // Not suppressed on SMS channel
    assert.equal(manager.isSuppressed('user@example.com', 'SMS'), false);
    // Other users not suppressed
    assert.equal(manager.isSuppressed('other@example.com', 'EMAIL'), false);
  });

  test('should scrub audience list and remove suppressed contacts', () => {
    const manager = new UnsubscribeManager();
    manager.optOut('blocked@test.com', 'EMAIL');

    const audience = [
      { id: 1, email: 'active1@test.com' },
      { id: 2, email: 'blocked@test.com' },
      { id: 3, email: 'active2@test.com' }
    ];

    const result = manager.scrubAudience(audience, 'EMAIL');
    assert.equal(result.originalCount, 3);
    assert.equal(result.suppressedCount, 1);
    assert.equal(result.allowed.length, 2);
    assert.equal(result.allowed[0].email, 'active1@test.com');
    assert.equal(result.allowed[1].email, 'active2@test.com');
  });
});
