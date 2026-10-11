import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, Eye, Plus } from '@phosphor-icons/react';
import type { LessonBlock } from '@/types';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { ApiError } from '@/lib/db/errors';
import { useLesson } from '@/features/learning/hooks';
import { useSaveLesson } from './hooks';
import { BlockEditor, blockTypes, newBlock, type BlockType } from './block-editors';
import { QueryState } from '@/components/data/query-state';
import { buttonStyles } from '@/components/ui/button/button';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu/dropdown-menu';
import { Button } from '@/components/ui/button/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { Notice } from '@/components/patterns/notice/notice';

export function LessonEditorPage() {
  const { pathwayId = '', lessonId = '' } = useParams();
  const t = useT();
  const q = useLesson(lessonId);
  return (
    <div className="flex flex-col gap-6">
      <Link to={`/mentor/pathways/${pathwayId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{q.data?.pathway.title ?? t('mentor.builder.libraryTitle')}</Link>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-12 w-2/3" /><SkeletonText lines={4} /><Skeleton className="h-40 w-full" /></div>}>
        {(d) => d.isAuthor ? <Editor key={d.lesson.id} lesson={d.lesson} pathwayId={pathwayId} /> : <Notice tone="warning">{t('mentor.editor.notAuthor')}</Notice>}
      </QueryState>
    </div>
  );
}

type L = NonNullable<ReturnType<typeof useLesson>['data']>['lesson'];

function Editor({ lesson, pathwayId }: { lesson: L; pathwayId: string }) {
  const t = useT();
  const f = useFormat();
  const save = useSaveLesson();
  const [title, setTitle] = useState(lesson.title);
  const [summary, setSummary] = useState(lesson.summary);
  const [minutes, setMinutes] = useState(String(lesson.estimatedMinutes));
  const [blocks, setBlocks] = useState<LessonBlock[]>(lesson.blocks);
  const [requireReflection, setRequireReflection] = useState(lesson.completion.requireReflection);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const version = useRef(lesson.version);
  const dirty = useRef(false);
  const first = useRef(true);

  const touch = () => { dirty.current = true; setStatus('idle'); };

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!dirty.current) return;
    const id = setTimeout(() => {
      setStatus('saving');
      save.mutate({ id: lesson.id, version: version.current, patch: { title: title.trim() || lesson.title, summary, estimatedMinutes: Math.max(1, Number(minutes) || 1), blocks, completion: { requireQuiz: false, requireReflection } } }, {
        onSuccess: (l) => { version.current = l.version; dirty.current = false; setStatus('saved'); setSavedAt(new Date().toISOString()); },
        onError: (e) => { setStatus('error'); if (e instanceof ApiError && e.code === 'conflict') setConflict(true); },
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [title, summary, minutes, blocks, requireReflection]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (i: number, dir: -1 | 1) => { const next = [...blocks]; const j = i + dir; const a = next[i]; const b = next[j]; if (!a || !b) return; next[i] = b; next[j] = a; touch(); setBlocks(next); };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h2 font-semibold">{t('mentor.editor.title')}</h1>
          <p role="status" aria-live="polite" className="text-sm text-muted">{status === 'saving' ? t('states.saving') : status === 'saved' && savedAt ? t('states.savedAt', { time: f.time(savedAt) }) : status === 'error' ? t('learn.reflect.saveError') : ''}</p>
          <Link to={`/app/pathways/${pathwayId}/lessons/${lesson.id}`} className={buttonStyles({ variant: 'secondary' }) + ' ms-auto'}><Eye size={18} aria-hidden="true" />{t('mentor.builder.preview')}</Link>
        </div>
        {conflict ? <Notice tone="danger">{t('mentor.editor.conflict')}</Notice> : null}
        <Field label={t('mentor.editor.lessonTitle')} required>{(p) => <Input {...p} value={title} onChange={(e) => { setTitle(e.target.value); touch(); }} />}</Field>
        <Field label={t('mentor.editor.summary')}>{(p) => <Textarea {...p} rows={2} value={summary} onChange={(e) => { setSummary(e.target.value); touch(); }} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('mentor.editor.minutes')}>{(p) => <Input {...p} type="number" min={1} max={120} value={minutes} onChange={(e) => { setMinutes(e.target.value); touch(); }} />}</Field>
          <Checkbox label={t('mentor.editor.requireReflection')} description={t('mentor.editor.requireReflectionHelp')} checked={requireReflection} onCheckedChange={(c) => { setRequireReflection(c === true); touch(); }} />
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {blocks.length === 0 ? <Notice>{t('mentor.editor.noBlocks')}</Notice> : null}
        {blocks.map((b, i) => <BlockEditor key={b.id} block={b} index={i} count={blocks.length} lessonId={lesson.id} onChange={(nb) => { touch(); setBlocks(blocks.map((x) => (x.id === nb.id ? nb : x))); }} onMove={(d) => move(i, d)} onDelete={() => { touch(); setBlocks(blocks.filter((x) => x.id !== b.id)); }} />)}
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="secondary"><Plus size={18} aria-hidden="true" />{t('mentor.editor.addBlock')}</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {blockTypes.map((k: BlockType) => <DropdownMenuItem key={k} onSelect={() => { touch(); setBlocks([...blocks, newBlock(k)]); }}>{t(`mentor.editor.block.${k}`)}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
