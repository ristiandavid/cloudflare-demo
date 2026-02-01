import { Icon } from '@iconify/react';
import type { ClusterViewModel } from '../types/dashboard';

/**
 * DetailModal - Full view of a feedback theme/cluster
 * 
 * Shows all details, sample feedback, metrics, and available actions.
 */

interface DetailModalProps {
  theme: ClusterViewModel;
  onClose: () => void;
  onEscalate: (id: string) => void;
  onAssign: (id: string) => void;
}

// Extended sample feedback based on category
function getSampleFeedbackForCategory(category: string): Array<{
  text: string;
  source: string;
  time: string;
  sentiment: 'negative' | 'neutral' | 'positive';
}> {
  const samples: Record<string, Array<{ text: string; source: string; time: string; sentiment: 'negative' | 'neutral' | 'positive' }>> = {
    'OUTAGE': [
      { text: 'MAJOR OUTAGE - nothing is working!', source: 'twitter', time: '10:42 AM', sentiment: 'negative' },
      { text: 'Site is completely down!', source: 'reddit', time: '10:38 AM', sentiment: 'negative' },
      { text: 'Is there an outage? Can\'t access anything', source: 'discord', time: '10:35 AM', sentiment: 'negative' },
      { text: 'Full service outage right now', source: 'forum', time: '10:30 AM', sentiment: 'negative' },
      { text: 'Everything is broken, production down', source: 'github', time: '10:25 AM', sentiment: 'negative' },
    ],
    'BUG': [
      { text: 'Login fails on mobile every time I try. Super frustrating!', source: 'twitter', time: '09:15 AM', sentiment: 'negative' },
      { text: 'Can\'t log in on my iPhone, keeps showing error', source: 'reddit', time: '09:12 AM', sentiment: 'negative' },
      { text: 'Mobile login broken again? Come on...', source: 'twitter', time: '09:08 AM', sentiment: 'negative' },
      { text: 'Bug: Mobile login returns 500 error on iOS and Android', source: 'github', time: '08:55 AM', sentiment: 'negative' },
      { text: 'Anyone else having login issues on mobile?', source: 'discord', time: '08:45 AM', sentiment: 'neutral' },
    ],
    'PERFORMANCE': [
      { text: 'The app is so slow today, taking forever to load', source: 'twitter', time: '11:20 AM', sentiment: 'negative' },
      { text: 'Performance has degraded significantly this week', source: 'reddit', time: '11:15 AM', sentiment: 'negative' },
      { text: 'Pages taking 10+ seconds to load', source: 'forum', time: '11:00 AM', sentiment: 'negative' },
      { text: 'so laggy right now, anyone else?', source: 'discord', time: '10:45 AM', sentiment: 'negative' },
      { text: 'Loving the features but performance needs work', source: 'reddit', time: '10:30 AM', sentiment: 'neutral' },
    ],
    'BILLING': [
      { text: 'Payment failed but still got charged', source: 'twitter', time: '02:30 PM', sentiment: 'negative' },
      { text: 'Double charged for my subscription', source: 'reddit', time: '02:15 PM', sentiment: 'negative' },
      { text: 'Billing issue - got charged twice this month', source: 'forum', time: '01:45 PM', sentiment: 'negative' },
      { text: 'Bug: Payment processing creates duplicate charges', source: 'github', time: '01:20 PM', sentiment: 'negative' },
      { text: 'anyone else get double charged?', source: 'discord', time: '01:00 PM', sentiment: 'neutral' },
    ],
    'DOCS': [
      { text: 'Documentation is outdated, spent hours figuring out the API', source: 'twitter', time: '03:00 PM', sentiment: 'negative' },
      { text: 'Docs don\'t match the actual API response format', source: 'reddit', time: '02:45 PM', sentiment: 'negative' },
      { text: 'Please update the docs, the examples don\'t work', source: 'forum', time: '02:30 PM', sentiment: 'negative' },
      { text: 'Documentation issue: /api/users endpoint description is wrong', source: 'github', time: '02:00 PM', sentiment: 'neutral' },
      { text: 'anyone know the correct params? docs are wrong', source: 'discord', time: '01:30 PM', sentiment: 'neutral' },
    ],
    'FEATURE': [
      { text: 'Would love to see a bulk export feature', source: 'twitter', time: '04:00 PM', sentiment: 'neutral' },
      { text: 'Feature request: ability to export all data at once', source: 'reddit', time: '03:45 PM', sentiment: 'neutral' },
      { text: 'We need bulk export for compliance reasons', source: 'forum', time: '03:30 PM', sentiment: 'neutral' },
      { text: 'Feature: Add bulk data export functionality', source: 'github', time: '03:00 PM', sentiment: 'neutral' },
      { text: 'is there any way to export everything?', source: 'discord', time: '02:30 PM', sentiment: 'neutral' },
    ],
    'PRAISE': [
      { text: 'Love this product, use it every day!', source: 'twitter', time: '05:00 PM', sentiment: 'positive' },
      { text: 'Best purchase I\'ve made this year', source: 'reddit', time: '04:45 PM', sentiment: 'positive' },
      { text: 'The customer support is amazing!', source: 'forum', time: '04:30 PM', sentiment: 'positive' },
      { text: 'Great onboarding experience', source: 'twitter', time: '04:00 PM', sentiment: 'positive' },
      { text: 'Highly recommend to all teams', source: 'discord', time: '03:30 PM', sentiment: 'positive' },
    ],
  };
  return samples[category] || samples['BUG'];
}

function getSourceIcon(source: string): string {
  const s = source.toLowerCase();
  if (s.includes('github')) return 'mdi:github';
  if (s.includes('discord')) return 'mdi:discord';
  if (s.includes('twitter')) return 'mdi:twitter';
  if (s.includes('reddit')) return 'mdi:reddit';
  if (s.includes('forum')) return 'solar:letter-bold';
  return 'solar:chat-round-line-bold';
}

function getSentimentBadge(sentiment: 'negative' | 'neutral' | 'positive') {
  const styles = {
    negative: 'bg-destructive/20 text-destructive',
    neutral: 'bg-chart-5/20 text-chart-5',
    positive: 'bg-chart-3/20 text-chart-3',
  };
  return styles[sentiment];
}

export function DetailModal({ theme, onClose, onEscalate, onAssign }: DetailModalProps) {
  const sampleFeedback = getSampleFeedbackForCategory(theme.category);
  
  // Calculate derived metrics
  const avgResponseTime = theme.urgency >= 8 ? '< 1 hour' : theme.urgency >= 6 ? '< 4 hours' : '< 24 hours';
  const impactLevel = theme.urgency >= 8 ? 'Critical' : theme.urgency >= 6 ? 'High' : theme.urgency >= 4 ? 'Medium' : 'Low';
  const estimatedUsers = theme.count * 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                theme.status === 'Escalated' ? 'bg-destructive/20 text-destructive' :
                theme.status === 'Investigating' ? 'bg-chart-2/20 text-chart-2' :
                'bg-secondary text-muted-foreground'
              }`}>
                {theme.status}
              </span>
              <span className="text-xs text-muted-foreground">{theme.shortId}</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">{theme.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {theme.category} • {theme.count} reports today • Urgency {theme.urgency.toFixed(1)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="solar:close-circle-bold" className="size-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left column: Metrics */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Key Metrics
                </h3>
                <div className="space-y-3">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Urgency Score</div>
                    <div className={`text-3xl font-bold font-mono ${
                      theme.urgency >= 8 ? 'text-destructive' :
                      theme.urgency >= 6 ? 'text-primary' :
                      'text-chart-2'
                    }`}>
                      {theme.urgency.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Volume Today</div>
                    <div className="text-2xl font-bold font-mono">{theme.count}</div>
                    <div className={`text-xs flex items-center gap-1 mt-1 ${
                      theme.trendPercent > 0 ? 'text-destructive' :
                      theme.trendPercent < 0 ? 'text-chart-3' :
                      'text-muted-foreground'
                    }`}>
                      <Icon 
                        icon={theme.trendPercent > 0 ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} 
                        className="size-3" 
                      />
                      {Math.abs(theme.trendPercent)}% vs yesterday
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">7-Day Total</div>
                    <div className="text-2xl font-bold font-mono">{theme.count * 7}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Impact Assessment
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impact Level:</span>
                    <span className={`font-medium ${
                      impactLevel === 'Critical' ? 'text-destructive' :
                      impactLevel === 'High' ? 'text-primary' :
                      'text-foreground'
                    }`}>{impactLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Affected Users:</span>
                    <span className="font-medium">~{estimatedUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommended SLA:</span>
                    <span className="font-medium">{avgResponseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First Reported:</span>
                    <span className="font-medium">3 days ago</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Owner
                </h3>
                {theme.owner ? (
                  <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
                    <div 
                      className="size-10 rounded-full flex items-center justify-center text-sm text-white font-bold"
                      style={{ backgroundColor: theme.ownerBgColor }}
                    >
                      {theme.ownerInitials}
                    </div>
                    <div>
                      <div className="font-medium">{theme.owner}</div>
                      <div className="text-xs text-muted-foreground">Assigned 2h ago</div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onAssign(theme.id)}
                    className="w-full bg-card border border-dashed border-border rounded-lg p-4 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon icon="solar:user-plus-bold" className="size-5" />
                    <span>Assign Owner</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right columns: Feedback list */}
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Recent Feedback ({sampleFeedback.length} samples)
              </h3>
              <div className="space-y-3">
                {sampleFeedback.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">"{item.text}"</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon icon={getSourceIcon(item.source)} className="size-3" />
                            <span className="capitalize">{item.source}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getSentimentBadge(item.sentiment)}`}>
                            {item.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:magic-stick-3-bold" className="size-4 text-primary" />
                  <h4 className="text-sm font-medium text-primary">AI Summary</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  This cluster contains {theme.count} reports primarily from {sampleFeedback[0]?.source || 'multiple sources'} users 
                  experiencing {theme.category.toLowerCase()} issues. The sentiment is predominantly{' '}
                  {theme.urgency >= 6 ? 'negative' : 'mixed'} with urgency trending{' '}
                  {theme.trendPercent > 0 ? 'upward' : 'stable'}. 
                  {theme.urgency >= 8 && ' Immediate attention recommended.'}
                  {theme.urgency >= 6 && theme.urgency < 8 && ' Should be addressed within 4 hours.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <button className="text-sm font-medium px-4 py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors flex items-center gap-2">
              <Icon icon="solar:link-bold" className="size-4" />
              Create Ticket
            </button>
            <button className="text-sm font-medium px-4 py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors flex items-center gap-2">
              <Icon icon="solar:share-bold" className="size-4" />
              Share
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="text-sm font-medium px-4 py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => onEscalate(theme.id)}
              className="text-sm font-medium px-4 py-2 rounded bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center gap-2"
            >
              <Icon icon="solar:danger-triangle-bold" className="size-4" />
              Escalate Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
