import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh data
      gcTime: 30 * 60 * 1000, // 30 minutes in garbage collection cache
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1,
    },
  },
})

export default queryClient
