import type { AiConversation, AiMessage, ApprovalRequest, Id, EntityRef } from '@/types';
import { ApiError, forbidden, notFound } from '../db/errors';
import { newId, nowIso } from '../db/ids';
import { actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { draftFeedback, respond } from '../ai-canned';
import { mentorsOf, nameOf } from './actions';
import { notify } from './engine';
import { isMentorOf, requireRole, userCard } from './access';

const enabled = () => {
  const a = actor();
  return a.org ? a.org.settings.aiCompanionEnabled : true;
};

export const aiService = {
  status: () => call(() => ({ enabled: enabled(), mode: 'demo' as const })),

  conversations: () =>
    call(() => {
      const a = actor();
      return store.find('aiConversations', (c) => c.userId === a.user.id).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt));
    }),

  messages: (conversationId: string) =>
    call(() => {
      const a = actor();
      const c = store.get('aiConversations', conversationId);
      if (!c || c.userId !== a.user.id) throw notFound('That conversation');
      return store.find('aiMessages', (m) => m.conversationId === conversationId).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
    }),

  create: (context?: EntityRef | null) =>
    call(() => {
      const a = actor();
      if (!enabled()) throw forbidden('Your organisation has turned the study companion off.');
      const at = nowIso();
      return store.put('aiConversations', { id: newId('aic'), userId: a.user.id, context: context ?? null, title: '', createdAt: at, updatedAt: at } as AiConversation);
    }, { write: true }),

  remove: (id: string) =>
    call(() => {
      const a = actor();
      const c = store.get('aiConversations', id);
      if (!c || c.userId !== a.user.id) throw notFound('That conversation');
      for (const m of store.find('aiMessages', (x) => x.conversationId === id)) store.remove('aiMessages', m.id);
      store.remove('aiConversations', id);
    }, { write: true }),

  ask: (conversationId: string, content: string) =>
    call(() => {
      const a = actor();
      if (!enabled()) throw forbidden('Your organisation has turned the study companion off.');
      const c = store.get('aiConversations', conversationId);
      if (!c || c.userId !== a.user.id) throw notFound('That conversation');
      const text = content.trim();
      if (!text) throw new ApiError('validation_failed', 'Type a question first.');
      if (text.length > 2000) throw new ApiError('validation_failed', 'Please keep it under 2,000 characters.');
      const at = nowIso();
      const lesson = c.context?.type === 'lesson' ? store.get('lessons', c.context.id) : undefined;
      const scripture = lesson?.blocks.find((b) => b.type === 'scripture');
      const reply = respond(text, { lessonTitle: lesson?.title, passage: scripture && scripture.type === 'scripture' ? undefined : undefined });
      const user: AiMessage = { id: newId('aim'), conversationId: c.id, role: 'user', content: text, citations: [], disclosure: 'ai_generated_demo', safety: 'ok', createdAt: at };
      const assistant: AiMessage = { id: newId('aim'), conversationId: c.id, role: 'assistant', content: reply.content, citations: reply.citations, disclosure: 'ai_generated_demo', safety: reply.safety, createdAt: new Date(Date.now() + 1).toISOString() };
      store.put('aiMessages', user);
      store.put('aiMessages', assistant);
      store.put('aiConversations', { ...c, title: c.title || (reply.title || text.slice(0, 40)), updatedAt: at });
      return { user, assistant };
    }, { write: true }),

  /** Asks a mentor to approve sharing an AI answer. Nothing is visible to anyone else until they approve. */
  requestShare: (messageId: string, target: { type: 'reflection'; id: string }, note?: string) =>
    call(() => {
      const a = actor();
      const m = store.get('aiMessages', messageId);
      const c = m ? store.get('aiConversations', m.conversationId) : undefined;
      if (!m || !c || c.userId !== a.user.id || m.role !== 'assistant') throw notFound('That message');
      const mentor = mentorsOf(a.user.id, a.orgId)[0];
      if (!mentor) throw new ApiError('validation_failed', 'You need a mentor to approve sharing.');
      const r = store.get('reflections', target.id);
      if (!r || r.authorId !== a.user.id) throw notFound('That reflection');
      const existing = store.find('approvals', (x) => x.source.messageId === messageId && x.target.id === target.id && x.status === 'pending')[0];
      if (existing) return existing;
      const req: ApprovalRequest = { id: newId('apr'), kind: 'share_ai_answer', requestedBy: a.user.id, mentorId: mentor, source: { conversationId: c.id, messageId: m.id as Id<'aim'> }, content: m.content, target: { type: 'reflection', id: target.id }, status: 'pending', editedContent: null, decisionNote: note ?? null, decidedBy: null, decidedAt: null, createdAt: nowIso() };
      store.put('approvals', req);
      notify(mentor, 'ai_approval_request', { messageKey: 'notif.ai_request', params: { name: nameOf(a.user.id) } }, '/mentor/approvals', { type: 'approval', id: req.id });
      return req;
    }, { write: true }),

  myRequests: () => call(() => { const a = actor(); return store.find('approvals', (x) => x.requestedBy === a.user.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt)); }),

  approvals: (status: 'pending' | 'all' = 'pending') =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor');
      return store.find('approvals', (x) => x.mentorId === a.user.id && (status === 'all' || x.status === 'pending')).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).map((x) => {
        const q = store.find('aiMessages', (m) => m.conversationId === x.source.conversationId && m.role === 'user' && m.createdAt < (store.get('aiMessages', x.source.messageId)?.createdAt ?? '')).sort((p, r) => r.createdAt.localeCompare(p.createdAt))[0];
        return { ...x, requester: userCard(x.requestedBy), question: q?.content ?? '', targetTitle: store.get('reflections', x.target.id)?.title ?? store.get('lessons', store.get('reflections', x.target.id)?.lessonId ?? '')?.title ?? '' };
      });
    }),

  decide: (id: string, input: { decision: 'approve' | 'decline'; editedContent?: string; note?: string }) =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor');
      const r = store.get('approvals', id);
      if (!r || r.mentorId !== a.user.id) throw notFound('That request');
      if (r.status !== 'pending') throw new ApiError('conflict', 'This request has already been answered.');
      const edited = input.editedContent && input.editedContent.trim() !== r.content ? input.editedContent.trim() : null;
      const next = store.put('approvals', { ...r, status: input.decision === 'approve' ? 'approved' : 'declined', editedContent: edited, decisionNote: input.note ?? null, decidedBy: a.user.id, decidedAt: nowIso() });
      if (input.decision === 'approve') {
        // Only now does the text become visible to anyone who can read the reflection.
        store.put('comments', { id: newId('cmt'), subject: { type: 'reflection', id: r.target.id }, parentId: null, authorId: r.requestedBy, body: edited ?? r.content, kind: 'comment', createdAt: nowIso(), editedAt: null, status: 'visible', aiReviewedBy: a.user.id });
      }
      notify(r.requestedBy, 'ai_approval_result', { messageKey: input.decision === 'approve' ? 'notif.ai_approved' : 'notif.ai_declined', params: { mentor: nameOf(a.user.id) } }, `/app/journal/${r.target.id}`, { type: 'approval', id: r.id });
      return next;
    }, { write: true }),

  /** A starting draft for the mentor to edit. It is never saved or sent on its own. */
  draftFeedback: (reflectionId: string) =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor');
      const r = store.get('reflections', reflectionId);
      if (!r || !isMentorOf(a, r.authorId)) throw forbidden();
      return { suggestion: draftFeedback((store.get('users', r.authorId)?.displayName ?? '').split(' ')[0] ?? '', r.plainText) };
    }),
};
