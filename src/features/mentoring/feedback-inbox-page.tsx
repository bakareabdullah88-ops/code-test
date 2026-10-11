import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useReflections } from '@/features/reflections/hooks';
import { ReflectionCard } from '@/features/reflections/reflection-card';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { LampIllustration } from '@/components/icons/illustrations';

export function FeedbackInboxPage() {
  const t = useT();
  const [tab, setTab] = useState<'awaiting' | 'responded' | 'all'>('awaiting');
  const q = useReflections({ scope: 'inbox', feedback: tab });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('mentor.feedback.title')} description={t('mentor.feedback.description')} />
      <SegmentedControl label={t('mentor.feedback.filter')} className="self-start" value={tab} onValueChange={(v) => setTab(v as typeof tab)} options={[{ value: 'awaiting', label: t('mentor.feedback.tabWaiting') }, { value: 'responded', label: t('mentor.feedback.tabReplied') }, { value: 'all', label: t('mentor.feedback.tabAll') }]} />
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>}>
        {(list) => list.length ? <ul className="flex flex-col gap-3">{list.map((r) => <li key={r.id}><ReflectionCard r={r} href={`/mentor/feedback/${r.id}`} showAuthor /></li>)}</ul> : <EmptyState illustration={<LampIllustration />} title={t(tab === 'awaiting' ? 'mentor.feedback.emptyWaitingTitle' : 'mentor.feedback.emptyTitle')} description={t(tab === 'awaiting' ? 'mentor.feedback.emptyWaitingBody' : 'mentor.feedback.emptyBody')} />}
      </QueryState>
    </div>
  );
}
