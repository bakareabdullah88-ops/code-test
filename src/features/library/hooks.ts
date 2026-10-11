import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ResourceKind } from '@/types';
import { libraryService } from '@/lib/services/workspace';
import { useSessionState } from '@/lib/db/session';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };

export const useResources = (filter: { query: string; kind: ResourceKind | 'all'; saved: boolean }) => { const w = useWho(); return useQuery({ queryKey: ['resources', filter, w], queryFn: () => libraryService.list(filter) }); };
export const useResource = (id: string) => { const w = useWho(); return useQuery({ queryKey: ['resource', id, w], queryFn: () => libraryService.get(id) }); };
export function useBookmark() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => libraryService.toggleBookmark(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['resources'] }); void qc.invalidateQueries({ queryKey: ['resource'] }); } });
}
