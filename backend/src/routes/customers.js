const express = require('express');
const router = express.Router();
const supabase = require('../db/client');

// GET /api/customers - list with filters & pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, city, gender, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (city) query = query.eq('city', city);
    if (gender) query = query.eq('gender', gender);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ customers: data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/stats - overview stats
router.get('/stats', async (req, res) => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('total_spend, total_orders, last_order_date, city, tags');
    if (error) throw error;

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    const stats = {
      total: customers.length,
      active: customers.filter(c => c.last_order_date && new Date(c.last_order_date) > thirtyDaysAgo).length,
      atRisk: customers.filter(c => {
        const d = new Date(c.last_order_date);
        return d < thirtyDaysAgo && d > ninetyDaysAgo;
      }).length,
      churned: customers.filter(c => c.last_order_date && new Date(c.last_order_date) < ninetyDaysAgo).length,
      vip: customers.filter(c => c.tags?.includes('vip')).length,
      totalRevenue: customers.reduce((sum, c) => sum + parseFloat(c.total_spend || 0), 0).toFixed(2),
      avgOrderValue: (customers.reduce((sum, c) => sum + parseFloat(c.total_spend || 0), 0) /
        customers.reduce((sum, c) => sum + parseInt(c.total_orders || 0), 0)).toFixed(2),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, orders(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/import - bulk import
router.post('/import', async (req, res) => {
  try {
    const { customers } = req.body;
    if (!customers?.length) return res.status(400).json({ error: 'No customers provided' });

    const cleanedCustomers = customers.map(c => {
      const clean = { ...c };
      if (typeof clean.tags === 'string') {
        if (!clean.tags.trim()) {
          delete clean.tags;
        } else {
          try {
            // Check if it's a stringified JSON array
            if (clean.tags.startsWith('[') && clean.tags.endsWith(']')) {
              clean.tags = JSON.parse(clean.tags);
            } else {
              // Comma separated string
              clean.tags = clean.tags.split(',').map(t => t.trim()).filter(Boolean);
            }
          } catch (e) {
            clean.tags = [];
          }
        }
      }
      return clean;
    });

    const { data, error } = await supabase
      .from('customers')
      .upsert(cleanedCustomers, { onConflict: 'email' })
      .select();
    if (error) throw error;

    res.json({ imported: data.length, customers: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
