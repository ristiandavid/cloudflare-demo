# Pulse - Feedback Intelligence System

Pulse is an automated feedback intelligence system that discovers, analyzes, clusters, and escalates product feedback from multiple sources. Built entirely on the Cloudflare developer platform, it demonstrates how to build a full-stack AI-powered application with zero traditional infrastructure.

**Live Demo**: [https://pulse.ristiandavid.workers.dev](https://pulse.ristiandavid.workers.dev)

---

## What It Does

Pulse automatically processes product feedback and surfaces actionable insights:

1. **Collects Feedback** - Gathers feedback from multiple sources (Twitter, Reddit, Discord, GitHub, Forums)
2. **AI Analysis** - Uses Workers AI to analyze sentiment, urgency (1-5), and category for each piece of feedback
3. **Smart Clustering** - Groups related feedback into clusters (bugs, outages, feature requests, etc.)
4. **Trend Detection** - Calculates volume spikes, sentiment drops, and urgency trends
5. **Automatic Escalation** - Flags critical issues when the escalation score exceeds threshold
6. **Daily Reports** - Generates comprehensive reports with actionable summaries

### Dashboard Features

- **Today's Priorities** - Top urgent clusters with source breakdown, urgency scores, and quick actions
- **System Health** - KPI tiles showing net sentiment, volume, average urgency, and high-risk count
- **Feedback Themes** - Sortable table of all clusters with expandable details
- **Sources & Drivers** - Visual breakdown of feedback sources and sentiment trends
- **Activity Feed** - Real-time log of processed feedback with status labels
- **Workflow Stepper** - Visual progress indicator when running the pipeline

---

## Cloudflare Products Used

| Product | Purpose |
|---------|---------|
| **Workers** | Backend API, request handling, and serving the React frontend |
| **D1** | Serverless SQLite database for storing feedback, clusters, and reports |
| **Workers AI** | LLM inference (Llama 3.1 8B) for sentiment analysis and categorization |
| **Workflows** | Durable execution for the multi-step daily triage pipeline |
| **Cron Triggers** | Scheduled daily runs at 8:00 AM UTC |
| **Static Assets** | Serving the React frontend via Cloudflare's CDN |

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cloudflare Edge                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   Workers   │────▶│  Workers AI │     │     D1      │      │
│   │  (API/UI)   │     │ (Llama 3.1) │     │  (SQLite)   │      │
│   └──────┬──────┘     └─────────────┘     └──────▲──────┘      │
│          │                                        │             │
│          │            ┌─────────────┐            │             │
│          └───────────▶│  Workflows  │────────────┘             │
│                       │(Daily Triage)│                          │
│                       └─────────────┘                          │
│                              ▲                                  │
│                              │                                  │
│                       ┌─────────────┐                          │
│                       │Cron Trigger │                          │
│                       │ (8am UTC)   │                          │
│                       └─────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Daily Triage Workflow

The workflow runs automatically every day at 8:00 AM UTC (or manually via the dashboard):

```
Step 1: Fetch Sources
    └── Generates 15-30 simulated feedback items from various platforms

Step 2: Analyze Feedback
    └── Workers AI processes each item:
        • Sentiment score (-1 to 1)
        • Urgency level (1-5)
        • Category (bug, outage, performance, billing, docs, feature, praise)
        • Short summary

Step 3: Store Feedback
    └── Saves analyzed items to D1 database with unique IDs

Step 4: Update Clusters
    └── Groups feedback by category, calculates:
        • Average sentiment per cluster
        • Average urgency per cluster
        • Volume trends
        • Escalation scores

Step 5: Generate Report
    └── Creates daily summary with cluster stats and escalations
```

### Escalation Logic

Issues are automatically flagged for escalation based on this formula:

```
score = 0.5 × avg_urgency + 0.3 × volume_spike + 0.2 × sentiment_drop
```

If `score > 3.5`, the cluster is marked as escalated.

### Database Schema

```sql
-- Feedback items from all sources
CREATE TABLE feedback (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,        -- twitter, reddit, discord, github, forum
    created_at INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    sentiment REAL,              -- -1 to 1
    urgency INTEGER,             -- 1-5
    category TEXT,
    cluster_id TEXT
);

-- Grouped clusters of related feedback
CREATE TABLE clusters (
    id TEXT PRIMARY KEY,
    summary TEXT,
    category TEXT,
    avg_sentiment REAL,
    avg_urgency REAL,
    count_today INTEGER,
    count_7d INTEGER,
    trend_score REAL,
    escalated INTEGER           -- 0 or 1
);

-- Daily generated reports
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    summary TEXT,
    json TEXT
);
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves the React dashboard |
| `/api/dashboard` | GET | Returns all dashboard data (stats, clusters, trends) |
| `/run` | POST | Manually triggers the daily triage workflow |
| `/report` | GET | Returns the latest generated report |
| `/seed` | POST | Seeds the database with initial data |
| `/mock/:source` | GET | Returns mock HTML for browser rendering simulation |

---

## Tech Stack

**Backend:**
- Cloudflare Workers (TypeScript)
- Cloudflare D1 (SQLite)
- Cloudflare Workers AI (Llama 3.1 8B Instruct)
- Cloudflare Workflows

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts (data visualization)
- Iconify (icons)

---

## Local Development

### Prerequisites

- Node.js 18+
- Cloudflare account with Workers, D1, and AI access
- Wrangler CLI

### Setup

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Create D1 database
npx wrangler d1 create pulse-db

# Apply schema
npx wrangler d1 execute pulse-db --local --file=schema.sql

# Start backend (terminal 1)
npm run dev

# Start frontend (terminal 2)
cd frontend && npm run dev
```

### Development URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8787

---

## Deployment

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Deploy to Cloudflare
npm run deploy
```

The deploy command:
1. Builds the React frontend to `/public`
2. Deploys the Worker with all bindings
3. Sets up the cron trigger
4. Configures static asset serving

---

## Configuration

All configuration is in `wrangler.jsonc`:

```jsonc
{
    "name": "pulse",
    "main": "src/index.ts",
    "compatibility_date": "2026-01-28",
    "compatibility_flags": ["nodejs_compat"],
    
    // Serve React frontend
    "assets": {
        "directory": "./public",
        "binding": "ASSETS",
        "not_found_handling": "single-page-application"
    },
    
    // D1 Database
    "d1_databases": [{
        "binding": "DB",
        "database_name": "pulse-db",
        "database_id": "your-database-id"
    }],
    
    // Workers AI
    "ai": { "binding": "AI" },
    
    // Workflows
    "workflows": [{
        "name": "daily-triage",
        "binding": "DAILY_TRIAGE",
        "class_name": "DailyTriageWorkflow"
    }],
    
    // Daily cron at 8am UTC
    "triggers": {
        "crons": ["0 8 * * *"]
    }
}
```

---

## License

MIT
