const test = require('node:test');
const assert = require('node:assert/strict');
const UtmParameterTracker = require('../src/utmParameterTracker');

test('UTM Parameter Tracker Tests', async (t) => {
  await t.test('should extract campaign parameters from URL', () => {
    const url = 'https://app.xeno.com/signup?utm_source=linkedin&utm_medium=cpc&utm_campaign=q4_enterprise';
    const res = UtmParameterTracker.parseUtmParams(url);
    assert.equal(res.source, 'linkedin');
    assert.equal(res.medium, 'cpc');
    assert.equal(res.campaign, 'q4_enterprise');
  });
});
