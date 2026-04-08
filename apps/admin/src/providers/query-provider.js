import { jsx as _jsx } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            retry: 1,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 0,
        },
    },
});
export { queryClient };
export function QueryProvider({ children }) {
    return (_jsx(QueryClientProvider, { client: queryClient, children: children }));
}
