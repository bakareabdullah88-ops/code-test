import type { Feedback, Id, Reflection, ReflectionVisibility, RichDoc } from '@/types';
import { ApiError, forbidden, notFound } from '../db/errors';
import { newId, nowIso } from '../db/ids';
import { actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { docToText, isEmptyDoc, wordCount } from '../editor/text';
import { mentorsOf, recordFeedbackSent, recordReflectionSubmitted } from './actions';
import { canReadReflection, groupIdsOf, isMentorOf, mustReadReflection, userCard } from './access';

export interface ReflectionView extends Reflection {
  author: ReturnType<typeof userCard>;
  lessonTitle: string | null;
  pathwayTitle: string | null;
}
export interface FeedbackView extends Feedback { mentor: ReturnType<typeof userCard> }

function view(r: Reflection): ReflectionView {
  const lesson = r.lessonId ? store.get('lessons', r.lessonId) : undefined;
  const pathway = r.pathwayId ? store.get('pathways', r.pathwayId) : undefined;
  return { ...r, author: userCard(r.authorId), lessonTitle: lesson?.title ?? null, pathwayTitle: pathway?.title ?? null };
}

export interface ListReflectionsParams {
  scope: 'mine' | 'inbox' | 'group' | 'mentee';
  lessonId?: string;
  menteeId?: string;
  groupId?: string;
  status?: 'draft' | 'submitted';
  feedback?: 'awaiting' | 'responded' | 'all';
  q?: string;
}

export const reflectionsService = {
  /** Who a reflection can be shared with, for the visibility picker. */
  shareOptions: () =>
    call(() => {
      const a = actor();
      const mentor = mentorsOf(a.user.id, a.orgId)[0];
      const groups = groupIdsOf(a.user.id).map((id) => store.get('groups', id)).filter((g): g is NonNullable<typeof g> => !!g).map((g) => ({ id: g.id, name: g.name }));
      return { mentorName: mentor ? (store.get('users', mentor)?.displayName ?? null) : null, groups };
    }),

  list: (params: ListReflectionsParams) =>
    call(() => {
      const a = actor();
      let list = store.find('reflections', (r) => {
        if (params.scope === 'mine') return r.authorId === a.user.id;
        if (!canReadReflection(a, r) || r.authorId === a.user.id) return false;
        if (params.scope === 'inbox') return isMentorOf(a, r.authorId);
        if (params.scope === 'mentee') return isMentorOf(a, r.authorId) && r.authorId === params.menteeId;
        if (params.scope === 'group') return r.visibility === 'group' && r.groupId === params.groupId;
        return false;
      });
      if (params.lessonId) list = list.filter((r) => r.lessonId === params.lessonId);
      if (params.status) list = list.filter((r) => r.status === params.status);
      if (params.feedback === 'awaiting') list = list.filter((r) => r.feedbackStatus === 'awaiting');
      if (params.feedback === 'responded') list = list.filter((r) => r.feedbackStatus === 'responded');
      if (params.q) {
        const q = params.q.toLowerCase();
        list = list.filter((r) => r.plainText.toLowerCase().includes(q) || (r.title ?? '').toLowerCase().includes(q));
      }
      // The mentor inbox lists the longest-waiting reflection first; everything else is newest first.
      list.sort((x, y) => (params.scope === 'inbox' ? (x.submittedAt ?? '').localeCompare(y.submittedAt ?? '') : y.updatedAt.localeCompare(x.updatedAt)));
      return list.map(view);
    }),

  get: (id: string) =>
    call(() => {
      const { a, r } = mustReadReflection(id);
      const feedback = store.find('feedback', (f) => f.reflectionId === id && (f.status === 'sent' || f.mentorId === a.user.id)).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
      const visibleFeedback = r.authorId === a.user.id ? feedback.filter((f) => f.status === 'sent') : feedback;
      const posts = r.visibility === 'group' ? store.find('posts', (p) => p.sharedReflection?.reflectionId === id).length : 0;
      return { reflection: view(r), feedback: visibleFeedback.map((f) => ({ ...f, mentor: userCard(f.mentorId) })) as FeedbackView[], isAuthor: r.authorId === a.user.id, sharedPosts: posts, mentorIds: mentorsOf(r.authorId, r.orgId) };
    }),

  create: (input: { lessonId?: string | null; title?: string | null; body: RichDoc; visibility?: ReflectionVisibility; groupId?: string | null }) =>
    call(() => {
      const a = actor();
      const lesson = input.lessonId ? store.get('lessons', input.lessonId) : undefined;
      const prompt = lesson?.blocks.find((b) => b.type === 'reflectionPrompt');
      const text = docToText(input.body);
      const at = nowIso();
      const rec: Reflection = {
        id: newId('ref'), authorId: a.user.id, orgId: a.orgId, lessonId: lesson?.id ?? null, pathwayId: lesson?.pathwayId ?? null,
        promptId: prompt?.type === 'reflectionPrompt' ? prompt.promptId : null, promptText: prompt?.type === 'reflectionPrompt' ? prompt.prompt : null, title: input.title ?? null,
        body: input.body, plainText: text, wordCount: wordCount(text), scriptureRefs: [], visibility: input.visibility ?? 'private', groupId: (input.groupId as Id<'grp'>) ?? null,
        status: 'draft', submittedAt: null, feedbackStatus: 'none', feedbackCount: 0, version: 1, createdAt: at, updatedAt: at,
      };
      return view(store.put('reflections', rec));
    }, { write: true }),

  update: (id: string, patch: { title?: string | null; body?: RichDoc; visibility?: ReflectionVisibility; groupId?: string | null }, version: number) =>
    call(() => {
      const a = actor();
      const r = store.get('reflections', id);
      if (!r || r.authorId !== a.user.id) throw notFound('That reflection');
      if (r.version !== version) throw new ApiError('conflict', 'This reflection was changed somewhere else.');
      const body = patch.body ?? r.body;
      const text = docToText(body);
      const next: Reflection = { ...r, ...patch, groupId: (patch.groupId === undefined ? r.groupId : (patch.groupId as Id<'grp'> | null)), body, plainText: text, wordCount: wordCount(text), version: r.version + 1, updatedAt: nowIso() };
      return view(store.put('reflections', next));
    }, { write: true }),

  submit: (id: string, input: { visibility: 'private' | 'mentor' | 'group'; groupId?: string | null }) =>
    call(() => {
      const a = actor();
      const r = store.get('reflections', id);
      if (!r || r.authorId !== a.user.id) throw notFound('That reflection');
      if (isEmptyDoc(r.body)) throw new ApiError('validation_failed', 'Write something first.', { fieldErrors: { body: ['Write something before you save.'] } });
      if (input.visibility === 'mentor' && !mentorsOf(a.user.id, a.orgId).length) throw new ApiError('validation_failed', 'You do not have a mentor to share with yet.', { fieldErrors: { visibility: ['You do not have a mentor yet.'] } });
      if (input.visibility === 'group') {
        const gid = input.groupId ?? groupIdsOf(a.user.id)[0];
        if (!gid) throw new ApiError('validation_failed', 'You are not in a group yet.', { fieldErrors: { visibility: ['You are not in a group yet.'] } });
        input = { ...input, groupId: gid };
      }
      const at = nowIso();
      const next: Reflection = {
        ...r, visibility: input.visibility, groupId: input.visibility === 'group' ? (input.groupId as Id<'grp'>) : null, status: 'submitted', submittedAt: r.submittedAt ?? at,
        feedbackStatus: input.visibility === 'private' ? 'none' : r.feedbackCount > 0 ? 'responded' : 'awaiting', version: r.version + 1, updatedAt: at,
      };
      store.put('reflections', next);
      const wasSubmitted = r.status === 'submitted';
      const newMilestones = wasSubmitted ? [] : recordReflectionSubmitted(next, at);
      return { reflection: view(next), newMilestones };
    }, { write: true }),

  withdraw: (id: string) =>
    call(() => {
      const a = actor();
      const r = store.get('reflections', id);
      if (!r || r.authorId !== a.user.id) throw notFound('That reflection');
      return view(store.put('reflections', { ...r, visibility: 'private', groupId: null, feedbackStatus: 'none', version: r.version + 1, updatedAt: nowIso() }));
    }, { write: true }),

  remove: (id: string) =>
    call(() => {
      const a = actor();
      const r = store.get('reflections', id);
      if (!r || r.authorId !== a.user.id) throw notFound('That reflection');
      for (const f of store.find('feedback', (x) => x.reflectionId === id)) store.remove('feedback', f.id);
      store.remove('reflections', id);
    }, { write: true }),
};

export const feedbackService = {
  send: (reflectionId: string, input: { body: RichDoc; shareableToGroup?: boolean; aiAssisted?: boolean; draftId?: string | null }) =>
    call(() => {
      const a = actor();
      const r = store.get('reflections', reflectionId);
      if (!r || !canReadReflection(a, r) || !isMentorOf(a, r.authorId)) throw forbidden('Only the assigned mentor can reply.');
      if (isEmptyDoc(input.body)) throw new ApiError('validation_failed', 'Write a reply first.', { fieldErrors: { body: ['Write a reply before you send.'] } });
      const at = nowIso();
      const text = docToText(input.body);
      const existing = input.draftId ? store.get('feedback', input.draftId) : undefined;
      const fb: Feedback = {
        id: existing?.id ?? newId('fbk'), reflectionId: r.id, mentorId: a.user.id, body: input.body, plainText: text, shareableToGroup: !!input.shareableToGroup, aiAssisted: !!input.aiAssisted,
        status: 'sent', sentAt: at, readAt: null, createdAt: existing?.createdAt ?? at, updatedAt: at,
      };
      store.put('feedback', fb);
      const updated = store.put('reflections', { ...r, feedbackStatus: 'responded', feedbackCount: r.feedbackCount + (existing?.status === 'sent' ? 0 : 1) });
      const newMilestones = recordFeedbackSent(fb, updated, at);
      return { feedback: fb, newMilestones };
    }, { write: true }),

  saveDraft: (reflectionId: string, body: RichDoc, draftId?: string | null) =>
    call(() => {
      const a = actor();
      const r = store.get('reflections', reflectionId);
      if (!r || !isMentorOf(a, r.authorId)) throw forbidden();
      const at = nowIso();
      const existing = draftId ? store.get('feedback', draftId) : undefined;
      return store.put('feedback', { id: existing?.id ?? newId('fbk'), reflectionId: r.id, mentorId: a.user.id, body, plainText: docToText(body), shareableToGroup: false, aiAssisted: false, status: 'draft', sentAt: null, readAt: null, createdAt: existing?.createdAt ?? at, updatedAt: at });
    }, { write: true }),

  markRead: (id: string) =>
    call(() => {
      const a = actor();
      const f = store.get('feedback', id);
      const r = f ? store.get('reflections', f.reflectionId) : undefined;
      if (!f || !r || r.authorId !== a.user.id) throw notFound('That reply');
      return store.put('feedback', { ...f, readAt: f.readAt ?? nowIso() });
    }, { write: true }),
};
