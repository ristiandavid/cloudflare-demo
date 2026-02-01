import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardResponse, ReportResponse } from '../types/dashboard';

/**
 * Backend endpoints discovered from src/index.ts:
 * 
 * GET /api/dashboard - Returns full dashboard data including:
 *   - stats: { totalFeedback, escalatedCount, avgSentiment, clustersCount }
 *   - urgentIssues: ClusterData[] (clusters where avg_urgency >= 3)
 *   - escalatedItems: FeedbackItem[] (items with urgency >= 4 or category === 'outage')
 *   - clusters: ClusterData[]
 *   - sourceBreakdown: Record<string, number>
 *   - sentimentTrend: number[] (7 day mock data)
 *   - volumeTrend: number[] (7 day mock data)
 * 
 * GET /report - Returns latest report { id, created_at, summary, json }
 * 
 * POST /run - Triggers the DailyTriageWorkflow
 *   Returns { id: string, status: 'started' }
 * 
 * POST /seed - Seeds the database with initial data
 *   Returns { success: boolean, seeded: number }
 */

const API_BASE = '';

interface UseDashboardReturn {
  data: DashboardResponse | null;
  report: ReportResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  triggerRun: () => Promise<{ id: string; status: string }>;
  isRunning: boolean;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDashboard = useCallback(async (isRefetch = false) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch dashboard data and latest report in parallel
      const [dashboardRes, reportRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard`, { signal }),
        fetch(`${API_BASE}/report`, { signal })
      ]);

      if (!dashboardRes.ok) {
        throw new Error(`Dashboard API error: ${dashboardRes.status}`);
      }

      const dashboardData: DashboardResponse = await dashboardRes.json();
      setData(dashboardData);

      // Report might not exist yet
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        if (reportData.id) {
          setReport(reportData);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchDashboard(true);
  }, [fetchDashboard]);

  const triggerRun = useCallback(async (): Promise<{ id: string; status: string }> => {
    setIsRunning(true);
    try {
      const response = await fetch(`${API_BASE}/run`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Run failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Refetch data after a short delay to allow workflow to process
      setTimeout(() => {
        refetch();
      }, 2000);
      
      return result;
    } finally {
      setIsRunning(false);
    }
  }, [refetch]);

  useEffect(() => {
    fetchDashboard();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchDashboard]);

  return {
    data,
    report,
    isLoading,
    error,
    refetch,
    isRefetching,
    triggerRun,
    isRunning
  };
}
