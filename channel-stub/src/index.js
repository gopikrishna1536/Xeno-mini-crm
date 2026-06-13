require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Simulation config
const CONFIG = {
  DELIVERY_RATE: parseInt(process.env.DELIVERY_RATE) || 85,
  OPEN_RATE: parseInt(process.env.OPEN_RATE) || 45,
  CLICK_RATE: parseInt(process.env.CLICK_RATE) || 25,
  FAILURE_RATE: parseInt(process.env.FAILURE_RATE) || 10,
  MIN_DELAY: parseInt(process.env.MIN_DELAY_MS) || 500,
  MAX_DELAY: parseInt(process.env.MAX_DELAY_MS) || 4000,
};

const FAILURE_REASONS = [
  'Phone number unreachable',
  'Message blocked by carrier',
  'Invalid recipient',
  'Delivery timeout',
  'Account suspended',
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDelay() {
  return randomBetween(CONFIG.MIN_DELAY, CONFIG.MAX_DELAY);
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

// Send a callback with retry logic (up to 3 attempts)
async function sendCallback(callbackUrl, payload, attempt = 1) {
  try {
    await axios.post(callbackUrl, payload, { timeout: 5000 });
  } catch (err) {
    if (attempt < 3) {
      const backoff = attempt * 1000;
      console.log(`Retry ${attempt} for ${payload.communication_id} in ${backoff}ms`);
      await new Promise(r => setTimeout(r, backoff));
      return sendCallback(callbackUrl, payload, attempt + 1);
    }
    console.error(`Callback failed after 3 attempts for ${payload.communication_id}: ${err.message}`);
  }
}

// Simulate the full lifecycle for one communication
async function simulateCommunication(comm) {
  const { communication_id, channel, callback_url, recipient, message } = comm;

  // Step 1: Mark as sent after short delay
  await new Promise(r => setTimeout(r, randomBetween(100, 500)));
  await sendCallback(callback_url, { communication_id, status: 'sent' });

  // Step 2: Delivered or failed?
  await new Promise(r => setTimeout(r, randomDelay()));

  if (chance(CONFIG.FAILURE_RATE)) {
    await sendCallback(callback_url, {
      communication_id,
      status: 'failed',
      failure_reason: FAILURE_REASONS[randomBetween(0, FAILURE_REASONS.length - 1)],
    });
    return; // Stop here for failed messages
  }

  // Delivered
  await sendCallback(callback_url, { communication_id, status: 'delivered' });
  
  console.log(`\n==================================================`);
  console.log(`📲 MESSAGE RECEIVED [${channel?.toUpperCase() || 'UNKNOWN'}]`);
  console.log(`To: ${recipient}`);
  console.log(`Message:\n${message}`);
  console.log(`==================================================\n`);

  // Step 3: Opened?
  // SMS does not typically support open tracking.
  if (channel !== 'sms' && chance(CONFIG.OPEN_RATE)) {
    await new Promise(r => setTimeout(r, randomDelay()));
    await sendCallback(callback_url, { communication_id, status: 'opened' });

    // Step 4: Clicked?
    if (chance(CONFIG.CLICK_RATE)) {
      await new Promise(r => setTimeout(r, randomDelay()));
      await sendCallback(callback_url, { communication_id, status: 'clicked' });
    }
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', config: CONFIG, timestamp: new Date() });
});

// POST /send - single message
app.post('/send', async (req, res) => {
  const { communication_id, recipient, message, channel, callback_url } = req.body;

  if (!communication_id || !callback_url) {
    return res.status(400).json({ error: 'communication_id and callback_url are required' });
  }

  // Acknowledge immediately, process async
  res.json({ accepted: true, communication_id });

  // Simulate in background
  simulateCommunication({ communication_id, recipient, message, channel, callback_url })
    .catch(err => console.error(`Simulation error for ${communication_id}:`, err.message));
});

// POST /send-batch - batch of messages
app.post('/send-batch', async (req, res) => {
  const { communications } = req.body;

  if (!communications?.length) {
    return res.status(400).json({ error: 'communications array is required' });
  }

  // Acknowledge immediately
  res.json({ accepted: true, count: communications.length });

  // Stagger simulations to avoid thundering herd
  communications.forEach((comm, index) => {
    const staggerDelay = index * randomBetween(50, 200);
    setTimeout(() => {
      simulateCommunication(comm)
        .catch(err => console.error(`Simulation error for ${comm.communication_id}:`, err.message));
    }, staggerDelay);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`📡 Channel Stub running on port ${PORT}`);
  console.log(`   Delivery rate: ${CONFIG.DELIVERY_RATE}%`);
  console.log(`   Open rate: ${CONFIG.OPEN_RATE}%`);
  console.log(`   Click rate: ${CONFIG.CLICK_RATE}%`);
  console.log(`   Failure rate: ${CONFIG.FAILURE_RATE}%`);
});
