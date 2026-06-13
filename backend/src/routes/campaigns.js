const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../db/client');
const axios = require('axios');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

// GET /api/campaigns
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Attach stats to each campaign
    const campaignsWithStats = await Promise.all(data.map(async (campaign) => {
      const { data: comms } = await supabase
        .from('communications')
        .select('status')
        .eq('campaign_id', campaign.id);

      const stats = {
        total: comms?.length || 0,
        sent: comms?.filter(c => c.status !== 'queued').length || 0,
        delivered: comms?.filter(c => ['delivered', 'opened', 'clicked'].includes(c.status)).length || 0,
        opened: comms?.filter(c => ['opened', 'clicked'].includes(c.status)).length || 0,
        clicked: comms?.filter(c => c.status === 'clicked').length || 0,
        failed: comms?.filter(c => c.status === 'failed').length || 0,
      };
      return { ...campaign, stats };
    }));

    res.json(campaignsWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

    const { data: comms } = await supabase
      .from('communications')
      .select('*, customers(name, email, city)')
      .eq('campaign_id', req.params.id)
      .order('created_at', { ascending: false });

    res.json({ ...data, communications: comms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns - create campaign
router.post('/', async (req, res) => {
  try {
    const { name, description, segment_rules, message, channel, ai_generated } = req.body;

    // Fetch matching customers
    const { data: customers, error: segErr } = await fetchCustomersByRules(segment_rules);
    if (segErr) throw segErr;

    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .insert({
        name,
        description,
        segment_rules,
        segment_size: customers.length,
        message,
        channel: channel || 'whatsapp',
        status: 'draft',
        ai_generated: ai_generated || false,
      })
      .select()
      .single();
    if (campErr) throw campErr;

    res.json({ campaign, segment_size: customers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns/:id/launch - launch a campaign
router.post('/:id/launch', async (req, res) => {
  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (campaign.status === 'active') return res.status(400).json({ error: 'Campaign already launched' });

    // Fetch customers for this segment
    const customers = await fetchCustomersByRules(campaign.segment_rules);
    const customerList = customers.data || [];

    // Create communication records
    const comms = customerList.map(customer => ({
      id: uuidv4(),
      campaign_id: campaign.id,
      customer_id: customer.id,
      channel: campaign.channel,
      message: personalizeMessage(campaign.message, customer),
      status: 'queued',
      _phone: customer.phone,
      _email: customer.email,
    }));

    const commsForDb = comms.map(c => {
      const { _phone, _email, ...dbFields } = c;
      return dbFields;
    });

    if (commsForDb.length > 0) {
      // Insert in batches of 100
      for (let i = 0; i < commsForDb.length; i += 100) {
        await supabase.from('communications').insert(commsForDb.slice(i, i + 100));
      }
    }

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({ status: 'active', launched_at: new Date().toISOString() })
      .eq('id', campaign.id);

    // Fire off to channel stub or real sender (non-blocking)
    sendMessages(comms, campaign).catch(console.error);

    res.json({ success: true, communications_queued: comms.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: fetch customers by segment rules
async function fetchCustomersByRules(rules) {
  let query = supabase.from('customers').select('id, name, email, phone, city');

  if (rules.min_spend) query = query.gte('total_spend', rules.min_spend);
  if (rules.max_spend) query = query.lte('total_spend', rules.max_spend);
  if (rules.min_orders) query = query.gte('total_orders', rules.min_orders);
  if (rules.max_orders) query = query.lte('total_orders', rules.max_orders);
  if (rules.city) query = query.eq('city', rules.city);
  if (rules.gender) query = query.eq('gender', rules.gender);
  if (rules.has_tag) query = query.contains('tags', [rules.has_tag]);
  if (rules.min_age) query = query.gte('age', rules.min_age);
  if (rules.max_age) query = query.lte('age', rules.max_age);

  if (rules.last_order_days_ago_min) {
    const cutoff = new Date(Date.now() - rules.last_order_days_ago_min * 86400000);
    query = query.lte('last_order_date', cutoff.toISOString());
  }
  if (rules.last_order_days_ago_max) {
    const cutoff = new Date(Date.now() - rules.last_order_days_ago_max * 86400000);
    query = query.gte('last_order_date', cutoff.toISOString());
  }

  return query;
}

// Helper: simple message personalization
function personalizeMessage(template, customer) {
  return template
    .replace(/\{\{name\}\}/gi, customer.name)
    .replace(/\{\{city\}\}/gi, customer.city || '')
    .replace(/\{\{first_name\}\}/gi, customer.name.split(' ')[0]);
}

// Helper: send communications via real provider or channel stub
async function sendMessages(comms, campaign) {
  const isRealSending = process.env.ENABLE_REAL_MESSAGING === 'true';

  if (!isRealSending) {
    const CHANNEL_STUB_URL = process.env.CHANNEL_STUB_URL || 'http://localhost:5000';
    const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || 'http://localhost:4000/api/receipts';

    const BATCH_SIZE = 20;
    for (let i = 0; i < comms.length; i += BATCH_SIZE) {
      const batch = comms.slice(i, i + BATCH_SIZE);
      try {
        await axios.post(`${CHANNEL_STUB_URL}/send-batch`, {
          communications: batch.map(c => ({
            communication_id: c.id,
            recipient: c.customer_id,
            message: c.message,
            channel: c.channel,
            callback_url: CRM_CALLBACK_URL,
          })),
        });
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Batch ${i} failed:`, err.message);
      }
    }
    return;
  }

  // Real Sending Logic
  const channel = campaign.channel.toLowerCase();
  let twilioClient, transporter;

  if (channel === 'whatsapp' || channel === 'sms') {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  } else if (channel === 'email') {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  for (const comm of comms) {
    try {
      if (channel === 'whatsapp' && twilioClient && comm._phone) {
        await twilioClient.messages.create({
          body: comm.message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${comm._phone}`
        });
        await updateCommStatus(comm.id, 'sent');
      } else if (channel === 'sms' && twilioClient && comm._phone) {
        await twilioClient.messages.create({
          body: comm.message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: comm._phone
        });
        await updateCommStatus(comm.id, 'sent');
} else if (channel === 'email' && process.env.RESEND_API_KEY && comm._email) {
  const resendResponse = await axios.post(
    'https://api.resend.com/emails',
    {
      from: process.env.RESEND_FROM_EMAIL || 'Xeno CRM <onboarding@resend.dev>',
      to: [comm._email],
      subject: campaign.name,
      text: comm.message,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('Resend email sent:', resendResponse.data);
  await updateCommStatus(comm.id, 'sent');
} else if (channel === 'email' && transporter && comm._email) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
    to: comm._email,
    subject: campaign.name,
    text: comm.message,
  });
  await updateCommStatus(comm.id, 'sent');
}
 else {
        await updateCommStatus(comm.id, 'failed', 'Missing credentials or contact info');
      }
    } catch (err) {
      console.error('Failed to send real message:', err.message);
      await updateCommStatus(comm.id, 'failed', err.message);
    }
  }
}

async function updateCommStatus(id, status, reason = null) {
  await supabase.from('communications').update({ 
    status, 
    sent_at: status === 'sent' ? new Date().toISOString() : null,
    failed_at: status === 'failed' ? new Date().toISOString() : null,
    failure_reason: reason
  }).eq('id', id);
}

module.exports = router;
