import type { AttentionItem, CheckIn, Enrollment, Goal, Id, Milestone, Reflection, RichDoc, SessionNote, TimelineEvent } from '@/types';
import { ApiError, forbidden, notFound } from '../db/errors';
import { newId, nowIso } from '../db/ids';
import { actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { docToText } from '../editor/text';
import { nameOf } from './actions';
import { award } from './engine';
import { isMentorOf, requireRole, userCard } from './access';

const DAY = 86_400_000;
const daysBetween = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY);

function menteesOf(mentorId: string, orgId: string | null) {
  return store.find('assignments', (x) => x.orgId === orgId && x.mentorId === mentorId && x.status === 'active').map((x) => x.menteeId);
}

export const mentoringService = {
  /** "Who might need me this week?" Derived from the same data the rest of the app uses. */
  attention: () =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor');
      const org = a.org;
      const targetDays = org?.settings.reflectionResponseTargetDays ?? 3;
      const quietDays = org?.settings.attentionAfterDays ?? 14;
      const mentees = menteesOf(a.user.id, a.orgId);
      const items: (AttentionItem & { priority: number })[] = [];
      const snoozed = new Map(store.find('snoozes', (s) => s.mentorId === a.user.id).map((s) => [s.key, s.until]));
      for (const mid of mentees) {
        const name = nameOf(mid);
        for (const r of store.find('reflections', (x) => x.authorId === mid && x.status === 'submitted' && x.feedbackStatus === 'awaiting' && x.visibility !== 'private')) {
          const days = daysBetween(r.submittedAt ?? r.updatedAt);
          if (days >= targetDays) {
            const lesson = r.lessonId ? store.get('lessons', r.lessonId)?.title : '';
            items.push({ id: `refl:${r.id}`, menteeId: mid, kind: 'reflection_waiting', detail: { messageKey: 'attention.reflection_waiting', params: { name, days, lesson: lesson ?? '' } }, subject: { type: 'reflection', id: r.id }, since: r.submittedAt ?? r.updatedAt, snoozedUntil: snoozed.get(`refl:${r.id}`) ?? null, priority: 1 });
          }
        }
        const membership = store.find('memberships', (m) => m.userId === mid && m.orgId === a.orgId)[0];
        const last = membership?.lastActiveAt;
        if (last && daysBetween(last) >= quietDays) {
          items.push({ id: `quiet:${mid}`, menteeId: mid, kind: 'quiet', detail: { messageKey: 'attention.quiet', params: { name, days: daysBetween(last) } }, subject: { type: 'user', id: mid }, since: last, snoozedUntil: snoozed.get(`quiet:${mid}`) ?? null, priority: 2 });
        }
        for (const g of store.find('goals', (x) => x.userId === mid && x.status === 'active' && !!x.targetDate)) {
          const diff = Math.ceil((new Date(g.targetDate as string).getTime() - Date.now()) / DAY);
          if (diff >= 0 && diff <= 7) items.push({ id: `goal:${g.id}`, menteeId: mid, kind: 'goal_due', detail: { messageKey: 'attention.goal_due', params: { name, goal: g.title, days: diff } }, subject: { type: 'goal', id: g.id }, since: g.createdAt, snoozedUntil: snoozed.get(`goal:${g.id}`) ?? null, priority: 4 });
        }
        for (const c of store.find('checkIns', (x) => x.menteeId === mid && x.mentorId === a.user.id && x.status === 'planned')) {
          const hours = (new Date(c.scheduledAt).getTime() - Date.now()) / 3_600_000;
          if (hours > 0 && hours <= 72) items.push({ id: `chk:${c.id}`, menteeId: mid, kind: 'checkin_soon', detail: { messageKey: 'attention.checkin_soon', params: { name, hours: Math.round(hours) } }, subject: { type: 'checkIn', id: c.id }, since: c.createdAt, snoozedUntil: snoozed.get(`chk:${c.id}`) ?? null, priority: 3 });
        }
        for (const p of store.find('prayers', (x) => x.authorId === mid && x.privacy === 'mentor' && x.status === 'open' && daysBetween(x.createdAt) <= 7)) {
          items.push({ id: `pray:${p.id}`, menteeId: mid, kind: 'prayer_shared', detail: { messageKey: 'attention.prayer_shared', params: { name } }, subject: { type: 'prayer', id: p.id }, since: p.createdAt, snoozedUntil: snoozed.get(`pray:${p.id}`) ?? null, priority: 5 });
        }
        for (const m of store.find('milestones', (x) => x.userId === mid && !x.affirmedBy && daysBetween(x.awardedAt) <= 10 && ['pathway_complete', 'first_reflection'].includes(x.key))) {
          items.push({ id: `mls:${m.id}`, menteeId: mid, kind: 'milestone_to_affirm', detail: { messageKey: 'attention.milestone', params: { name, titleKey: `milestones.${m.key}.title` } }, subject: { type: 'milestone', id: m.id }, since: m.awardedAt, snoozedUntil: snoozed.get(`mls:${m.id}`) ?? null, priority: 6 });
        }
      }
      return items.filter((i) => !i.snoozedUntil || i.snoozedUntil < nowIso()).sort((x, y) => x.priority - y.priority || x.since.localeCompare(y.since)).map(({ priority, ...rest }) => ({ ...(void priority, rest), menteeName: nameOf(rest.menteeId) }) as AttentionItem & { menteeName: string });
    }),

  snooze: (itemId: string, days: 3 | 7) =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor');
      store.put('snoozes', { id: `snz_${a.user.id}_${itemId}`, mentorId: a.user.id, key: itemId, until: new Date(Date.now() + days * DAY).toISOString() });
    }, { write: true }),

  mentees: () =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor');
      return menteesOf(a.user.id, a.orgId).map((id) => {
        const membership = store.find('memberships', (m) => m.userId === id && m.orgId === a.orgId)[0];
        const enrolls = store.find('enrollments', (e) => e.userId === id && e.status === 'active');
        const current = enrolls[0] ? store.get('pathways', enrolls[0].pathwayId) : undefined;
        const lessons = current ? store.find('lessons', (l) => l.pathwayId === current.id && l.status === 'published') : [];
        const done = lessons.filter((l) => store.get('progress', `prg_${id.slice(4)}_${l.id}`)?.status === 'completed').length;
        const refl = store.find('reflections', (r) => r.authorId === id && r.status === 'submitted' && r.visibility !== 'private');
        const lastRefl = refl.map((r) => r.submittedAt ?? '').sort().pop() ?? null;
        const next = store.find('checkIns', (c) => c.menteeId === id && c.mentorId === a.user.id && c.status === 'planned').map((c) => c.scheduledAt).sort()[0] ?? null;
        return {
          user: userCard(id), pathwayTitle: current?.title ?? null, completedLessons: done, totalLessons: lessons.length, lastReflectionAt: lastRefl, lastActiveAt: membership?.lastActiveAt ?? null,
          nextCheckInAt: next, awaitingCount: refl.filter((r) => r.feedbackStatus === 'awaiting').length,
        };
      });
    }),

  menteeOverview: (menteeId: string) =>
    call(() => {
      const a = actor();
      if (!isMentorOf(a, menteeId)) throw forbidden('This person is not one of your mentees.');
      const membership = store.find('memberships', (m) => m.userId === menteeId && m.orgId === a.orgId)[0];
      const reflections: Reflection[] = store.find('reflections', (r) => r.authorId === menteeId && r.status === 'submitted' && r.visibility !== 'private').sort((x, y) => (y.submittedAt ?? '').localeCompare(x.submittedAt ?? ''));
      const enrollments: (Enrollment & { pathwayTitle: string; completed: number; total: number })[] = store.find('enrollments', (e) => e.userId === menteeId).map((e) => {
        const lessons = store.find('lessons', (l) => l.pathwayId === e.pathwayId && l.status === 'published');
        return { ...e, pathwayTitle: store.get('pathways', e.pathwayId)?.title ?? '', completed: lessons.filter((l) => store.get('progress', `prg_${menteeId.slice(4)}_${l.id}`)?.status === 'completed').length, total: lessons.length };
      });
      const timeline: TimelineEvent[] = store.find('timeline', (t) => t.userId === menteeId && t.visibility !== 'owner').sort((x, y) => y.occurredAt.localeCompare(x.occurredAt)).slice(0, 40);
      const milestones: Milestone[] = store.find('milestones', (m) => m.userId === menteeId);
      const goals: Goal[] = store.find('goals', (g) => g.userId === menteeId);
      const checkIns: CheckIn[] = store.find('checkIns', (c) => c.menteeId === menteeId && c.mentorId === a.user.id).sort((x, y) => y.scheduledAt.localeCompare(x.scheduledAt));
      const notes: SessionNote[] = store.find('sessionNotes', (n) => n.menteeId === menteeId && n.mentorId === a.user.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
      return { user: store.get('users', menteeId), lastActiveAt: membership?.lastActiveAt ?? null, reflections: reflections.map((r) => ({ id: r.id, lessonId: r.lessonId, title: r.title, plainText: r.plainText, submittedAt: r.submittedAt, feedbackStatus: r.feedbackStatus, lessonTitle: r.lessonId ? (store.get('lessons', r.lessonId)?.title ?? null) : null })), enrollments, timeline, milestones, goals, checkIns, notes };
    }),

  // Goals
  createGoal: (input: { userId?: string; title: string; description?: string | null; targetDate?: string | null; steps?: string[] }) =>
    call(() => {
      const a = actor();
      const owner = (input.userId ?? a.user.id) as Id<'usr'>;
      if (owner !== a.user.id && !isMentorOf(a, owner)) throw forbidden();
      const goal: Goal = {
        id: newId('gol'), userId: owner, createdBy: a.user.id, kind: owner === a.user.id ? 'personal' : 'mentor_set', title: input.title, description: input.description ?? null, targetDate: input.targetDate ?? null,
        steps: (input.steps ?? []).filter(Boolean).map((label, i) => ({ id: `s${i + 1}`, label, done: false })), status: 'active', completedAt: null, linked: null, mentorNote: null, version: 1, createdAt: nowIso(),
      };
      return store.put('goals', goal);
    }, { write: true }),

  updateGoal: (id: string, patch: Partial<Pick<Goal, 'title' | 'description' | 'targetDate' | 'steps' | 'status' | 'mentorNote'>>) =>
    call(() => {
      const a = actor();
      const g = store.get('goals', id);
      if (!g) throw notFound('That goal');
      if (g.userId !== a.user.id && !isMentorOf(a, g.userId)) throw forbidden();
      const status = patch.status ?? g.status;
      const next = store.put('goals', { ...g, ...patch, status, completedAt: status === 'completed' ? (g.completedAt ?? nowIso()) : null, version: g.version + 1 });
      if (status === 'completed' && g.status !== 'completed') {
        award(g.userId, 'goal_completed', { type: 'goal', id: g.id });
      }
      return next;
    }, { write: true }),

  goals: (userId?: string) =>
    call(() => {
      const a = actor();
      const uid = userId ?? a.user.id;
      if (uid !== a.user.id && !isMentorOf(a, uid)) throw forbidden();
      return store.find('goals', (g) => g.userId === uid).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    }),

  // Check-ins and notes
  scheduleCheckIn: (input: { menteeId: string; scheduledAt: string; durationMin: number; mode: CheckIn['mode']; location?: string | null; agenda: string[] }) =>
    call(() => {
      const a = actor();
      if (!isMentorOf(a, input.menteeId)) throw forbidden();
      const c: CheckIn = { id: newId('chk'), mentorId: a.user.id, menteeId: input.menteeId as Id<'usr'>, scheduledAt: input.scheduledAt, durationMin: input.durationMin, mode: input.mode, location: input.location ?? null, status: 'planned', agenda: input.agenda, sharedSummary: null, createdAt: nowIso() };
      return store.put('checkIns', c);
    }, { write: true }),

  updateCheckIn: (id: string, patch: Partial<Pick<CheckIn, 'status' | 'scheduledAt' | 'agenda' | 'sharedSummary'>>) =>
    call(() => {
      const a = actor();
      const c = store.get('checkIns', id);
      if (!c || c.mentorId !== a.user.id) throw notFound('That check-in');
      return store.put('checkIns', { ...c, ...patch });
    }, { write: true }),

  myCheckIns: () =>
    call(() => {
      const a = actor();
      return store.find('checkIns', (c) => c.menteeId === a.user.id || c.mentorId === a.user.id).sort((x, y) => x.scheduledAt.localeCompare(y.scheduledAt)).map((c) => ({ ...c, mentee: userCard(c.menteeId), mentor: userCard(c.mentorId) }));
    }),

  saveNote: (input: { id?: string; menteeId: string; checkInId?: string | null; body: RichDoc; followUps?: { id: string; label: string; done: boolean }[] }) =>
    call(() => {
      const a = actor();
      if (!isMentorOf(a, input.menteeId)) throw forbidden();
      const existing = input.id ? store.get('sessionNotes', input.id) : undefined;
      if (existing && existing.mentorId !== a.user.id) throw forbidden();
      const at = nowIso();
      const note: SessionNote = {
        id: existing?.id ?? newId('snt'), mentorId: a.user.id, menteeId: input.menteeId as Id<'usr'>, checkInId: (input.checkInId as Id<'chk'>) ?? existing?.checkInId ?? null, body: input.body, plainText: docToText(input.body),
        followUps: input.followUps ?? existing?.followUps ?? [], createdAt: existing?.createdAt ?? at, updatedAt: at, version: (existing?.version ?? 0) + 1,
      };
      return store.put('sessionNotes', note);
    }, { write: true }),

  affirmMilestone: (userId: string, key: string, note?: string) =>
    call(() => {
      const a = actor();
      if (!isMentorOf(a, userId)) throw forbidden();
      const existing = store.find('milestones', (m) => m.userId === userId && m.key === key)[0];
      if (existing) return store.put('milestones', { ...existing, affirmedBy: a.user.id, note: note ?? existing.note });
      const m = award(userId as Id<'usr'>, key, null, nowIso(), a.user.id, note ?? null);
      if (!m) throw new ApiError('conflict', 'That milestone already exists.');
      return m;
    }, { write: true }),
};
