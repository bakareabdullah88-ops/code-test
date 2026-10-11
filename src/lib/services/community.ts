import type { DiscussionPost, DiscussionThread, Group, Id, Meeting, PrayerPrivacy, PrayerRequest, Report, RichDoc } from '@/types';
import { ApiError, forbidden, notFound } from '../db/errors';
import { newId, nowIso } from '../db/ids';
import { actor, type Actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { isEmptyDoc } from '../editor/text';
import { addTimeline, evaluateMilestones, notify } from './engine';
import { nameOf } from './actions';
import { groupIdsOf, isLeaderOf, isMentorOf, userCard } from './access';

const isMember = (userId: string, groupId: string) => (groupIdsOf(userId) as string[]).includes(groupId);

function mustSeeGroup(a: Actor, id: string): Group {
  const g = store.get('groups', id);
  if (!g || g.orgId !== a.orgId) throw notFound('That group');
  if (!isMember(a.user.id, id) && !a.has('admin')) throw forbidden('You are not in this group.');
  return g;
}

export interface GroupView extends Group { leaders: ReturnType<typeof userCard>[]; nextMeeting: Meeting | null; pathwayTitle: string | null; amLeader: boolean; amMember: boolean }

function groupView(g: Group, a: Actor): GroupView {
  const next = store.find('meetings', (m) => m.groupId === g.id && m.status === 'scheduled' && m.startsAt > nowIso()).sort((x, y) => x.startsAt.localeCompare(y.startsAt))[0] ?? null;
  return { ...g, leaders: g.leaderIds.map(userCard), nextMeeting: next, pathwayTitle: g.pathwayId ? (store.get('pathways', g.pathwayId)?.title ?? null) : null, amLeader: isLeaderOf(a.user.id, g.id), amMember: isMember(a.user.id, g.id) };
}

export const groupsService = {
  list: (scope: 'mine' | 'led' | 'org') =>
    call(() => {
      const a = actor();
      const mine = new Set(groupIdsOf(a.user.id));
      const list = store.find('groups', (g) => g.orgId === a.orgId && !g.archivedAt && (scope === 'org' ? a.has('admin') || g.privacy === 'open_to_org' : scope === 'led' ? isLeaderOf(a.user.id, g.id) : mine.has(g.id)));
      return list.map((g) => groupView(g, a));
    }),

  get: (id: string) =>
    call(() => {
      const a = actor();
      const g = mustSeeGroup(a, id);
      const members = store.find('groupMemberships', (m) => m.groupId === id).map((m) => ({ ...userCard(m.userId), role: m.role, joinedAt: m.joinedAt }));
      const threads = store.find('threads', (t) => t.groupId === id).sort((x, y) => Number(y.pinned) - Number(x.pinned) || (y.lastPostAt ?? '').localeCompare(x.lastPostAt ?? ''));
      return { group: groupView(g, a), members, threads };
    }),

  meetings: (groupId: string) =>
    call(() => {
      const a = actor();
      mustSeeGroup(a, groupId);
      return store.find('meetings', (m) => m.groupId === groupId).sort((x, y) => x.startsAt.localeCompare(y.startsAt));
    }),

  meeting: (id: string) =>
    call(() => {
      const a = actor();
      const m = store.get('meetings', id);
      if (!m) throw notFound('That meeting');
      const g = mustSeeGroup(a, m.groupId);
      const lesson = m.lessonId ? store.get('lessons', m.lessonId) : undefined;
      return { meeting: m, group: groupView(g, a), lesson: lesson ? { id: lesson.id, title: lesson.title, pathwayId: lesson.pathwayId, summary: lesson.summary } : null, people: store.find('groupMemberships', (x) => x.groupId === g.id).map((x) => userCard(x.userId)) };
    }),

  createMeeting: (groupId: string, input: { startsAt: string; durationMin: number; location: string | null; lessonId?: string | null; repeatWeeks?: number }) =>
    call(() => {
      const a = actor();
      if (!isLeaderOf(a.user.id, groupId)) throw forbidden('Only a leader of this group can schedule meetings.');
      const out: Meeting[] = [];
      for (let i = 0; i <= (input.repeatWeeks ?? 0); i++) {
        const start = new Date(new Date(input.startsAt).getTime() + i * 7 * 86_400_000);
        out.push(store.put('meetings', { id: newId('mtg'), groupId: groupId as Id<'grp'>, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + input.durationMin * 60_000).toISOString(), location: input.location, videoUrl: null, lessonId: (input.lessonId as Id<'les'>) ?? null, agenda: [], notes: null, status: 'scheduled', attendance: [], version: 1 }));
      }
      for (const m of store.find('groupMemberships', (x) => x.groupId === groupId && x.userId !== a.user.id)) notify(m.userId, 'meeting_reminder', { messageKey: 'notif.meeting_scheduled', params: { group: store.get('groups', groupId)?.name ?? '' } }, `/app/groups/${groupId}`, { type: 'meeting', id: out[0]?.id ?? '' });
      return out;
    }, { write: true }),

  updateMeeting: (id: string, patch: Partial<Pick<Meeting, 'agenda' | 'notes' | 'status' | 'location' | 'lessonId' | 'startsAt' | 'endsAt'>>) =>
    call(() => {
      const a = actor();
      const m = store.get('meetings', id);
      if (!m) throw notFound('That meeting');
      if (!isLeaderOf(a.user.id, m.groupId)) throw forbidden();
      return store.put('meetings', { ...m, ...patch, version: m.version + 1 });
    }, { write: true }),

  setAttendance: (id: string, attendance: { userId: Id<'usr'>; present: boolean }[]) =>
    call(() => {
      const a = actor();
      const m = store.get('meetings', id);
      if (!m) throw notFound('That meeting');
      if (!isLeaderOf(a.user.id, m.groupId)) throw forbidden();
      return store.put('meetings', { ...m, attendance, status: 'held', version: m.version + 1 });
    }, { write: true }),

  addMembers: (groupId: string, userIds: string[]) =>
    call(() => {
      const a = actor();
      if (!isLeaderOf(a.user.id, groupId) && !a.has('admin')) throw forbidden();
      for (const u of userIds) if (!isMember(u, groupId)) store.put('groupMemberships', { id: `gmb_${groupId.slice(4)}_${u.slice(4)}`, groupId: groupId as Id<'grp'>, userId: u as Id<'usr'>, role: 'member', joinedAt: nowIso() });
      const g = store.get('groups', groupId);
      if (g) store.put('groups', { ...g, memberCount: store.find('groupMemberships', (m) => m.groupId === groupId).length });
    }, { write: true }),

  removeMember: (groupId: string, userId: string) =>
    call(() => {
      const a = actor();
      if (!isLeaderOf(a.user.id, groupId) && !a.has('admin') && userId !== a.user.id) throw forbidden();
      store.remove('groupMemberships', `gmb_${groupId.slice(4)}_${userId.slice(4)}`);
      const g = store.get('groups', groupId);
      if (g) store.put('groups', { ...g, memberCount: store.find('groupMemberships', (m) => m.groupId === groupId).length });
    }, { write: true }),

  candidates: (groupId: string) =>
    call(() => {
      const a = actor();
      if (!isLeaderOf(a.user.id, groupId) && !a.has('admin')) throw forbidden();
      const inGroup = new Set(store.find('groupMemberships', (m) => m.groupId === groupId).map((m) => m.userId));
      return store.find('memberships', (m) => m.orgId === a.orgId && m.status === 'active' && !inGroup.has(m.userId)).map((m) => userCard(m.userId));
    }),

  /** How the group is doing, phrased for care: attendance and conversation, no ranking. */
  summary: (groupId: string) =>
    call(() => {
      const a = actor();
      if (!isLeaderOf(a.user.id, groupId) && !a.has('admin')) throw forbidden();
      const held = store.find('meetings', (m) => m.groupId === groupId && m.status === 'held');
      const members = store.find('groupMemberships', (m) => m.groupId === groupId);
      return members.map((m) => {
        const present = held.filter((h) => h.attendance.some((x) => x.userId === m.userId && x.present)).length;
        const last = store.find('memberships', (x) => x.userId === m.userId && x.orgId === a.orgId)[0]?.lastActiveAt ?? null;
        return { user: userCard(m.userId), role: m.role, present, held: held.length, lastActiveAt: last, posts: store.find('posts', (p) => p.authorId === m.userId && store.get('threads', p.threadId)?.groupId === groupId).length };
      });
    }),
};

export interface PostView extends DiscussionPost { author: ReturnType<typeof userCard> }

export const discussionService = {
  thread: (id: string) =>
    call(() => {
      const a = actor();
      const t = store.get('threads', id);
      if (!t) throw notFound('That discussion');
      const g = mustSeeGroup(a, t.groupId);
      const leader = isLeaderOf(a.user.id, g.id);
      const lesson = t.lessonId ? store.get('lessons', t.lessonId) : undefined;
      const posts = store.find('posts', (p) => p.threadId === id).sort((x, y) => x.createdAt.localeCompare(y.createdAt)).map((p): PostView => ({
        ...p, author: userCard(p.authorId),
        // Moderated posts are replaced by a tombstone for everyone except leaders.
        body: p.status !== 'visible' && !leader ? ({ type: 'doc', content: [] } as RichDoc) : p.body,
      }));
      return { thread: t, group: { id: g.id, name: g.name }, lesson: lesson ? { id: lesson.id, title: lesson.title, pathwayId: lesson.pathwayId } : null, posts, amLeader: leader };
    }),

  createThread: (groupId: string, input: { title: string; body: RichDoc; lessonId?: string | null }) =>
    call(() => {
      const a = actor();
      mustSeeGroup(a, groupId);
      if (!input.title.trim()) throw new ApiError('validation_failed', 'Give the discussion a title.', { fieldErrors: { title: ['Give the discussion a title.'] } });
      const at = nowIso();
      const t: DiscussionThread = { id: newId('thr'), groupId: groupId as Id<'grp'>, lessonId: (input.lessonId as Id<'les'>) ?? null, title: input.title.trim(), createdBy: a.user.id, pinned: false, locked: false, postCount: 0, lastPostAt: at, createdAt: at };
      store.put('threads', t);
      if (!isEmptyDoc(input.body)) discussionService.postSync(t.id, input.body);
      return store.get('threads', t.id) as DiscussionThread;
    }, { write: true }),

  postSync: (threadId: string, body: RichDoc, parentId: string | null = null, sharedReflectionId: string | null = null) => {
    const a = actor();
    const t = store.get('threads', threadId);
    if (!t) throw notFound('That discussion');
    mustSeeGroup(a, t.groupId);
    if (t.locked) throw new ApiError('forbidden', 'This discussion is locked.');
    if (isEmptyDoc(body)) throw new ApiError('validation_failed', 'Write something first.', { fieldErrors: { body: ['Write something first.'] } });
    const at = nowIso();
    const shared = sharedReflectionId ? store.get('reflections', sharedReflectionId) : undefined;
    const post: DiscussionPost = { id: newId('pst'), threadId: t.id, parentId: (parentId as Id<'pst'>) ?? null, authorId: a.user.id, body, sharedReflection: shared && shared.authorId === a.user.id ? { reflectionId: shared.id, excerpt: shared.plainText.slice(0, 220) } : null, status: 'visible', moderation: null, createdAt: at, editedAt: null, reactions: [] };
    store.put('posts', post);
    store.put('threads', { ...t, postCount: t.postCount + 1, lastPostAt: at });
    for (const uid of new Set(store.find('posts', (p) => p.threadId === t.id).map((p) => p.authorId))) {
      if (uid !== a.user.id) notify(uid, 'discussion_reply', { messageKey: 'notif.discussion_reply', params: { name: nameOf(a.user.id), thread: t.title } }, `/app/groups/${t.groupId}/discussions/${t.id}`, { type: 'thread', id: t.id }, at);
    }
    addTimeline(a.user.id, 'discussion_shared', { type: 'thread', id: t.id }, { messageKey: 'timeline.discussion', params: { thread: t.title } }, 'group', at);
    evaluateMilestones(a.user.id, at);
    return post;
  },

  post: (threadId: string, body: RichDoc, parentId: string | null = null, sharedReflectionId: string | null = null) => call(() => discussionService.postSync(threadId, body, parentId, sharedReflectionId), { write: true }),

  react: (postId: string, kind: 'amen' | 'thanks' | 'helpful') =>
    call(() => {
      const p = store.get('posts', postId);
      if (!p) throw notFound('That post');
      const cur = p.reactions.find((r) => r.kind === kind);
      const mine = !cur?.mine;
      const others = p.reactions.filter((r) => r.kind !== kind);
      const count = Math.max(0, (cur?.count ?? 0) + (mine ? 1 : -1));
      return store.put('posts', { ...p, reactions: count ? [...others, { kind, count, mine }] : others });
    }, { write: true }),

  report: (postId: string, reason: Report['reason'], note?: string) =>
    call(() => {
      const a = actor();
      const p = store.get('posts', postId);
      if (!p) throw notFound('That post');
      return store.put('reports', { id: newId('rpt'), subject: { type: 'post', id: postId }, reportedBy: a.user.id, reason, note: note ?? null, status: 'open', createdAt: nowIso() });
    }, { write: true }),

  /** Leader-only: hide, restore, pin, lock. */
  moderate: (input: { postId?: string; threadId?: string; action: 'hide' | 'restore' | 'pin' | 'unpin' | 'lock' | 'unlock'; reason?: string }) =>
    call(() => {
      const a = actor();
      if (input.postId) {
        const p = store.get('posts', input.postId);
        const t = p ? store.get('threads', p.threadId) : undefined;
        if (!p || !t) throw notFound('That post');
        if (!isLeaderOf(a.user.id, t.groupId)) throw forbidden();
        if (input.action === 'hide') {
          store.put('posts', { ...p, status: 'hidden', moderation: { reason: input.reason ?? '', at: nowIso(), by: a.user.id } });
          notify(p.authorId, 'discussion_reply', { messageKey: 'notif.post_hidden', params: { thread: t.title } }, `/app/groups/${t.groupId}/discussions/${t.id}`);
        } else store.put('posts', { ...p, status: 'visible', moderation: null });
        for (const r of store.find('reports', (x) => x.subject.id === p.id && x.status === 'open')) store.put('reports', { ...r, status: 'actioned' });
      } else if (input.threadId) {
        const t = store.get('threads', input.threadId);
        if (!t) throw notFound('That discussion');
        if (!isLeaderOf(a.user.id, t.groupId)) throw forbidden();
        store.put('threads', { ...t, pinned: input.action === 'pin' ? true : input.action === 'unpin' ? false : t.pinned, locked: input.action === 'lock' ? true : input.action === 'unlock' ? false : t.locked });
      }
    }, { write: true }),

  dismissReport: (id: string) =>
    call(() => {
      const a = actor();
      const r = store.get('reports', id);
      const p = r ? store.get('posts', r.subject.id) : undefined;
      const t = p ? store.get('threads', p.threadId) : undefined;
      if (!r || !t || !isLeaderOf(a.user.id, t.groupId)) throw forbidden();
      store.put('reports', { ...r, status: 'dismissed' });
    }, { write: true }),

  reports: (groupId: string) =>
    call(() => {
      const a = actor();
      if (!isLeaderOf(a.user.id, groupId)) throw forbidden();
      return store.find('reports', (r) => r.status === 'open' && r.subject.type === 'post').flatMap((r) => {
        const p = store.get('posts', r.subject.id);
        const t = p ? store.get('threads', p.threadId) : undefined;
        return p && t && t.groupId === groupId ? [{ report: r, post: { ...p, author: userCard(p.authorId) } as PostView, thread: t }] : [];
      });
    }),

  announce: (groupId: string, title: string, body: RichDoc) =>
    call(() => {
      const a = actor();
      if (!isLeaderOf(a.user.id, groupId)) throw forbidden();
      const t = discussionService.createThreadSync(groupId, title, body);
      store.put('threads', { ...t, pinned: true });
      return t;
    }, { write: true }),

  createThreadSync: (groupId: string, title: string, body: RichDoc) => {
    const a = actor();
    const at = nowIso();
    const t: DiscussionThread = { id: newId('thr'), groupId: groupId as Id<'grp'>, lessonId: null, title, createdBy: a.user.id, pinned: false, locked: false, postCount: 0, lastPostAt: at, createdAt: at };
    store.put('threads', t);
    discussionService.postSync(t.id, body);
    return store.get('threads', t.id) as DiscussionThread;
  },
};

// Prayer wall. Privacy is decided here, never in the UI.
export interface PrayerView extends Omit<PrayerRequest, 'authorId'> { author: ReturnType<typeof userCard> | null; mine: boolean; groupName: string | null }

function canReadPrayer(a: Actor, p: PrayerRequest & { supporterIds: string[] }): boolean {
  if (p.authorId === a.user.id) return true;
  if (!p.authorId) return false;
  switch (p.privacy) {
    case 'only_me': return false;
    case 'mentor': return isMentorOf(a, p.authorId);
    case 'group': return (!!p.groupId && isMember(a.user.id, p.groupId)) || isMentorOf(a, p.authorId);
    case 'organisation': return !!a.orgId && a.orgId === p.orgId;
  }
}

function prayerView(a: Actor, p: PrayerRequest & { supporterIds: string[] }): PrayerView {
  const mine = p.authorId === a.user.id;
  const { supporterIds, authorId, ...rest } = p;
  void authorId;
  return { ...rest, author: p.anonymous && !mine ? null : p.authorId ? userCard(p.authorId) : null, mine, iAmPraying: supporterIds.includes(a.user.id), supporterCount: supporterIds.length, groupName: p.groupId ? (store.get('groups', p.groupId)?.name ?? null) : null };
}

export const prayerService = {
  list: (scope: 'all' | 'mine' | 'group' | 'organisation', status: 'open' | 'answered' = 'open') =>
    call(() => {
      const a = actor();
      const list = store.find('prayers', (p) => canReadPrayer(a, p) && p.status === status && (scope === 'all' || (scope === 'mine' ? p.authorId === a.user.id : scope === 'group' ? p.privacy === 'group' || p.privacy === 'mentor' : p.privacy === 'organisation')));
      return list.sort((x, y) => y.createdAt.localeCompare(x.createdAt)).map((p) => prayerView(a, p));
    }),

  get: (id: string) =>
    call(() => {
      const a = actor();
      const p = store.get('prayers', id);
      if (!p || !canReadPrayer(a, p)) throw notFound('That prayer request');
      const comments = store.find('comments', (c) => c.subject.type === 'prayer' && c.subject.id === id).sort((x, y) => x.createdAt.localeCompare(y.createdAt)).map((c) => ({ ...c, author: userCard(c.authorId) }));
      return { prayer: prayerView(a, p), comments };
    }),

  create: (input: { body: string; privacy: PrayerPrivacy; groupId?: string | null; anonymous: boolean; category: PrayerRequest['category'] }) =>
    call(() => {
      const a = actor();
      if (!input.body.trim()) throw new ApiError('validation_failed', 'Write your request first.', { fieldErrors: { body: ['Write your request first.'] } });
      if (input.privacy === 'group' && !input.groupId) throw new ApiError('validation_failed', 'Choose a group.', { fieldErrors: { groupId: ['Choose a group.'] } });
      if (input.privacy === 'mentor' && !a.orgId) throw new ApiError('validation_failed', 'You do not have a mentor.', { fieldErrors: { privacy: ['You do not have a mentor.'] } });
      const at = nowIso();
      const p = store.put('prayers', { id: newId('pry'), orgId: a.orgId, authorId: a.user.id, anonymous: input.anonymous, body: input.body.trim(), category: input.category, privacy: input.privacy, groupId: (input.groupId as Id<'grp'>) ?? null, status: 'open', supporterCount: 0, iAmPraying: false, answeredNote: null, answeredAt: null, createdAt: at, updatedAt: at, supporterIds: [] });
      return prayerView(a, p);
    }, { write: true }),

  pray: (id: string, praying: boolean) =>
    call(() => {
      const a = actor();
      const p = store.get('prayers', id);
      if (!p || !canReadPrayer(a, p)) throw notFound('That prayer request');
      const set = new Set(p.supporterIds);
      if (praying) set.add(a.user.id); else set.delete(a.user.id);
      return prayerView(a, store.put('prayers', { ...p, supporterIds: [...set] }));
    }, { write: true }),

  markAnswered: (id: string, note: string) =>
    call(() => {
      const a = actor();
      const p = store.get('prayers', id);
      if (!p || p.authorId !== a.user.id) throw forbidden();
      const next = store.put('prayers', { ...p, status: 'answered', answeredNote: note || null, answeredAt: nowIso(), updatedAt: nowIso() });
      addTimeline(a.user.id, 'prayer_answered', { type: 'prayer', id }, { messageKey: 'timeline.prayer_answered', params: {} }, 'owner');
      evaluateMilestones(a.user.id);
      for (const s of p.supporterIds) notify(s as Id<'usr'>, 'prayer_update', { messageKey: 'notif.prayer_answered', params: {} }, `/app/community/prayer/${id}`, { type: 'prayer', id });
      return prayerView(a, next);
    }, { write: true }),

  remove: (id: string) =>
    call(() => {
      const a = actor();
      const p = store.get('prayers', id);
      if (!p || p.authorId !== a.user.id) throw forbidden();
      store.remove('prayers', id);
    }, { write: true }),

  encourage: (id: string, body: string) =>
    call(() => {
      const a = actor();
      const p = store.get('prayers', id);
      if (!p || !canReadPrayer(a, p)) throw notFound('That prayer request');
      if (!body.trim()) throw new ApiError('validation_failed', 'Write a short message first.');
      const c = store.put('comments', { id: newId('cmt'), subject: { type: 'prayer', id }, parentId: null, authorId: a.user.id, body: body.trim().slice(0, 400), kind: 'encouragement', createdAt: nowIso(), editedAt: null, status: 'visible' });
      if (p.authorId && p.authorId !== a.user.id) notify(p.authorId, 'prayer_update', { messageKey: 'notif.prayer_encouraged', params: { name: p.anonymous ? '' : nameOf(a.user.id) } }, `/app/community/prayer/${id}`, { type: 'prayer', id });
      return c;
    }, { write: true }),
};

