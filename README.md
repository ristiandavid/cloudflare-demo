# Pulse - Feedback Intelligence System

A proactive feedback intelligence system built on Cloudflare Workers that automatically discovers, analyzes, and clusters product feedback from multiple sources.

## Features

- **Automated Daily Workflow**: Runs at 8am London time via cron trigger
- **Multi-Source Ingestion**: Simulates fetching from Twitter, Reddit, Forums, GitHub, and Discord
- **AI-Powered Analysis**: Uses Workers AI (Llama 3.1) for sentiment, urgency, and category classification
- **Intelligent Clustering**: Groups similar feedback items by category
- **Escalation Detection**: Automatically flags critical issues based on deterministic scoring
- **Real-time Dashboard**: Single-page dashboard with charts and data visualization

## Tech Stack

- **Cloudflare Workers**: Hosting and API
- **Cloudflare D1**: SQLite database for persistence
- **Workers AI**: LLM-powered feedback analysis
- **Browser Rendering**: (Simulated) proactive web scraping
- **Workflows**: Durable execution for daily triage pipeline

## Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Dashboard UI |
| `/run` | POST | Manually trigger the workflow |
| `/report` | GET | Get the latest generated report |
| `/api/dashboard` | GET | Dashboard data API |
| `/seed` | POST | Seed the database with initial data |
| `/mock/twitter` | GET | Mock Twitter HTML page |
| `/mock/reddit` | GET | Mock Reddit HTML page |
| `/mock/forum` | GET | Mock Forum HTML page |
| `/mock/github` | GET | Mock GitHub HTML page |
| `/mock/discord` | GET | Mock Discord HTML page |

## Quick Start

```bash
# Install dependencies
npm install

# Create the D1 database (already done)
npx wrangler d1 create pulse-db

# Apply the schema
npx wrangler d1 execute pulse-db --local --file=schema.sql

# Start development server
npm run dev

# Seed the database
curl -X POST http://localhost:8787/seed

# Open dashboard
open http://localhost:8787
```

## Deployment

```bash
# Apply schema to remote database
npx wrangler d1 execute pulse-db --remote --file=schema.sql

# Deploy to Cloudflare
npm run deploy
```

## Data Model

### feedback
- `id`: TEXT PRIMARY KEY
- `source`: TEXT (twitter, reddit, forum, github, discord)
- `created_at`: INTEGER (timestamp)
- `raw_text`: TEXT
- `sentiment`: REAL (-1 to 1)
- `urgency`: INTEGER (1-5)
- `category`: TEXT (bug, feature, docs, performance, billing, outage, praise, other)
- `cluster_id`: TEXT

### clusters
- `id`: TEXT PRIMARY KEY
- `summary`: TEXT
- `category`: TEXT
- `avg_sentiment`: REAL
- `avg_urgency`: REAL
- `count_today`: INTEGER
- `count_7d`: INTEGER
- `trend_score`: REAL
- `escalated`: INTEGER (0 or 1)

### reports
- `id`: TEXT PRIMARY KEY
- `created_at`: INTEGER
- `summary`: TEXT
- `json`: TEXT

## Escalation Logic

```
score = 0.5 * avg_urgency + 0.3 * volume_spike + 0.2 * sentiment_drop
If score > 3.5 → escalated = true
```

---

# Cloudflare Friction Log

## What Was Confusing

### 1. Workflow Export Pattern
**Issue**: The documentation wasn't immediately clear that the Workflow class needs to be exported from the main entry point file and that the `class_name` in wrangler config must exactly match the exported class name.

**Solution**: After trial and error, confirmed that `export class DailyTriageWorkflow extends WorkflowEntrypoint<Env>` must be exported from `src/index.ts` and referenced as `"class_name": "DailyTriageWorkflow"` in wrangler.jsonc.

### 2. Browser Rendering Local Development
**Issue**: Browser Rendering requires `remote: true` for local development since there's no local simulation. This wasn't obvious at first.

**Note**: For this prototype, Browser Rendering is simulated with mock HTML routes rather than actual browser rendering to avoid complexity.

### 3. D1 Binding Auto-Creation
**Issue**: When running `wrangler d1 create`, it prompts to auto-add the binding to wrangler config, but in non-interactive mode defaults to "no". Had to manually add the binding configuration.

**Suggestion**: Documentation could clarify the non-interactive behavior better.

### 4. Workers AI Model Selection
**Issue**: Finding the right model for JSON extraction wasn't straightforward. The models page lists many options but doesn't clearly indicate which are best for structured output extraction.

**What worked**: `@cf/meta/llama-3.1-8b-instruct` works well but occasionally returns malformed JSON. Added fallback heuristic analysis.

## Missing Documentation

### 1. Workflow + Scheduled Triggers
The documentation doesn't clearly show how to combine Workflows with cron/scheduled triggers. Had to piece together information from multiple pages.

### 2. TypeScript Types for Workflows
The `WorkflowEvent` and `WorkflowStep` type imports from `cloudflare:workers` aren't well documented. Found them through trial and error.

### 3. D1 Batch Operations
Documentation focuses on individual queries. Would be helpful to have examples of batch inserts or transactions for bulk operations.

## Slow Parts

### 1. Workers AI Cold Start
First AI inference request takes noticeably longer (cold start). Subsequent requests are faster.

### 2. Type Generation
`npx wrangler types` is fast, but having to remember to run it after config changes is easy to forget.

## DX Issues

### 1. Error Messages
When a Workflow class isn't properly exported, the error message isn't very helpful. Says "class not found" without suggesting to check the export.

### 2. Local Workflow Testing
Testing workflows locally requires triggering via HTTP, but the workflow binding works differently than in production. The `/run` endpoint had to be manually created.

### 3. Wrangler Config Format
Using `wrangler.jsonc` (JSON with comments) is nice, but some examples in docs use `wrangler.toml`. Having to translate between formats adds friction.

## Suggestions

1. **Unified Config Examples**: Show both JSONC and TOML side-by-side in all documentation
2. **Workflow Starter Template**: A template that includes a basic workflow with scheduled trigger would accelerate onboarding
3. **AI Model Guide**: A guide specifically for "JSON extraction" use cases with recommended models and prompting strategies
4. **Local Dev Improvements**: Better simulation of Browser Rendering locally, even if it's just returning mock content
5. **Type Generation Automation**: Auto-run `wrangler types` on config changes in dev mode

## What Worked Well

1. **D1 SQL Interface**: Familiar SQLite syntax, easy to use
2. **Workers AI Binding**: Simple `env.AI.run()` API is intuitive
3. **Workflow Durability**: Step-based execution with automatic retry is powerful
4. **Wrangler CLI**: Overall excellent DX for deployment and local development
5. **Dashboard + Workers**: Serving HTML directly from Workers is simple and effective
6. **Observability**: Built-in logging and the observability flag are helpful

## Time Spent

- Initial setup and Hello World: 5 min
- D1 schema and configuration: 10 min
- Mock routes and data: 10 min
- Workers AI integration: 20 min (mostly prompt engineering)
- Workflow implementation: 25 min
- Dashboard HTML/JS: 30 min
- Debugging and testing: 15 min
- Documentation and README: 10 min

**Total**: ~2 hours
