import { MutationCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './db/errors';

// Data is local and cheap to re-read, so any successful write refreshes every active query.
export const queryClient: QueryClient = new QueryClient({
  mutationCache: new MutationCache({ onSuccess: () => void queryClient.invalidateQueries() }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => err instanceof ApiError && err.retryable && count < 2,
      retryDelay: (n) => Math.min(1000 * 2 ** n, 4000),
    },
    mutations: { retry: false },
  },
});

export const qk = {
  session: ['session'] as const,
  today: ['today'] as const,
  pathways: (scope: string) => ['pathways', scope] as const,
  pathway: (id: string) => ['pathway', id] as const,
  lesson: (id: string) => ['lesson', id] as const,
  quiz: (id: string) => ['quiz', id] as const,
  reflections: (params: unknown) => ['reflections', params] as const,
  reflection: (id: string) => ['reflection', id] as const,
  attention: ['attention'] as const,
  mentees: ['mentees'] as const,
  mentee: (id: string) => ['mentee', id] as const,
  notifications: ['notifications'] as const,
  unread: ['unread'] as const,
  timeline: (id?: string) => ['timeline', id ?? 'me'] as const,
  milestones: ['milestones'] as const,
  goals: (id?: string) => ['goals', id ?? 'me'] as const,
  personas: ['personas'] as const,
  search: (q: string) => ['search', q] as const,
};
