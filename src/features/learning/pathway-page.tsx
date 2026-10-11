import { useParams } from 'react-router';
import { CheckCircle, Circle, CircleHalf, Clock, Gauge, Path, UserCircle, Users } from '@phosphor-icons/react';
import { PropertyList } from '@/components/patterns/property-list/property-list';
import { Reveal } from '@/components/motion/reveal';
import { useT } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useSession } from '@/features/session/hooks';
import { useEnrol, usePathway } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { Cover } from '@/components/content/cover';
import { Card } from '@/components/ui/card/card';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Badge } from '@/components/ui/badge/badge';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { Progress } from '@/components/ui/progress/progress';
import { useToast } from '@/components/ui/toast/toast';
import { Notice } from '@/components/patterns/notice/notice';
import { ApiError } from '@/lib/db/errors';
import { Avatar } from '@/components/ui/avatar/avatar';

export function PathwayPage() {
  const { pathwayId = '' } = useParams();
  const t = useT();
  const q = usePathway(pathwayId);
  const enrol = useEnrol();
  const toast = useToast();
  const { user } = useSession();
  return (
    <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-48 w-full" /><SkeletonText lines={3} /></div>}>
      {(p) => {
        const flat = p.outline.flatMap((m) => m.lessons);
        const current = p.progress.currentLessonId;
        const isAuthor = p.authorId === user?.id;
        const startHref = current ? `/app/pathways/${p.id}/lessons/${current}` : flat[0] ? `/app/pathways/${p.id}/lessons/${flat[0].id}` : '#';
        return (
          <div className="flex flex-col gap-6">
            <header className="enter flex flex-col">
              <div className="h-36 overflow-hidden rounded-2xl border border-line shadow-card sm:h-48 md:h-56"><Cover coverKey={p.coverKey} /></div>
              <div className="flex flex-col gap-3 px-1 sm:px-4">
                <span className="pop -mt-8 grid size-16 place-items-center rounded-2xl border border-line bg-raised text-accent shadow-lift sm:-mt-10 sm:size-20"><Path size={34} weight="duotone" aria-hidden="true" /></span>
                <div className="flex flex-wrap gap-1.5">{p.status === 'draft' ? <Badge tone="warning">{t('learn.status.draft')}</Badge> : null}{p.enrollment?.status === 'completed' ? <Badge tone="success">{t('learn.status.done')}</Badge> : null}</div>
                <h1 className="text-h1 font-semibold tracking-tight">{p.title}</h1>
                <p className="max-w-prose text-lg text-muted">{p.summary}</p>
                <PropertyList items={[
                  { icon: Gauge, label: t('learn.pathway.level'), value: t(`learn.level.${p.level}`) },
                  { icon: UserCircle, label: t('learn.pathway.author'), value: <span className="inline-flex items-center gap-2"><Avatar name={p.author.displayName} size="sm" />{p.author.displayName}</span> },
                  { icon: Clock, label: t('learn.pathway.length'), value: t('learn.pathway.counts', { lessons: p.lessonCount, minutes: p.estimatedMinutes }) },
                  { icon: Users, label: t('learn.pathway.for'), value: p.audience },
                ]} className="max-w-xl" />
              {p.enrollment ? <div className="max-w-md"><Progress value={p.progress.total ? (p.progress.completed / p.progress.total) * 100 : 0} label={p.title} valueText={t('learn.pathway.progressText', { done: p.progress.completed, total: p.progress.total })} /><p className="mt-1 text-sm text-muted">{t('learn.pathway.progressText', { done: p.progress.completed, total: p.progress.total })}</p></div> : null}
              <div className="flex flex-wrap gap-2">
                {p.enrollment ? (
                  <Link to={startHref} className={buttonStyles({ size: 'lg' })}>{p.progress.completed > 0 ? t('learn.pathway.continue') : t('learn.pathway.begin')}</Link>
                ) : (
                  <Button size="lg" loading={enrol.isPending} disabled={p.status !== 'published'} onClick={() => enrol.mutate(p.id, { onSuccess: () => toast.show({ title: t('learn.pathway.enrolled', { title: p.title }), tone: 'success' }), onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }) })}>{t('learn.pathway.start')}</Button>
                )}
                {isAuthor ? <Link to={`/mentor/pathways/${p.id}`} className={buttonStyles({ size: 'lg', variant: 'secondary' })}>{t('learn.pathway.edit')}</Link> : null}
              </div>
              {p.status !== 'published' ? <Notice tone="warning">{t('learn.pathway.draftNotice')}</Notice> : null}
            </div>
            </header>
            <div className="flex flex-col gap-6">
              {p.outline.map((m) => (
                <Reveal key={m.id}><section aria-labelledby={`m-${m.id}`} className="flex flex-col gap-2">
                  <div><h2 id={`m-${m.id}`} className="text-h3 font-semibold">{m.title}</h2>{m.summary ? <p className="text-base text-muted">{m.summary}</p> : null}</div>
                  <Card padding="none">
                    <ol className="divide-y divide-line">
                      {m.lessons.map((l) => (
                        <li key={l.id}>
                          <Link to={`/app/pathways/${p.id}/lessons/${l.id}`} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors motion-fast hover:bg-sunken">
                            {l.progress === 'completed' ? <CheckCircle size={24} weight="fill" className="shrink-0 text-accent" aria-hidden="true" /> : l.progress === 'in_progress' ? <CircleHalf size={24} weight="fill" className="shrink-0 text-accent" aria-hidden="true" /> : <Circle size={24} className="shrink-0 text-subtle" aria-hidden="true" />}
                            <span className="min-w-0 flex-1"><span className="block font-medium text-ink">{l.title}</span><span className="block truncate text-sm text-muted">{l.summary || t('learn.pathway.noSummary')}</span></span>
                            <span className="shrink-0 text-sm text-muted">{t('learn.minutes', { minutes: l.estimatedMinutes })}</span>
                            <span className="sr-only">{t(`learn.status.${l.progress === 'completed' ? 'done' : l.progress === 'in_progress' ? 'current' : 'todo'}`)}</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </Card>
                </section></Reveal>
              ))}
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
