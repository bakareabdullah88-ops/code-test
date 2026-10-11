import { useParams } from 'react-router';
import { CheckCircle, Circle, CircleHalf } from '@phosphor-icons/react';
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
            <div className="overflow-hidden rounded-lg border border-line"><div className="h-40 md:h-56"><Cover coverKey={p.coverKey} /></div></div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5"><Badge>{t(`learn.level.${p.level}`)}</Badge>{p.status === 'draft' ? <Badge tone="warning">{t('learn.status.draft')}</Badge> : null}{p.enrollment?.status === 'completed' ? <Badge tone="success">{t('learn.status.pathwayDone')}</Badge> : null}</div>
              <h1 className="text-h2 font-semibold">{p.title}</h1>
              <p className="max-w-prose text-lg text-muted">{p.summary}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="flex items-center gap-2"><Avatar name={p.author.displayName} size="sm" />{t('learn.pathway.by', { name: p.author.displayName })}</span>
                <span>{t('learn.pathway.counts', { lessons: p.lessonCount, minutes: p.estimatedMinutes })}</span>
                <span>{t('learn.pathway.audience', { audience: p.audience })}</span>
              </div>
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
            <div className="flex flex-col gap-6">
              {p.outline.map((m) => (
                <section key={m.id} aria-labelledby={`m-${m.id}`} className="flex flex-col gap-2">
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
                </section>
              ))}
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
