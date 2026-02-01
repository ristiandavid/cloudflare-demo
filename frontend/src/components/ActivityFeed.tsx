import { Icon } from '@iconify/react';
import type { ActivityViewModel } from '../types/dashboard';

/**
 * ActivityFeed - Simple audit trail of recent actions
 * 
 * Answers: "What happened recently?"
 */

interface ActivityFeedProps {
  activities: ActivityViewModel[];
}

function getStatusColor(status: string): { bg: string; text: string } {
  const s = status.toLowerCase();
  if (s === 'escalated') return { bg: 'bg-destructive/20', text: 'text-destructive' };
  if (s === 'resolved') return { bg: 'bg-chart-3/20', text: 'text-chart-3' };
  if (s === 'investigating') return { bg: 'bg-chart-2/20', text: 'text-chart-2' };
  return { bg: 'bg-secondary', text: 'text-muted-foreground' };
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        <Icon icon="solar:history-linear" className="size-8 mx-auto mb-3 opacity-50" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg divide-y divide-border">
      {activities.map((activity, index) => {
        const statusColor = getStatusColor(activity.status);
        
        return (
          <div 
            key={activity.id} 
            className={`flex items-start gap-4 p-4 ${
              index === 0 ? '' : ''
            }`}
          >
            {/* Timestamp */}
            <div className="w-16 shrink-0">
              <span className="text-xs font-mono text-muted-foreground">
                {activity.time}
              </span>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-foreground truncate">
                  {activity.title}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${statusColor.bg} ${statusColor.text}`}>
                  {activity.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {activity.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
