import type { BibleRange, LessonBlock, Quiz, QuizQuestion, RichDoc, RichNode } from '@/types';
import { parseRef } from '@/lib/bible/ref';

type Inline = string | { b: string } | { i: string };

function inline(parts: Inline[]): RichNode[] {
  return parts.map((p) => {
    if (typeof p === 'string') return { type: 'text', text: p };
    if ('b' in p) return { type: 'text', text: p.b, marks: [{ type: 'bold' }] };
    return { type: 'text', text: p.i, marks: [{ type: 'italic' }] };
  });
}

export const p = (...parts: Inline[]): RichNode => ({ type: 'paragraph', content: inline(parts) });
export const h3 = (text: string): RichNode => ({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] });
export const quote = (text: string): RichNode => ({ type: 'blockquote', content: [p(text)] });
export const ul = (...items: string[]): RichNode => ({ type: 'bulletList', content: items.map((t) => ({ type: 'listItem', content: [p(t)] })) });
export const doc = (...content: RichNode[]): RichDoc => ({ type: 'doc', content });

export function range(input: string): BibleRange {
  const r = parseRef(input);
  if (!r) throw new Error(`Bad scripture reference in seed: ${input}`);
  return r;
}

let blockCounter = 0;
const bid = () => `b${++blockCounter}`;

export const text = (...nodes: RichNode[]): LessonBlock => ({ id: bid(), type: 'text', doc: doc(...nodes) });
export const scripture = (ref: string, caption: string | null = null): LessonBlock => ({ id: bid(), type: 'scripture', ref: range(ref), translationId: 'web', caption });
export const callout = (tone: 'note' | 'practice' | 'pray', ...nodes: RichNode[]): LessonBlock => ({ id: bid(), type: 'callout', tone, doc: doc(...nodes) });
export const reflect = (promptId: string, prompt: string, guidance: string | null = null): LessonBlock => ({ id: bid(), type: 'reflectionPrompt', promptId, prompt, guidance });
export const memory = (ref: string): LessonBlock => ({ id: bid(), type: 'memoryVerse', ref: range(ref) });
export const quizBlock = (quizId: `qz_${string}`): LessonBlock => ({ id: bid(), type: 'quiz', quizId });

/** Browser speech reads the lesson aloud; `speech:` tells the player to use the transcript. */
export function audio(transcript: RichNode[]): LessonBlock {
  const words = JSON.stringify(transcript).match(/"text":"[^"]*"/g)?.join(' ').split(/\s+/).length ?? 200;
  return { id: bid(), type: 'audio', src: 'speech:', durationSec: Math.round(words / 2.6), transcript: doc(...transcript), downloadBytes: 0 };
}

export function video(file: string, durationSec: number, transcript: RichNode[]): LessonBlock {
  return {
    id: bid(), type: 'video', src: `media/${file}.webm`, posterSrc: `media/${file}.jpg`, captionsSrc: `media/${file}.captions.txt`,
    durationSec, transcript: doc(...transcript), downloadBytes: null,
  };
}

export function single(id: string, prompt: string, options: [string, boolean][], explanation: string): QuizQuestion {
  return { id, kind: 'single', prompt, options: options.map(([t, c], i) => ({ id: `${id}o${i}`, text: t, correct: c })), explanation };
}
export function multi(id: string, prompt: string, options: [string, boolean][], explanation: string): QuizQuestion {
  return { id, kind: 'multi', prompt, options: options.map(([t, c], i) => ({ id: `${id}o${i}`, text: t, correct: c })), explanation };
}
export function trueFalse(id: string, prompt: string, answer: boolean, explanation: string): QuizQuestion {
  return { id, kind: 'true_false', prompt, answer, explanation };
}
export function makeQuiz(id: `qz_${string}`, lessonId: `les_${string}`, questions: QuizQuestion[]): Quiz {
  return { id, lessonId, questions, passRule: 'all_answered' };
}
