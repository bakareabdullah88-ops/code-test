import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plansService } from '@/lib/services/workspace';
import { useSessionState } from '@/lib/db/session';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };

export const usePlans = () => { const w = useWho(); return useQuery({ queryKey: ['plans', w], queryFn: plansService.list }); };
export const usePlan = (id: string) => { const w = useWho(); return useQuery({ queryKey: ['plan', id, w], queryFn: () => plansService.get(id) }); };
export function useStartPlan() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => plansService.start(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['plans'] }); void qc.invalidateQueries({ queryKey: ['plan'] }); } });
}
export function useToggleDay() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; day: number }) => plansService.toggleDay(v.id, v.day), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['plans'] }); void qc.invalidateQueries({ queryKey: ['plan'] }); void qc.invalidateQueries({ queryKey: ['timeline'] }); } });
}
