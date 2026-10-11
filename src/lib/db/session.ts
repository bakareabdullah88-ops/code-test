import { useSyncExternalStore } from 'react';
import type { Id, Membership, Organisation, Role, User } from '@/types';
import { ApiError } from './errors';
import { store } from './store';

const KEY = 'tessera.session.v1';
export interface SessionState { userId: Id<'usr'> | null; orgId: Id<'org'> | null }

let state: SessionState = { userId: null, orgId: null };
const listeners = new Set<() => void>();
let loaded = false;

function ensure() {
  if (loaded) return;
  loaded = true;
  try {
    state = { ...state, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<SessionState>) };
  } catch {
    // ignore corrupt value
  }
}

export function getSessionState(): SessionState {
  ensure();
  return state;
}

export function signInAs(userId: Id<'usr'> | null, orgId: Id<'org'> | null) {
  ensure();
  state = { userId, orgId };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage blocked; session lasts for this tab only
  }
  listeners.forEach((l) => l());
}

export function useSessionState(): SessionState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSessionState,
    () => state,
  );
}

/** Used inside services: who is making this request, and in which organisation. */
export interface Actor {
  user: User;
  orgId: Id<'org'> | null;
  org: Organisation | null;
  membership: Membership | null;
  roles: Role[];
  has(role: Role): boolean;
}

export function actor(): Actor {
  const { userId, orgId } = getSessionState();
  const user = userId ? store.get('users', userId) : undefined;
  if (!user) throw new ApiError('unauthenticated', 'Choose a person to continue.');
  const membership = orgId ? (store.find('memberships', (m) => m.userId === user.id && m.orgId === orgId && m.status === 'active')[0] ?? null) : null;
  const roles: Role[] = membership ? membership.roles : ['student'];
  return { user, orgId: membership ? orgId : null, org: membership && orgId ? (store.get('organisations', orgId) ?? null) : null, membership, roles, has: (r) => roles.includes(r) };
}
