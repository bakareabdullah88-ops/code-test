import type { EventKind, Id, OrgEvent, PlanDay, ReadingPlan, Resource, ResourceKind, RsvpStatus } from '@/types';
import { ApiError, notFound } from '../db/errors';
import { newId, nowIso } from '../db/ids';
import { actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { requireRole, userCard } from './access';
import { addTimeline, evaluateMilestones, notify } from './engine';

export interface EventCard extends OrgEvent {
  host: ReturnType<typeof userCard>;
  goingCount: number;
  maybeCount: number;
  mine: RsvpStatus | null;
  full: boolean;
}
export interface EventDetail extends EventCard { attendees: ReturnType<typeof userCard>[] }

function card(e: OrgEvent, userId: string): EventCard {
  const rs = store.find('rsvps', (r) => r.eventId === e.id);
  const going = rs.filter((r) => r.status === 'going').length;
  return {
    ...e, host: userCard(e.hostId), goingCount: going, maybeCount: rs.filter((r) => r.status === 'maybe').length,
    mine: rs.find((r) => r.userId === userId)?.status ?? null, full: e.capacity !== null && going >= e.capacity,
  };
}

export interface ResourceCard extends Resource { bookmarked: boolean }
export interface PlanCard extends ReadingPlan { dayCount: number; completed: number; started: boolean; nextDay: number | null }
export interface PlanDetail extends PlanCard { progressDays: number[] }

function planCard(p: ReadingPlan, userId: string): PlanCard {
  const pr = store.find('planProgress', (x) => x.userId === userId && x.planId === p.id)[0];
  const done = pr?.completedDays ?? [];
  const next = p.days.find((d) => !done.includes(d.day))?.day ?? null;
  return { ...p, dayCount: p.days.length, completed: done.length, started: !!pr, nextDay: pr ? next : null };
}

export const eventsService = {
  list: (scope: 'upcoming' | 'going' | 'past' = 'upcoming') =>
    call(() => {
      const a = actor();
      if (!a.orgId) return [] as EventCard[];
      const now = nowIso();
      let rows = store.find('events', (e) => e.orgId === a.orgId).map((e) => card(e, a.user.id));
      if (scope === 'past') rows = rows.filter((e) => e.endsAt < now).sort((x, y) => y.startsAt.localeCompare(x.startsAt));
      else {
        rows = rows.filter((e) => e.endsAt >= now).sort((x, y) => x.startsAt.localeCompare(y.startsAt));
        if (scope === 'going') rows = rows.filter((e) => e.mine === 'going' || e.mine === 'maybe');
      }
      return rows;
    }),

  get: (id: string) =>
    call((): EventDetail => {
      const a = actor();
      const e = store.get('events', id);
      if (!e || e.orgId !== a.orgId) throw notFound('That event');
      const attendees = store.find('rsvps', (r) => r.eventId === e.id && r.status === 'going').map((r) => userCard(r.userId));
      return { ...card(e, a.user.id), attendees };
    }),

  rsvp: (id: string, status: RsvpStatus | null) =>
    call(() => {
      const a = actor();
      const e = store.get('events', id);
      if (!e || e.orgId !== a.orgId) throw notFound('That event');
      if (e.endsAt < nowIso()) throw new ApiError('conflict', 'This event has already finished.');
      const existing = store.find('rsvps', (r) => r.eventId === e.id && r.userId === a.user.id)[0];
      if (status === null) { if (existing) store.remove('rsvps', existing.id); return card(e, a.user.id); }
      const going = store.find('rsvps', (r) => r.eventId === e.id && r.status === 'going' && r.userId !== a.user.id).length;
      if (status === 'going' && e.capacity !== null && going >= e.capacity) throw new ApiError('conflict', 'This event is full.');
      store.put('rsvps', { id: existing?.id ?? `rsv_${e.id}_${a.user.id}`, eventId: e.id, userId: a.user.id, status, at: nowIso() });
      if (status === 'going' && e.hostId !== a.user.id && !existing) notify(e.hostId, 'event_rsvp', { messageKey: 'notif.event_rsvp', params: { name: a.user.displayName, title: e.title } }, `/app/community/events/${e.id}`);
      return card(e, a.user.id);
    }, { write: true }),

  create: (input: { title: string; kind: EventKind; startsAt: string; durationMinutes: number; location: string; description: string; capacity: number | null }) =>
    call(() => {
      const a = actor();
      requireRole(a, 'leader', 'admin');
      if (!a.orgId) throw new ApiError('forbidden', 'Join an organisation first.');
      const fieldErrors: Record<string, string[]> = {};
      if (input.title.trim().length < 3) fieldErrors.title = ['required'];
      if (!input.startsAt || Number.isNaN(Date.parse(input.startsAt))) fieldErrors.startsAt = ['invalid'];
      if (input.location.trim().length < 2) fieldErrors.location = ['required'];
      if (Object.keys(fieldErrors).length) throw new ApiError('validation_failed', 'Check the highlighted fields.', { fieldErrors });
      const start = new Date(input.startsAt);
      const ev: OrgEvent = {
        id: newId('evt'), orgId: a.orgId as Id<'org'>, title: input.title.trim(), kind: input.kind, description: input.description.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
        startsAt: start.toISOString(), endsAt: new Date(start.getTime() + input.durationMinutes * 60_000).toISOString(), location: input.location.trim(),
        coverKey: ({ service: 'dawn', workshop: 'table', retreat: 'mountain', social: 'field', prayer: 'lamp' } as const)[input.kind], capacity: input.capacity, hostId: a.user.id, groupId: null, createdAt: nowIso(),
      };
      store.put('events', ev);
      store.put('rsvps', { id: `rsv_${ev.id}_${a.user.id}`, eventId: ev.id, userId: a.user.id, status: 'going', at: nowIso() });
      return card(ev, a.user.id);
    }, { write: true }),

  cancel: (id: string) =>
    call(() => {
      const a = actor();
      const e = store.get('events', id);
      if (!e || e.orgId !== a.orgId) throw notFound('That event');
      if (e.hostId !== a.user.id && !a.has('admin')) throw new ApiError('forbidden', 'Only the host or an admin can cancel this event.');
      for (const r of store.find('rsvps', (x) => x.eventId === e.id)) store.remove('rsvps', r.id);
      store.remove('events', e.id);
      return { id };
    }, { write: true }),
};

export const libraryService = {
  list: (q: { query?: string; kind?: ResourceKind | 'all'; saved?: boolean } = {}) =>
    call(() => {
      const a = actor();
      const marks = new Set(store.find('bookmarks', (b) => b.userId === a.user.id).map((b) => b.resourceId));
      const query = (q.query ?? '').trim().toLowerCase();
      return store.find('resources', (r) => r.orgId === null || r.orgId === a.orgId)
        .filter((r) => (!q.kind || q.kind === 'all' || r.kind === q.kind) && (!q.saved || marks.has(r.id)) && (!query || `${r.title} ${r.summary} ${r.author} ${r.tags.join(' ')}`.toLowerCase().includes(query)))
        .sort((x, y) => x.title.localeCompare(y.title))
        .map((r): ResourceCard => ({ ...r, bookmarked: marks.has(r.id) }));
    }),

  get: (id: string) =>
    call((): ResourceCard => {
      const a = actor();
      const r = store.get('resources', id);
      if (!r || (r.orgId && r.orgId !== a.orgId)) throw notFound('That resource');
      return { ...r, bookmarked: store.find('bookmarks', (b) => b.userId === a.user.id && b.resourceId === r.id).length > 0 };
    }),

  toggleBookmark: (id: string) =>
    call(() => {
      const a = actor();
      const r = store.get('resources', id);
      if (!r) throw notFound('That resource');
      const existing = store.find('bookmarks', (b) => b.userId === a.user.id && b.resourceId === r.id)[0];
      if (existing) { store.remove('bookmarks', existing.id); return { bookmarked: false }; }
      store.put('bookmarks', { id: `bkm_${a.user.id}_${r.id}`, userId: a.user.id, resourceId: r.id, at: nowIso() });
      return { bookmarked: true };
    }, { write: true }),
};

export const plansService = {
  list: () => call(() => { const a = actor(); return store.list('plans').map((p) => planCard(p, a.user.id)); }),

  get: (id: string) =>
    call((): PlanDetail => {
      const a = actor();
      const p = store.get('plans', id);
      if (!p) throw notFound('That plan');
      const pr = store.find('planProgress', (x) => x.userId === a.user.id && x.planId === p.id)[0];
      return { ...planCard(p, a.user.id), progressDays: pr?.completedDays ?? [] };
    }),

  start: (id: string) =>
    call(() => {
      const a = actor();
      const p = store.get('plans', id);
      if (!p) throw notFound('That plan');
      if (!store.find('planProgress', (x) => x.userId === a.user.id && x.planId === p.id).length) store.put('planProgress', { id: `ppr_${a.user.id}_${p.id}`, userId: a.user.id, planId: p.id, startedAt: nowIso(), completedDays: [], updatedAt: nowIso() });
      return planCard(p, a.user.id);
    }, { write: true }),

  /** Marks a day done or undone. Finishing the last day adds a timeline entry and checks milestones. */
  toggleDay: (id: string, day: PlanDay['day']) =>
    call(() => {
      const a = actor();
      const p = store.get('plans', id);
      if (!p || !p.days.some((d) => d.day === day)) throw notFound('That day');
      const pr = store.find('planProgress', (x) => x.userId === a.user.id && x.planId === p.id)[0];
      if (!pr) throw new ApiError('conflict', 'Start the plan first.');
      const had = pr.completedDays.includes(day);
      const completedDays = (had ? pr.completedDays.filter((d) => d !== day) : [...pr.completedDays, day]).sort((x, y) => x - y);
      store.put('planProgress', { ...pr, completedDays, updatedAt: nowIso() });
      if (!had && completedDays.length === p.days.length) {
        addTimeline(a.user.id, 'plan_completed', { type: 'plan', id: p.id }, { messageKey: 'timeline.plan_completed', params: { title: p.title } }, 'mentor');
        evaluateMilestones(a.user.id);
      }
      return planCard(p, a.user.id);
    }, { write: true }),
};
