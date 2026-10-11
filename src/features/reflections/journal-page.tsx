import { useState } from 'react';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useReflections } from './hooks';
import { ReflectionCard } from './reflection-card';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { buttonStyles, Button } from '@/components/ui/button/button';
import { Chip } from '@/components/ui/chip/chip';
import { Input } from '@/components/ui/input/input';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { BookIllustration, LampIllustration } from '@/components/icons/illustrations';
import { useDebounced } from '@/lib/use-debounced';

type Filter = 'all' | 'private' | 'shared' | 'reply' | 'draft';

export function JournalPage() {
  const t = useT();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 250);
  const query = useReflections({ scope: 'mine', q: q || undefined });
  const filters: Filter[] = ['all', 'private', 'shared', 'reply', 'draft'];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('learn.journal.title')} description={t('learn.journal.description')} actions={<Link to="/app/journal/new" className={buttonStyles()}><Plus size={18} aria-hidden="true" />{t('learn.journal.new')}</Link>} />
      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <MagnifyingGlass size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input aria-label={t('learn.journal.search')} placeholder={t('learn.journal.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10" />
        </div>
        <div role="group" aria-label={t('learn.journal.filters')} className="flex flex-wrap gap-2">
          {filters.map((f) => <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>{t(`learn.journal.filter.${f}`)}</Chip>)}
        </div>
      </div>
      <QueryState query={query} skeleton={<div className="flex flex-col gap-4">{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}>
        {(all) => {
          const list = all.filter((r) => filter === 'all' ? true : filter === 'private' ? r.visibility === 'private' && r.status === 'submitted' : filter === 'shared' ? r.visibility !== 'private' && r.status === 'submitted' : filter === 'reply' ? r.feedbackStatus === 'responded' : r.status === 'draft');
          if (!all.length && !q) return <EmptyState illustration={<BookIllustration />} title={t('learn.journal.emptyTitle')} description={t('learn.journal.emptyBody')} action={<Link to="/app/journal/new" className={buttonStyles()}>{t('learn.journal.writeFirst')}</Link>} />;
          if (!list.length) return <EmptyState illustration={<LampIllustration />} title={t('learn.journal.noMatchTitle')} description={t('learn.journal.noMatchBody')} action={<Button variant="secondary" onClick={() => { setFilter('all'); setSearch(''); }}>{t('learn.journal.clear')}</Button>} />;
          return <ul className="flex flex-col gap-3">{list.map((r) => <li key={r.id}><ReflectionCard r={r} href={`/app/journal/${r.id}`} /></li>)}</ul>;
        }}
      </QueryState>
    </div>
  );
}
