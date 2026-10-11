import { describe, expect, it } from 'vitest';
import { formatRef, parseRef, resolveBook } from './ref';

describe('resolveBook', () => {
  it.each([['john', 'JHN'], ['Jn', 'JHN'], ['1 Cor', '1CO'], ['psalm', 'PSA'], ['Ps', 'PSA'], ['song of solomon', 'SNG'], ['reve', 'REV']])('%s -> %s', (i, c) => expect(resolveBook(i)).toBe(c));
  it('rejects ambiguous and unknown input', () => {
    expect(resolveBook('j')).toBeNull();
    expect(resolveBook('zzz')).toBeNull();
  });
});

describe('parseRef', () => {
  it('parses verses, ranges and whole chapters', () => {
    expect(parseRef('John 3:16')).toEqual({ book: 'JHN', chapter: 3, verseStart: 16, verseEnd: 16 });
    expect(parseRef('eph 2:8-9')).toEqual({ book: 'EPH', chapter: 2, verseStart: 8, verseEnd: 9 });
    expect(parseRef('Psalm 23')).toEqual({ book: 'PSA', chapter: 23, verseStart: 1, verseEnd: 0 });
  });
  it('rejects chapters out of range and nonsense', () => {
    expect(parseRef('John 99')).toBeNull();
    expect(parseRef('hello world 3')).toBeNull();
  });
  it('round-trips through formatRef', () => {
    expect(formatRef(parseRef('1 cor 13:4-7')!)).toBe('1 Corinthians 13:4-7');
  });
});
