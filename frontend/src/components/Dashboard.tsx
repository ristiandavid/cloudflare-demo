import { useState, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useDashboard } from '../hooks/useDashboard';
import { mapDashboardToUI } from '../utils/mappers';
import { WorkflowStepper } from './WorkflowStepper';
import { PriorityCard } from './PriorityCard';
import { KpiTile } from './KpiTile';
import { ThemeTable } from './ThemeTable';
import { SourceBreakdown } from './SourceBreakdown';
import { ActivityFeed } from './ActivityFeed';

/**
 * Dashboard - Decision-focused layout for Product Managers
 * 
 * Every section answers a question:
 * 1. What needs attention right now?
 * 2. Is overall health getting better or worse?
 * 3. What themes exist?
 * 4. Why is this happening?
 * 5. What happened recently?
 */

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
          <div className="h-10 w-28 bg-secondary rounded animate-pulse" />
        </div>
        
        {/* Priorities skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-secondary rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* KPIs skeleton */}
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
        
        {/* Table skeleton */}
        <div className="h-64 bg-secondary/30 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// Error display
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Icon icon="solar:danger-triangle-bold" className="size-16 text-destructive mx-auto mb-6" />
        <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <button
          onClick={onRetry}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, report, isLoading, error, refetch, isRefetching, triggerRun, isRunning } = useDashboard();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWorkflow, setShowWorkflow] = useState(false);

  // Map backend data to view model
  const viewModel = useMemo(() => {
    if (!data) return null;
    return mapDashboardToUI(data, report);
  }, [data, report]);

  // Handle workflow completion
  const handleWorkflowComplete = useCallback(() => {
    setShowWorkflow(false);
    refetch();
    setNotification({ type: 'success', message: 'Pipeline complete! Data refreshed.' });
    setTimeout(() => setNotification(null), 4000);
  }, [refetch]);

  // Handle run now action
  const handleRunNow = async () => {
    try {
      await triggerRun();
      setShowWorkflow(true);
    } catch {
      setNotification({ type: 'error', message: 'Failed to start pipeline' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Handle cluster actions
  const handleEscalate = (id: string) => {
    setNotification({ type: 'success', message: `Escalated: ${id}` });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleViewDetails = (id: string) => {
    setNotification({ type: 'success', message: `Opening: ${id}` });
    setTimeout(() => setNotification(null), 3000);
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error || !viewModel) return <ErrorState error={error || new Error('No data')} onRetry={refetch} />;

  // Derive KPIs from view model
  const kpis = {
    netSentiment: data?.stats.avgSentiment ?? 0,
    totalVolume: data?.stats.totalFeedback ?? 0,
    avgUrgency: viewModel.clusters.length > 0 
      ? viewModel.clusters.reduce((sum, c) => sum + c.urgency, 0) / viewModel.clusters.length 
      : 0,
    highRiskCount: viewModel.urgent.filter(u => u.urgencyScore >= 7).length,
    sentimentTrend: viewModel.telemetry.sentimentSeries,
  };

  // Top priorities: highest urgency clusters (max 5)
  const priorities = [...viewModel.urgent]
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 5);

  return (
    <div className={`min-h-screen bg-background text-foreground ${showWorkflow ? 'pt-48' : ''}`}>
      {/* Workflow Stepper - shows during pipeline execution */}
      <WorkflowStepper 
        isRunning={showWorkflow} 
        onComplete={handleWorkflowComplete} 
      />

      {/* Notification toast */}
      {notification && (
        <div className={`fixed ${showWorkflow ? 'top-56' : 'top-6'} right-6 z-40 px-4 py-3 rounded-lg shadow-xl ${
          notification.type === 'success' ? 'bg-chart-3' : 'bg-destructive'
        } text-white font-medium`}>
          {notification.message}
        </div>
      )}

      {/* Refetch indicator */}
      {isRefetching && !showWorkflow && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-50">
          <div className="h-full w-1/2 bg-primary animate-pulse" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-10 space-y-16">
        
        {/* ========== HEADER ========== */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Pulse</h1>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
              {viewModel.header.lastRunRelative}
            </span>
            {viewModel.header.healthStatus !== 'healthy' && (
              <span className={`text-xs px-2 py-1 rounded ${
                viewModel.header.healthStatus === 'down' 
                  ? 'bg-destructive/20 text-destructive' 
                  : 'bg-chart-2/20 text-chart-2'
              }`}>
                {viewModel.header.healthStatus === 'down' ? 'Issues detected' : 'Degraded'}
              </span>
            )}
          </div>
          <button
            onClick={handleRunNow}
            disabled={isRunning}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning ? (
              <Icon icon="solar:refresh-bold" className="size-4 animate-spin" />
            ) : (
              <Icon icon="solar:play-bold" className="size-4" />
            )}
            {isRunning ? 'Running...' : 'Run Pipeline'}
          </button>
        </header>

        {/* ========== SECTION 1: TODAY'S PRIORITIES ========== */}
        {/* Question: What needs attention right now? */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-semibold">Today's Priorities</h2>
            {priorities.length > 0 && (
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">
                {priorities.length} urgent
              </span>
            )}
          </div>
          
          {priorities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {priorities.map((item) => (
                <PriorityCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  service={item.service}
                  urgency={item.urgencyScore}
                  volume={viewModel.clusters.find(c => c.id === item.id)?.count ?? 0}
                  trend={item.volumeChange}
                  sentiment={item.sentimentScore}
                  sources={item.sources}
                  onEscalate={handleEscalate}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg">
              <Icon icon="solar:check-circle-bold" className="size-10 mx-auto mb-3 text-chart-3" />
              <p>No urgent issues right now</p>
            </div>
          )}
        </section>

        {/* ========== SECTION 2: SYSTEM HEALTH ========== */}
        {/* Question: Is overall health getting better or worse? */}
        <section>
          <h2 className="text-lg font-semibold mb-6">System Health</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiTile
              label="Net Sentiment"
              value={kpis.netSentiment}
              format="sentiment"
              trend={viewModel.telemetry.sentimentChange}
              sparkline={kpis.sentimentTrend.map(s => s.value)}
            />
            <KpiTile
              label="Volume Today"
              value={kpis.totalVolume}
              format="number"
            />
            <KpiTile
              label="Avg Urgency"
              value={kpis.avgUrgency}
              format="urgency"
            />
            <KpiTile
              label="High-Risk Items"
              value={kpis.highRiskCount}
              format="number"
              highlight={kpis.highRiskCount > 0}
            />
          </div>
        </section>

        {/* ========== SECTION 3: FEEDBACK THEMES ========== */}
        {/* Question: What themes exist? */}
        <section>
          <h2 className="text-lg font-semibold mb-6">Feedback Themes</h2>
          <ThemeTable
            themes={viewModel.clusters}
            onOpen={handleViewDetails}
          />
        </section>

        {/* ========== SECTION 4: SOURCES & DRIVERS ========== */}
        {/* Question: Why is this happening? */}
        <section>
          <h2 className="text-lg font-semibold mb-6">Sources & Drivers</h2>
          <SourceBreakdown
            sources={viewModel.telemetry.topSources}
            sentimentTrend={viewModel.telemetry.sentimentSeries}
          />
        </section>

        {/* ========== SECTION 5: ACTIVITY FEED ========== */}
        {/* Question: What happened recently? */}
        <section className="pb-12">
          <h2 className="text-lg font-semibold mb-6">Activity Feed</h2>
          <ActivityFeed activities={viewModel.activity} />
        </section>

      </div>
    </div>
  );
}
