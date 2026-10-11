import type { BibleRange, BibleVerse } from '@/types';
import { BOOKS } from './books';

interface BookFile { code: string; name: string; chapters: { v: number; t: string; p?: 1; q?: 1 }[][] }
const cache = new Map<string, Promise<BookFile>>();

const base = () => `${import.meta.env.BASE_URL}data/bible/web/`;

export function loadBook(code: string): Promise<BookFile> {
  let p = cache.get(code);
  if (!p) {
    p = fetch(`${base()}${code}.json`).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${code}`);
      return r.json() as Promise<BookFile>;
    });
    p.catch(() => cache.delete(code));
    cache.set(code, p);
  }
  return p;
}

export async function loadChapter(code: string, chapter: number): Promise<BibleVerse[]> {
  const book = await loadBook(code);
  return (book.chapters[chapter - 1] ?? []).map((v) => ({ v: v.v, text: v.t, p: !!v.p, poetry: v.q ? 1 : 0 }));
}

export async function loadPassage(r: BibleRange): Promise<BibleVerse[]> {
  const verses = await loadChapter(r.book, r.chapter);
  const end = r.verseEnd || 999;
  return verses.filter((v) => v.v >= r.verseStart && v.v <= end);
}

export async function searchBible(query: string, limit = 30): Promise<{ book: string; chapter: number; verse: number; text: string }[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const out: { book: string; chapter: number; verse: number; text: string }[] = [];
  for (const b of BOOKS) {
    const file = await loadBook(b.code);
    file.chapters.forEach((ch, ci) => ch.forEach((v) => { if (out.length < limit && v.t.toLowerCase().includes(q)) out.push({ book: b.code, chapter: ci + 1, verse: v.v, text: v.t }); }));
    if (out.length >= limit) break;
  }
  return out;
}
