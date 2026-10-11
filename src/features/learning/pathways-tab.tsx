import { useT } from '@/lib/i18n';
import { usePathways } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { Card } from '@/components/ui/card/card';
import { PathwayCard } from './pathway-card';
import { BookIllustration } from '@/components/icons/illustrations';

const Grid = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[0, 1, 2].map((i) => <Card key={i} padding="none"><Skeleton className="h-32 w-full rounded-none" /><div className="flex flex-col gap-2 p-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /></div></Card>)}
  </div>
);

export function PathwaysTab() {
  const t = useT();
  const mine = usePathways('enrolled');
  const library = usePathways('library');
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="mine-h" className="flex flex-col gap-3">
        <h2 id="mine-h" className="text-h3 font-semibold">{t('learn.journey.myPathways')}</h2>
        <QueryState query={mine} skeleton={<Grid />}>
          {(list) => list.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <li key={p.id} className="flex"><PathwayCard className="w-full" pathway={p} href={`/app/pathways/${p.id}`} /></li>)}</ul>
          ) : <EmptyState illustration={<BookIllustration />} title={t('learn.journey.noneTitle')} description={t('learn.journey.noneBody')} />}
        </QueryState>
      </section>
      <section aria-labelledby="lib-h" className="flex flex-col gap-3">
        <h2 id="lib-h" className="text-h3 font-semibold">{t('learn.journey.available')}</h2>
        <QueryState query={library} skeleton={<Grid />}>
          {(list) => {
            const rest = list.filter((p) => !p.enrollment);
            return rest.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <li key={p.id} className="flex"><PathwayCard className="w-full" pathway={p} href={`/app/pathways/${p.id}`} showProgress={false} /></li>)}</ul> : <p className="text-base text-muted">{t('learn.journey.allEnrolled')}</p>;
          }}
        </QueryState>
      </section>
    </div>
  );
}
