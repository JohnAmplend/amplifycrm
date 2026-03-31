import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			// Don't retry on 429 (rate limit) — back off instead
			retry: (failureCount, error) => {
				if (error?.status === 429 || error?.response?.status === 429) return false;
				return failureCount < 2;
			},
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
			staleTime: 60 * 1000,      // 1 minute default
			gcTime: 10 * 60 * 1000,    // 10 minutes
		},
	},
});