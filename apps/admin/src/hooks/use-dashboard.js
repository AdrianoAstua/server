import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
export const dashboardKeys = {
    all: ['dashboard'],
    summary: () => [...dashboardKeys.all, 'summary'],
    revenue: (start, end) => [...dashboardKeys.all, 'revenue', start, end],
    topProducts: (limit) => [...dashboardKeys.all, 'top-products', limit],
    activity: (limit) => [...dashboardKeys.all, 'activity', limit],
};
/**
 * Query: aggregated dashboard summary (revenue, orders, conversations, inventory).
 */
export function useDashboardSummary() {
    return useQuery({
        queryKey: dashboardKeys.summary(),
        queryFn: () => api.get('/dashboard/summary'),
        refetchInterval: 60_000, // Refresh every minute
    });
}
/**
 * Query: revenue chart data for a date range.
 */
export function useRevenueChart(start, end) {
    return useQuery({
        queryKey: dashboardKeys.revenue(start, end),
        queryFn: () => api.get(`/dashboard/revenue?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`),
        enabled: !!start && !!end,
    });
}
/**
 * Query: top selling products by revenue.
 */
export function useTopProducts(limit = 10) {
    return useQuery({
        queryKey: dashboardKeys.topProducts(limit),
        queryFn: () => api.get(`/dashboard/top-products?limit=${limit}`),
    });
}
/**
 * Query: recent activity feed.
 */
export function useActivityFeed(limit = 20) {
    return useQuery({
        queryKey: dashboardKeys.activity(limit),
        queryFn: () => api.get(`/dashboard/activity?limit=${limit}`),
        refetchInterval: 30_000,
    });
}
