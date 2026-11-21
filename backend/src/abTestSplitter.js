const crypto = require('node:crypto');

/**
 * Deterministic Customer Audience A/B Split Test Partitioner
 */
class AbTestSplitter {
  static assignVariant(customerId, experimentId, splitRatioA = 0.5) {
    const hash = crypto
      .createHash('md5')
      .update(`${experimentId}:${customerId}`)
      .digest('hex');

    // Convert first 4 bytes of hex to float in [0, 1)
    const intVal = parseInt(hash.slice(0, 8), 16);
    const bucket = intVal / 0xffffffff;

    return bucket < splitRatioA ? 'VARIANT_A' : 'VARIANT_B';
  }
}

module.exports = AbTestSplitter;
