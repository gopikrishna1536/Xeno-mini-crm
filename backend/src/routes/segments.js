const express = require('express');
const router = express.Router();
const supabase = require('../db/client');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// Convert AI-generated rules to Supabase query
function applySegmentRules(rules, selectFields = '*') {
  let query = supabase.from('customers').select(selectFields);

  if (rules.min_spend) query = query.gte('total_spend', rules.min_spend);
  if (rules.max_spend) query = query.lte('total_spend', rules.max_spend);
  if (rules.min_orders) query = query.gte('total_orders', rules.min_orders);
  if (rules.max_orders) query = query.lte('total_orders', rules.max_orders);
  if (rules.city) query = query.eq('city', rules.city);
  if (rules.gender) query = query.eq('gender', rules.gender);
  if (rules.min_age) query = query.gte('age', rules.min_age);
  if (rules.max_age) query = query.lte('age', rules.max_age);
  if (rules.has_tag) query = query.contains('tags', [rules.has_tag]);

  if (rules.last_order_days_ago_min || rules.last_order_days_ago_max) {
    const now = new Date();
    if (rules.last_order_days_ago_min) {
      const cutoff = new Date(now - rules.last_order_days_ago_min * 86400000);
      query = query.lte('last_order_date', cutoff.toISOString());
    }
    if (rules.last_order_days_ago_max) {
      const cutoff = new Date(now - rules.last_order_days_ago_max * 86400000);
      query = query.gte('last_order_date', cutoff.toISOString());
    }
  }

  return query;
}

// POST /api/segments/preview - preview segment size
router.post('/preview', async (req, res) => {
  try {
    const { rules } = req.body;
    const query = applySegmentRules(rules, 'id, name, email, city, total_spend, last_order_date');
    const { data, error } = await query;
    if (error) throw error;

    res.json({ count: data.length, sample: data.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/segments/ai-parse - parse natural language into rules
router.post('/ai-parse', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    let rules = {};

    if (anthropic) {
      const systemPrompt = `You are a CRM segmentation engine. Convert the user's natural language description into a structured JSON filter object.

Available filter fields:
- min_spend: number (minimum total spend in INR)
- max_spend: number (maximum total spend in INR)  
- min_orders: number (minimum number of orders)
- max_orders: number (maximum number of orders)
- last_order_days_ago_min: number (last order was AT LEAST this many days ago)
- last_order_days_ago_max: number (last order was AT MOST this many days ago)
- city: string (one of: Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata, Ahmedabad, Jaipur, Surat)
- gender: string ("male" or "female")
- min_age: number
- max_age: number
- has_tag: string (one of: "vip", "loyal", "at-risk")

Return ONLY a valid JSON object with the applicable fields. No explanation, no markdown.
Example: {"min_spend": 5000, "last_order_days_ago_min": 60}`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
        system: systemPrompt,
      });

      const rawText = message.content[0].text.trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response');

      rules = JSON.parse(jsonMatch[0]);
    } else {
      // Improved mock logic
      const p = prompt.toLowerCase();
      
      // Spend
      const spendMatch = p.match(/(?:spent|spend) over \$?(?:rs\.?\s*)?(?:₹\s*)?([\d,]+(?:\.\d+)?)/);
      if (spendMatch) rules.min_spend = parseFloat(spendMatch[1].replace(/,/g, ''));
      
      // Days ago
      const daysMatch = p.match(/last (\d+) days/);
      if (daysMatch) {
        if (p.includes("haven't") || p.includes("have not") || p.includes("not ordered")) {
          rules.last_order_days_ago_min = parseInt(daysMatch[1]);
        } else {
          rules.last_order_days_ago_max = parseInt(daysMatch[1]);
        }
      }
      
      // Customer health segments
      if (p.includes('risk')) {
        rules.last_order_days_ago_min = 31;
        rules.last_order_days_ago_max = 90;
      } else if (p.includes('churn')) {
        rules.last_order_days_ago_min = 90;
      } else if (p.includes('active')) {
        rules.last_order_days_ago_max = 30;
      }
      
      // Tags
      if (p.includes('vip')) rules.has_tag = 'vip';
      
      // Demographics
      const cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'hyderabad', 'pune', 'kolkata', 'ahmedabad', 'jaipur', 'surat'];
      for (const city of cities) {
        if (p.includes(city)) rules.city = city.charAt(0).toUpperCase() + city.slice(1);
      }
      
      if (p.includes('male') && !p.includes('female')) rules.gender = 'male';
      if (p.includes('female')) rules.gender = 'female';
    }

    // Preview with these rules
    const query = applySegmentRules(rules, 'id, name, email, city, total_spend, last_order_date');
    const { data, error } = await query;
    if (error) throw error;

    res.json({
      rules,
      count: data.length,
      sample: data.slice(0, 10),
      description: prompt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/segments/fetch-customers - get full customer list for rules
router.post('/fetch-customers', async (req, res) => {
  try {
    const { rules } = req.body;
    const query = applySegmentRules(rules, 'id, name, email, phone, city');
    const { data, error } = await query;
    if (error) throw error;
    res.json({ customers: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
