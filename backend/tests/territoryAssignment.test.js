const test = require('node:test');
const assert = require('node:assert/strict');
const TerritoryAssignmentRule = require('../src/territoryAssignmentRule');

test('Territory Assignment Tests', async (t) => {
  await t.test('should assign lead to rep with lowest load', () => {
    const reps = [
      { id: 'R1', name: 'Alice', regions: ['APAC'], isActive: true, activeLeadCount: 10 },
      { id: 'R2', name: 'Bob', regions: ['APAC'], isActive: true, activeLeadCount: 4 }
    ];
    const res = TerritoryAssignmentRule.assignLead('APAC', reps);
    assert.equal(res.assignedRepId, 'R2');
  });
});
