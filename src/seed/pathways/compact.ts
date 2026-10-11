import { audio, callout, makeQuiz, memory, p, quizBlock, reflect, scripture, single, text, trueFalse } from '../rich';
import type { SeedLesson } from './types';

interface Mini {
  key: string;
  title: string;
  summary: string;
  minutes: number;
  body: string[];
  refs: string[];
  practice?: string;
  memory?: string;
  prompt: string;
  guidance?: string;
  quiz?: { q: string; options: [string, boolean][]; why: string };
  tf?: { q: string; a: boolean; why: string };
}

/** Builds a complete lesson (read-aloud, text, scripture, reflection, quiz) from a compact description. */
export function mini(m: Mini): SeedLesson {
  const blocks = [audio([p(m.body[0] ?? '')]), text(...m.body.map((t) => p(t)))];
  for (const r of m.refs) blocks.push(scripture(r));
  if (m.practice) blocks.push(callout('practice', p(m.practice)));
  if (m.memory) blocks.push(memory(m.memory));
  blocks.push(reflect(`${m.key}-1`, m.prompt, m.guidance ?? null));
  const qid = `qz_${m.key}` as const;
  const questions = [];
  if (m.quiz) questions.push(single('q1', m.quiz.q, m.quiz.options, m.quiz.why));
  if (m.tf) questions.push(trueFalse('q2', m.tf.q, m.tf.a, m.tf.why));
  if (questions.length) blocks.push(quizBlock(qid));
  return {
    key: m.key, title: m.title, summary: m.summary, minutes: m.minutes, blocks,
    quiz: questions.length ? makeQuiz(qid, `les_${m.key}`, questions) : undefined,
  };
}
