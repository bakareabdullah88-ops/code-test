import type { Id, Reflection, Role } from '@/types';
import { ApiError, forbidden } from '../db/errors';
import { store } from '../db/store';
import { actor, type Actor } from '../db/session';

export function requireRole(a: Actor, ...roles: Role[]) {
  if (!roles.some((r) => a.has(r))) throw forbidden();
}

export const isMentorOf = (a: Actor, userId: string) =>
  !!a.orgId && store.find('assignments', (x) => x.orgId === a.orgId && x.mentorId === a.user.id && x.menteeId === userId && x.status === 'active').length > 0;

export const groupIdsOf = (userId: string) => store.find('groupMemberships', (g) => g.userId === userId).map((g) => g.groupId);
export const isLeaderOf = (userId: string, groupId: string) => store.find('groupMemberships', (g) => g.userId === userId && g.groupId === groupId && (g.role === 'leader' || g.role === 'co_leader')).length > 0;

/** Reflection visibility rules (PRODUCT.md section 5). Admins never read reflection content. */
export function canReadReflection(a: Actor, r: Reflection): boolean {
  if (r.authorId === a.user.id) return true;
  if (r.status !== 'submitted' || r.visibility === 'private') return false;
  if (isMentorOf(a, r.authorId)) return true;
  if (r.visibility === 'group' && r.groupId) return groupIdsOf(a.user.id).includes(r.groupId);
  return false;
}

export function mustReadReflection(id: string): { a: Actor; r: Reflection } {
  const a = actor();
  const r = store.get('reflections', id);
  if (!r || !canReadReflection(a, r)) throw new ApiError('not_found', 'That reflection could not be found.');
  return { a, r };
}

export const userCard = (id: string) => {
  const u = store.get('users', id);
  return u ? { id: u.id as Id<'usr'>, displayName: u.displayName, avatarUrl: u.avatarUrl, country: u.country } : { id: id as Id<'usr'>, displayName: 'Former member', avatarUrl: null, country: null };
};
