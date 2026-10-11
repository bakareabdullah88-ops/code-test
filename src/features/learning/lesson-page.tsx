import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, ArrowRight, BookmarkSimple, CheckCircle, Lightbulb, NotePencil, SlidersHorizontal, HandsPraying } from '@phosphor-icons/react';
import type { LessonBlock } from '@/types';
import { useT } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { ApiError } from '@/lib/db/errors';
import { lessonsService } from '@/lib/services/learning';
import { formatRef } from '@/lib/bible/ref';
import { setPrefs, usePrefs, type ReadingSize } from '@/lib/prefs';
import { useLesson, useSetProgress } from './hooks';
import { useReflections } from '@/features/reflections/hooks';
import { ReflectionComposer } from '@/features/reflections/reflection-composer';
import { useAddMemoryVerse, useMemoryVerses } from '@/features/bible/hooks';
import { QuizRunner } from './quiz-runner';
import { QueryState } from '@/components/data/query-state';
import { RichView } from '@/components/content/rich-view';
import { ScriptureCard } from '@/components/content/scripture';
import { AudioReader } from '@/components/content/audio-reader';
import { VideoPlayer } from '@/components/content/video-player';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet/sheet';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Badge } from '@/components/ui/badge/badge';
import { useToast } from '@/components/ui/toast/toast';
import { cn } from '@/lib/cn';

const calloutIcon = { note: Lightbulb, practice: NotePencil, pray: HandsPraying } as const;

export function LessonPage() {
  const { pathwayId = '', lessonId = '' } = useParams();
  const t = useT();
  const q = useLesson(lessonId);
  const [settings, setSettings] = useState(false);
  const prefs = usePrefs();

  return (
    <div className="mx-auto flex max-w-[68ch] flex-col gap-6 lg:max-w-3xl">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/app/pathways/${pathwayId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{q.data?.pathway.title ?? t('learn.lesson.back')}</Link>
        <Button variant="ghost" size="sm" onClick={() => setSettings(true)}><SlidersHorizontal size={18} aria-hidden="true" />{t('learn.lesson.readerSettings')}</Button>
      </div>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-9 w-3/4" /><SkeletonText lines={6} /><Skeleton className="h-28 w-full" /></div>}>
        {(d) => <LessonBody key={d.lesson.id} data={d} pathwayId={pathwayId} />}
      </QueryState>
      <Sheet open={settings} onOpenChange={setSettings}>
        <SheetContent title={t('learn.lesson.readerSettings')} closeLabel={t('actions.close')} side="responsive">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2"><p className="text-sm font-semibold">{t('learn.lesson.textSize')}</p>
              <SegmentedControl label={t('learn.lesson.textSize')} value={prefs.readingSize} onValueChange={(v) => setPrefs({ readingSize: v as ReadingSize })} options={[{ value: 's', label: t('learn.lesson.sizeS') }, { value: 'm', label: t('learn.lesson.sizeM') }, { value: 'l', label: t('learn.lesson.sizeL') }, { value: 'xl', label: t('learn.lesson.sizeXL') }]} /></div>
            <div className="flex flex-col gap-2"><p className="text-sm font-semibold">{t('learn.lesson.lineSpacing')}</p>
              <SegmentedControl label={t('learn.lesson.lineSpacing')} value={prefs.readingSpacing} onValueChange={(v) => setPrefs({ readingSpacing: v as 'comfortable' | 'relaxed' })} options={[{ value: 'comfortable', label: t('learn.lesson.comfortable') }, { value: 'relaxed', label: t('learn.lesson.relaxed') }]} /></div>
            <p className="prose-reading rounded-md border border-line p-4">{t('learn.lesson.sample')}</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

type Data = NonNullable<ReturnType<typeof useLesson>['data']>;

function LessonBody({ data, pathwayId }: { data: Data; pathwayId: string }) {
  const t = useT();
  const toast = useToast();
  const { lesson } = data;
  const setProgress = useSetProgress();
  const refl = useReflections({ scope: 'mine', lessonId: lesson.id });
  const [composer, setComposer] = useState(false);
  const [finished, setFinished] = useState<{ pathwayCompleted: boolean } | null>(data.progress?.status === 'completed' ? { pathwayCompleted: false } : null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSaved = useRef<string | null>(data.progress?.lastBlockId ?? null);

  // Resume where the reader left off.
  useEffect(() => {
    const id = data.progress?.lastBlockId;
    if (id && data.progress?.status !== 'completed') document.getElementById(`blk-${id}`)?.scrollIntoView({ block: 'start' });
  }, [data.progress?.lastBlockId, data.progress?.status]);

  // Remember the furthest block reached, without refetching the page on every scroll.
  useEffect(() => {
    if (data.isAuthor || data.progress?.status === 'completed') return;
    const els = [...(containerRef.current?.querySelectorAll<HTMLElement>('[data-block]') ?? [])];
    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      const id = top?.target.getAttribute('data-block');
      if (!id || id === lastSaved.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { lastSaved.current = id; void lessonsService.setProgress(lesson.id, 'in_progress', id).catch(() => undefined); }, 2000);
    }, { rootMargin: '0px 0px -60% 0px' });
    els.forEach((e) => io.observe(e));
    return () => { io.disconnect(); if (timer) clearTimeout(timer); };
  }, [lesson.id, data.isAuthor, data.progress?.status]);

  const prompt = lesson.blocks.find((b) => b.type === 'reflectionPrompt');
  const myReflection = refl.data?.find((r) => r.promptId === (prompt?.type === 'reflectionPrompt' ? prompt.promptId : '__none'));

  const finish = () =>
    setProgress.mutate({ lessonId: lesson.id, status: 'completed' }, {
      onSuccess: (r) => {
        setFinished({ pathwayCompleted: r.pathwayCompleted });
        for (const m of r.newMilestones) toast.show({ title: t('learn.reflect.milestone', { title: t(`milestones.${m.key}.title`) }), description: t(`milestones.${m.key}.meaning`), tone: 'success' });
      },
      onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }),
    });

  const blocks = useMemo(() => lesson.blocks, [lesson.blocks]);

  return (
    <article ref={containerRef} className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted"><span>{t('learn.minutes', { minutes: lesson.estimatedMinutes })}</span>{lesson.status !== 'published' ? <Badge tone="warning">{t('learn.status.draft')}</Badge> : null}{data.progress?.status === 'completed' ? <Badge tone="success">{t('learn.status.done')}</Badge> : null}</div>
        <h1 className="text-h1 font-semibold">{lesson.title}</h1>
        {lesson.summary ? <p className="text-lg text-muted">{lesson.summary}</p> : null}
      </header>

      {blocks.length === 0 ? <p className="text-base text-muted">{t('learn.lesson.empty')}</p> : null}
      {blocks.map((b) => (
        <div key={b.id} id={`blk-${b.id}`} data-block={b.id} className="scroll-mt-20">
          <Block block={b} lessonId={lesson.id} onWrite={() => setComposer(true)} reflection={b.type === 'reflectionPrompt' ? (myReflection ?? null) : null} />
        </div>
      ))}

      <footer className="flex flex-col gap-4 border-t border-line pt-6">
        {finished ? (
          <div className="flex flex-col gap-3 rounded-lg bg-accent-soft p-5" role="status">
            <div className="flex items-center gap-2"><CheckCircle size={28} weight="fill" className="text-accent" aria-hidden="true" /><h2 className="text-h4 font-semibold">{finished.pathwayCompleted ? t('learn.lesson.pathwayDoneTitle') : t('learn.lesson.doneTitle')}</h2></div>
            <p className="text-base text-muted">{finished.pathwayCompleted ? t('learn.lesson.pathwayDoneBody', { pathway: data.pathway.title }) : t('learn.lesson.doneBody')}</p>
            {prompt && !myReflection ? <Button variant="secondary" onClick={() => setComposer(true)} className="w-fit"><NotePencil size={18} aria-hidden="true" />{t('learn.lesson.writeNow')}</Button> : null}
            <div className="flex flex-wrap gap-2">
              {data.nextId ? <Link to={`/app/pathways/${pathwayId}/lessons/${data.nextId}`} className={buttonStyles({ size: 'lg' })}>{t('learn.lesson.next')}<ArrowRight size={18} aria-hidden="true" /></Link> : null}
              <Link to={`/app/pathways/${pathwayId}`} className={buttonStyles({ size: 'lg', variant: 'secondary' })}>{t('learn.lesson.backToPathway')}</Link>
            </div>
          </div>
        ) : data.isAuthor && lesson.status !== 'published' ? null : (
          <Button size="lg" className="w-full sm:w-fit" loading={setProgress.isPending} onClick={finish}><CheckCircle size={20} aria-hidden="true" />{t('learn.lesson.finish')}</Button>
        )}
        <div className="flex justify-between gap-2 text-sm">
          {data.previousId ? <Link to={`/app/pathways/${pathwayId}/lessons/${data.previousId}`} className="inline-flex min-h-11 items-center gap-1 text-muted hover:text-ink"><ArrowLeft size={14} aria-hidden="true" />{t('learn.lesson.previous')}</Link> : <span />}
          {data.nextId && !finished ? <Link to={`/app/pathways/${pathwayId}/lessons/${data.nextId}`} className="inline-flex min-h-11 items-center gap-1 text-muted hover:text-ink">{t('learn.lesson.skipNext')}<ArrowRight size={14} aria-hidden="true" /></Link> : null}
        </div>
      </footer>

      <Sheet open={composer} onOpenChange={setComposer}>
        <SheetContent title={t('learn.reflect.sheetTitle')} description={lesson.title} closeLabel={t('actions.close')} side="responsive" className="md:w-[32rem]">
          <ReflectionComposer lessonId={lesson.id} existing={myReflection ?? null} prompt={prompt?.type === 'reflectionPrompt' ? prompt.prompt : null} autoFocus />
        </SheetContent>
      </Sheet>
    </article>
  );
}

function Block({ block, lessonId, onWrite, reflection }: { block: LessonBlock; lessonId: string; onWrite: () => void; reflection: { id: string; status: string; visibility: string } | null }) {
  const t = useT();
  switch (block.type) {
    case 'text': return <RichView doc={block.doc} />;
    case 'scripture': return <ScriptureCard range={block.ref} caption={block.caption} />;
    case 'callout': {
      const Icon = calloutIcon[block.tone];
      return (
        <aside className="flex gap-3 rounded-lg border border-line bg-sunken p-4 md:p-5">
          <Icon size={24} className="mt-0.5 shrink-0 text-accent-soft-ink" aria-hidden="true" />
          <div><p className="text-sm font-semibold text-accent-soft-ink">{t(`learn.callout.${block.tone}`)}</p><RichView doc={block.doc} className="prose-reading text-[length:0.95em]" /></div>
        </aside>
      );
    }
    case 'audio': return <AudioReader transcript={block.transcript} durationSec={block.durationSec} title={t('learn.audio.title')} />;
    case 'video': return <VideoPlayer src={block.src} poster={block.posterSrc} captions={block.captionsSrc} transcript={block.transcript} title={t('learn.video.title')} />;
    case 'quiz': return <QuizRunner quizId={block.quizId} />;
    case 'memoryVerse': return <MemoryVerseBlock range={block.ref} lessonId={lessonId} />;
    case 'reflectionPrompt':
      return (
        <section aria-label={t('learn.reflect.promptLabel')} className="flex flex-col gap-3 rounded-lg border border-accent bg-accent-soft p-5 md:p-6">
          <p className="text-sm font-semibold text-accent-soft-ink">{t('learn.reflect.promptLabel')}</p>
          <p className="font-serif text-lg text-ink">{block.prompt}</p>
          {block.guidance ? <p className="text-base text-muted">{block.guidance}</p> : null}
          {reflection ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={reflection.status === 'draft' ? 'warning' : 'success'}>{reflection.status === 'draft' ? t('learn.reflect.statusDraft') : t(`learn.reflect.status.${reflection.visibility}`)}</Badge>
              <Link to={`/app/journal/${reflection.id}`} className="inline-flex min-h-11 items-center text-sm font-medium text-accent-soft-ink underline underline-offset-4">{t('learn.reflect.openEntry')}</Link>
              {reflection.status === 'draft' ? <Button variant="secondary" onClick={onWrite}>{t('learn.reflect.continue')}</Button> : null}
            </div>
          ) : <Button onClick={onWrite} className="w-fit"><NotePencil size={18} aria-hidden="true" />{t('learn.reflect.write')}</Button>}
        </section>
      );
  }
}

function MemoryVerseBlock({ range, lessonId }: { range: import('@/types').BibleRange; lessonId: string }) {
  const t = useT();
  const toast = useToast();
  const mem = useMemoryVerses();
  const add = useAddMemoryVerse();
  const has = mem.data?.some((v) => v.range.book === range.book && v.range.chapter === range.chapter && v.range.verseStart === range.verseStart && v.range.verseEnd === range.verseEnd);
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4')}>
      <div className="flex items-center gap-3"><BookmarkSimple size={24} className="text-accent-soft-ink" aria-hidden="true" /><div><p className="font-medium text-ink">{t('learn.memory.title')}</p><p className="text-sm text-muted">{formatRef(range)}</p></div></div>
      {has ? <Badge tone="success">{t('learn.memory.added')}</Badge> : (
        <Button variant="secondary" loading={add.isPending} onClick={() => add.mutate({ range, source: { type: 'lesson', id: lessonId } }, { onSuccess: () => toast.show({ title: t('learn.memory.addedToast', { ref: formatRef(range) }), tone: 'success' }), onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }) })}>{t('learn.memory.add')}</Button>
      )}
    </div>
  );
}
