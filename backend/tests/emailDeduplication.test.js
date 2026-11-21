const test = require('node:test');
const assert = require('node:assert/strict');
const EmailDeduplication = require('../src/emailDeduplication');

test('Email Deduplication Tests', async (t) => {
  await t.test('should detect alias duplicate Gmail accounts', () => {
    const contacts = [
      { id: 1, email: 'john.doe@gmail.com' },
      { id: 2, email: 'johndoe+news@gmail.com' },
      { id: 3, email: 'sarah@company.com' }
    ];
    const res = EmailDeduplication.deduplicateContacts(contacts);
    assert.equal(res.uniqueCount, 2);
    assert.equal(res.duplicateCount, 1);
  });
});
