import type { BibleRange, Highlight, HighlightColor, Id, RichDoc, VerseNote } from '@/types';
import { notFound } from '../db/errors';
import { newId, nowIso } from '../db/ids';
import { actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { docToText } from '../editor/text';
import { overlaps } from '../bible/ref';

/** Highlights and notes belong to their owner alone. They only leave the Bible if the owner turns a note into a reflection. */
export const bibleService = {
  annotations: (book: string, chapter: number) =>
    call(() => {
      const a = actor();
      const inChapter = (r: BibleRange) => r.book === book && r.chapter === chapter;
      return {
        highlights: store.find('highlights', (h) => h.userId === a.user.id && inChapter(h.range)),
        notes: store.find('verseNotes', (n) => n.userId === a.user.id && inChapter(n.range)),
      };
    }),

  allAnnotations: () =>
    call(() => {
      const a = actor();
      return {
        highlights: store.find('highlights', (h) => h.userId === a.user.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
        notes: store.find('verseNotes', (n) => n.userId === a.user.id).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)),
      };
    }),

  highlight: (range: BibleRange, color: HighlightColor | null) =>
    call(() => {
      const a = actor();
      const overlapping = store.find('highlights', (h) => h.userId === a.user.id && overlaps(h.range, range));
      for (const h of overlapping) store.remove('highlights', h.id);
      if (color === null) return null;
      const h: Highlight = { id: newId('hlt'), userId: a.user.id, translationId: 'web', range, color, createdAt: nowIso() };
      return store.put('highlights', h);
    }, { write: true }),

  saveNote: (input: { id?: string; range: BibleRange; body: RichDoc }) =>
    call(() => {
      const a = actor();
      const existing = input.id ? store.get('verseNotes', input.id) : undefined;
      if (input.id && (!existing || existing.userId !== a.user.id)) throw notFound('That note');
      const at = nowIso();
      const n: VerseNote = { id: existing?.id ?? newId('vnt'), userId: a.user.id, range: input.range, body: input.body, plainText: docToText(input.body), reflectionId: existing?.reflectionId ?? null, createdAt: existing?.createdAt ?? at, updatedAt: at, version: (existing?.version ?? 0) + 1 };
      return store.put('verseNotes', n);
    }, { write: true }),

  deleteNote: (id: string) =>
    call(() => {
      const a = actor();
      const n = store.get('verseNotes', id);
      if (!n || n.userId !== a.user.id) throw notFound('That note');
      store.remove('verseNotes', id);
    }, { write: true }),
};
export type { Id };
