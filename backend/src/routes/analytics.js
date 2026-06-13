const express = require('express');
const router = express.Router();
const supabase = require('../db/client');

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const [campaignsRes, commsRes, customersRes] = await Promise.all([
      supabase.from('campaigns').select('id, status, launched_at'),
      supabase.from('communications').select('status, created_at'),
      supabase.from('customers').select('id, total_spend, created_at'),
    ]);

    const campaigns = campaignsRes.data || [];
    const comms = commsRes.data || [];
    const customers = customersRes.data || [];

    const overview = {
      total_campaigns: campaigns.length,
      active_campaigns: campaigns.filter(c => c.status === 'active').length,
      total_messages_sent: comms.filter(c => c.status !== 'queued').length,
      total_delivered: comms.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length,
      total_opened: comms.filter(c => ['opened', 'clicked'].includes(c.status)).length,
      total_clicked: comms.filter(c => c.status === 'clicked').length,
      total_failed: comms.filter(c => c.status === 'failed').length,
      delivery_rate: comms.length > 0
        ? ((comms.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length / comms.filter(c => c.status !== 'queued').length) * 100).toFixed(1)
        : 0,
      open_rate: comms.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length > 0
        ? ((comms.filter(c => ['opened', 'clicked'].includes(c.status)).length / comms.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length) * 100).toFixed(1)
        : 0,
      total_customers: customers.length,
      total_revenue: customers.reduce((sum, c) => sum + parseFloat(c.total_spend || 0), 0).toFixed(2),
    };

    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/campaign/:id
router.get('/campaign/:id', async (req, res) => {
  try {
    const { data: comms, error } = await supabase
      .from('communications')
      .select('status, created_at, sent_at, delivered_at, opened_at, clicked_at')
      .eq('campaign_id', req.params.id);
    if (error) throw error;

    const total = comms.length;
    const stats = {
      total,
      queued: comms.filter(c => c.status === 'queued').length,
      sent: comms.filter(c => c.status === 'sent').length,
      delivered: comms.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length,
      opened: comms.filter(c => ['opened', 'clicked'].includes(c.status)).length,
      clicked: comms.filter(c => c.status === 'clicked').length,
      failed: comms.filter(c => c.status === 'failed').length,
    };

    stats.delivery_rate = stats.sent > 0 ? ((stats.delivered / (stats.sent + stats.delivered)) * 100).toFixed(1) : 0;
    stats.open_rate = stats.delivered > 0 ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0;
    stats.click_rate = stats.opened > 0 ? ((stats.clicked / stats.opened) * 100).toFixed(1) : 0;

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
