import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from '@phosphor-icons/react';
import { useT, useMsg, useFormat } from '@/lib/i18n';
import { useMarkRead, useNotifications } from '@/features/growth/hooks';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Button } from '@/components/ui/button/button';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { LampIllustration } from '@/components/icons/illustrations';
import { cn } from '@/lib/cn';

export function NotificationsPage() {
  const t = useT();
  const msg = useMsg();
  const f = useFormat();
  const nav = useNavigate();
  const q = useNotifications();
  const mark = useMarkRead();
  const unread = q.data?.filter((n) => !n.readAt).length ?? 0;
  const groups = useMemo(() => {
    const m = new Map<string, NonNullable<typeof q.data>>();
    for (const n of q.data ?? []) { const k = f.date(n.createdAt, { weekday: 'long', day: 'numeric', month: 'long' }); m.set(k, [...(m.get(k) ?? []), n]); }
    return [...m.entries()];
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title={t('nav.notifications')} description={t('notifications.description')} actions={<Button variant="secondary" disabled={!unread} loading={mark.isPending} onClick={() => mark.mutate('all')}>{t('notifications.markAll')}</Button>} />
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4">{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}>
        {(all) => all.length ? (
          <div className="flex flex-col gap-6">
            {groups.map(([day, items]) => (
              <section key={day} aria-label={day}>
                <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted">{day}</h2>
                <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button type="button" onClick={() => { if (!n.readAt) mark.mutate([n.id]); nav(n.href); }} className={cn('flex w-full items-start gap-3 px-4 py-3 text-start transition-colors motion-fast hover:bg-sunken', !n.readAt && 'bg-accent-soft')}>
                        <Bell size={20} className="mt-0.5 shrink-0 text-accent-soft-ink" aria-hidden="true" />
                        <span className="min-w-0 flex-1"><span className="block text-base text-ink">{msg(n.message)}</span><span className="block text-sm text-muted">{f.ago(n.createdAt)}</span></span>
                        {!n.readAt ? <span className="mt-1 shrink-0 text-xs font-semibold text-accent-soft-ink">{t('notifications.new')}</span> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : <EmptyState illustration={<LampIllustration />} title={t('notifications.emptyTitle')} description={t('notifications.emptyBody')} />}
      </QueryState>
    </div>
  );
}
