// Converts the World English Bible JSON (public domain) into compact per-book files.
// Usage: node scripts/build-bible.mjs <path-to-world-english-bible-checkout>
// Output: public/data/bible/web/<code>.json = { code, name, chapters: [ [ { v, t, p?, q? } ] ] } and index.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = process.argv[2];
if (!src) throw new Error('Pass the path to a world-english-bible checkout');
const out = new URL('../public/data/bible/web/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const books = [
  ['GEN', 'genesis', 'Genesis', 'OT'], ['EXO', 'exodus', 'Exodus', 'OT'], ['LEV', 'leviticus', 'Leviticus', 'OT'], ['NUM', 'numbers', 'Numbers', 'OT'], ['DEU', 'deuteronomy', 'Deuteronomy', 'OT'],
  ['JOS', 'joshua', 'Joshua', 'OT'], ['JDG', 'judges', 'Judges', 'OT'], ['RUT', 'ruth', 'Ruth', 'OT'], ['1SA', '1samuel', '1 Samuel', 'OT'], ['2SA', '2samuel', '2 Samuel', 'OT'],
  ['1KI', '1kings', '1 Kings', 'OT'], ['2KI', '2kings', '2 Kings', 'OT'], ['1CH', '1chronicles', '1 Chronicles', 'OT'], ['2CH', '2chronicles', '2 Chronicles', 'OT'], ['EZR', 'ezra', 'Ezra', 'OT'],
  ['NEH', 'nehemiah', 'Nehemiah', 'OT'], ['EST', 'esther', 'Esther', 'OT'], ['JOB', 'job', 'Job', 'OT'], ['PSA', 'psalms', 'Psalms', 'OT'], ['PRO', 'proverbs', 'Proverbs', 'OT'],
  ['ECC', 'ecclesiastes', 'Ecclesiastes', 'OT'], ['SNG', 'songofsolomon', 'Song of Solomon', 'OT'], ['ISA', 'isaiah', 'Isaiah', 'OT'], ['JER', 'jeremiah', 'Jeremiah', 'OT'], ['LAM', 'lamentations', 'Lamentations', 'OT'],
  ['EZK', 'ezekiel', 'Ezekiel', 'OT'], ['DAN', 'daniel', 'Daniel', 'OT'], ['HOS', 'hosea', 'Hosea', 'OT'], ['JOL', 'joel', 'Joel', 'OT'], ['AMO', 'amos', 'Amos', 'OT'],
  ['OBA', 'obadiah', 'Obadiah', 'OT'], ['JON', 'jonah', 'Jonah', 'OT'], ['MIC', 'micah', 'Micah', 'OT'], ['NAM', 'nahum', 'Nahum', 'OT'], ['HAB', 'habakkuk', 'Habakkuk', 'OT'],
  ['ZEP', 'zephaniah', 'Zephaniah', 'OT'], ['HAG', 'haggai', 'Haggai', 'OT'], ['ZEC', 'zechariah', 'Zechariah', 'OT'], ['MAL', 'malachi', 'Malachi', 'OT'],
  ['MAT', 'matthew', 'Matthew', 'NT'], ['MRK', 'mark', 'Mark', 'NT'], ['LUK', 'luke', 'Luke', 'NT'], ['JHN', 'john', 'John', 'NT'], ['ACT', 'acts', 'Acts', 'NT'],
  ['ROM', 'romans', 'Romans', 'NT'], ['1CO', '1corinthians', '1 Corinthians', 'NT'], ['2CO', '2corinthians', '2 Corinthians', 'NT'], ['GAL', 'galatians', 'Galatians', 'NT'], ['EPH', 'ephesians', 'Ephesians', 'NT'],
  ['PHP', 'philippians', 'Philippians', 'NT'], ['COL', 'colossians', 'Colossians', 'NT'], ['1TH', '1thessalonians', '1 Thessalonians', 'NT'], ['2TH', '2thessalonians', '2 Thessalonians', 'NT'],
  ['1TI', '1timothy', '1 Timothy', 'NT'], ['2TI', '2timothy', '2 Timothy', 'NT'], ['TIT', 'titus', 'Titus', 'NT'], ['PHM', 'philemon', 'Philemon', 'NT'], ['HEB', 'hebrews', 'Hebrews', 'NT'],
  ['JAS', 'james', 'James', 'NT'], ['1PE', '1peter', '1 Peter', 'NT'], ['2PE', '2peter', '2 Peter', 'NT'], ['1JN', '1john', '1 John', 'NT'], ['2JN', '2john', '2 John', 'NT'],
  ['3JN', '3john', '3 John', 'NT'], ['JUD', 'jude', 'Jude', 'NT'], ['REV', 'revelation', 'Revelation', 'NT'],
];

const index = [];
let bytes = 0;
books.forEach(([code, file, name, testament], order) => {
  const chunks = JSON.parse(readFileSync(`${src}/json/${file}.json`, 'utf8'));
  const chapters = [];
  let paraStart = false;
  let poetry = false;
  for (const c of chunks) {
    if (c.type === 'paragraph start') { paraStart = true; poetry = false; continue; }
    if (c.type === 'stanza start') { poetry = true; paraStart = true; continue; }
    if (c.type === 'stanza end') { poetry = false; continue; }
    if (!('value' in c) || !c.chapterNumber || !c.verseNumber) continue;
    const ch = (chapters[c.chapterNumber - 1] ??= []);
    const text = c.value.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const last = ch[ch.length - 1];
    if (last && last.v === c.verseNumber) {
      last.t += (poetry ? ' / ' : ' ') + text;
      continue;
    }
    const verse = { v: c.verseNumber, t: text };
    if (paraStart) verse.p = 1;
    if (poetry) verse.q = 1;
    paraStart = false;
    ch.push(verse);
  }
  for (let i = 0; i < chapters.length; i++) chapters[i] ??= [];
  const body = JSON.stringify({ code, name, chapters });
  bytes += body.length;
  writeFileSync(`${out}${code}.json`, body);
  index.push({ code, name, testament, chapters: chapters.length, order });
});
writeFileSync(`${out}index.json`, JSON.stringify(index));
console.log(`${books.length} books, ${(bytes / 1e6).toFixed(1)} MB`);
