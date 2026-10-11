import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import type { LessonBlock, Quiz, QuizQuestion, RichDoc } from '@/types';
import { useT } from '@/lib/i18n';
import { formatRef, parseRef } from '@/lib/bible/ref';
import { emptyDoc } from '@/lib/editor/text';
import { lessonsService } from '@/lib/services/learning';
import { RichEditor } from '@/components/content/rich-editor';
import { PassageText } from '@/components/content/scripture';
import { Button } from '@/components/ui/button/button';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Field } from '@/components/ui/field/field';
import { IconButton } from '@/components/ui/icon-button/icon-button';
import { Input, Textarea } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { RadioGroup } from '@/components/ui/radio-group/radio-group';
import { useSaveQuiz } from './hooks';

export const blockTypes = ['text', 'scripture', 'callout', 'reflectionPrompt', 'quiz', 'memoryVerse', 'audio', 'video'] as const;
export type BlockType = (typeof blockTypes)[number];

let n = 0;
const uid = () => `b${Date.now().toString(36)}${(n++).toString(36)}`;

export function newBlock(type: BlockType): LessonBlock {
  const id = uid();
  switch (type) {
    case 'text': return { id, type, doc: emptyDoc() };
    case 'scripture': return { id, type, ref: { book: 'JHN', chapter: 3, verseStart: 16, verseEnd: 16 }, translationId: 'web', caption: null };
    case 'callout': return { id, type, tone: 'note', doc: emptyDoc() };
    case 'reflectionPrompt': return { id, type, promptId: `prompt-${id}`, prompt: '', guidance: null };
    case 'quiz': return { id, type, quizId: `qz_${id}` };
    case 'memoryVerse': return { id, type, ref: { book: 'PSA', chapter: 119, verseStart: 105, verseEnd: 105 } };
    case 'audio': return { id, type, src: 'speech:', durationSec: 60, transcript: emptyDoc(), downloadBytes: 0 };
    case 'video': return { id, type, src: 'media/grace.webm', posterSrc: 'media/grace.jpg', captionsSrc: 'media/grace.captions.txt', durationSec: 24, transcript: emptyDoc(), downloadBytes: null };
  }
}

export const videoChoices = [{ value: 'grace', seconds: 24 }, { value: 'scripture', seconds: 22 }, { value: 'prayer', seconds: 20 }];

interface Props {
  block: LessonBlock;
  index: number;
  count: number;
  lessonId: string;
  onChange: (b: LessonBlock) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}

export function BlockEditor({ block, index, count, lessonId, onChange, onMove, onDelete }: Props) {
  const t = useT();
  const title = t(`mentor.editor.block.${block.type}`);
  return (
    <section aria-label={`${index + 1}. ${title}`} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-muted">{index + 1}. {title}</h3>
        <div className="ms-auto flex items-center gap-1">
          <IconButton size="sm" label={t('mentor.editor.moveBlockUp', { n: index + 1 })} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={18} /></IconButton>
          <IconButton size="sm" label={t('mentor.editor.moveBlockDown', { n: index + 1 })} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown size={18} /></IconButton>
          <IconButton size="sm" label={t('mentor.editor.deleteBlock', { n: index + 1 })} onClick={onDelete}><Trash size={18} /></IconButton>
        </div>
      </div>
      <Fields block={block} lessonId={lessonId} onChange={onChange} />
    </section>
  );
}

function Fields({ block, lessonId, onChange }: { block: LessonBlock; lessonId: string; onChange: (b: LessonBlock) => void }) {
  const t = useT();
  switch (block.type) {
    case 'text': return <RichEditor label={t('mentor.editor.block.text')} value={block.doc} onChange={(doc) => onChange({ ...block, doc })} minHeight="md" placeholder={t('mentor.editor.textPlaceholder')} />;
    case 'callout':
      return (
        <div className="flex flex-col gap-3">
          <Field label={t('mentor.editor.calloutTone')}>{(p) => <Select {...p} value={block.tone} onValueChange={(v) => onChange({ ...block, tone: v as typeof block.tone })} options={(['note', 'practice', 'pray'] as const).map((k) => ({ value: k, label: t(`learn.callout.${k}`) }))} />}</Field>
          <RichEditor label={t('mentor.editor.block.callout')} value={block.doc} onChange={(doc) => onChange({ ...block, doc })} minHeight="sm" />
        </div>
      );
    case 'scripture': case 'memoryVerse': return <RefField block={block} onChange={onChange} />;
    case 'reflectionPrompt':
      return (
        <div className="flex flex-col gap-3">
          <Field label={t('mentor.editor.prompt')} required>{(p) => <Textarea {...p} rows={2} value={block.prompt} onChange={(e) => onChange({ ...block, prompt: e.target.value })} />}</Field>
          <Field label={t('mentor.editor.guidance')} description={t('mentor.editor.guidanceHelp')}>{(p) => <Input {...p} value={block.guidance ?? ''} onChange={(e) => onChange({ ...block, guidance: e.target.value || null })} />}</Field>
        </div>
      );
    case 'audio':
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{t('mentor.editor.audioHelp')}</p>
          <RichEditor label={t('mentor.editor.audioText')} value={block.transcript} onChange={(doc: RichDoc) => onChange({ ...block, transcript: doc })} minHeight="sm" />
        </div>
      );
    case 'video':
      return (
        <div className="flex flex-col gap-3">
          <Field label={t('mentor.editor.video')} description={t('mentor.editor.videoHelp')}>
            {(p) => <Select {...p} value={block.src.replace('media/', '').replace('.webm', '')} onValueChange={(v) => { const c = videoChoices.find((x) => x.value === v); onChange({ ...block, src: `media/${v}.webm`, posterSrc: `media/${v}.jpg`, captionsSrc: `media/${v}.captions.txt`, durationSec: c?.seconds ?? 20 }); }} options={videoChoices.map((v) => ({ value: v.value, label: t(`mentor.editor.videoOption.${v.value}`) }))} />}
          </Field>
          <RichEditor label={t('mentor.editor.transcript')} value={block.transcript ?? emptyDoc()} onChange={(doc) => onChange({ ...block, transcript: doc })} minHeight="sm" />
        </div>
      );
    case 'quiz': return <QuizEditor lessonId={lessonId} />;
  }
}

function RefField({ block, onChange }: { block: Extract<LessonBlock, { type: 'scripture' | 'memoryVerse' }>; onChange: (b: LessonBlock) => void }) {
  const t = useT();
  const [text, setText] = useState(formatRef(block.ref));
  const parsed = parseRef(text);
  useEffect(() => { if (parsed) onChange({ ...block, ref: parsed }); }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-3">
      <Field label={t('mentor.editor.reference')} description={t('mentor.editor.referenceHelp')} error={parsed ? undefined : t('mentor.editor.referenceInvalid')}>{(p) => <Input {...p} value={text} onChange={(e) => setText(e.target.value)} />}</Field>
      {parsed ? <div className="rounded-md bg-sunken p-3"><p className="mb-1 text-sm font-medium">{formatRef(parsed)}</p><PassageText range={parsed} className="text-base" /></div> : null}
      {block.type === 'scripture' ? <Field label={t('mentor.editor.caption')}>{(p) => <Input {...p} value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value || null })} />}</Field> : null}
    </div>
  );
}

function QuizEditor({ lessonId }: { lessonId: string }) {
  const t = useT();
  const lesson = useQuery({ queryKey: ['lesson-quiz', lessonId], queryFn: async () => {
    const d = await lessonsService.get(lessonId);
    const qb = d.lesson.blocks.find((b) => b.type === 'quiz');
    return qb && qb.type === 'quiz' ? lessonsService.quiz(qb.quizId) : null;
  } });
  const save = useSaveQuiz();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  useEffect(() => { if (lesson.isSuccess && questions === null) setQuestions((lesson.data as Quiz | null)?.questions ?? []); }, [lesson.isSuccess, lesson.data, questions]);
  useEffect(() => {
    if (questions === null) return;
    const id = setTimeout(() => save.mutate({ lessonId, questions }), 900);
    return () => clearTimeout(id);
  }, [questions]); // eslint-disable-line react-hooks/exhaustive-deps
  if (questions === null) return <p className="text-sm text-muted">{t('states.loading')}</p>;

  const upd = (i: number, q: QuizQuestion) => setQuestions(questions.map((x, k) => (k === i ? q : x)));
  const add = (kind: QuizQuestion['kind']) => {
    const id = `q${questions.length + 1}${Date.now().toString(36)}`;
    const base = { id, prompt: '', explanation: '' };
    setQuestions([...questions, kind === 'true_false' ? { ...base, kind, answer: true } : { ...base, kind, options: [{ id: `${id}a`, text: '', correct: true }, { id: `${id}b`, text: '', correct: false }] }]);
  };
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-2 rounded-md border border-line p-3">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-muted">{t('mentor.editor.question', { n: i + 1 })} &middot; {t(`mentor.editor.qkind.${q.kind}`)}</span><IconButton size="sm" className="ms-auto" label={t('mentor.editor.deleteQuestion', { n: i + 1 })} onClick={() => setQuestions(questions.filter((_, k) => k !== i))}><Trash size={18} /></IconButton></div>
          <Field label={t('mentor.editor.questionText')}>{(p) => <Input {...p} value={q.prompt} onChange={(e) => upd(i, { ...q, prompt: e.target.value })} />}</Field>
          {q.kind === 'true_false' ? (
            <RadioGroup aria-label={t('mentor.editor.correctAnswer')} value={String(q.answer)} onValueChange={(v) => upd(i, { ...q, answer: v === 'true' })} options={[{ value: 'true', label: t('learn.quiz.true') }, { value: 'false', label: t('learn.quiz.false') }]} />
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{t('mentor.editor.optionsHelp')}</p>
              {q.options.map((o, oi) => (
                <div key={o.id} className="flex items-center gap-2">
                  <Checkbox className="shrink-0" label={t('mentor.editor.correct')} checked={o.correct} onCheckedChange={(c) => upd(i, { ...q, options: q.options.map((x, k) => (q.kind === 'single' ? { ...x, correct: k === oi } : k === oi ? { ...x, correct: c === true } : x)) })} />
                  <Input aria-label={t('mentor.editor.optionText', { n: oi + 1 })} value={o.text} onChange={(e) => upd(i, { ...q, options: q.options.map((x, k) => (k === oi ? { ...x, text: e.target.value } : x)) })} />
                  <IconButton size="sm" label={t('mentor.editor.deleteOption', { n: oi + 1 })} disabled={q.options.length <= 2} onClick={() => upd(i, { ...q, options: q.options.filter((_, k) => k !== oi) })}><Trash size={18} /></IconButton>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="w-fit" onClick={() => upd(i, { ...q, options: [...q.options, { id: `${q.id}o${q.options.length}${Date.now().toString(36)}`, text: '', correct: false }] })}><Plus size={16} aria-hidden="true" />{t('mentor.editor.addOption')}</Button>
            </div>
          )}
          <Field label={t('mentor.editor.explanation')} description={t('mentor.editor.explanationHelp')}>{(p) => <Input {...p} value={q.explanation} onChange={(e) => upd(i, { ...q, explanation: e.target.value })} />}</Field>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => add('single')}><Plus size={16} aria-hidden="true" />{t('mentor.editor.qkind.single')}</Button>
        <Button size="sm" variant="secondary" onClick={() => add('multi')}><Plus size={16} aria-hidden="true" />{t('mentor.editor.qkind.multi')}</Button>
        <Button size="sm" variant="secondary" onClick={() => add('true_false')}><Plus size={16} aria-hidden="true" />{t('mentor.editor.qkind.true_false')}</Button>
      </div>
    </div>
  );
}
