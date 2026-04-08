import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  DashboardSummary,
  RevenueChartData,
  TopProductData,
  ActivityFeedEntry,
} from '@/types/api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  revenue: (start: string, end: string) =>
    [...dashboardKeys.all, 'revenue', start, end] as const,
  topProducts: (limit?: number) => [...dashboardKeys.all, 'top-products', limit] as const,
  activity: (limit?: number) => [...dashboardKeys.all, 'activity', limit] as const,
};

/**
 * Query: aggregated dashboard summary (revenue, orders, conversations, inventory).
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
    refetchInterval: 60_000, // Refresh every minute
  });
}

/**
 * Query: revenue chart data for a date range.
 */
export function useRevenueChart(start: string, end: string) {
  return useQuery({
    queryKey: dashboardKeys.revenue(start, end),
    queryFn: () =>
      api.get<RevenueChartData>(
        `/dashboard/revenue?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      ),
    enabled: !!start && !!end,
  });
}

/**
 * Query: top selling products by revenue.
 */
export function useTopProducts(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.topProducts(limit),
    queryFn: () =>
      api.get<TopProductData[]>(`/dashboard/top-products?limit=${limit}`),
  });
}

/**
 * Query: recent activity feed.
 */
export function useActivityFeed(limit = 20) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () =>
      api.get<ActivityFeedEntry[]>(`/dashboard/activity?limit=${limit}`),
    refetchInterval: 30_000,
  });
}
