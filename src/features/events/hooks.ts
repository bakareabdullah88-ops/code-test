import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RsvpStatus } from '@/types';
import { eventsService } from '@/lib/services/workspace';
import { useSessionState } from '@/lib/db/session';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };

export const useEvents = (scope: 'upcoming' | 'going' | 'past') => { const w = useWho(); return useQuery({ queryKey: ['events', scope, w], queryFn: () => eventsService.list(scope) }); };
export const useEvent = (id: string) => { const w = useWho(); return useQuery({ queryKey: ['event', id, w], queryFn: () => eventsService.get(id) }); };

export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; status: RsvpStatus | null }) => eventsService.rsvp(v.id, v.status), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['events'] }); void qc.invalidateQueries({ queryKey: ['event'] }); } });
}
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: Parameters<typeof eventsService.create>[0]) => eventsService.create(v), onSuccess: () => void qc.invalidateQueries({ queryKey: ['events'] }) });
}
export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => eventsService.cancel(id), onSuccess: () => void qc.invalidateQueries({ queryKey: ['events'] }) });
}
