import type { BibleRange, Id, MemoryVerse } from '@/types';
import { ApiError, notFound } from '../db/errors';
import { daysFromNow, newId, nowIso } from '../db/ids';
import { actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { loadPassage } from '../bible/loader';
import { rangeKey } from '../bible/ref';
import { schedule, stateOf, type Rating } from '../srs';
import { evaluateMilestones, addTimeline } from './engine';
import { formatRef } from '../bible/ref';

export const memoryService = {
  list: () =>
    call(() => {
      const a = actor();
      return store.find('memoryVerses', (v) => v.userId === a.user.id).sort((x, y) => x.srs.dueAt.localeCompare(y.srs.dueAt));
    }),

  due: () =>
    call(() => {
      const a = actor();
      return store.find('memoryVerses', (v) => v.userId === a.user.id && v.srs.dueAt <= nowIso()).sort((x, y) => x.srs.dueAt.localeCompare(y.srs.dueAt));
    }),

  /** Adds a verse. The text is snapshotted from the bundled Bible at the time of adding. */
  add: (range: BibleRange, source: MemoryVerse['source'] = { type: 'bible', id: null }) =>
    call(async () => {
      const a = actor();
      if (store.find('memoryVerses', (v) => v.userId === a.user.id && rangeKey(v.range) === rangeKey(range)).length) throw new ApiError('conflict', 'That verse is already in your memory verses.');
      const verses = await loadPassage(range);
      if (!verses.length) throw new ApiError('validation_failed', 'That passage does not exist.');
      const text = verses.map((v) => v.text.replaceAll(' / ', ' ')).join(' ');
      const mv: MemoryVerse = { id: newId('mvs'), userId: a.user.id, translationId: 'web', range, text, source, srs: { box: 0, easiness: 2.5, intervalDays: 0, reps: 0, dueAt: nowIso(), lastReviewedAt: null }, state: 'new', createdAt: nowIso() };
      store.put('memoryVerses', mv);
      addTimeline(a.user.id, 'memory_verse_added', { type: 'verse', id: mv.id }, { messageKey: 'timeline.memory_verse_added', params: { ref: formatRef(range) } }, 'owner');
      evaluateMilestones(a.user.id);
      return mv;
    }, { write: true }),

  remove: (id: string) =>
    call(() => {
      const a = actor();
      const v = store.get('memoryVerses', id);
      if (!v || v.userId !== a.user.id) throw notFound('That verse');
      store.remove('memoryVerses', id);
    }, { write: true }),

  review: (id: string, rating: Rating) =>
    call(() => {
      const a = actor();
      const v = store.get('memoryVerses', id);
      if (!v || v.userId !== a.user.id) throw notFound('That verse');
      const next = schedule(v.srs, rating);
      const now = nowIso();
      const dueAt = next.intervalDays === 0 ? new Date(Date.now() + 10 * 60_000).toISOString() : daysFromNow(next.intervalDays, 6);
      store.put('memoryReviews', { id: newId('mrv'), memoryVerseId: v.id, rating, reviewedAt: now });
      return store.put('memoryVerses', { ...v, srs: { ...next, dueAt, lastReviewedAt: now }, state: stateOf(next) });
    }, { write: true }),
};
export type { Id };
