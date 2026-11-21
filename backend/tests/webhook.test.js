const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { WebhookVerifier } = require('../src/utils/webhookVerifier');

describe('Cryptographic Webhook Signature Verifier Tests', () => {
  const secretKey = 'whsec_test_secret_key_12345';
  const payload = JSON.stringify({ event: 'delivery_status', id: 'del_101', status: 'DELIVERED' });

  test('should successfully verify valid signed webhook payload', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = WebhookVerifier.signPayload(payload, secretKey, timestamp);

    const res = WebhookVerifier.verifySignature(payload, signature, secretKey);
    assert.equal(res.isValid, true);
    assert.equal(res.reason, null);
    assert.equal(res.timestamp, timestamp);
  });

  test('should reject tampered payload content with valid signature', () => {
    const signature = WebhookVerifier.signPayload(payload, secretKey);
    const tamperedPayload = JSON.stringify({ event: 'delivery_status', id: 'del_101', status: 'FAILED' });

    const res = WebhookVerifier.verifySignature(tamperedPayload, signature, secretKey);
    assert.equal(res.isValid, false);
    assert.equal(res.reason, 'Signature mismatch');
  });

  test('should reject signature created with wrong secret key', () => {
    const signature = WebhookVerifier.signPayload(payload, 'wrong_key');

    const res = WebhookVerifier.verifySignature(payload, signature, secretKey);
    assert.equal(res.isValid, false);
    assert.equal(res.reason, 'Signature mismatch');
  });

  test('should reject replay attacks with expired timestamps outside tolerance window', () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const signature = WebhookVerifier.signPayload(payload, secretKey, oldTimestamp);

    const res = WebhookVerifier.verifySignature(payload, signature, secretKey, { toleranceSeconds: 300 });
    assert.equal(res.isValid, false);
    assert.ok(res.reason.includes('outside tolerance window'));
  });
});
