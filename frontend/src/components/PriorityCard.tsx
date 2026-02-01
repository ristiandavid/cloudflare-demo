import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { SourceInfo } from '../types/dashboard';

/**
 * PriorityCard - Shows a single urgent cluster that needs attention
 * 
 * Answers: "What exactly is broken and how bad is it?"
 * Expandable to show more details about the issue.
 */

interface PriorityCardProps {
  id: string;
  title: string;
  service: string;
  urgency: number;
  volume: number;
  trend: number;
  sentiment: number;
  sources: SourceInfo[];
  onEscalate: (id: string) => void;
  onViewDetails: (id: string) => void;
}

function getSentimentColor(sentiment: number): string {
  if (sentiment <= -0.5) return 'bg-destructive';
  if (sentiment <= -0.1) return 'bg-chart-2';
  if (sentiment <= 0.3) return 'bg-chart-5';
  return 'bg-chart-3';
}

function getUrgencyColor(urgency: number): string {
  if (urgency >= 8) return 'text-destructive';
  if (urgency >= 6) return 'text-primary';
  if (urgency >= 4) return 'text-chart-2';
  return 'text-muted-foreground';
}

// Sample feedback items to show in expanded view
// In a real app, this would come from the backend
function getSampleFeedback(service: string): string[] {
  const samples: Record<string, string[]> = {
    'auth service': [
      'Login fails on mobile every time I try. Super frustrating!',
      'Can\'t log in on my iPhone, keeps showing error',
      'Mobile login broken again? Come on...',
    ],
    'billing api': [
      'Payment failed but still got charged',
      'Double charged for my subscription',
      'Billing issue - got charged twice this month',
    ],
    'api gateway': [
      'The app is so slow today, taking forever to load',
      'Performance has degraded significantly this week',
      'Pages taking 10+ seconds to load',
    ],
    'default': [
      'Users are reporting issues with this feature',
      'Multiple complaints received in the last 24 hours',
      'Trend indicates growing frustration',
    ],
  };
  return samples[service.toLowerCase()] || samples['default'];
}

export function PriorityCard({
  id,
  title,
  service,
  urgency,
  volume,
  trend,
  sentiment,
  sources,
  onEscalate,
  onViewDetails,
}: PriorityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  
  const sentimentColor = getSentimentColor(sentiment);
  const urgencyColor = getUrgencyColor(urgency);
  const sampleFeedback = getSampleFeedback(service);

  const handleEscalate = () => {
    setIsEscalating(true);
    setTimeout(() => {
      setIsEscalating(false);
      setIsEscalated(true);
      onEscalate(id);
    }, 800);
  };

  const handleViewDetails = () => {
    setIsExpanded(!isExpanded);
    onViewDetails(id);
  };

  return (
    <div className={`bg-card border rounded-lg transition-all duration-300 ${
      isExpanded ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border hover:border-border/80'
    }`}>
      {/* Main card content */}
      <div className="p-5">
        {/* Header row: Service + Urgency score */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">{service}</div>
            <h3 className="font-semibold text-foreground leading-tight pr-4">
              {title}
            </h3>
          </div>
          <div className={`text-3xl font-bold font-mono ${urgencyColor}`}>
            {urgency.toFixed(1)}
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Vol:</span>
            <span className="font-medium">{volume}</span>
          </div>
          
          <div className={`flex items-center gap-1 ${
            trend > 0 ? 'text-destructive' : trend < 0 ? 'text-chart-3' : 'text-muted-foreground'
          }`}>
            <Icon 
              icon={trend > 0 ? 'solar:arrow-up-bold' : trend < 0 ? 'solar:arrow-down-bold' : 'solar:minus-bold'} 
              className="size-3" 
            />
            <span className="font-medium">{Math.abs(trend)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`size-2 rounded-full ${sentimentColor}`} />
            <span className="text-muted-foreground text-xs">
              {sentiment <= -0.5 ? 'negative' : sentiment <= 0 ? 'mixed' : 'neutral'}
            </span>
          </div>
        </div>

        {/* Sources with counts */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs text-muted-foreground">From:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {sources.length > 0 ? (
              sources.slice(0, 4).map((sourceInfo, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-1 bg-secondary/80 rounded px-2 py-1"
                  title={`${sourceInfo.count} from ${sourceInfo.source}`}
                >
                  <Icon 
                    icon={sourceInfo.icon} 
                    className="size-3.5 text-muted-foreground" 
                  />
                  <span className="text-xs font-medium text-foreground">
                    {sourceInfo.count}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No source data</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleEscalate}
            disabled={isEscalating || isEscalated}
            className={`flex-1 text-sm font-medium py-2 rounded transition-all flex items-center justify-center gap-2 ${
              isEscalated 
                ? 'bg-chart-3/20 text-chart-3 cursor-default' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isEscalating ? (
              <Icon icon="solar:refresh-bold" className="size-4 animate-spin" />
            ) : isEscalated ? (
              <>
                <Icon icon="solar:check-bold" className="size-4" />
                Escalated
              </>
            ) : (
              'Escalate'
            )}
          </button>
          <button
            onClick={handleViewDetails}
            className={`flex-1 text-sm font-medium py-2 rounded border transition-colors flex items-center justify-center gap-2 ${
              isExpanded 
                ? 'bg-primary/10 border-primary/30 text-primary' 
                : 'bg-secondary hover:bg-accent text-foreground border-border'
            }`}
          >
            <Icon 
              icon={isExpanded ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'} 
              className="size-4" 
            />
            {isExpanded ? 'Collapse' : 'View Details'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-border px-5 py-4 bg-secondary/30">
          {/* Issue summary */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Issue Summary
            </h4>
            <p className="text-sm text-foreground">
              {volume} reports received in the last 24 hours. Urgency score of {urgency.toFixed(1)} indicates 
              {urgency >= 8 ? ' critical attention required' : urgency >= 6 ? ' high priority' : ' moderate concern'}.
              Sentiment is trending {sentiment <= -0.3 ? 'negatively' : 'neutral'} with a {Math.abs(trend)}% 
              {trend > 0 ? ' increase' : trend < 0 ? ' decrease' : ' stable trend'} in volume.
            </p>
          </div>

          {/* Sample feedback */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Sample Feedback
            </h4>
            <div className="space-y-2">
              {sampleFeedback.map((feedback, index) => (
                <div 
                  key={index}
                  className="text-sm text-muted-foreground bg-background rounded px-3 py-2 border border-border/50"
                >
                  "{feedback}"
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-background rounded px-3 py-2 border border-border/50">
              <div className="text-xs text-muted-foreground">First Report</div>
              <div className="text-sm font-medium">2h ago</div>
            </div>
            <div className="bg-background rounded px-3 py-2 border border-border/50">
              <div className="text-xs text-muted-foreground">Peak Time</div>
              <div className="text-sm font-medium">10:30 AM</div>
            </div>
            <div className="bg-background rounded px-3 py-2 border border-border/50">
              <div className="text-xs text-muted-foreground">Affected Users</div>
              <div className="text-sm font-medium">~{Math.round(volume * 12)}</div>
            </div>
          </div>

          {/* Actions in expanded view */}
          <div className="flex gap-3 pt-2 border-t border-border/50">
            <button className="flex-1 text-xs font-medium py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors flex items-center justify-center gap-2">
              <Icon icon="solar:link-bold" className="size-3" />
              Create Ticket
            </button>
            <button className="flex-1 text-xs font-medium py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors flex items-center justify-center gap-2">
              <Icon icon="solar:users-group-rounded-bold" className="size-3" />
              Assign Team
            </button>
            <button className="flex-1 text-xs font-medium py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors flex items-center justify-center gap-2">
              <Icon icon="solar:bell-bold" className="size-3" />
              Set Alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
