import { useMemo, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useMentees } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Chip } from '@/components/ui/chip/chip';
import { Input } from '@/components/ui/input/input';
import { Progress } from '@/components/ui/progress/progress';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { LampIllustration } from '@/components/icons/illustrations';

export function MenteesPage() {
  const t = useT();
  const f = useFormat();
  const q = useMentees();
  const [search, setSearch] = useState('');
  const [onlyWaiting, setOnlyWaiting] = useState(false);
  const list = useMemo(() => (q.data ?? []).filter((m) => (!search || m.user.displayName.toLowerCase().includes(search.toLowerCase())) && (!onlyWaiting || m.awaitingCount > 0)), [q.data, search, onlyWaiting]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('mentor.mentees.title')} description={t('mentor.mentees.description')} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm"><MagnifyingGlass size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" /><Input aria-label={t('mentor.mentees.search')} placeholder={t('mentor.mentees.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10" /></div>
        <Chip selected={onlyWaiting} onClick={() => setOnlyWaiting((v) => !v)}>{t('mentor.mentees.waiting')}</Chip>
      </div>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>}>
        {(all) => !all.length ? <EmptyState illustration={<LampIllustration />} title={t('mentor.mentees.emptyTitle')} description={t('mentor.mentees.emptyBody')} /> : !list.length ? <p className="text-base text-muted">{t('mentor.mentees.noMatch')}</p> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {list.map((m) => (
              <li key={m.user.id}>
                <Link to={`/mentor/mentees/${m.user.id}`} className="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors motion-fast hover:border-line-strong hover:bg-sunken">
                  <div className="flex items-center gap-3"><Avatar name={m.user.displayName} /><div className="min-w-0 flex-1"><p className="font-medium text-ink">{m.user.displayName}</p><p className="truncate text-sm text-muted">{m.pathwayTitle ?? t('mentor.mentees.noPathway')}</p></div>{m.awaitingCount > 0 ? <Badge tone="accent">{t('mentor.mentees.awaiting', { count: m.awaitingCount })}</Badge> : null}</div>
                  {m.totalLessons > 0 ? <Progress value={(m.completedLessons / m.totalLessons) * 100} label={m.user.displayName} valueText={t('learn.pathway.progressText', { done: m.completedLessons, total: m.totalLessons })} /> : null}
                  <p className="text-sm text-muted">{m.lastActiveAt ? t('mentor.mentees.lastActive', { when: f.ago(m.lastActiveAt) }) : t('mentor.mentees.neverActive')}{m.nextCheckInAt ? ` · ${t('mentor.mentees.nextCheckIn', { when: f.dateTime(m.nextCheckInAt) })}` : ''}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
