import { useMemo, useState } from 'react';
import { BookOpenText, CheckCircle, ChatCircleText, Flag, HandsPraying, NotePencil, Sparkle, Users } from '@phosphor-icons/react';
import type { TimelineEvent, TimelineEventType } from '@/types';
import { useT, useMsg, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useTimeline } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Chip } from '@/components/ui/chip/chip';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { PathIllustration } from '@/components/icons/illustrations';

const icons: Record<TimelineEventType, typeof Flag> = {
  lesson_completed: CheckCircle, pathway_started: Flag, pathway_completed: Flag, reflection_submitted: NotePencil, feedback_received: ChatCircleText, discussion_shared: Users,
  memory_verse_added: BookOpenText, goal_completed: CheckCircle, milestone_awarded: Sparkle, prayer_answered: HandsPraying, checkin_held: Users, plan_completed: BookOpenText,
};
const groupsOf: Record<string, TimelineEventType[]> = {
  lessons: ['lesson_completed', 'pathway_started', 'pathway_completed'],
  writing: ['reflection_submitted', 'feedback_received', 'discussion_shared'],
  growth: ['milestone_awarded', 'goal_completed', 'memory_verse_added', 'prayer_answered', 'checkin_held'],
};

function href(e: TimelineEvent): string | null {
  switch (e.subject.type) {
    case 'reflection': return `/app/journal/${e.subject.id}`;
    case 'lesson': return `/app/lessons/${e.subject.id}`;
    case 'pathway': return `/app/pathways/${e.subject.id}`;
    case 'milestone': return '/app/journey/milestones';
    default: return null;
  }
}

function weekKey(iso: string) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** The journey as a thread: dated events grouped by week, each linking back to its source. */
export function TimelineList({ userId, showFilters = true }: { userId?: string; showFilters?: boolean }) {
  const t = useT();
  const msg = useMsg();
  const f = useFormat();
  const q = useTimeline(userId);
  const [filter, setFilter] = useState<'all' | keyof typeof groupsOf>('all');

  return (
    <div className="flex flex-col gap-4">
      {showFilters ? (
        <div role="group" aria-label={t('learn.timeline.filters')} className="flex flex-wrap gap-2">
          {(['all', 'lessons', 'writing', 'growth'] as const).map((k) => <Chip key={k} selected={filter === k} onClick={() => setFilter(k)}>{t(`learn.timeline.filter.${k}`)}</Chip>)}
        </div>
      ) : null}
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4">{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}>
        {(all) => <Events events={all} filter={filter} msg={msg} f={f} t={t} />}
      </QueryState>
    </div>
  );
}

function Events({ events, filter, msg, f, t }: { events: TimelineEvent[]; filter: string; msg: ReturnType<typeof useMsg>; f: ReturnType<typeof useFormat>; t: ReturnType<typeof useT> }) {
  const list = useMemo(() => events.filter((e) => filter === 'all' || groupsOf[filter]?.includes(e.type)), [events, filter]);
  const weeks = useMemo(() => {
    const m = new Map<string, TimelineEvent[]>();
    for (const e of list) { const k = weekKey(e.occurredAt); m.set(k, [...(m.get(k) ?? []), e]); }
    return [...m.entries()];
  }, [list]);
  if (!events.length) return <EmptyState illustration={<PathIllustration />} title={t('learn.timeline.emptyTitle')} description={t('learn.timeline.emptyBody')} />;
  if (!list.length) return <p className="text-base text-muted">{t('learn.timeline.noneMatch')}</p>;
  return (
    <div className="flex flex-col gap-8">
      {weeks.map(([week, items]) => (
        <section key={week} aria-label={t('learn.timeline.weekOf', { date: f.date(week) })}>
          <h3 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-muted">{t('learn.timeline.weekOf', { date: f.date(week) })}</h3>
          <ol className="relative flex flex-col gap-4 border-s-2 border-line ps-6">
            {items.map((e) => {
              const Icon = icons[e.type];
              const to = href(e);
              const body = (<><span className="block text-base text-ink">{msg(e.summary)}</span><span className="block text-sm text-muted">{f.ago(e.occurredAt)}</span></>);
              return (
                <li key={e.id} className="relative">
                  <span aria-hidden="true" className="absolute -start-[2.2rem] top-0 grid size-8 place-items-center rounded-md border border-line bg-surface text-accent-soft-ink"><Icon size={18} /></span>
                  {to ? <Link to={to} className="block rounded-md py-1 hover:bg-sunken">{body}</Link> : <div className="py-1">{body}</div>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
