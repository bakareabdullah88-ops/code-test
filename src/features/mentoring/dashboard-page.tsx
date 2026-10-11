import { CalendarBlank, ChatCircleText, Clock, Flag, HandsPraying, Sparkle, Target } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import type { AttentionItem } from '@/types';
import { useT, useMsg, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useSession } from '@/features/session/hooks';
import { useAttention, useMyCheckIns, useSnooze } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Card } from '@/components/ui/card/card';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Avatar } from '@/components/ui/avatar/avatar';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { LampIllustration } from '@/components/icons/illustrations';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu/dropdown-menu';
import { useToast } from '@/components/ui/toast/toast';

const icon = { reflection_waiting: ChatCircleText, quiet: Clock, goal_due: Target, checkin_soon: CalendarBlank, milestone_to_affirm: Sparkle, approval_pending: Flag, prayer_shared: HandsPraying } as const;

function actionFor(i: AttentionItem): { to: string; key: string } {
  switch (i.kind) {
    case 'reflection_waiting': return { to: `/mentor/feedback/${i.subject?.id}`, key: 'mentor.attention.reply' };
    case 'quiet': return { to: `/mentor/mentees/${i.menteeId}`, key: 'mentor.attention.openProfile' };
    case 'goal_due': return { to: `/mentor/mentees/${i.menteeId}?tab=goals`, key: 'mentor.attention.openGoals' };
    case 'checkin_soon': return { to: `/mentor/mentees/${i.menteeId}?tab=sessions`, key: 'mentor.attention.prepare' };
    case 'prayer_shared': return { to: `/mentor/mentees/${i.menteeId}`, key: 'mentor.attention.openProfile' };
    default: return { to: `/mentor/mentees/${i.menteeId}`, key: 'mentor.attention.affirm' };
  }
}

export function MentorDashboardPage() {
  const t = useT();
  const msg = useMsg();
  const f = useFormat();
  const toast = useToast();
  const { user } = useSession();
  const q = useAttention();
  const checks = useMyCheckIns();
  const snooze = useSnooze();
  const nav = useNavigate();
  const upcoming = (checks.data ?? []).filter((c) => c.mentorId === user?.id && c.status === 'planned' && new Date(c.scheduledAt).getTime() > Date.now()).slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('mentor.dashboard.title')} description={t('mentor.dashboard.description')} />
      <section aria-labelledby="att-h" className="flex flex-col gap-3">
        <h2 id="att-h" className="text-h3 font-semibold">{t('mentor.dashboard.attention')}</h2>
        <QueryState query={q} skeleton={<div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>}>
          {(items) => items.length ? (
            <ul className="flex flex-col gap-3">
              {items.map((i) => {
                const Icon = icon[i.kind];
                const a = actionFor(i);
                return (
                  <li key={i.id}>
                    <Card className="flex flex-wrap items-center gap-4">
                      <Avatar name={i.menteeName} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-start gap-2 text-base text-ink"><Icon size={20} className="mt-0.5 shrink-0 text-accent-soft-ink" aria-hidden="true" />{msg(i.detail)}</p>
                        <p className="ms-7 text-sm text-muted">{f.ago(i.since)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={a.to} className={buttonStyles({ size: 'sm' })}>{t(a.key)}</Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="sm" variant="ghost">{t('mentor.attention.later')}</Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => snooze.mutate({ id: i.id, days: 3 }, { onSuccess: () => toast.show({ title: t('mentor.attention.snoozed', { days: 3 }), tone: 'success' }) })}>{t('mentor.attention.snooze', { days: 3 })}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => snooze.mutate({ id: i.id, days: 7 }, { onSuccess: () => toast.show({ title: t('mentor.attention.snoozed', { days: 7 }), tone: 'success' }) })}>{t('mentor.attention.snooze', { days: 7 })}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState illustration={<LampIllustration />} title={t('mentor.dashboard.allClearTitle')} description={t('mentor.dashboard.allClearBody')} action={<Link to="/mentor/mentees" className={buttonStyles({ variant: 'secondary' })}>{t('mentor.dashboard.seeMentees')}</Link>} />}
        </QueryState>
      </section>
      <section aria-labelledby="week-h" className="flex flex-col gap-3">
        <h2 id="week-h" className="text-h3 font-semibold">{t('mentor.dashboard.thisWeek')}</h2>
        <QueryState query={checks} skeleton={<SkeletonRow />}>
          {() => upcoming.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => nav(`/mentor/mentees/${c.menteeId}?tab=sessions`)} className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface p-4 text-start transition-colors motion-fast hover:bg-sunken">
                    <Avatar name={c.mentee.displayName} />
                    <span><span className="block font-medium">{c.mentee.displayName}</span><span className="block text-sm text-muted">{f.dateTime(c.scheduledAt)} &middot; {t(`mentor.mode.${c.mode}`)}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="text-base text-muted">{t('mentor.dashboard.noCheckIns')}</p>}
        </QueryState>
      </section>
    </div>
  );
}
