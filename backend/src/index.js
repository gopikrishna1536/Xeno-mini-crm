require('dotenv').config();
const express = require('express');
const cors = require('cors');

const customersRouter = require('./routes/customers');
const campaignsRouter = require('./routes/campaigns');
const segmentsRouter = require('./routes/segments');
const receiptsRouter = require('./routes/receipts');
const analyticsRouter = require('./routes/analytics');
const aiRouter = require('./routes/ai');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Routes
app.use('/api/customers', customersRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 CRM Backend running on port ${PORT}`);
});
