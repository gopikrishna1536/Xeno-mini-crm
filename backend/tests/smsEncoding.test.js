const test = require('node:test');
const assert = require('node:assert/strict');
const SmsEncodingLengthValidator = require('../src/smsEncodingLengthValidator');

test('SMS Encoding Tests', async (t) => {
  await t.test('should detect GSM-7 standard ASCII text', () => {
    const res = SmsEncodingLengthValidator.analyzeMessage('Hello customer your order is ready.');
    assert.equal(res.encoding, 'GSM-7');
    assert.equal(res.segmentsCount, 1);
  });

  await t.test('should detect UCS-2 for emojis and calculate segments', () => {
    const res = SmsEncodingLengthValidator.analyzeMessage('Flash sale today! 🎉 Get 50% discount right now on all products!');
    assert.equal(res.encoding, 'UCS-2');
  });
});
