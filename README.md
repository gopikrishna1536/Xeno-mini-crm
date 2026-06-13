# Xeno Mini CRM — AI-Native Marketing Platform

A fully AI-native CRM for reaching shoppers, built for Xeno's SDE Internship Assignment 2026.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  Dashboard │ Customers │ Campaigns │ Analytics       │
└───────────────────────┬─────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────┐
│               CRM Backend (Express)                  │
│  /customers │ /segments │ /campaigns │ /receipts     │
│  /analytics │ /ai                                    │
│                        │                             │
│    Claude API ◄────────┘  (AI segmentation +         │
│                            message generation)       │
└───────────────────────┬─────────────────────────────┘
                        │ POST /send-batch
┌───────────────────────▼─────────────────────────────┐
│            Channel Stub (Express)                    │
│  Simulates delivery → fires async callbacks back    │
│  with: sent → delivered → opened → clicked/failed   │
└─────────────────────────────────────────────────────┘
                        │
                  Supabase (PostgreSQL)
```

## 📦 Project Structure

```
xeno-crm/
├── frontend/        → Next.js 14 app (Vercel)
├── backend/         → CRM Express API (Railway)
└── channel-stub/    → Delivery simulator (Railway)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Anthropic API key

### 1. Clone and install

```bash
git clone <your-repo>
cd xeno-crm

# Install all dependencies
cd backend && npm install
cd ../channel-stub && npm install
cd ../frontend && npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `backend/src/db/schema.sql`
3. Copy your Project URL and service_role key

### 3. Configure environment variables

```bash
# backend/.env
cp backend/.env.example backend/.env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY

# channel-stub/.env
cp channel-stub/.env.example channel-stub/.env

# frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > frontend/.env.local
```

### 4. Seed the database

```bash
cd backend && npm run seed
```

### 5. Run all three services

Open 3 terminals:

```bash
# Terminal 1 - Channel Stub
cd channel-stub && npm run dev

# Terminal 2 - CRM Backend
cd backend && npm run dev

# Terminal 3 - Frontend
cd frontend && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Set env: NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Backend + Channel Stub → Railway
1. Connect your GitHub repo at [railway.app](https://railway.app)
2. Create two services: `backend` and `channel-stub`
3. Set root directories and env variables in Railway dashboard

---

## 🤖 AI Features

| Feature | How it works |
|---|---|
| AI Segment Builder | Marketer types plain English → Claude converts to structured filter rules → DB query |
| AI Message Generator | Given audience + goal + channel → Claude writes 3 message variants |
| AI Campaign Suggestions | Analyze customer health stats → Claude recommends 3 high-impact campaigns |

---

## 📡 Channel Stub Flow

```
CRM → POST /send-batch (channel stub)
          ↓ async, staggered
      simulate: sent → delivered (85%) or failed (10%)
          ↓ if delivered
      simulate: opened (45%)
          ↓ if opened
      simulate: clicked (25%)
          ↓
      POST /api/receipts (CRM) — with retry on failure
```

---

## 🗃️ Key Design Decisions

- **Two-service architecture**: CRM and channel stub are separate deployments, mirroring real-world messaging provider integrations
- **Async callbacks with retry**: Channel stub fires callbacks with 3-attempt backoff, handling transient failures
- **Staggered batch sends**: 50–200ms jitter between sends to avoid thundering herd at scale
- **AI in the critical path**: Segmentation and message drafting both go through Claude — not optional add-ons
- **Supabase for simplicity**: Managed Postgres with a JS SDK, no ORM overhead for this scope
- **Polling for live stats**: Campaign detail page polls every 3s to show delivery stats as they arrive

---

## ⚖️ Tradeoffs Made

- Used polling instead of WebSockets for simplicity (WebSockets at scale would be better)
- No auth/multi-tenancy (single brand assumed)
- Channel stub simulates all channels the same way (real providers have different APIs)
- No job queue (BullMQ/Redis) for campaign dispatch — acceptable at demo scale, required at production scale
