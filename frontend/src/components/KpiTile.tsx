import { Icon } from '@iconify/react';

/**
 * KpiTile - A single KPI metric with optional sparkline
 * 
 * Answers: "How is this metric doing at a glance?"
 */

interface KpiTileProps {
  label: string;
  value: number;
  format: 'number' | 'sentiment' | 'urgency' | 'percent';
  trend?: number;
  sparkline?: number[];
  highlight?: boolean;
}

function formatValue(value: number, format: KpiTileProps['format']): string {
  switch (format) {
    case 'sentiment':
      return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    case 'urgency':
      return value.toFixed(1);
    case 'percent':
      return `${value.toFixed(0)}%`;
    case 'number':
    default:
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  }
}

function getValueColor(value: number, format: KpiTileProps['format']): string {
  if (format === 'sentiment') {
    if (value <= -0.3) return 'text-destructive';
    if (value <= 0) return 'text-chart-2';
    return 'text-chart-3';
  }
  if (format === 'urgency') {
    if (value >= 4) return 'text-destructive';
    if (value >= 3) return 'text-primary';
    return 'text-foreground';
  }
  return 'text-foreground';
}

// Simple inline sparkline SVG
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 60;
  const height = 20;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] >= data[0];
  const color = trend ? '#238636' : '#cf222e';

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

export function KpiTile({ label, value, format, trend, sparkline, highlight }: KpiTileProps) {
  const displayValue = formatValue(value, format);
  const valueColor = getValueColor(value, format);

  return (
    <div className={`rounded-lg p-5 ${
      highlight ? 'bg-destructive/10 border border-destructive/20' : 'bg-card border border-border'
    }`}>
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      
      <div className="flex items-end justify-between">
        <div className={`text-3xl font-bold font-mono ${valueColor}`}>
          {displayValue}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {sparkline && sparkline.length > 1 && (
            <Sparkline data={sparkline} />
          )}
          
          {typeof trend === 'number' && (
            <div className={`flex items-center gap-1 text-xs ${
              trend > 0 ? 'text-chart-3' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              <Icon 
                icon={trend > 0 ? 'solar:arrow-up-bold' : trend < 0 ? 'solar:arrow-down-bold' : 'solar:minus-bold'} 
                className="size-3" 
              />
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
