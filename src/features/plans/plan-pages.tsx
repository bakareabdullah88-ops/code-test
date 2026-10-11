import { useParams } from 'react-router';
import { motion } from 'motion/react';
import { BookOpenText, CalendarCheck, Check } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { parseRef } from '@/lib/bible/ref';
import { QueryState } from '@/components/data/query-state';
import { Cover } from '@/components/content/cover';
import { PassageText } from '@/components/content/scripture';
import { PageCover } from '@/components/patterns/page-cover/page-cover';
import { Progress } from '@/components/ui/progress/progress';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { formatRef } from '@/lib/bible/ref';
import { cn } from '@/lib/cn';
import { usePlan, usePlans, useStartPlan, useToggleDay } from './hooks';

export function PlansTab() {
  const t = useT();
  const q = usePlans();
  return (
    <QueryState query={q} skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 w-full" />)}</div>}>
      {(list) => (
        <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link to={`/app/bible/plans/${p.id}`} className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface/80 shadow-card">
                <span className="block h-28 overflow-hidden"><Cover coverKey={p.coverKey} className="transition-transform duration-500 group-hover:scale-105" /></span>
                <span className="flex flex-1 flex-col gap-2 p-4">
                  <span className="text-lg font-semibold leading-snug">{p.title}</span>
                  <span className="text-sm text-muted">{p.summary}</span>
                  <span className="mt-auto pt-2 text-sm font-medium text-accent-soft-ink">{p.started ? t('plans.progress', { done: p.completed, total: p.dayCount }) : t('plans.days', { count: p.dayCount })}</span>
                  {p.started ? <Progress value={(p.completed / p.dayCount) * 100} label={p.title} valueText={t('plans.progress', { done: p.completed, total: p.dayCount })} /> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}

export function PlanPage() {
  const { planId = '' } = useParams();
  const t = useT();
  const q = usePlan(planId);
  const start = useStartPlan();
  const toggle = useToggleDay();
  return (
    <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-56 w-full" /><Skeleton className="h-10 w-2/3" /></div>}>
      {(p) => (
        <div className="flex flex-col gap-8">
          <PageCover coverKey={p.coverKey} icon={CalendarCheck} title={p.title} description={p.summary}>
            {p.started ? <div className="max-w-md"><Progress value={(p.completed / p.dayCount) * 100} label={p.title} valueText={t('plans.progress', { done: p.completed, total: p.dayCount })} /><p className="mt-1 text-sm text-muted">{p.completed === p.dayCount ? t('plans.finished') : t('plans.progress', { done: p.completed, total: p.dayCount })}</p></div>
              : <Button size="lg" loading={start.isPending} onClick={() => start.mutate(p.id)}>{t('plans.start')}</Button>}
          </PageCover>
          <ol className="mx-auto flex w-full max-w-prose flex-col gap-3 px-1 sm:px-4">
            {p.days.map((d) => {
              const done = p.progressDays.includes(d.day);
              const today = p.started && p.nextDay === d.day;
              const ranges = d.refs.map((r) => parseRef(r)).filter((r): r is NonNullable<typeof r> => !!r);
              return (
                <li key={d.day} className={cn('rounded-2xl border bg-surface/80 shadow-card transition-colors motion-base', today ? 'border-accent' : 'border-line')}>
                  <div className="flex items-center gap-3 p-3">
                    <button type="button" disabled={!p.started || toggle.isPending} aria-pressed={done} aria-label={t(done ? 'plans.unmark' : 'plans.mark', { day: d.day })} onClick={() => toggle.mutate({ id: p.id, day: d.day })} className={cn('grid size-11 shrink-0 place-items-center rounded-full border-2 transition-all motion-fast active:scale-90 disabled:opacity-50', done ? 'border-accent bg-accent text-on-accent' : 'border-line-strong text-transparent hover:border-accent')}>
                      <motion.span initial={false} animate={{ scale: done ? 1 : 0.4, opacity: done ? 1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}><Check size={20} weight="bold" aria-hidden="true" /></motion.span>
                    </button>
                    <div className="min-w-0 flex-1"><p className="text-sm text-muted">{t('plans.day', { day: d.day })}{today ? <> · <span className="font-medium text-accent-soft-ink">{t('plans.next')}</span></> : null}</p><h2 className="truncate text-lg font-semibold">{d.title}</h2></div>
                    <span className="hidden text-sm text-muted sm:block">{d.refs.map((r) => { const x = parseRef(r); return x ? formatRef(x) : r; }).join(', ')}</span>
                  </div>
                  {(today || (p.started && !done && p.nextDay === null)) || (!p.started && d.day === 1) ? (
                    <div className="flex flex-col gap-4 border-t border-line p-4">
                      {ranges.map((r) => <div key={formatRef(r)} className="flex flex-col gap-1"><p className="flex items-center gap-2 text-sm font-medium text-muted"><BookOpenText size={16} aria-hidden="true" />{formatRef(r)}</p><PassageText range={r} /></div>)}
                      <p className="rounded-xl bg-accent-soft p-3 text-base text-accent-soft-ink">{d.prompt}</p>
                      <Link to={`/app/bible/${ranges[0]?.book ?? 'JHN'}/${ranges[0]?.chapter ?? 1}`} className="text-sm font-medium text-accent-soft-ink underline-offset-4 hover:underline">{t('plans.openReader')}</Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </QueryState>
  );
}
