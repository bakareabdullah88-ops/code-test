import { useState } from 'react';
import { useParams } from 'react-router';
import { BookmarkSimple, Clock, MagnifyingGlass, Article, Compass, Headphones, Books } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import type { Resource, ResourceKind } from '@/types';
import { parseRef } from '@/lib/bible/ref';
import { useDebounced } from '@/lib/use-debounced';
import { QueryState } from '@/components/data/query-state';
import { Cover } from '@/components/content/cover';
import { ScriptureCard } from '@/components/content/scripture';
import { PageCover } from '@/components/patterns/page-cover/page-cover';
import { PropertyList } from '@/components/patterns/property-list/property-list';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Chip } from '@/components/ui/chip/chip';
import { Input } from '@/components/ui/input/input';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { useToast } from '@/components/ui/toast/toast';
import { cn } from '@/lib/cn';
import { useBookmark, useResource, useResources } from './hooks';

const kindIcon = { article: Article, guide: Compass, audio: Headphones, book: Books } as const;
const kinds: (ResourceKind | 'all')[] = ['all', 'guide', 'article', 'audio', 'book'];

export function LibraryTab() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ResourceKind | 'all'>('all');
  const [saved, setSaved] = useState(false);
  const debounced = useDebounced(query, 200);
  const q = useResources({ query: debounced, kind, saved });
  const bookmark = useBookmark();
  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-xl">
        <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input type="search" aria-label={t('library.search')} placeholder={t('library.search')} value={query} onChange={(e) => setQuery(e.target.value)} className="ps-10" />
      </div>
      <div role="group" aria-label={t('library.filter')} className="flex flex-wrap gap-2">
        {kinds.map((k) => <Chip key={k} selected={!saved && kind === k} onClick={() => { setKind(k); setSaved(false); }}>{t(`library.kind.${k}`)}</Chip>)}
        <Chip selected={saved} onClick={() => setSaved((s) => !s)}><BookmarkSimple size={16} weight={saved ? 'fill' : 'regular'} aria-hidden="true" />{t('library.saved')}</Chip>
      </div>
      <QueryState query={q} skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}</div>}>
        {(list) => list.length ? (
          <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => {
              const Ic = kindIcon[r.kind];
              return (
                <li key={r.id} className="group relative">
                  <Link to={`/app/journey/library/${r.id}`} className="hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface/80 shadow-card">
                    <span className="block h-28 overflow-hidden"><Cover coverKey={r.coverKey} className="transition-transform duration-500 group-hover:scale-105" /></span>
                    <span className="flex flex-1 flex-col gap-2 p-4">
                      <span className="flex items-center gap-2 text-xs font-medium text-muted"><Ic size={16} aria-hidden="true" />{t(`library.kind.${r.kind}`)}<span aria-hidden="true">·</span>{t('library.minutes', { count: r.minutes })}</span>
                      <span className="text-lg font-semibold leading-snug">{r.title}</span>
                      <span className="text-sm text-muted">{r.summary}</span>
                      <span className="mt-auto pt-1 text-sm text-subtle">{r.author}</span>
                    </span>
                  </Link>
                  <button type="button" aria-pressed={r.bookmarked} aria-label={t(r.bookmarked ? 'library.unsave' : 'library.save', { title: r.title })} onClick={() => bookmark.mutate(r.id)} className={cn('glass absolute end-3 top-3 grid size-11 place-items-center rounded-full border transition-transform motion-fast active:scale-90', r.bookmarked ? 'text-accent' : 'text-ink')}>
                    <BookmarkSimple size={20} weight={r.bookmarked ? 'fill' : 'regular'} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title={t('library.emptyTitle')} description={t(saved ? 'library.emptySaved' : 'library.emptyBody')} />}
      </QueryState>
    </div>
  );
}

export function ResourcePage() {
  const { resourceId = '' } = useParams();
  const t = useT();
  const toast = useToast();
  const q = useResource(resourceId);
  const bookmark = useBookmark();
  return (
    <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-56 w-full" /><Skeleton className="h-10 w-2/3" /></div>}>
      {(r: Resource & { bookmarked: boolean }) => (
        <article className="flex flex-col gap-8">
          <PageCover coverKey={r.coverKey} icon={kindIcon[r.kind]} title={r.title} description={r.summary}>
            <Button variant={r.bookmarked ? 'primary' : 'secondary'} aria-pressed={r.bookmarked} loading={bookmark.isPending} onClick={() => bookmark.mutate(r.id, { onSuccess: (x) => toast.show({ title: t(x.bookmarked ? 'library.savedToast' : 'library.unsavedToast') }) })}>
              <BookmarkSimple size={18} weight={r.bookmarked ? 'fill' : 'regular'} aria-hidden="true" />{t(r.bookmarked ? 'library.saved' : 'library.saveShort')}
            </Button>
          </PageCover>
          <div className="mx-auto flex w-full max-w-prose flex-col gap-6 px-1 sm:px-4">
            <PropertyList items={[
              { icon: kindIcon[r.kind], label: t('library.type'), value: <Badge>{t(`library.kind.${r.kind}`)}</Badge> },
              { icon: Clock, label: t('library.time'), value: t('library.minutes', { count: r.minutes }) },
              { icon: Article, label: t('library.author'), value: r.author },
            ]} />
            <div className="flex flex-col gap-5 font-serif text-lg leading-relaxed md:text-xl md:leading-relaxed">{r.body.map((p, i) => <p key={i}>{p}</p>)}</div>
            {r.refs.map((ref) => { const range = parseRef(ref); return range ? <ScriptureCard key={ref} range={range} /> : null; })}
          </div>
        </article>
      )}
    </QueryState>
  );
}
