import type { RichDoc, RichNode } from '@/types';

function walk(n: RichNode, out: string[]) {
  if (n.type === 'text' && n.text) out.push(n.text);
  if (n.type === 'hardBreak') out.push('\n');
  n.content?.forEach((c) => walk(c, out));
  if (['paragraph', 'heading', 'listItem', 'blockquote'].includes(n.type)) out.push('\n');
}

/** Plain-text projection used for search, excerpts and notifications. */
export function docToText(doc: RichDoc): string {
  const out: string[] = [];
  doc.content.forEach((n) => walk(n, out));
  return out.join('').replace(/\n{3,}/g, '\n\n').trim();
}

export function excerpt(text: string, max = 160): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export const emptyDoc = (): RichDoc => ({ type: 'doc', content: [{ type: 'paragraph' }] });
export const isEmptyDoc = (d: RichDoc) => docToText(d).length === 0;
export const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
