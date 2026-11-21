const test = require('node:test');
const assert = require('node:assert/strict');
const NetPromoterScore = require('../src/netPromoterScore');

test('Net Promoter Score Tests', async (t) => {
  await t.test('should compute NPS accurately', () => {
    // 7 promoters (70%), 2 passives (20%), 1 detractor (10%) -> NPS = 60
    const ratings = [10, 10, 9, 9, 9, 10, 10, 8, 7, 3];
    const res = NetPromoterScore.calculateNPS(ratings);
    assert.equal(res.netPromoterScore, 60);
  });
});
