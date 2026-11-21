/**
 * Cryptographic Webhook Signature Verifier with Timing-Safe Comparison & Replay Protection.
 * Supports Stripe & Twilio style HMAC-SHA256 signature verification.
 */
const crypto = require('crypto');

class WebhookVerifier {
  /**
   * Verifies an incoming HMAC SHA-256 webhook signature.
   * @param {string|Buffer} rawPayload - Raw request body
   * @param {string} signatureHeader - Received signature header (e.g., 't=12345,v1=abcdef...')
   * @param {string} secretKey - Webhook signing secret
   * @param {Object} [options] - { toleranceSeconds: 300 }
   * @returns {Object} { isValid: boolean, reason?: string, timestamp?: number }
   */
  static verifySignature(rawPayload, signatureHeader, secretKey, options = {}) {
    const { toleranceSeconds = 300, now = Date.now() } = options;

    if (!rawPayload || !signatureHeader || !secretKey) {
      return { isValid: false, reason: 'Missing payload, signature header, or secret key' };
    }

    // Parse header: t=TIMESTAMP,v1=SIGNATURE
    let timestamp = null;
    let signatureHex = null;

    const parts = signatureHeader.split(',');
    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key && val) {
        if (key.trim() === 't') timestamp = parseInt(val.trim(), 10);
        if (key.trim() === 'v1') signatureHex = val.trim();
      }
    }

    if (!timestamp || !signatureHex) {
      // Fallback: check if header is directly the hex signature
      if (/^[0-9a-f]{64}$/i.test(signatureHeader.trim())) {
        signatureHex = signatureHeader.trim();
      } else {
        return { isValid: false, reason: 'Malformed signature header format' };
      }
    }

    // Replay attack prevention check
    if (timestamp) {
      const currentTimeSec = Math.floor(now / 1000);
      const diffSec = Math.abs(currentTimeSec - timestamp);
      if (diffSec > toleranceSeconds) {
        return { isValid: false, reason: `Timestamp outside tolerance window (${diffSec}s > ${toleranceSeconds}s)` };
      }
    }

    // Compute expected HMAC SHA-256
    const payloadStringToSign = timestamp ? `${timestamp}.${rawPayload}` : rawPayload;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payloadStringToSign);
    const expectedSignatureHex = hmac.digest('hex');

    // Timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignatureHex, 'utf8');
    const actualBuffer = Buffer.from(signatureHex, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return { isValid: false, reason: 'Signature mismatch' };
    }

    const isValid = crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    return {
      isValid,
      reason: isValid ? null : 'Signature mismatch',
      timestamp
    };
  }

  /**
   * Helper to sign a payload (used by test suites and sender webhooks).
   */
  static signPayload(rawPayload, secretKey, timestamp = Math.floor(Date.now() / 1000)) {
    const payloadStringToSign = `${timestamp}.${rawPayload}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payloadStringToSign);
    const signatureHex = hmac.digest('hex');
    return `t=${timestamp},v1=${signatureHex}`;
  }
}

module.exports = { WebhookVerifier };
