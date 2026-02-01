/**
 * Backend API Response Types
 * 
 * These types match the response from GET /api/dashboard endpoint.
 * The backend is implemented in src/index.ts of the worker.
 */

export interface DashboardStats {
  totalFeedback: number;
  escalatedCount: number;
  avgSentiment: number;
  clustersCount: number;
}

export interface ClusterData {
  id: string;
  summary: string | null;
  category: string | null;
  avg_sentiment: number | null;
  avg_urgency: number | null;
  count_today: number;
  count_7d: number;
  trend_score: number;
  escalated: number;
  sources?: Record<string, number>; // Source breakdown: { twitter: 5, reddit: 3, ... }
}

export interface FeedbackItem {
  id: string;
  source: string;
  created_at: number;
  raw_text: string;
  sentiment: number | null;
  urgency: number | null;
  category: string | null;
  cluster_id: string | null;
}

export interface ActivityItem extends FeedbackItem {
  action: 'escalated' | 'alert' | 'positive' | 'processed';
}

export interface DashboardResponse {
  stats: DashboardStats;
  urgentIssues: ClusterData[];
  escalatedItems: FeedbackItem[];
  recentActivity: ActivityItem[];
  clusters: ClusterData[];
  sourceBreakdown: Record<string, number>;
  sentimentTrend: number[];
  volumeTrend: number[];
}

export interface ReportResponse {
  id: string;
  created_at: number;
  summary: string;
  json: string;
}

/**
 * View Model Types - used by the UI layer
 * All values are derived from backend data
 */

export interface HeaderViewModel {
  appName: string;
  environmentLabel: string;
  healthStatus: 'healthy' | 'degraded' | 'down';
  autoRunStatus: boolean;
  lastRunTimestamp: number | null;
  lastRunRelative: string;
  nextRunLabel: string;
  version: string;
}

export interface SourceInfo {
  source: string;
  count: number;
  icon: string;
  color: string;
}

export interface UrgentCardViewModel {
  id: string;
  service: string; // Derived from category
  title: string; // Derived from summary
  urgencyScore: number;
  sentiment: 'negative' | 'neutral' | 'mixed' | 'positive';
  sentimentScore: number;
  volumeChange: number;
  volumeLabel: string;
  isHighPriority: boolean;
  sources: SourceInfo[]; // Top sources for this cluster
}

export interface TelemetryViewModel {
  sentimentSeries: { day: string; value: number }[];
  sentimentChange: number;
  volumeSeries: { day: string; value: number }[];
  totalVolume: number;
  distribution: { category: string; value: number; color: string }[];
  topSources: { source: string; percent: number; icon: string; color: string }[];
}

export interface ClusterViewModel {
  id: string;
  shortId: string;
  category: string;
  categoryColor: string;
  title: string;
  urgency: number;
  urgencyColor: string;
  count: number;
  owner: string | null;
  ownerAvatar: string | null;
  ownerInitials: string;
  ownerBgColor: string;
  trendPercent: number;
  trendDirection: 'up' | 'down' | 'stable';
  status: string;
  statusColor: string;
  borderColor: string;
}

export interface ActivityViewModel {
  id: string;
  time: string;
  timestamp: number;
  title: string;
  status: string;
  statusColor: string;
  statusBgColor: string;
  description: string;
}

export interface DashboardViewModel {
  header: HeaderViewModel;
  urgent: UrgentCardViewModel[];
  urgentCount: number;
  telemetry: TelemetryViewModel;
  clusters: ClusterViewModel[];
  activity: ActivityViewModel[];
}
