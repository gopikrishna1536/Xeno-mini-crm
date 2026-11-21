/**
 * Campaign Message Dispatcher
 * Handles template interpolation, channel routing, rate limiting, and retry handling.
 */

class CampaignDispatcher {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 2;
        this.batchSize = options.batchSize ?? 10;
        this.retryDelayMs = options.retryDelayMs ?? 50;
    }

    /**
     * Replaces template variables in a text with customer attributes.
     * e.g. "Hello {{name}}, you have {{spend}} in reward points!"
     */
    interpolateTemplate(template, customer) {
        if (!template) return '';
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
            if (key in customer && customer[key] !== undefined && customer[key] !== null) {
                return String(customer[key]);
            }
            return '';
        });
    }

    /**
     * Dispatches a single message to a delivery adapter with retry handling.
     */
    async dispatchSingle(customer, messageText, channel, adapter) {
        let attempt = 0;
        let lastError = null;

        while (attempt <= this.maxRetries) {
            try {
                attempt++;
                const result = await adapter.send({
                    customerId: customer.id,
                    recipient: channel === 'EMAIL' ? customer.email : customer.phone,
                    channel,
                    body: messageText,
                    attempt
                });
                return {
                    customerId: customer.id,
                    status: 'DELIVERED',
                    deliveryId: result.deliveryId || `del_${Date.now()}_${customer.id}`,
                    attempts: attempt,
                    error: null
                };
            } catch (err) {
                lastError = err;
                if (attempt <= this.maxRetries && this.retryDelayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * attempt));
                }
            }
        }

        return {
            customerId: customer.id,
            status: 'FAILED',
            deliveryId: null,
            attempts: attempt,
            error: lastError ? lastError.message : 'Unknown delivery error'
        };
    }

    /**
     * Dispatches campaign messages to a list of customers in batches.
     */
    async dispatchCampaign(campaign, customers, adapter) {
        const results = [];
        const { messageTemplate, channel = 'EMAIL' } = campaign;

        for (let i = 0; i < customers.length; i += this.batchSize) {
            const batch = customers.slice(i, i + this.batchSize);
            const batchPromises = batch.map(customer => {
                const messageText = this.interpolateTemplate(messageTemplate, customer);
                return this.dispatchSingle(customer, messageText, channel, adapter);
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        const deliveredCount = results.filter(r => r.status === 'DELIVERED').length;
        const failedCount = results.filter(r => r.status === 'FAILED').length;
        const successRate = results.length > 0 ? (deliveredCount / results.length) * 100 : 0;

        return {
            campaignId: campaign.id,
            totalAudience: customers.length,
            deliveredCount,
            failedCount,
            successRate: Math.round(successRate * 10) / 10,
            results
        };
    }
}

module.exports = { CampaignDispatcher };
