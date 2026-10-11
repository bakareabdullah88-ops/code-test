import { useQuery } from '@tanstack/react-query';
import { sessionService } from '@/lib/services/system';
import { useSessionState } from '@/lib/db/session';
import { qk } from '@/lib/query';
import type { Role } from '@/types';
import type { Lens } from '@/config/nav';

export function useSession() {
  const state = useSessionState();
  const q = useQuery({ queryKey: [...qk.session, state.userId, state.orgId], queryFn: sessionService.me, enabled: !!state.userId });
  const roles: Role[] = q.data ? (q.data.memberships.find((m) => m.orgId === state.orgId)?.roles ?? ['student']) : [];
  const lenses: Lens[] = [];
  if (roles.length) {
    lenses.push('learn');
    if (roles.includes('mentor')) lenses.push('mentor');
    if (roles.includes('leader')) lenses.push('lead');
    if (roles.includes('admin')) lenses.push('admin');
  }
  return { ...state, session: q.data ?? null, user: q.data?.user ?? null, roles, lenses, loading: q.isLoading, org: q.data?.organisations.find((o) => o.id === state.orgId) ?? null };
}
