const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// POST /api/ai/generate-message
router.post('/generate-message', async (req, res) => {
  try {
    const { segment_description, campaign_goal, channel, brand_name } = req.body;

    let variants;

    if (anthropic) {
      const channelConstraints = {
        whatsapp: 'WhatsApp message (max 1024 chars, conversational, can use emojis)',
        sms: 'SMS (max 160 chars, no emojis, very concise)',
        email: 'Email (can be longer, professional, HTML-friendly)',
        rcs: 'RCS message (rich, can use emojis and formatting)',
      };

      const prompt = `You are a marketing copywriter for an Indian retail/fashion brand called "${brand_name || 'StyleHub'}".

Audience: ${segment_description}
Goal: ${campaign_goal}
Channel: ${channelConstraints[channel] || channelConstraints.whatsapp}

Write 3 different message variants. Each should:
- Feel personal and relevant to this audience
- Have a clear call-to-action
- Use {{name}} for personalization where natural
- Be appropriate for the channel

Return ONLY a JSON array of 3 objects: [{"variant": 1, "message": "...", "tone": "friendly/urgent/exclusive"}, ...]
No markdown, no explanation.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].text.trim();
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Could not parse AI response');

      variants = JSON.parse(jsonMatch[0]);
    } else {
      variants = [
        { variant: 1, message: `Hey {{name}}, we miss you! Check out our new collection at ${brand_name || 'StyleHub'}.`, tone: "friendly" },
        { variant: 2, message: `Exclusive offer for you, {{name}}! Get 20% off your next purchase at ${brand_name || 'StyleHub'}.`, tone: "exclusive" },
        { variant: 3, message: `{{name}}, don't miss out! Special discounts ending soon at ${brand_name || 'StyleHub'}.`, tone: "urgent" }
      ];
    }

    res.json({ variants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/suggest-campaigns
router.post('/suggest-campaigns', async (req, res) => {
  try {
    const { stats } = req.body;

    let suggestions;

    if (anthropic) {
      const prompt = `You are a CRM analyst for an Indian retail brand. Based on these customer stats, suggest 3 high-impact campaigns.

Stats:
- Total customers: ${stats.total}
- Active (bought in 30 days): ${stats.active}
- At-risk (31-90 days inactive): ${stats.atRisk}
- Churned (90+ days inactive): ${stats.churned}
- VIP customers: ${stats.vip}

Return ONLY a JSON array: [{"title": "...", "description": "...", "segment": "...", "goal": "...", "priority": "high/medium/low"}, ...]
No markdown, no explanation. Exactly 3 items.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const rawText = response.content[0].text.trim();
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Could not parse AI response');

      suggestions = JSON.parse(jsonMatch[0]);
    } else {
      suggestions = [
        { title: "Win Back Churned", description: "Target customers who haven't ordered in 90+ days", segment: "churned", goal: "reactivation", priority: "high" },
        { title: "VIP Appreciation", description: "Reward our best customers", segment: "vip", goal: "retention", priority: "medium" },
        { title: "Active Engagement", description: "Keep active customers engaged with new arrivals", segment: "active", goal: "engagement", priority: "low" }
      ];
    }

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
