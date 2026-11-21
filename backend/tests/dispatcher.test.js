const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { CampaignDispatcher } = require('../src/services/campaignDispatcher');

describe('CampaignDispatcher Service Tests', () => {
    test('should properly interpolate template variables with customer attributes', () => {
        const dispatcher = new CampaignDispatcher();
        const customer = { name: 'Alice Smith', spend: 450, discount: '20%' };
        const template = 'Hi {{name}}, your balance is ${{spend}}. Use {{discount}} off!';

        const rendered = dispatcher.interpolateTemplate(template, customer);
        assert.equal(rendered, 'Hi Alice Smith, your balance is $450. Use 20% off!');
    });

    test('should leave missing variables blank without throwing', () => {
        const dispatcher = new CampaignDispatcher();
        const customer = { name: 'Bob' };
        const template = 'Hello {{name}}, code: {{code}}!';

        const rendered = dispatcher.interpolateTemplate(template, customer);
        assert.equal(rendered, 'Hello Bob, code: !');
    });

    test('should dispatch campaign to multiple customers in batches successfully', async () => {
        const dispatcher = new CampaignDispatcher({ batchSize: 2 });
        const mockAdapter = {
            send: async (payload) => ({ deliveryId: `id_${payload.customerId}` })
        };

        const campaign = { id: 'camp_101', messageTemplate: 'Special offer for {{name}}', channel: 'EMAIL' };
        const customers = [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
            { id: 3, name: 'Charlie', email: 'charlie@example.com' }
        ];

        const report = await dispatcher.dispatchCampaign(campaign, customers, mockAdapter);

        assert.equal(report.campaignId, 'camp_101');
        assert.equal(report.totalAudience, 3);
        assert.equal(report.deliveredCount, 3);
        assert.equal(report.failedCount, 0);
        assert.equal(report.successRate, 100);
    });

    test('should retry failed delivery attempts and record failure if max retries exceeded', async () => {
        const dispatcher = new CampaignDispatcher({ maxRetries: 2, retryDelayMs: 1 });
        let callCount = 0;
        const failingAdapter = {
            send: async () => {
                callCount++;
                throw new Error('503 Service Unavailable');
            }
        };

        const result = await dispatcher.dispatchSingle(
            { id: 99, email: 'fail@test.com' },
            'Test message',
            'EMAIL',
            failingAdapter
        );

        assert.equal(result.status, 'FAILED');
        assert.equal(result.attempts, 3); // initial + 2 retries
        assert.equal(callCount, 3);
        assert.ok(result.error.includes('503 Service Unavailable'));
    });
});
