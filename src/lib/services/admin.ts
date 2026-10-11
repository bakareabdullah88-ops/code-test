import type { Id, Invite, Membership, Organisation, Role } from '@/types';
import { ApiError, forbidden, notFound } from '../db/errors';
import { daysFromNow, newId, nowIso } from '../db/ids';
import { actor, type Actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { notify } from './engine';
import { nameOf } from './actions';
import { requireRole, userCard } from './access';

const admin = (): Actor => {
  const a = actor();
  requireRole(a, 'admin');
  if (!a.orgId) throw forbidden();
  return a;
};
const audit = (a: Actor, action: string, subject: { type: 'user' | 'group'; id: string } | null, meta: Record<string, unknown> = {}) =>
  store.put('audit', { id: newId('aud'), orgId: a.orgId as Id<'org'>, actorId: a.user.id, action, subject, at: nowIso(), meta });

export interface MemberRow { membership: Membership; user: ReturnType<typeof userCard> & { email: string }; mentors: ReturnType<typeof userCard>[]; groups: { id: string; name: string }[] }

export const adminService = {
  members: () =>
    call((): MemberRow[] => {
      const a = admin();
      return store.find('memberships', (m) => m.orgId === a.orgId).map((m) => ({
        membership: m, user: { ...userCard(m.userId), email: store.get('users', m.userId)?.email ?? '' },
        mentors: store.find('assignments', (x) => x.orgId === a.orgId && x.menteeId === m.userId && x.status === 'active').map((x) => userCard(x.mentorId)),
        groups: store.find('groupMemberships', (g) => g.userId === m.userId).flatMap((g) => { const grp = store.get('groups', g.groupId); return grp ? [{ id: grp.id, name: grp.name }] : []; }),
      })).sort((x, y) => x.user.displayName.localeCompare(y.user.displayName));
    }),

  updateMember: (membershipId: string, patch: { roles?: Role[]; status?: 'active' | 'suspended' }) =>
    call(() => {
      const a = admin();
      const m = store.get('memberships', membershipId);
      if (!m || m.orgId !== a.orgId) throw notFound('That member');
      if (patch.roles) {
        if (!patch.roles.length) throw new ApiError('validation_failed', 'Keep at least one role.');
        const otherAdmins = store.find('memberships', (x) => x.orgId === a.orgId && x.id !== m.id && x.roles.includes('admin') && x.status === 'active');
        if (m.roles.includes('admin') && !patch.roles.includes('admin') && !otherAdmins.length) throw new ApiError('conflict', 'An organisation needs at least one admin.');
      }
      const next = store.put('memberships', { ...m, ...patch });
      audit(a, 'member.update', { type: 'user', id: m.userId }, { ...patch });
      return next;
    }, { write: true }),

  assignMentor: (menteeId: string, mentorId: string | null) =>
    call(() => {
      const a = admin();
      for (const x of store.find('assignments', (y) => y.orgId === a.orgId && y.menteeId === menteeId && y.status === 'active')) store.put('assignments', { ...x, status: 'ended', endedAt: nowIso() });
      if (mentorId) {
        store.put('assignments', { id: newId('mas'), orgId: a.orgId as Id<'org'>, mentorId: mentorId as Id<'usr'>, menteeId: menteeId as Id<'usr'>, status: 'active', startedAt: nowIso(), endedAt: null });
        notify(menteeId as Id<'usr'>, 'assignment', { messageKey: 'notif.mentor_assigned', params: { mentor: nameOf(mentorId) } }, '/app/today');
        notify(mentorId as Id<'usr'>, 'assignment', { messageKey: 'notif.mentee_assigned', params: { name: nameOf(menteeId) } }, '/mentor/mentees');
      }
      audit(a, 'mentor.assign', { type: 'user', id: menteeId }, { mentorId });
    }, { write: true }),

  invites: () => call(() => { const a = admin(); return store.find('invites', (i) => i.orgId === a.orgId).sort((x, y) => y.createdAt.localeCompare(x.createdAt)); }),

  createInvite: (input: { roles: Role[]; email?: string; expiresInDays: number }) =>
    call(() => {
      const a = admin();
      if (!input.roles.length) throw new ApiError('validation_failed', 'Choose at least one role.', { fieldErrors: { roles: ['Choose at least one role.'] } });
      const code = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      const inv: Invite = { id: newId('inv'), orgId: a.orgId as Id<'org'>, code, email: input.email?.trim() || null, roles: input.roles, expiresAt: daysFromNow(input.expiresInDays), status: 'pending', createdBy: a.user.id, createdAt: nowIso() };
      store.put('invites', inv);
      audit(a, 'invite.create', null, { roles: input.roles });
      return inv;
    }, { write: true }),

  revokeInvite: (id: string) =>
    call(() => {
      const a = admin();
      const i = store.get('invites', id);
      if (!i || i.orgId !== a.orgId) throw notFound('That invite');
      store.put('invites', { ...i, status: 'revoked' });
      audit(a, 'invite.revoke', null);
    }, { write: true }),

  groups: () =>
    call(() => {
      const a = admin();
      return store.find('groups', (g) => g.orgId === a.orgId).map((g) => ({ ...g, leaders: g.leaderIds.map(userCard), pathwayTitle: g.pathwayId ? (store.get('pathways', g.pathwayId)?.title ?? null) : null }));
    }),

  createGroup: (input: { name: string; description: string; leaderId: string; pathwayId?: string | null }) =>
    call(() => {
      const a = admin();
      if (!input.name.trim()) throw new ApiError('validation_failed', 'Give the group a name.', { fieldErrors: { name: ['Give the group a name.'] } });
      const id = newId('grp');
      const g = store.put('groups', { id, orgId: a.orgId as Id<'org'>, name: input.name.trim(), description: input.description || null, leaderIds: [input.leaderId as Id<'usr'>], privacy: 'open_to_org', pathwayId: (input.pathwayId as Id<'pth'>) ?? null, schedule: { recurrence: 'weekly', weekday: 4, startTime: '18:30', durationMin: 90, timeZone: 'UTC', location: null, videoUrl: null }, memberCount: 1, archivedAt: null, createdAt: nowIso() });
      store.put('groupMemberships', { id: `gmb_${id.slice(4)}_${input.leaderId.slice(4)}`, groupId: id, userId: input.leaderId as Id<'usr'>, role: 'leader', joinedAt: nowIso() });
      const m = store.find('memberships', (x) => x.userId === input.leaderId && x.orgId === a.orgId)[0];
      if (m && !m.roles.includes('leader')) store.put('memberships', { ...m, roles: [...m.roles, 'leader'] });
      audit(a, 'group.create', { type: 'group', id });
      return g;
    }, { write: true }),

  archiveGroup: (id: string, archived: boolean) =>
    call(() => {
      const a = admin();
      const g = store.get('groups', id);
      if (!g || g.orgId !== a.orgId) throw notFound('That group');
      store.put('groups', { ...g, archivedAt: archived ? nowIso() : null });
      audit(a, archived ? 'group.archive' : 'group.restore', { type: 'group', id });
    }, { write: true }),

  updateOrg: (patch: { name?: string; branding?: Partial<Organisation['branding']>; settings?: Partial<Organisation['settings']> }) =>
    call(() => {
      const a = admin();
      const o = store.get('organisations', a.orgId as string);
      if (!o) throw notFound('That organisation');
      const next = store.put('organisations', { ...o, name: patch.name?.trim() || o.name, branding: { ...o.branding, ...patch.branding }, settings: { ...o.settings, ...patch.settings } });
      audit(a, 'org.update', null, { keys: Object.keys(patch) });
      return next;
    }, { write: true }),

  audit: () => call(() => { const a = admin(); return store.find('audit', (e) => e.orgId === a.orgId).sort((x, y) => y.at.localeCompare(x.at)).slice(0, 50).map((e) => ({ ...e, actor: userCard(e.actorId) })); }),

  /** Aggregates only. Nothing here reads reflection, prayer, note or conversation text. */
  report: (days: number) =>
    call(() => {
      const a = admin();
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      const members = store.find('memberships', (m) => m.orgId === a.orgId && m.status === 'active');
      const ids = new Set(members.map((m) => m.userId));
      const week = (iso: string) => { const d = new Date(iso); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); d.setUTCHours(0, 0, 0, 0); return d.toISOString().slice(0, 10); };
      const weeks = new Map<string, { weekStart: string; lessons: number; reflections: number; active: Set<string> }>();
      const touch = (iso: string, uid: string, k: 'lessons' | 'reflections' | null) => {
        if (iso < since || !ids.has(uid as Id<'usr'>)) return;
        const w = week(iso);
        const row = weeks.get(w) ?? { weekStart: w, lessons: 0, reflections: 0, active: new Set<string>() };
        if (k) row[k]++;
        row.active.add(uid);
        weeks.set(w, row);
      };
      const completed = store.find('progress', (p) => p.status === 'completed' && !!p.completedAt && p.completedAt >= since && ids.has(p.userId));
      for (const p of completed) touch(p.completedAt as string, p.userId, 'lessons');
      const submitted = store.find('reflections', (r) => r.status === 'submitted' && !!r.submittedAt && r.orgId === a.orgId);
      for (const r of submitted) touch(r.submittedAt as string, r.authorId, 'reflections');
      const activity = [...weeks.values()].sort((x, y) => x.weekStart.localeCompare(y.weekStart)).map((w) => ({ weekStart: w.weekStart, lessons: w.lessons, reflections: w.reflections, activeMembers: w.active.size }));
      const pathways = store.find('pathways', (p) => p.orgId === a.orgId && p.status === 'published').map((p) => {
        const enr = store.find('enrollments', (e) => e.pathwayId === p.id);
        return { id: p.id, title: p.title, started: enr.length, completed: enr.filter((e) => e.status === 'completed').length };
      });
      const waits = submitted.filter((r) => r.feedbackStatus !== 'none' && r.submittedAt);
      const bucket = (r: (typeof waits)[number]) => {
        const f = store.find('feedback', (x) => x.reflectionId === r.id && x.status === 'sent').map((x) => x.sentAt ?? '').sort()[0];
        const end = f ? new Date(f).getTime() : Date.now();
        const d = (end - new Date(r.submittedAt as string).getTime()) / 86_400_000;
        return d < 1 ? '<1d' : d < 3 ? '1-3d' : d < 7 ? '3-7d' : '>7d';
      };
      const responseTime = (['<1d', '1-3d', '3-7d', '>7d'] as const).map((b) => ({ bucket: b, count: waits.filter((r) => bucket(r) === b).length }));
      const groups = store.find('groups', (g) => g.orgId === a.orgId && !g.archivedAt).map((g) => {
        const held = store.find('meetings', (m) => m.groupId === g.id && m.status === 'held');
        const rate = held.length ? held.reduce((s, m) => s + m.attendance.filter((x) => x.present).length, 0) / held.length : 0;
        return { id: g.id, name: g.name, meetings: held.length, averageAttendance: Math.round(rate * 10) / 10, members: g.memberCount };
      });
      const milestones = store.find('milestones', (m) => ids.has(m.userId) && m.awardedAt >= since);
      const cats = new Map<string, number>();
      for (const m of milestones) cats.set(m.key, (cats.get(m.key) ?? 0) + 1);
      return {
        totals: { members: members.length, activeMembers: new Set(activity.length ? [...weeks.values()].flatMap((w) => [...w.active]) : []).size, lessonsCompleted: completed.length, reflections: submitted.filter((r) => (r.submittedAt ?? '') >= since).length, awaiting: submitted.filter((r) => r.feedbackStatus === 'awaiting').length, milestones: milestones.length, meetings: groups.reduce((s, g) => s + g.meetings, 0) },
        activity, pathways, responseTime, groups, milestones: [...cats.entries()].map(([key, count]) => ({ key, count })).sort((x, y) => y.count - x.count),
        setup: { invited: store.find('invites', (i) => i.orgId === a.orgId).length > 0, groups: groups.length > 0, mentors: store.find('assignments', (x) => x.orgId === a.orgId).length > 0 },
      };
    }),
};
