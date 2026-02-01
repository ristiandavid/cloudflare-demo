import { Icon } from '@iconify/react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * SourceBreakdown - Shows where feedback is coming from and sentiment over time
 * 
 * Answers: "Where are problems coming from?" and "Is sentiment improving or declining?"
 */

interface Source {
  source: string;
  percent: number;
  icon: string;
  color: string;
}

interface SentimentPoint {
  day: string;
  value: number;
}

interface SourceBreakdownProps {
  sources: Source[];
  sentimentTrend: SentimentPoint[];
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

export function SourceBreakdown({ sources, sentimentTrend }: SourceBreakdownProps) {
  // Calculate overall sentiment change
  const sentimentChange = sentimentTrend.length >= 2
    ? sentimentTrend[sentimentTrend.length - 1].value - sentimentTrend[0].value
    : 0;
  const isImproving = sentimentChange > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Source breakdown */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Top Sources
        </div>
        <div className="space-y-4">
          {sources.map((source) => (
            <div key={source.source} className="flex items-center gap-3">
              <Icon 
                icon={getSourceIcon(source.source)} 
                className="size-5 text-muted-foreground" 
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium capitalize">{source.source}</span>
                  <span className="text-sm font-mono text-muted-foreground">{source.percent}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${source.percent}%`,
                      backgroundColor: source.color
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {sources.length === 0 && (
            <div className="text-muted-foreground text-sm text-center py-4">
              No source data available
            </div>
          )}
        </div>
      </div>

      {/* Sentiment over time */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Sentiment Trend
          </div>
          <div className={`flex items-center gap-1 text-xs ${
            isImproving ? 'text-chart-3' : 'text-destructive'
          }`}>
            <Icon 
              icon={isImproving ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'} 
              className="size-3" 
            />
            {isImproving ? 'Improving' : 'Declining'}
          </div>
        </div>
        
        {sentimentTrend.length > 1 ? (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentTrend}>
                <defs>
                  <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isImproving ? '#238636' : '#cf222e'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isImproving ? '#238636' : '#cf222e'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9aa4b2', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ 
                    background: '#161b22', 
                    border: '1px solid #2a313c', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: '#9aa4b2' }}
                  formatter={(value) => [Number(value).toFixed(2), 'Sentiment']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isImproving ? '#238636' : '#cf222e'}
                  fill="url(#sentimentGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
            Not enough data for trend
          </div>
        )}
      </div>
    </div>
  );
}
