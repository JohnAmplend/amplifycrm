import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 60 * 1000,      // 1 minute default — prevents re-fetching on every mount
			gcTime: 10 * 60 * 1000,    // 10 minutes — keep cache in memory longer
		},
	},
});