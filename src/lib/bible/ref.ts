import type { BibleRange } from '@/types';
import { BOOKS, bookByCode } from './books';

const norm = (s: string) => s.toLowerCase().replace(/[.\s]/g, '');
const lookup = new Map<string, string>();
for (const b of BOOKS) {
  lookup.set(norm(b.name), b.code);
  lookup.set(b.code.toLowerCase(), b.code);
  for (const a of b.aliases) lookup.set(a, b.code);
}

/** Resolves "john", "Jn", "1 Cor", "psalm" (and unambiguous prefixes such as "reve") to a book code. */
export function resolveBook(input: string): string | null {
  const key = norm(input);
  if (!key) return null;
  const exact = lookup.get(key);
  if (exact) return exact;
  const hits = new Set<string>();
  for (const [k, code] of lookup) if (k.startsWith(key)) hits.add(code);
  return hits.size === 1 ? ([...hits][0] ?? null) : null;
}

/** Parses "John 3:16", "Jn 3:16-18", "1 Cor 13", "Ps 23:1-3". A bare chapter selects the whole chapter (verseEnd 0 means "to the end"). */
export function parseRef(input: string): BibleRange | null {
  const m = input.trim().match(/^((?:[1-3]\s*)?[a-zA-Z][a-zA-Z.\s]*?)\s*(\d+)?(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  if (!m) return null;
  const code = resolveBook(m[1] ?? '');
  if (!code) return null;
  const chapter = m[2] ? Number(m[2]) : 1;
  const info = bookByCode.get(code);
  if (!info || chapter < 1 || chapter > info.chapters) return null;
  if (!m[3]) return { book: code, chapter, verseStart: 1, verseEnd: 0 };
  const start = Number(m[3]);
  const end = m[4] ? Number(m[4]) : start;
  return { book: code, chapter, verseStart: start, verseEnd: Math.max(start, end) };
}

export function formatRef(r: BibleRange): string {
  const name = bookByCode.get(r.book)?.name ?? r.book;
  if (r.verseEnd === 0) return `${name} ${r.chapter}`;
  return r.verseStart === r.verseEnd ? `${name} ${r.chapter}:${r.verseStart}` : `${name} ${r.chapter}:${r.verseStart}-${r.verseEnd}`;
}

export const rangeKey = (r: BibleRange) => `${r.book}.${r.chapter}.${r.verseStart}-${r.verseEnd}`;
export const overlaps = (a: BibleRange, b: BibleRange) =>
  a.book === b.book && a.chapter === b.chapter && a.verseStart <= (b.verseEnd || 999) && b.verseStart <= (a.verseEnd || 999);
