const express = require('express');
const router = express.Router();
const supabase = require('../db/client');

const VALID_STATUSES = ['sent', 'delivered', 'opened', 'clicked', 'failed'];

// POST /api/receipts - called by channel stub
router.post('/', async (req, res) => {
  try {
    const { communication_id, status, failure_reason } = req.body;

    if (!communication_id || !status) {
      return res.status(400).json({ error: 'communication_id and status are required' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Build the update object
    const update = { status, updated_at: new Date().toISOString() };
    const now = new Date().toISOString();

    if (status === 'sent') update.sent_at = now;
    if (status === 'delivered') update.delivered_at = now;
    if (status === 'opened') update.opened_at = now;
    if (status === 'clicked') update.clicked_at = now;
    if (status === 'failed') {
      update.failed_at = now;
      update.failure_reason = failure_reason || 'Unknown';
    }

    const { error } = await supabase
      .from('communications')
      .update(update)
      .eq('id', communication_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('Receipt error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/receipts/batch - batch callback handler
router.post('/batch', async (req, res) => {
  try {
    const { receipts } = req.body;
    if (!receipts?.length) return res.status(400).json({ error: 'No receipts provided' });

    const results = await Promise.allSettled(
      receipts.map(async ({ communication_id, status, failure_reason }) => {
        if (!VALID_STATUSES.includes(status)) return;

        const update = { status, updated_at: new Date().toISOString() };
        const now = new Date().toISOString();
        if (status === 'sent') update.sent_at = now;
        if (status === 'delivered') update.delivered_at = now;
        if (status === 'opened') update.opened_at = now;
        if (status === 'clicked') update.clicked_at = now;
        if (status === 'failed') { update.failed_at = now; update.failure_reason = failure_reason; }

        return supabase.from('communications').update(update).eq('id', communication_id);
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    res.json({ processed: succeeded, total: receipts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
