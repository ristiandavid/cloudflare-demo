import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { ClusterViewModel } from '../types/dashboard';
import { DetailModal } from './DetailModal';
import { AssignModal } from './AssignModal';

/**
 * ThemeTable - Sortable table of all feedback themes/clusters
 * 
 * Answers: "What are all the themes and how should I prioritize them?"
 * Rows are expandable to show more details.
 */

type SortKey = 'urgency' | 'count' | 'trend' | 'category';
type SortDir = 'asc' | 'desc';

interface ThemeTableProps {
  themes: ClusterViewModel[];
  onOpen: (id: string) => void;
}

function getSentimentIndicator(urgency: number): { color: string; label: string } {
  if (urgency >= 8) return { color: 'bg-destructive', label: 'critical' };
  if (urgency >= 6) return { color: 'bg-primary', label: 'high' };
  if (urgency >= 4) return { color: 'bg-chart-2', label: 'medium' };
  return { color: 'bg-chart-5', label: 'low' };
}

// Sample feedback for expanded rows
function getSampleFeedbackForCategory(category: string): string[] {
  const samples: Record<string, string[]> = {
    'OUTAGE': [
      'MAJOR OUTAGE - nothing is working!',
      'Site is completely down!',
      'Is there an outage? Can\'t access anything',
    ],
    'BUG': [
      'Login fails on mobile every time I try',
      'Mobile login broken again?',
      'Bug: Mobile login returns 500 error',
    ],
    'PERFORMANCE': [
      'The app is so slow today',
      'Performance has degraded significantly',
      'Pages taking forever to load',
    ],
    'BILLING': [
      'Payment failed but still got charged',
      'Double charged for my subscription',
      'Billing issue with invoices',
    ],
    'DOCS': [
      'Documentation is outdated',
      'Docs don\'t match the actual API',
      'Please update the examples',
    ],
    'FEATURE': [
      'Would love to see bulk export',
      'Feature request: dark mode',
      'Can we get keyboard shortcuts?',
    ],
    'PRAISE': [
      'This product is amazing!',
      'Great customer support',
      'Love the new features',
    ],
  };
  return samples[category] || samples['BUG'];
}

export function ThemeTable({ themes, onOpen }: ThemeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailModalTheme, setDetailModalTheme] = useState<ClusterViewModel | null>(null);
  const [assignModalTheme, setAssignModalTheme] = useState<ClusterViewModel | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenFullView = (theme: ClusterViewModel) => {
    setDetailModalTheme(theme);
    onOpen(theme.id);
  };

  const handleAssignClick = (theme: ClusterViewModel) => {
    setAssignModalTheme(theme);
  };

  const handleEscalate = (id: string) => {
    showNotification(`Escalated: ${id}`);
    setDetailModalTheme(null);
  };

  const handleAssign = (_themeId: string, owner: { name: string }) => {
    showNotification(`Assigned ${owner.name} to theme`);
    setAssignModalTheme(null);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const sortedThemes = useMemo(() => {
    let filtered = themes;
    
    if (search) {
      const q = search.toLowerCase();
      filtered = themes.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      let aVal: number, bVal: number;
      
      switch (sortKey) {
        case 'urgency':
          aVal = a.urgency;
          bVal = b.urgency;
          break;
        case 'count':
          aVal = a.count;
          bVal = b.count;
          break;
        case 'trend':
          aVal = a.trendPercent;
          bVal = b.trendPercent;
          break;
        case 'category':
          return sortDir === 'asc' 
            ? a.category.localeCompare(b.category)
            : b.category.localeCompare(a.category);
        default:
          aVal = a.urgency;
          bVal = b.urgency;
      }
      
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [themes, sortKey, sortDir, search]);

  const SortHeader = ({ label, sortKeyValue }: { label: string; sortKeyValue: SortKey }) => (
    <button
      onClick={() => handleSort(sortKeyValue)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${
        sortKey === sortKeyValue ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      {label}
      {sortKey === sortKeyValue && (
        <Icon 
          icon={sortDir === 'desc' ? 'solar:alt-arrow-down-bold' : 'solar:alt-arrow-up-bold'} 
          className="size-3" 
        />
      )}
    </button>
  );

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-chart-3 text-white px-4 py-3 rounded-lg shadow-xl font-medium">
          {notification}
        </div>
      )}

      {/* Detail Modal */}
      {detailModalTheme && (
        <DetailModal
          theme={detailModalTheme}
          onClose={() => setDetailModalTheme(null)}
          onEscalate={handleEscalate}
          onAssign={() => {
            setDetailModalTheme(null);
            setAssignModalTheme(detailModalTheme);
          }}
        />
      )}

      {/* Assign Modal */}
      {assignModalTheme && (
        <AssignModal
          themeId={assignModalTheme.id}
          themeTitle={assignModalTheme.title}
          onClose={() => setAssignModalTheme(null)}
          onAssign={handleAssign}
        />
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <Icon icon="solar:magnifer-linear" className="size-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search themes..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <span className="text-xs text-muted-foreground">{sortedThemes.length} themes</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider">
              <th className="w-8 py-3 px-4"></th>
              <th className="text-left py-3 px-4 font-medium">
                <SortHeader label="Theme" sortKeyValue="category" />
              </th>
              <th className="text-right py-3 px-4 font-medium">
                <SortHeader label="Count" sortKeyValue="count" />
              </th>
              <th className="text-right py-3 px-4 font-medium">
                <SortHeader label="Urgency" sortKeyValue="urgency" />
              </th>
              <th className="text-right py-3 px-4 font-medium">
                <SortHeader label="Trend" sortKeyValue="trend" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Owner</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedThemes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  {search ? 'No themes match your search' : 'No themes found'}
                </td>
              </tr>
            ) : (
              sortedThemes.map((theme) => {
                const indicator = getSentimentIndicator(theme.urgency);
                const isExpanded = expandedRow === theme.id;
                const sampleFeedback = getSampleFeedbackForCategory(theme.category);
                
                return (
                  <>
                    <tr 
                      key={theme.id} 
                      onClick={() => toggleRow(theme.id)}
                      className={`border-b cursor-pointer transition-colors ${
                        isExpanded 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'border-border/50 hover:bg-secondary/30'
                      }`}
                    >
                      {/* Expand arrow */}
                      <td className="py-3 px-4">
                        <Icon 
                          icon={isExpanded ? 'solar:alt-arrow-down-bold' : 'solar:alt-arrow-right-bold'} 
                          className={`size-4 transition-colors ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                      </td>
                      
                      {/* Theme name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-2 rounded-full ${indicator.color}`} />
                          <div>
                            <div className="font-medium text-foreground">{theme.title}</div>
                            <div className="text-xs text-muted-foreground">{theme.category}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Count */}
                      <td className="py-3 px-4 text-right font-mono">{theme.count}</td>
                      
                      {/* Urgency */}
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono font-semibold ${
                          theme.urgency >= 8 ? 'text-destructive' :
                          theme.urgency >= 6 ? 'text-primary' :
                          theme.urgency >= 4 ? 'text-chart-2' :
                          'text-muted-foreground'
                        }`}>
                          {theme.urgency.toFixed(1)}
                        </span>
                      </td>
                      
                      {/* Trend */}
                      <td className="py-3 px-4 text-right">
                        <span className={`flex items-center justify-end gap-1 ${
                          theme.trendPercent > 0 ? 'text-destructive' :
                          theme.trendPercent < 0 ? 'text-chart-3' :
                          'text-muted-foreground'
                        }`}>
                          <Icon 
                            icon={
                              theme.trendPercent > 0 ? 'solar:arrow-up-bold' :
                              theme.trendPercent < 0 ? 'solar:arrow-down-bold' :
                              'solar:minus-bold'
                            } 
                            className="size-3" 
                          />
                          {Math.abs(theme.trendPercent)}%
                        </span>
                      </td>
                      
                      {/* Owner */}
                      <td className="py-3 px-4">
                        {theme.owner ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="size-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                              style={{ backgroundColor: theme.ownerBgColor }}
                            >
                              {theme.ownerInitials}
                            </div>
                            <span className="text-sm">{theme.owner}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          theme.status === 'Escalated' ? 'bg-destructive/20 text-destructive' :
                          theme.status === 'Investigating' ? 'bg-chart-2/20 text-chart-2' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {theme.status}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Expanded row details */}
                    {isExpanded && (
                      <tr key={`${theme.id}-expanded`} className="bg-secondary/20">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-3 gap-6">
                            {/* Left: Sample feedback */}
                            <div className="col-span-2">
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
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
                            
                            {/* Right: Quick stats and actions */}
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                                Details
                              </h4>
                              <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">7-day count:</span>
                                  <span className="font-medium">{theme.count * 7}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Avg sentiment:</span>
                                  <span className={`font-medium ${
                                    theme.urgency >= 6 ? 'text-destructive' : 'text-muted-foreground'
                                  }`}>
                                    {theme.urgency >= 6 ? 'Negative' : 'Mixed'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">First seen:</span>
                                  <span className="font-medium">3 days ago</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenFullView(theme); }}
                                  className="w-full text-xs font-medium py-2 rounded bg-primary hover:bg-primary/90 text-primary-foreground transition-colors flex items-center justify-center gap-2"
                                >
                                  <Icon icon="solar:arrow-right-up-bold" className="size-3" />
                                  Open Full View
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleAssignClick(theme); }}
                                  className="w-full text-xs font-medium py-2 rounded bg-secondary hover:bg-accent text-foreground border border-border transition-colors flex items-center justify-center gap-2"
                                >
                                  <Icon icon="solar:users-group-rounded-bold" className="size-3" />
                                  Assign Owner
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
