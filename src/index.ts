import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import puppeteer from "@cloudflare/puppeteer";

// Types
interface Env {
	DB: D1Database;
	AI: Ai;
	BROWSER: Fetcher;
	DAILY_TRIAGE: Workflow;
}

interface FeedbackItem {
	id: string;
	source: string;
	created_at: number;
	raw_text: string;
	sentiment?: number;
	urgency?: number;
	category?: string;
	cluster_id?: string;
}

interface AIAnalysis {
	sentiment: number;
	urgency: number;
	category: string;
	summary: string;
}

interface ClusterData {
	id: string;
	summary: string;
	category: string;
	avg_sentiment: number;
	avg_urgency: number;
	count_today: number;
	count_7d: number;
	trend_score: number;
	escalated: number;
}

// Seed data embedded for simplicity
const SEED_DATA: FeedbackItem[] = [
	{"id": "f001", "source": "twitter", "created_at": 1737936000, "raw_text": "Login fails on mobile every time I try. Super frustrating!"},
	{"id": "f002", "source": "twitter", "created_at": 1737936060, "raw_text": "Can't log in on my iPhone, keeps showing error"},
	{"id": "f003", "source": "twitter", "created_at": 1737936120, "raw_text": "Mobile login broken again? Come on..."},
	{"id": "f004", "source": "reddit", "created_at": 1737936180, "raw_text": "Anyone else having login issues on mobile? Been trying for an hour"},
	{"id": "f005", "source": "reddit", "created_at": 1737936240, "raw_text": "Login not working on Android app, desktop works fine"},
	{"id": "f006", "source": "forum", "created_at": 1737936300, "raw_text": "Mobile authentication fails with error code 500"},
	{"id": "f007", "source": "github", "created_at": 1737936360, "raw_text": "Bug: Mobile login returns 500 error on iOS and Android"},
	{"id": "f008", "source": "discord", "created_at": 1737936420, "raw_text": "is mobile login down for everyone or just me?"},
	{"id": "f009", "source": "twitter", "created_at": 1737936480, "raw_text": "Mobile app login completely broken rn"},
	{"id": "f010", "source": "twitter", "created_at": 1737936540, "raw_text": "Fix the mobile login already!"},
	{"id": "f011", "source": "reddit", "created_at": 1737850000, "raw_text": "The new dashboard is amazing! Love the dark mode"},
	{"id": "f012", "source": "twitter", "created_at": 1737850060, "raw_text": "Finally dark mode! Thank you devs"},
	{"id": "f015", "source": "twitter", "created_at": 1737764000, "raw_text": "Documentation is outdated, spent hours figuring out the API"},
	{"id": "f016", "source": "reddit", "created_at": 1737764060, "raw_text": "Docs don't match the actual API response format"},
	{"id": "f017", "source": "github", "created_at": 1737764120, "raw_text": "Documentation issue: /api/users endpoint description is wrong"},
	{"id": "f018", "source": "forum", "created_at": 1737764180, "raw_text": "Please update the docs, the examples don't work"},
	{"id": "f019", "source": "discord", "created_at": 1737764240, "raw_text": "anyone know the correct params for /api/users? docs are wrong"},
	{"id": "f021", "source": "twitter", "created_at": 1737678000, "raw_text": "Would love to see a bulk export feature"},
	{"id": "f022", "source": "reddit", "created_at": 1737678060, "raw_text": "Feature request: ability to export all data at once"},
	{"id": "f026", "source": "twitter", "created_at": 1737592000, "raw_text": "The app is so slow today, taking forever to load"},
	{"id": "f027", "source": "reddit", "created_at": 1737592060, "raw_text": "Performance has degraded significantly this week"},
	{"id": "f036", "source": "twitter", "created_at": 1737420000, "raw_text": "Payment failed but still got charged"},
	{"id": "f037", "source": "reddit", "created_at": 1737420060, "raw_text": "Double charged for my subscription"},
	{"id": "f038", "source": "forum", "created_at": 1737420120, "raw_text": "Billing issue - got charged twice this month"},
	{"id": "f046", "source": "twitter", "created_at": 1737248000, "raw_text": "The search is completely broken"},
	{"id": "f047", "source": "reddit", "created_at": 1737248060, "raw_text": "Search returns no results even for exact matches"},
	{"id": "f101", "source": "twitter", "created_at": 1736302000, "raw_text": "MAJOR OUTAGE - nothing is working!"},
	{"id": "f102", "source": "twitter", "created_at": 1736302060, "raw_text": "Site is completely down!"},
	{"id": "f103", "source": "twitter", "created_at": 1736302120, "raw_text": "Is there an outage? Can't access anything"},
	{"id": "f104", "source": "reddit", "created_at": 1736302180, "raw_text": "Full service outage right now"},
	{"id": "f105", "source": "reddit", "created_at": 1736302240, "raw_text": "Everything is broken, production down"},
	{"id": "f106", "source": "forum", "created_at": 1736302300, "raw_text": "URGENT: Complete service unavailability"},
	{"id": "f107", "source": "forum", "created_at": 1736302360, "raw_text": "Major incident - all APIs returning 503"},
	{"id": "f108", "source": "discord", "created_at": 1736302420, "raw_text": "OUTAGE OUTAGE OUTAGE"},
	{"id": "f109", "source": "discord", "created_at": 1736302480, "raw_text": "everything just died"},
	{"id": "f110", "source": "github", "created_at": 1736302540, "raw_text": "Critical: Global service outage affecting all regions"},
];

// Mock HTML pages for Browser Rendering simulation
const MOCK_PAGES: Record<string, string> = {
	twitter: `<!DOCTYPE html><html><body>
		<div class="tweet"><p>Login fails on mobile every time I try. Super frustrating!</p></div>
		<div class="tweet"><p>Can't log in on my iPhone, keeps showing error</p></div>
		<div class="tweet"><p>Mobile login broken again? Come on...</p></div>
		<div class="tweet"><p>Finally dark mode! Thank you devs</p></div>
		<div class="tweet"><p>The app is so slow today, taking forever to load</p></div>
	</body></html>`,
	reddit: `<!DOCTYPE html><html><body>
		<div class="post"><p>Anyone else having login issues on mobile? Been trying for an hour</p></div>
		<div class="post"><p>Login not working on Android app, desktop works fine</p></div>
		<div class="post"><p>The new dashboard is amazing! Love the dark mode</p></div>
		<div class="post"><p>Docs don't match the actual API response format</p></div>
		<div class="post"><p>Double charged for my subscription</p></div>
	</body></html>`,
	forum: `<!DOCTYPE html><html><body>
		<div class="topic"><p>Mobile authentication fails with error code 500</p></div>
		<div class="topic"><p>Please update the docs, the examples don't work</p></div>
		<div class="topic"><p>Billing issue - got charged twice this month</p></div>
		<div class="topic"><p>URGENT: Complete service unavailability</p></div>
		<div class="topic"><p>Major incident - all APIs returning 503</p></div>
	</body></html>`,
	github: `<!DOCTYPE html><html><body>
		<div class="issue"><p>Bug: Mobile login returns 500 error on iOS and Android</p></div>
		<div class="issue"><p>Documentation issue: /api/users endpoint description is wrong</p></div>
		<div class="issue"><p>Critical: Global service outage affecting all regions</p></div>
		<div class="issue"><p>Feature: Add bulk data export functionality</p></div>
	</body></html>`,
	discord: `<!DOCTYPE html><html><body>
		<div class="message"><p>is mobile login down for everyone or just me?</p></div>
		<div class="message"><p>anyone know the correct params for /api/users? docs are wrong</p></div>
		<div class="message"><p>OUTAGE OUTAGE OUTAGE</p></div>
		<div class="message"><p>everything just died</p></div>
	</body></html>`,
};

// Dashboard HTML
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Pulse - Feedback Intelligence</title>
	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { 
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: #0f172a; color: #e2e8f0; padding: 20px;
		}
		.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
		h1 { font-size: 28px; font-weight: 700; color: #f8fafc; }
		.run-btn {
			background: #3b82f6; color: white; border: none; padding: 12px 24px;
			border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
		}
		.run-btn:hover { background: #2563eb; }
		.run-btn:disabled { background: #64748b; cursor: not-allowed; }
		.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
		.card {
			background: #1e293b; border-radius: 12px; padding: 20px;
			border: 1px solid #334155;
		}
		.card h2 { font-size: 16px; color: #94a3b8; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
		.urgent-item {
			background: #7f1d1d; border-radius: 8px; padding: 16px; margin-bottom: 12px;
			border-left: 4px solid #ef4444;
		}
		.urgent-item.medium { background: #78350f; border-left-color: #f59e0b; }
		.urgent-item.low { background: #1e3a5f; border-left-color: #3b82f6; }
		.urgent-item h3 { font-size: 14px; margin-bottom: 8px; }
		.urgent-item .meta { font-size: 12px; color: #94a3b8; display: flex; gap: 16px; }
		.urgent-item .meta span { display: flex; align-items: center; gap: 4px; }
		.approve-btn {
			background: #22c55e; color: white; border: none; padding: 6px 12px;
			border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px;
		}
		.chart-container { height: 200px; }
		table { width: 100%; border-collapse: collapse; }
		th, td { text-align: left; padding: 12px; border-bottom: 1px solid #334155; }
		th { color: #94a3b8; font-size: 12px; text-transform: uppercase; }
		td { font-size: 14px; }
		.trend-up { color: #ef4444; }
		.trend-down { color: #22c55e; }
		.escalated-feed { max-height: 300px; overflow-y: auto; }
		.escalated-item { padding: 12px; border-bottom: 1px solid #334155; }
		.escalated-item:last-child { border-bottom: none; }
		.source-badge {
			display: inline-block; padding: 2px 8px; border-radius: 4px;
			font-size: 11px; font-weight: 600; text-transform: uppercase;
		}
		.source-twitter { background: #1d9bf0; }
		.source-reddit { background: #ff4500; }
		.source-forum { background: #6366f1; }
		.source-github { background: #333; }
		.source-discord { background: #5865f2; }
		.loading { text-align: center; padding: 40px; color: #64748b; }
		.stat { font-size: 32px; font-weight: 700; color: #f8fafc; }
		.stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
		.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
		.stat-card { background: #1e293b; border-radius: 8px; padding: 16px; text-align: center; }
		.cluster-row { cursor: pointer; }
		.cluster-row:hover { background: #334155; }
		.cluster-details { display: none; background: #0f172a; padding: 16px; }
		.cluster-details.open { display: table-row; }
		.example-msg { padding: 8px; background: #1e293b; border-radius: 4px; margin: 4px 0; font-size: 13px; }
	</style>
</head>
<body>
	<div class="header">
		<h1>Pulse</h1>
		<button class="run-btn" onclick="runWorkflow()">Run Now</button>
	</div>

	<div class="stats-grid" id="stats">
		<div class="stat-card">
			<div class="stat" id="total-feedback">-</div>
			<div class="stat-label">Total Feedback</div>
		</div>
		<div class="stat-card">
			<div class="stat" id="escalated-count">-</div>
			<div class="stat-label">Escalated Today</div>
		</div>
		<div class="stat-card">
			<div class="stat" id="avg-sentiment">-</div>
			<div class="stat-label">Avg Sentiment</div>
		</div>
		<div class="stat-card">
			<div class="stat" id="clusters-count">-</div>
			<div class="stat-label">Active Clusters</div>
		</div>
	</div>

	<div class="grid">
		<div class="card" style="grid-column: span 2;">
			<h2>Top Urgent Issues</h2>
			<div id="urgent-issues"><div class="loading">Loading...</div></div>
		</div>

		<div class="card">
			<h2>Escalated Today</h2>
			<div class="escalated-feed" id="escalated-feed"><div class="loading">Loading...</div></div>
		</div>

		<div class="card">
			<h2>Sentiment Over Time</h2>
			<div class="chart-container"><canvas id="sentimentChart"></canvas></div>
		</div>

		<div class="card">
			<h2>Volume Over Time</h2>
			<div class="chart-container"><canvas id="volumeChart"></canvas></div>
		</div>

		<div class="card">
			<h2>Source Breakdown</h2>
			<div class="chart-container"><canvas id="sourceChart"></canvas></div>
		</div>

		<div class="card" style="grid-column: span 3;">
			<h2>Cluster Table</h2>
			<table id="cluster-table">
				<thead>
					<tr>
						<th>Cluster</th>
						<th>Category</th>
						<th>Urgency</th>
						<th>Count</th>
						<th>Trend</th>
					</tr>
				</thead>
				<tbody id="cluster-tbody"><tr><td colspan="5" class="loading">Loading...</td></tr></tbody>
			</table>
		</div>
	</div>

	<script>
		let sentimentChart, volumeChart, sourceChart;

		async function loadDashboard() {
			try {
				const res = await fetch('/api/dashboard');
				const data = await res.json();
				renderDashboard(data);
			} catch (e) {
				console.error('Failed to load dashboard:', e);
			}
		}

		function renderDashboard(data) {
			// Stats
			document.getElementById('total-feedback').textContent = data.stats.totalFeedback;
			document.getElementById('escalated-count').textContent = data.stats.escalatedCount;
			document.getElementById('avg-sentiment').textContent = data.stats.avgSentiment.toFixed(2);
			document.getElementById('clusters-count').textContent = data.stats.clustersCount;

			// Urgent Issues
			const urgentHtml = data.urgentIssues.map(issue => \`
				<div class="urgent-item \${issue.avg_urgency >= 4 ? '' : issue.avg_urgency >= 3 ? 'medium' : 'low'}">
					<h3>\${issue.summary || issue.category}</h3>
					<div class="meta">
						<span>Urgency: \${issue.avg_urgency?.toFixed(1) || 'N/A'}</span>
						<span>Sentiment: \${issue.avg_sentiment?.toFixed(2) || 'N/A'}</span>
						<span>Trend: <span class="\${issue.trend_score > 0 ? 'trend-up' : 'trend-down'}">\${issue.trend_score > 0 ? '+' : ''}\${(issue.trend_score * 100).toFixed(0)}%</span></span>
					</div>
					<button class="approve-btn" onclick="approveIssue('\${issue.id}')">Approve</button>
				</div>
			\`).join('') || '<div class="loading">No urgent issues</div>';
			document.getElementById('urgent-issues').innerHTML = urgentHtml;

			// Escalated Feed
			const escalatedHtml = data.escalatedItems.map(item => \`
				<div class="escalated-item">
					<span class="source-badge source-\${item.source}">\${item.source}</span>
					<p style="margin-top: 8px; font-size: 13px;">\${item.raw_text}</p>
				</div>
			\`).join('') || '<div class="loading">No escalated items</div>';
			document.getElementById('escalated-feed').innerHTML = escalatedHtml;

			// Cluster Table
			const clusterHtml = data.clusters.map(cluster => \`
				<tr class="cluster-row" onclick="toggleCluster('\${cluster.id}')">
					<td>\${cluster.summary || 'Cluster ' + cluster.id.slice(0, 8)}</td>
					<td>\${cluster.category || 'N/A'}</td>
					<td>\${cluster.avg_urgency?.toFixed(1) || 'N/A'}</td>
					<td>\${cluster.count_today || 0}</td>
					<td class="\${cluster.trend_score > 0 ? 'trend-up' : 'trend-down'}">\${cluster.trend_score > 0 ? '+' : ''}\${(cluster.trend_score * 100).toFixed(0)}%</td>
				</tr>
			\`).join('') || '<tr><td colspan="5">No clusters</td></tr>';
			document.getElementById('cluster-tbody').innerHTML = clusterHtml;

			// Charts
			renderCharts(data);
		}

		function renderCharts(data) {
			const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

			// Sentiment Chart
			if (sentimentChart) sentimentChart.destroy();
			sentimentChart = new Chart(document.getElementById('sentimentChart'), {
				type: 'line',
				data: {
					labels: days,
					datasets: [{
						label: 'Sentiment',
						data: data.sentimentTrend || [-0.2, -0.3, -0.1, 0.1, -0.4, -0.5, -0.3],
						borderColor: '#3b82f6',
						tension: 0.4,
						fill: false
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: false } },
					scales: {
						y: { min: -1, max: 1, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
						x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
					}
				}
			});

			// Volume Chart
			if (volumeChart) volumeChart.destroy();
			volumeChart = new Chart(document.getElementById('volumeChart'), {
				type: 'bar',
				data: {
					labels: days,
					datasets: [{
						label: 'Volume',
						data: data.volumeTrend || [12, 19, 15, 25, 32, 28, 35],
						backgroundColor: '#22c55e'
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: false } },
					scales: {
						y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
						x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
					}
				}
			});

			// Source Chart
			if (sourceChart) sourceChart.destroy();
			sourceChart = new Chart(document.getElementById('sourceChart'), {
				type: 'doughnut',
				data: {
					labels: Object.keys(data.sourceBreakdown || {}),
					datasets: [{
						data: Object.values(data.sourceBreakdown || {}),
						backgroundColor: ['#1d9bf0', '#ff4500', '#6366f1', '#333', '#5865f2']
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } }
				}
			});
		}

		async function runWorkflow() {
			const btn = document.querySelector('.run-btn');
			btn.disabled = true;
			btn.textContent = 'Running...';
			try {
				const res = await fetch('/run', { method: 'POST' });
				const data = await res.json();
				alert('Workflow started! ID: ' + data.id);
				setTimeout(loadDashboard, 2000);
			} catch (e) {
				alert('Failed to start workflow');
			} finally {
				btn.disabled = false;
				btn.textContent = 'Run Now';
			}
		}

		function approveIssue(id) {
			alert('Issue ' + id + ' approved for action');
		}

		function toggleCluster(id) {
			// Simple toggle, in real app would show details
			console.log('Toggle cluster:', id);
		}

		loadDashboard();
	</script>
</body>
</html>`;

// Helper functions
function generateId(): string {
	return crypto.randomUUID();
}

// Analyze feedback using Workers AI
async function analyzeWithAI(env: Env, text: string): Promise<AIAnalysis> {
	try {
		const prompt = `Analyze this product feedback and return ONLY a JSON object with these exact fields:
- sentiment: number between -1 (very negative) and 1 (very positive)
- urgency: integer 1-5 (1=low, 5=critical)
- category: one of "bug", "feature", "docs", "performance", "billing", "outage", "praise", "other"
- summary: short 5-10 word summary

Feedback: "${text}"

Return ONLY valid JSON, no explanation:`;

		const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
			messages: [{ role: "user", content: prompt }],
			max_tokens: 150,
		});

		// Parse the response
		const responseText = (response as any).response || "";
		const jsonMatch = responseText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]);
			return {
				sentiment: Math.max(-1, Math.min(1, Number(parsed.sentiment) || 0)),
				urgency: Math.max(1, Math.min(5, Math.round(Number(parsed.urgency) || 3))),
				category: parsed.category || "other",
				summary: parsed.summary || text.slice(0, 50),
			};
		}
	} catch (e) {
		console.error("AI analysis failed:", e);
	}

	// Fallback: simple heuristic analysis
	return heuristicAnalysis(text);
}

// Fallback heuristic analysis
function heuristicAnalysis(text: string): AIAnalysis {
	const lower = text.toLowerCase();
	
	let sentiment = 0;
	if (lower.includes("love") || lower.includes("great") || lower.includes("amazing") || lower.includes("thank")) {
		sentiment = 0.7;
	} else if (lower.includes("broken") || lower.includes("fail") || lower.includes("error") || lower.includes("bug")) {
		sentiment = -0.6;
	} else if (lower.includes("outage") || lower.includes("down") || lower.includes("urgent")) {
		sentiment = -0.9;
	}

	let urgency = 3;
	if (lower.includes("outage") || lower.includes("critical") || lower.includes("urgent") || lower.includes("down")) {
		urgency = 5;
	} else if (lower.includes("broken") || lower.includes("fail") || lower.includes("error")) {
		urgency = 4;
	} else if (lower.includes("feature") || lower.includes("request") || lower.includes("would love")) {
		urgency = 2;
	}

	let category = "other";
	if (lower.includes("bug") || lower.includes("error") || lower.includes("broken") || lower.includes("fail")) {
		category = "bug";
	} else if (lower.includes("feature") || lower.includes("request") || lower.includes("would love")) {
		category = "feature";
	} else if (lower.includes("doc") || lower.includes("example")) {
		category = "docs";
	} else if (lower.includes("slow") || lower.includes("performance") || lower.includes("lag")) {
		category = "performance";
	} else if (lower.includes("billing") || lower.includes("charge") || lower.includes("payment")) {
		category = "billing";
	} else if (lower.includes("outage") || lower.includes("down") || lower.includes("503")) {
		category = "outage";
	} else if (lower.includes("love") || lower.includes("great") || lower.includes("amazing")) {
		category = "praise";
	}

	return {
		sentiment,
		urgency,
		category,
		summary: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
	};
}

// Simple clustering by category
function assignCluster(category: string): string {
	return `cluster-${category}`;
}

// Calculate escalation score
function calculateEscalationScore(avgUrgency: number, volumeSpike: number, sentimentDrop: number): number {
	return 0.5 * avgUrgency + 0.3 * volumeSpike + 0.2 * sentimentDrop;
}

// Workflow Definition
export class DailyTriageWorkflow extends WorkflowEntrypoint<Env> {
	async run(event: WorkflowEvent<unknown>, step: WorkflowStep) {
		// Step 1: Fetch sources (simulated with mock data)
		const feedbackItems = await step.do("fetch-sources", async () => {
			// In real scenario, would use Browser Rendering to fetch pages
			// For demo, use embedded seed data
			return SEED_DATA;
		});

		// Step 2: Extract and analyze feedback with AI
		const analyzedItems = await step.do("analyze-feedback", async () => {
			const results: FeedbackItem[] = [];
			for (const item of feedbackItems) {
				const analysis = await analyzeWithAI(this.env, item.raw_text);
				results.push({
					...item,
					sentiment: analysis.sentiment,
					urgency: analysis.urgency,
					category: analysis.category,
					cluster_id: assignCluster(analysis.category),
				});
			}
			return results;
		});

		// Step 3: Store to D1
		await step.do("store-feedback", async () => {
			for (const item of analyzedItems) {
				await this.env.DB.prepare(`
					INSERT OR REPLACE INTO feedback (id, source, created_at, raw_text, sentiment, urgency, category, cluster_id)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`).bind(
					item.id,
					item.source,
					item.created_at,
					item.raw_text,
					item.sentiment,
					item.urgency,
					item.category,
					item.cluster_id
				).run();
			}
			return { stored: analyzedItems.length };
		});

		// Step 4: Update clusters
		const clusters = await step.do("update-clusters", async () => {
			const categories = [...new Set(analyzedItems.map(i => i.category))];
			const clusterData: ClusterData[] = [];

			for (const category of categories) {
				const items = analyzedItems.filter(i => i.category === category);
				const clusterId = assignCluster(category!);
				const avgSentiment = items.reduce((sum, i) => sum + (i.sentiment || 0), 0) / items.length;
				const avgUrgency = items.reduce((sum, i) => sum + (i.urgency || 0), 0) / items.length;

				// Calculate trend (simplified)
				const trendScore = avgUrgency > 3.5 ? 0.3 : avgUrgency > 2.5 ? 0.1 : -0.1;

				// Calculate escalation
				const volumeSpike = items.length > 5 ? 4 : items.length > 2 ? 2 : 1;
				const sentimentDrop = avgSentiment < -0.5 ? 4 : avgSentiment < 0 ? 2 : 0;
				const escalationScore = calculateEscalationScore(avgUrgency, volumeSpike, sentimentDrop);
				const escalated = escalationScore > 3.5 ? 1 : 0;

				const cluster: ClusterData = {
					id: clusterId,
					summary: `${category} issues (${items.length} reports)`,
					category: category!,
					avg_sentiment: avgSentiment,
					avg_urgency: avgUrgency,
					count_today: items.length,
					count_7d: items.length,
					trend_score: trendScore,
					escalated,
				};

				await this.env.DB.prepare(`
					INSERT OR REPLACE INTO clusters (id, summary, category, avg_sentiment, avg_urgency, count_today, count_7d, trend_score, escalated)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				`).bind(
					cluster.id,
					cluster.summary,
					cluster.category,
					cluster.avg_sentiment,
					cluster.avg_urgency,
					cluster.count_today,
					cluster.count_7d,
					cluster.trend_score,
					cluster.escalated
				).run();

				clusterData.push(cluster);
			}

			return clusterData;
		});

		// Step 5: Generate report
		const report = await step.do("generate-report", async () => {
			const escalatedClusters = clusters.filter(c => c.escalated === 1);
			const reportData = {
				id: generateId(),
				created_at: Date.now(),
				summary: `Daily Triage Report: ${analyzedItems.length} feedback items processed, ${clusters.length} clusters identified, ${escalatedClusters.length} escalated.`,
				clusters,
				escalatedClusters,
			};

			await this.env.DB.prepare(`
				INSERT INTO reports (id, created_at, summary, json)
				VALUES (?, ?, ?, ?)
			`).bind(
				reportData.id,
				reportData.created_at,
				reportData.summary,
				JSON.stringify(reportData)
			).run();

			return reportData;
		});

		return { success: true, report };
	}
}

// Main Worker
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Routes
		try {
			// Dashboard
			if (path === "/" || path === "/dashboard") {
				return new Response(DASHBOARD_HTML, {
					headers: { "Content-Type": "text/html", ...corsHeaders },
				});
			}

			// Mock pages for Browser Rendering simulation
			if (path.startsWith("/mock/")) {
				const source = path.replace("/mock/", "");
				const html = MOCK_PAGES[source];
				if (html) {
					return new Response(html, {
						headers: { "Content-Type": "text/html", ...corsHeaders },
					});
				}
				return new Response("Not found", { status: 404 });
			}

			// Trigger workflow manually
			if (path === "/run" && request.method === "POST") {
				const instance = await env.DAILY_TRIAGE.create({
					id: generateId(),
				});
				return Response.json({ id: instance.id, status: "started" }, { headers: corsHeaders });
			}

			// Get latest report
			if (path === "/report") {
				const result = await env.DB.prepare(
					"SELECT * FROM reports ORDER BY created_at DESC LIMIT 1"
				).first();
				return Response.json(result || { message: "No reports yet" }, { headers: corsHeaders });
			}

			// Dashboard API
			if (path === "/api/dashboard") {
				// Get stats
				const feedbackCount = await env.DB.prepare("SELECT COUNT(*) as count FROM feedback").first();
				const clustersResult = await env.DB.prepare("SELECT * FROM clusters ORDER BY avg_urgency DESC").all();
				const escalatedClusters = await env.DB.prepare("SELECT * FROM clusters WHERE escalated = 1").all();
				const feedbackResult = await env.DB.prepare("SELECT * FROM feedback ORDER BY created_at DESC LIMIT 50").all();

				// Calculate averages
				const avgSentiment = feedbackResult.results?.length
					? feedbackResult.results.reduce((sum: number, f: any) => sum + (f.sentiment || 0), 0) / feedbackResult.results.length
					: 0;

				// Source breakdown
				const sourceBreakdown: Record<string, number> = {};
				for (const f of feedbackResult.results || []) {
					sourceBreakdown[(f as any).source] = (sourceBreakdown[(f as any).source] || 0) + 1;
				}

				// Mock trend data
				const sentimentTrend = [-0.2, -0.3, -0.15, 0.1, -0.4, -0.5, -0.25];
				const volumeTrend = [12, 19, 15, 25, 32, 28, 35];

				// Escalated feedback items
				const escalatedItems = (feedbackResult.results || []).filter(
					(f: any) => f.urgency >= 4 || f.category === "outage"
				).slice(0, 10);

				return Response.json({
					stats: {
						totalFeedback: (feedbackCount as any)?.count || 0,
						escalatedCount: escalatedClusters.results?.length || 0,
						avgSentiment,
						clustersCount: clustersResult.results?.length || 0,
					},
					urgentIssues: clustersResult.results?.filter((c: any) => c.avg_urgency >= 3) || [],
					escalatedItems,
					clusters: clustersResult.results || [],
					sourceBreakdown,
					sentimentTrend,
					volumeTrend,
				}, { headers: corsHeaders });
			}

			// Seed data endpoint (for initial setup)
			if (path === "/seed" && request.method === "POST") {
				let seeded = 0;
				for (const item of SEED_DATA) {
					const analysis = heuristicAnalysis(item.raw_text);
					await env.DB.prepare(`
						INSERT OR REPLACE INTO feedback (id, source, created_at, raw_text, sentiment, urgency, category, cluster_id)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					`).bind(
						item.id,
						item.source,
						item.created_at,
						item.raw_text,
						analysis.sentiment,
						analysis.urgency,
						analysis.category,
						assignCluster(analysis.category)
					).run();
					seeded++;
				}

				// Create initial clusters
				const categories = ["bug", "feature", "docs", "performance", "billing", "outage", "praise"];
				for (const category of categories) {
					const clusterId = assignCluster(category);
					await env.DB.prepare(`
						INSERT OR REPLACE INTO clusters (id, summary, category, avg_sentiment, avg_urgency, count_today, count_7d, trend_score, escalated)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
					`).bind(
						clusterId,
						`${category} issues`,
						category,
						category === "outage" ? -0.8 : category === "praise" ? 0.7 : -0.3,
						category === "outage" ? 5 : category === "bug" ? 4 : 2,
						5,
						20,
						category === "outage" ? 0.5 : 0.1,
						category === "outage" || category === "bug" ? 1 : 0
					).run();
				}

				return Response.json({ success: true, seeded }, { headers: corsHeaders });
			}

			// 404
			return new Response("Not found", { status: 404 });
		} catch (e) {
			console.error("Error:", e);
			return Response.json({ error: String(e) }, { status: 500, headers: corsHeaders });
		}
	},

	// Scheduled handler for cron trigger
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		const instance = await env.DAILY_TRIAGE.create({
			id: generateId(),
		});
		console.log("Daily triage workflow started:", instance.id);
	},
} satisfies ExportedHandler<Env>;
