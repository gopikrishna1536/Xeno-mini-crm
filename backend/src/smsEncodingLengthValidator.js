/**
 * SMS Encoding (GSM-7 vs UCS-2) & Segment Partitioner
 */
class SmsEncodingLengthValidator {
  static GSM7_CHARS = new Set("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà");

  static analyzeMessage(text) {
    let isGsm7 = true;
    for (const ch of text) {
      if (!SmsEncodingLengthValidator.GSM7_CHARS.has(ch)) {
        isGsm7 = false;
        break;
      }
    }

    const encoding = isGsm7 ? 'GSM-7' : 'UCS-2';
    const singleLimit = isGsm7 ? 160 : 70;
    const multiLimit = isGsm7 ? 153 : 67;

    const charCount = text.length;
    let segments = 1;
    if (charCount > singleLimit) {
      segments = Math.ceil(charCount / multiLimit);
    }

    return {
      charCount,
      encoding,
      segmentsCount: segments,
      singleMessageLimit: singleLimit
    };
  }
}

module.exports = SmsEncodingLengthValidator;
