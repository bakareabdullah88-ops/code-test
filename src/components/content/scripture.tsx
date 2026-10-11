import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { BookOpenText } from '@phosphor-icons/react';
import type { BibleRange } from '@/types';
import { useT } from '@/lib/i18n';
import { loadPassage } from '@/lib/bible/loader';
import { formatRef, rangeKey } from '@/lib/bible/ref';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { ErrorState } from '@/components/patterns/error-state/error-state';
import { cn } from '@/lib/cn';

/** Verses from the bundled World English Bible, with verse numbers set small. */
export function PassageText({ range, className }: { range: BibleRange; className?: string }) {
  const q = useQuery({ queryKey: ['passage', rangeKey(range)], queryFn: () => loadPassage(range), staleTime: Infinity });
  const t = useT();
  if (q.isLoading) return <div aria-busy="true" aria-label={t('states.loading')}><SkeletonText lines={3} /><Skeleton className="mt-2 h-4 w-1/3" /></div>;
  if (q.isError) return <ErrorState className="py-4" title={t('states.errorTitle')} description={t('states.errorBody')} retryLabel={t('actions.retry')} onRetry={() => void q.refetch()} />;
  const verses = q.data ?? [];
  return (
    <p className={cn('font-serif', className)}>
      {verses.map((v) => (
        <span key={v.v} className={v.poetry ? 'block ps-4 -indent-4' : undefined}>
          <span className="verse-num">{v.v}</span>
          {v.text.replaceAll(' / ', ' ')}{' '}
        </span>
      ))}
    </p>
  );
}

export function ScriptureCard({ range, caption }: { range: BibleRange; caption?: string | null }) {
  const t = useT();
  const ref = formatRef(range);
  return (
    <figure className="rounded-lg border border-line bg-surface p-5 md:p-6">
      {caption ? <p className="mb-2 text-sm text-muted">{caption}</p> : null}
      <blockquote className="prose-reading text-[length:1.05em]"><PassageText range={range} /></blockquote>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{ref} <span className="text-muted">{t('bible.webShort')}</span></span>
        <Link to={`/app/bible/${range.book}/${range.chapter}${range.verseEnd ? `?v=${range.verseStart}${range.verseEnd !== range.verseStart ? `-${range.verseEnd}` : ''}` : ''}`} className="inline-flex min-h-11 items-center gap-1.5 text-accent-soft-ink underline underline-offset-4">
          <BookOpenText size={16} aria-hidden="true" />{t('bible.openInBible')}
        </Link>
      </figcaption>
    </figure>
  );
}
