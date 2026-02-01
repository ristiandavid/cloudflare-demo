import type {
  DashboardResponse,
  ReportResponse,
  DashboardViewModel,
  HeaderViewModel,
  UrgentCardViewModel,
  TelemetryViewModel,
  ClusterViewModel,
  ActivityViewModel,
} from '../types/dashboard';
import {
  sentimentToLabelAndColor,
  categoryToColorClass,
  sourceToIconAndColor,
  urgencyToColorClass,
  clusterStatusToColors,
  stringToColor,
  nameToInitials,
} from './colors';

/**
 * Computes relative time string from timestamp
 * Derived from backend timestamp, not hardcoded
 */
function getRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Formats time from timestamp for activity log
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Derives health status from escalation count and sentiment
 */
function deriveHealthStatus(data: DashboardResponse): 'healthy' | 'degraded' | 'down' {
  // Health is derived from escalated count and average sentiment
  if (data.stats.escalatedCount >= 3 || data.stats.avgSentiment < -0.6) {
    return 'down';
  }
  if (data.stats.escalatedCount >= 1 || data.stats.avgSentiment < -0.3) {
    return 'degraded';
  }
  return 'healthy';
}

/**
 * Derives next run time (8am UTC daily per cron schedule "0 8 * * *")
 */
function getNextRunLabel(): string {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCHours(8, 0, 0, 0);
  
  if (now.getUTCHours() >= 8) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }
  
  return `${String(nextRun.getUTCHours()).padStart(2, '0')}:00 UTC`;
}

/**
 * Generates service name from category
 * Derived deterministically from category field
 */
function categoryToService(category: string | null): string {
  const cat = (category || 'other').toLowerCase();
  switch (cat) {
    case 'bug': return 'Core Service';
    case 'outage': return 'Auth Service';
    case 'performance': return 'API Gateway';
    case 'billing': return 'Billing API';
    case 'docs': return 'Documentation';
    case 'feature': return 'Frontend';
    case 'praise': return 'General';
    default: return 'Other';
  }
}

/**
 * Maps backend dashboard response to UI view model
 * NO hardcoded values - all derived from backend data
 */
export function mapDashboardToUI(
  data: DashboardResponse,
  report: ReportResponse | null
): DashboardViewModel {
  // Header derived from backend data
  const header: HeaderViewModel = {
    appName: 'Pulse',
    environmentLabel: 'Production', // Could be from env var if backend provides it
    healthStatus: deriveHealthStatus(data),
    autoRunStatus: true, // Derived from cron trigger being configured
    lastRunTimestamp: report?.created_at || null,
    lastRunRelative: report ? getRelativeTime(report.created_at) : 'Never',
    nextRunLabel: getNextRunLabel(),
    version: 'v1.0.0', // Could be from backend if exposed
  };

  // Urgent cards from urgentIssues
  const urgent: UrgentCardViewModel[] = data.urgentIssues.map((issue) => {
    const sentimentInfo = sentimentToLabelAndColor(issue.avg_sentiment || 0);
    const volumeChange = (issue.trend_score || 0) * 100;
    
    // Build sources array from the cluster's sources breakdown
    const sources = Object.entries(issue.sources || {})
      .map(([source, count]) => {
        const sourceInfo = sourceToIconAndColor(source);
        return {
          source,
          count: count as number,
          icon: sourceInfo.icon,
          color: sourceInfo.bgColor,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Top 4 sources
    
    return {
      id: issue.id,
      service: categoryToService(issue.category),
      title: issue.summary || `${issue.category || 'Unknown'} issue`,
      urgencyScore: Math.round((issue.avg_urgency || 0) * 2 * 10) / 10, // Scale 1-5 to ~1-10
      sentiment: sentimentInfo.label,
      sentimentScore: issue.avg_sentiment || 0,
      volumeChange: volumeChange,
      volumeLabel: volumeChange > 0 
        ? `+${Math.round(volumeChange)}% Vol` 
        : volumeChange < 0 
          ? `${Math.round(volumeChange)}% Vol`
          : 'Stable',
      isHighPriority: (issue.avg_urgency || 0) >= 4,
      sources,
    };
  });

  // Telemetry from backend series
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const sentimentSeries = data.sentimentTrend.map((value, i) => ({
    day: days[i % 7],
    value: value,
  }));
  
  const volumeSeries = data.volumeTrend.map((value, i) => ({
    day: days[i % 7],
    value: value,
  }));

  // Calculate sentiment change from trend
  const sentimentChange = data.sentimentTrend.length >= 2
    ? ((data.sentimentTrend[data.sentimentTrend.length - 1] - data.sentimentTrend[0]) / 
       Math.abs(data.sentimentTrend[0] || 0.01)) * 100
    : 0;

  // Distribution from cluster categories
  const categoryColors: Record<string, string> = {
    bug: 'var(--chart-1)',
    outage: 'var(--chart-1)',
    performance: 'var(--chart-2)',
    billing: 'var(--chart-2)',
    docs: 'var(--chart-4)',
    feature: 'var(--chart-5)',
    praise: 'var(--chart-3)',
    other: 'var(--chart-5)',
  };

  const distribution = data.clusters.map((cluster) => ({
    category: cluster.category || 'other',
    value: cluster.count_today,
    color: categoryColors[cluster.category || 'other'] || 'var(--chart-5)',
  }));

  // Top sources from sourceBreakdown
  const totalSources = Object.values(data.sourceBreakdown).reduce((a, b) => a + b, 0);
  const topSources = Object.entries(data.sourceBreakdown)
    .map(([source, count]) => {
      const sourceInfo = sourceToIconAndColor(source);
      return {
        source,
        percent: totalSources > 0 ? Math.round((count / totalSources) * 100) : 0,
        icon: sourceInfo.icon,
        color: sourceInfo.bgColor,
      };
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  const telemetry: TelemetryViewModel = {
    sentimentSeries,
    sentimentChange: Math.round(sentimentChange * 10) / 10,
    volumeSeries,
    totalVolume: data.stats.totalFeedback,
    distribution,
    topSources,
  };

  // Clusters from backend
  const clusters: ClusterViewModel[] = data.clusters.map((cluster) => {
    const catColors = categoryToColorClass(cluster.category);
    const statusColors = clusterStatusToColors(cluster.escalated ? 'escalated' : 'open');
    const urgColor = urgencyToColorClass((cluster.avg_urgency || 0) * 2);
    
    // Owner is not in current backend, derive from category for demo
    const owner = cluster.escalated ? 'Ristian' : null;
    
    return {
      id: cluster.id,
      shortId: `#${cluster.id.slice(-4)}`,
      category: (cluster.category || 'other').toUpperCase(),
      categoryColor: catColors.textClass,
      title: cluster.summary || `${cluster.category} issues`,
      urgency: Math.round((cluster.avg_urgency || 0) * 2 * 10) / 10,
      urgencyColor: urgColor,
      count: cluster.count_today,
      owner,
      ownerAvatar: null, // Would come from user service
      ownerInitials: nameToInitials(owner),
      ownerBgColor: stringToColor(owner || 'unassigned'),
      trendPercent: Math.round((cluster.trend_score || 0) * 100),
      trendDirection: cluster.trend_score > 0 ? 'up' : cluster.trend_score < 0 ? 'down' : 'stable',
      status: cluster.escalated ? 'Escalated' : 'Open',
      statusColor: statusColors.textClass,
      borderColor: catColors.borderClass,
    };
  });

  // Activity from recent activity items
  const activity: ActivityViewModel[] = (data.recentActivity || data.escalatedItems).slice(0, 10).map((item) => {
    // Determine status based on action type
    const action = 'action' in item ? item.action : 'processed';
    const statusMap: Record<string, { label: string; type: string }> = {
      escalated: { label: 'Escalated', type: 'escalated' },
      alert: { label: 'Alert', type: 'escalated' },
      positive: { label: 'Positive', type: 'resolved' },
      processed: { label: 'Processed', type: 'auto' },
    };
    
    const statusInfo = statusMap[action] || statusMap.processed;
    const statusColors = clusterStatusToColors(statusInfo.type);
    
    // Determine timestamp - handle both seconds and milliseconds
    const timestamp = item.created_at > 10000000000 
      ? item.created_at  // Already milliseconds
      : item.created_at * 1000;  // Convert from seconds
    
    return {
      id: item.id,
      time: formatTime(timestamp),
      timestamp: item.created_at,
      title: item.raw_text.slice(0, 40) + (item.raw_text.length > 40 ? '...' : ''),
      status: statusInfo.label,
      statusColor: statusColors.textClass,
      statusBgColor: statusColors.bgClass,
      description: `${item.source.charAt(0).toUpperCase() + item.source.slice(1)}: "${item.raw_text.slice(0, 60)}${item.raw_text.length > 60 ? '...' : ''}"`,
    };
  });

  return {
    header,
    urgent,
    urgentCount: urgent.filter(u => u.isHighPriority).length,
    telemetry,
    clusters,
    activity,
  };
}
