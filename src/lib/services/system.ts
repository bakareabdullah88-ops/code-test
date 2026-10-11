import type { Id, Notification, NotificationKind, SearchHit, Session } from '@/types';
import { ApiError, forbidden, notFound } from '../db/errors';
import { actor, getSessionState, signInAs } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { newId, nowIso } from '../db/ids';
import { SEED_VERSION, seedAll } from '@/seed';
import { milestoneDefinitions } from './engine';
import { isMentorOf, userCard } from './access';

export const bootService = {
  /** Loads saved data, or seeds the demo on first run (or when the seed changed). */
  async ensureSeeded(): Promise<{ seeded: boolean; persistent: boolean }> {
    const had = await store.load();
    const meta = store.get('meta', 'seedVersion');
    let seeded = false;
    if (!had || !meta || meta.value !== SEED_VERSION) {
      await store.clearAll();
      seedAll();
      store.put('meta', { id: 'seedVersion', value: SEED_VERSION });
      await store.flush();
      seeded = true;
    }
    const s = getSessionState();
    if (s.userId && !store.get('users', s.userId)) signInAs(null, null);
    return { seeded, persistent: store.persistent };
  },
  async reset() {
    await store.clearAll();
    seedAll();
    store.put('meta', { id: 'seedVersion', value: SEED_VERSION });
    await store.flush();
    signInAs(null, null);
  },
};

export interface PersonaCard { userId: Id<'usr'>; orgId: Id<'org'> | null; name: string; country: string | null; roles: ('student' | 'mentor' | 'leader' | 'admin')[]; orgName: string | null; blurb: string }

export const authService = {
  /** Demo sign-in: matches a seeded email; the password is not checked because there is no real account system. */
  signIn: (input: { email: string; password: string }) =>
    call(() => {
      const email = input.email.trim().toLowerCase();
      const fieldErrors: Record<string, string[]> = {};
      if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = ['invalid'];
      if (!input.password) fieldErrors.password = ['required'];
      if (Object.keys(fieldErrors).length) throw new ApiError('validation_failed', 'Check the highlighted fields.', { fieldErrors });
      const user = store.find('users', (u) => u.email.toLowerCase() === email)[0];
      if (!user) throw new ApiError('unauthenticated', 'We could not find an account with that email.');
      const m = store.find('memberships', (x) => x.userId === user.id && x.status === 'active')[0];
      signInAs(user.id, m?.orgId ?? null);
      return { userId: user.id, roles: m?.roles ?? (['student'] as const), name: user.displayName };
    }),

  /** Joins an organisation with an invite code and creates the account in the demo store. */
  join: (input: { code: string; name: string; email: string }) =>
    call(() => {
      const fieldErrors: Record<string, string[]> = {};
      if (input.name.trim().length < 2) fieldErrors.name = ['required'];
      if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) fieldErrors.email = ['invalid'];
      if (Object.keys(fieldErrors).length) throw new ApiError('validation_failed', 'Check the highlighted fields.', { fieldErrors });
      const code = input.code.trim().toUpperCase();
      const inv = store.find('invites', (i) => i.code.toUpperCase() === code)[0];
      if (!inv || inv.status !== 'pending' || inv.expiresAt < nowIso()) throw new ApiError('not_found', 'That invite code is not valid or has expired.', { fieldErrors: { code: ['invalid'] } });
      const email = input.email.trim().toLowerCase();
      if (store.find('users', (u) => u.email.toLowerCase() === email).length) throw new ApiError('conflict', 'An account with that email already exists. Try signing in.', { fieldErrors: { email: ['taken'] } });
      const now = nowIso();
      const user = { id: newId('usr'), displayName: input.name.trim(), email, avatarUrl: null, bio: null, country: null, locale: 'en' as const, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', createdAt: now };
      store.put('users', user);
      store.put('memberships', { id: newId('mem'), userId: user.id, orgId: inv.orgId, roles: inv.roles, status: 'active', joinedAt: now, lastActiveAt: now });
      store.put('invites', { ...inv, status: 'accepted' });
      signInAs(user.id, inv.orgId);
      return { userId: user.id, roles: inv.roles, name: user.displayName };
    }),
};

export const sessionService = {
  /** People the demo can sign in as, grouped in the UI by role. */
  personas: () =>
    call(() => {
      const cards: PersonaCard[] = [];
      for (const u of store.list('users')) {
        const ms = store.find('memberships', (m) => m.userId === u.id && m.status === 'active');
        if (!ms.length) {
          cards.push({ userId: u.id, orgId: null, name: u.displayName, country: u.country, roles: ['student'], orgName: null, blurb: u.bio ?? '' });
          continue;
        }
        const first = ms[0];
        if (first) cards.push({ userId: u.id, orgId: first.orgId, name: u.displayName, country: u.country, roles: first.roles, orgName: store.get('organisations', first.orgId)?.name ?? null, blurb: u.bio ?? '' });
      }
      return cards;
    }, { raw: true }),

  me: () =>
    call((): Session => {
      const a = actor();
      const memberships = store.find('memberships', (m) => m.userId === a.user.id && m.status === 'active');
      return { user: a.user, memberships, organisations: memberships.map((m) => store.get('organisations', m.orgId)).filter((o): o is NonNullable<typeof o> => !!o), activeOrgId: a.orgId, capabilities: [] };
    }, { raw: true }),

  switchOrg: (orgId: Id<'org'> | null) =>
    call(() => {
      const { userId } = getSessionState();
      if (!userId) throw new ApiError('unauthenticated', 'Choose a person first.');
      if (orgId && !store.find('memberships', (m) => m.userId === userId && m.orgId === orgId && m.status === 'active').length) throw forbidden();
      signInAs(userId, orgId);
    }, { raw: true }),
};

export const notificationsService = {
  list: (unreadOnly = false) =>
    call(() => {
      const a = actor();
      return store.find('notifications', (n) => n.userId === a.user.id && (!unreadOnly || !n.readAt)).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 100);
    }),
  unreadCount: () => call(() => store.find('notifications', (n) => n.userId === actor().user.id && !n.readAt).length),
  markRead: (ids: string[] | 'all') =>
    call(() => {
      const a = actor();
      const now = new Date().toISOString();
      for (const n of store.find('notifications', (x) => x.userId === a.user.id && !x.readAt && (ids === 'all' || ids.includes(x.id)))) store.put('notifications', { ...n, readAt: now });
    }, { write: true }),
};
export type { Notification, NotificationKind };

export const growthService = {
  timeline: (userId?: string) =>
    call(() => {
      const a = actor();
      const uid = userId ?? a.user.id;
      const own = uid === a.user.id;
      if (!own && !isMentorOf(a, uid)) throw forbidden();
      return store.find('timeline', (t) => t.userId === uid && (own || t.visibility !== 'owner')).sort((x, y) => y.occurredAt.localeCompare(x.occurredAt));
    }),
  milestones: () =>
    call(() => {
      const a = actor();
      const mine = store.find('milestones', (m) => m.userId === a.user.id).sort((x, y) => y.awardedAt.localeCompare(x.awardedAt));
      const earned = new Set(mine.map((m) => m.key));
      return { earned: mine.map((m) => ({ ...m, affirmer: m.affirmedBy ? userCard(m.affirmedBy) : null })), upcoming: milestoneDefinitions.filter((d) => !earned.has(d.key)), definitions: milestoneDefinitions };
    }),
};

export const peopleService = {
  profile: (id: string) =>
    call(() => {
      const u = store.get('users', id);
      if (!u) throw notFound('That person');
      return { id: u.id, displayName: u.displayName, bio: u.bio, country: u.country, avatarUrl: u.avatarUrl };
    }),
  updateMe: (patch: { displayName?: string; bio?: string | null; avatarUrl?: string | null; country?: string | null }) =>
    call(() => {
      const a = actor();
      return store.put('users', { ...a.user, ...patch });
    }, { write: true }),
};

export const searchService = {
  search: (q: string) =>
    call((): SearchHit[] => {
      const a = actor();
      const needle = q.trim().toLowerCase();
      if (needle.length < 2) return [];
      const hits: SearchHit[] = [];
      for (const l of store.find('lessons', (x) => x.status === 'published' && (x.title + ' ' + x.summary).toLowerCase().includes(needle)).slice(0, 5)) {
        hits.push({ type: 'lesson', id: l.id, title: l.title, excerpt: l.summary, href: `/app/pathways/${l.pathwayId}/lessons/${l.id}` });
      }
      for (const p of store.find('pathways', (x) => x.status === 'published' && x.title.toLowerCase().includes(needle)).slice(0, 3)) hits.push({ type: 'pathway', id: p.id, title: p.title, excerpt: p.summary, href: `/app/pathways/${p.id}` });
      for (const r of store.find('reflections', (x) => x.authorId === a.user.id && (x.plainText + ' ' + (x.title ?? '')).toLowerCase().includes(needle)).slice(0, 4)) {
        hits.push({ type: 'reflection', id: r.id, title: r.title ?? r.lessonId ? (store.get('lessons', r.lessonId ?? '')?.title ?? 'Reflection') : 'Journal entry', excerpt: r.plainText.slice(0, 120), href: `/app/journal/${r.id}` });
      }
      if (a.orgId) {
        const visible = new Set(a.has('mentor') ? store.find('assignments', (x) => x.mentorId === a.user.id).map((x) => x.menteeId) : []);
        for (const m of store.find('memberships', (x) => x.orgId === a.orgId && x.status === 'active')) {
          const u = store.get('users', m.userId);
          if (!u || !u.displayName.toLowerCase().includes(needle)) continue;
          hits.push({ type: 'person', id: u.id, title: u.displayName, excerpt: m.roles.join(', '), href: visible.has(u.id) ? `/mentor/mentees/${u.id}` : `/profile/${u.id}` });
          if (hits.length > 16) break;
        }
      }
      return hits;
    }),
};
