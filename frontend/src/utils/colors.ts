/**
 * Centralized color and label utility functions
 * All dynamic colors are derived from data, not hardcoded in JSX
 */

/**
 * Maps health status to Tailwind color classes
 */
export function statusToColorClass(status: 'healthy' | 'degraded' | 'down' | string): string {
  switch (status) {
    case 'healthy':
      return 'text-chart-3'; // green
    case 'degraded':
      return 'text-chart-2'; // blue/warning
    case 'down':
      return 'text-destructive'; // red
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Maps urgency score (1-10) to color classes
 * Higher urgency = more red/orange
 */
export function urgencyToColorClass(urgencyScore: number): string {
  if (urgencyScore >= 8) return 'text-primary'; // orange - critical
  if (urgencyScore >= 6) return 'text-chart-2'; // blue - high
  if (urgencyScore >= 4) return 'text-chart-4'; // purple - medium
  return 'text-chart-5'; // gray - low
}

export function urgencyToBgClass(urgencyScore: number): string {
  if (urgencyScore >= 8) return 'bg-primary/20 border-primary/30';
  if (urgencyScore >= 6) return 'bg-chart-2/20 border-chart-2/30';
  if (urgencyScore >= 4) return 'bg-chart-4/20 border-chart-4/30';
  return 'bg-chart-5/20 border-chart-5/30';
}

/**
 * Maps sentiment score (-1 to 1) to label and color
 */
export function sentimentToLabelAndColor(sentimentScore: number): {
  label: 'negative' | 'neutral' | 'mixed' | 'positive';
  colorClass: string;
  bgClass: string;
  icon: string;
} {
  if (sentimentScore <= -0.5) {
    return {
      label: 'negative',
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive/20',
      icon: 'solar:emoji-sad-square-bold'
    };
  }
  if (sentimentScore <= -0.1) {
    return {
      label: 'mixed',
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive/20',
      icon: 'solar:emoji-sad-square-bold'
    };
  }
  if (sentimentScore <= 0.3) {
    return {
      label: 'neutral',
      colorClass: 'text-chart-5',
      bgClass: 'bg-chart-5/20',
      icon: 'solar:emoji-funny-square-bold'
    };
  }
  return {
    label: 'positive',
    colorClass: 'text-chart-3',
    bgClass: 'bg-chart-3/20',
    icon: 'solar:emoji-funny-square-bold'
  };
}

/**
 * Maps category to color classes
 */
export function categoryToColorClass(category: string | null): {
  textClass: string;
  bgClass: string;
  borderClass: string;
} {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'bug':
    case 'outage':
      return {
        textClass: 'text-primary',
        bgClass: 'bg-primary/10',
        borderClass: 'border-l-primary'
      };
    case 'performance':
      return {
        textClass: 'text-primary',
        bgClass: 'bg-primary/10',
        borderClass: 'border-l-primary'
      };
    case 'docs':
    case 'feature':
      return {
        textClass: 'text-chart-5',
        bgClass: 'bg-chart-5/10',
        borderClass: 'border-l-chart-5'
      };
    case 'billing':
      return {
        textClass: 'text-chart-2',
        bgClass: 'bg-chart-2/10',
        borderClass: 'border-l-chart-2'
      };
    case 'praise':
      return {
        textClass: 'text-chart-3',
        bgClass: 'bg-chart-3/10',
        borderClass: 'border-l-chart-3'
      };
    default:
      return {
        textClass: 'text-chart-4',
        bgClass: 'bg-chart-4/10',
        borderClass: 'border-l-chart-4'
      };
  }
}

/**
 * Maps source name to icon and color
 */
export function sourceToIconAndColor(source: string): {
  icon: string;
  colorClass: string;
  bgColor: string;
} {
  const s = source.toLowerCase();
  switch (s) {
    case 'github':
      return { icon: 'mdi:github', colorClass: 'text-foreground', bgColor: '#ffffff' };
    case 'discord':
      return { icon: 'mdi:discord', colorClass: 'text-[#5865F2]', bgColor: '#5865F2' };
    case 'twitter':
      return { icon: 'mdi:twitter', colorClass: 'text-[#1DA1F2]', bgColor: '#1DA1F2' };
    case 'reddit':
      return { icon: 'mdi:reddit', colorClass: 'text-[#FF4500]', bgColor: '#FF4500' };
    case 'forum':
      return { icon: 'solar:letter-bold', colorClass: 'text-chart-4', bgColor: '#a371f7' };
    default:
      return { icon: 'solar:chat-round-line-linear', colorClass: 'text-muted-foreground', bgColor: '#9aa4b2' };
  }
}

/**
 * Maps cluster/activity status to colors
 */
export function clusterStatusToColors(status: string): {
  textClass: string;
  bgClass: string;
  borderClass: string;
} {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'escalated':
      return {
        textClass: 'text-primary',
        bgClass: 'bg-primary/20',
        borderClass: 'border-primary/30'
      };
    case 'resolved':
      return {
        textClass: 'text-chart-3',
        bgClass: 'bg-chart-3/20',
        borderClass: 'border-chart-3/30'
      };
    case 'investigating':
      return {
        textClass: 'text-chart-2',
        bgClass: 'bg-chart-2/20',
        borderClass: 'border-chart-2/30'
      };
    case 'open':
    case 'auto':
    case 'backlog':
    default:
      return {
        textClass: 'text-muted-foreground',
        bgClass: 'bg-secondary',
        borderClass: 'border-border'
      };
  }
}

/**
 * Generate deterministic background color from string (for avatars)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 50%, 40%)`;
}

/**
 * Generate initials from name
 */
export function nameToInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
