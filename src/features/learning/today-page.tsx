import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Icon } from '@phosphor-icons/react';
import { BookOpenText, CalendarBlank, CaretRight, ChatCircleText, CheckCircle, Clock, NotePencil, Play, Sparkle, Trophy, UsersThree } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { useMsg, useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { formatRef } from '@/lib/bible/ref';
import { excerpt } from '@/lib/editor/text';
import { lessonsService, type TodayDayItem } from '@/lib/services/learning';
import { useToday } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { ProgressRing } from '@/components/ui/progress/progress';

type TodayData = NonNullable<ReturnType<typeof useToday>['data']>;

function TodaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Skeleton className="h-96 w-full rounded-3xl" />
      <div className="flex flex-col gap-5"><Skeleton className="h-44 w-full rounded-3xl" /><Skeleton className="h-56 w-full rounded-3xl" /></div>
    </div>
  );
}

export function TodayPage() {
  const t = useT();
  const f = useFormat();
  const q = useToday();
  const now = new Date().toISOString();
  const pathwayPct = (d: TodayData) => {
    const lessons = d.next?.pathway.outline.flatMap((m) => m.lessons) ?? [];
    return lessons.length ? (lessons.filter((l) => l.progress === 'completed').length / lessons.length) * 100 : 0;
  };
  return (
    <div className="relative isolate flex flex-col gap-6 pb-4">
      <div className="today-sky" aria-hidden="true" />
      <header className="enter flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-sans text-4xl font-semibold tracking-tight text-ink md:text-5xl">{t('learn.today.title')}</h1>
          <p className="font-sans text-3xl font-normal tracking-tight text-accent-soft-ink md:text-4xl">{f.date(now, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        </div>
        {q.data?.next ? <ProgressRing value={pathwayPct(q.data)} label={t('learn.today.ringLabel', { pathway: q.data.next.pathway.title })} caption={t('learn.today.ringCaption')} /> : null}
      </header>

      <QueryState query={q} skeleton={<TodaySkeleton />}>
        {(d) => (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <FocusStack d={d} pct={pathwayPct(d)} />
            <div className="flex flex-col gap-5">
              <WeekStrip week={d.week} />
              <AlsoToday d={d} />
            </div>
            <div className="flex justify-center lg:col-span-2">
              <Link to="/app/companion" className="glass-strong group inline-flex min-h-12 items-center gap-2.5 rounded-full border px-5 text-base text-muted shadow-lift transition-all motion-base hover:-translate-y-0.5 hover:text-ink">
                <Sparkle size={18} weight="fill" className="text-accent transition-transform motion-base group-hover:rotate-12" aria-hidden="true" />{t('learn.today.ask')}
              </Link>
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}

function FocusStack({ d, pct }: { d: TodayData; pct: number }) {
  const t = useT();
  if (!d.next) {
    return (
      <section aria-labelledby="focus-h" className="enter glass rounded-3xl border p-2">
        <div className="flex min-h-72 flex-col rounded-3xl bg-raised p-6 shadow-lift">
          <p className="text-sm text-muted">{t('learn.today.focus')}</p>
          <h2 id="focus-h" className="mt-6 font-sans text-3xl font-semibold leading-tight tracking-tight">{t(d.enrolledCount ? 'learn.today.allDoneTitle' : 'learn.today.noPathwayTitle')}</h2>
          <p className="mt-3 text-base text-muted">{t(d.enrolledCount ? 'learn.today.allDoneBody' : 'learn.today.noPathwayBody')}</p>
          <div className="mt-auto pt-6"><PillLink to="/app/journey">{t('learn.today.choosePathway')}</PillLink></div>
        </div>
      </section>
    );
  }
  const { pathway, lesson } = d.next;
  const href = `/app/pathways/${pathway.id}/lessons/${lesson.id}`;
  return (
    <section aria-labelledby="focus-h" className="enter relative">
      {/* The pathway sits behind today's lesson like the next sheet in a stack. */}
      <div className="glass mx-3 -mb-8 flex items-center gap-3 rounded-3xl border px-5 pb-11 pt-4 text-sm">
        <span className="relative grid size-5 place-items-center" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="size-5 -rotate-90"><circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5" className="stroke-line" /><circle cx="10" cy="10" r="8" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-accent" strokeDasharray={50.3} strokeDashoffset={50.3 * (1 - pct / 100)} /></svg>
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-ink">{pathway.title}</span>
        <span className="font-semibold tabular-nums text-ink">{Math.round(pct)}%</span>
      </div>
      <div className="glass relative rounded-3xl border p-2 shadow-card">
        <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="flex min-h-80 flex-col rounded-3xl bg-raised p-6 shadow-lift">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{t('learn.today.focus')}</p>
            {d.mentorName ? <Avatar name={d.mentorName} size="sm" /> : null}
          </div>
          <h2 id="focus-h" className="mt-8 font-sans text-3xl font-semibold leading-tight tracking-tight text-ink">{lesson.title}</h2>
          <p className="mt-3 max-w-md text-base text-muted">{lesson.summary}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            <PillLink to={href} icon>{lesson.progress === 'in_progress' ? t('learn.today.continue') : t('learn.today.start')}</PillLink>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted"><Clock size={16} aria-hidden="true" />{t('learn.today.minShort', { minutes: lesson.estimatedMinutes })}</span>
          </div>
        </motion.div>
        {d.upNext ? (
          <Link to={`/app/pathways/${pathway.id}/lessons/${d.upNext.id}`} className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm transition-colors motion-fast hover:bg-raised/60">
            <span className="text-muted">{t('learn.today.upNext')}</span><span className="min-w-0 flex-1 truncate font-medium text-ink">{d.upNext.title}</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function PillLink({ to, icon, children }: { to: string; icon?: boolean; children: ReactNode }) {
  return (
    <Link to={to} className="group inline-flex min-h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-ink pe-5 ps-1.5 text-base font-medium text-bg shadow-lift transition-transform motion-fast hover:-translate-y-0.5 active:scale-95">
      <span className="grid size-9 place-items-center rounded-full bg-accent text-on-accent transition-transform motion-base group-hover:scale-110" aria-hidden="true">{icon ? <Play size={16} weight="fill" /> : <CaretRight size={16} weight="bold" />}</span>
      {children}
    </Link>
  );
}

function WeekStrip({ week }: { week: TodayData['week'] }) {
  const t = useT();
  const f = useFormat();
  const msg = useMsg();
  const todayIdx = Math.max(0, week.findIndex((d) => new Date(d.date).toDateString() === new Date().toDateString()));
  const [sel, setSel] = useState(todayIdx);
  const first = week[0]?.date;
  const last = week[6]?.date;
  const day = week[sel];
  const itemIcon: Record<TodayDayItem['kind'], Icon> = { done: CheckCircle, meeting: UsersThree, event: CalendarBlank };
  return (
    <section aria-labelledby="week-h" className="enter glass rounded-3xl border p-4">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="week-h" className="font-sans text-sm font-normal text-muted">{t('learn.today.thisWeek')}</h2>
        {first && last ? <p className="text-sm font-medium text-ink">{f.date(first, { month: 'short', day: 'numeric' })} - {f.date(last, { day: 'numeric' })}</p> : null}
      </div>
      <div role="group" aria-label={t('learn.today.thisWeek')} className="mt-3 grid grid-cols-7 gap-1">
        {week.map((w, i) => {
          const on = i === sel;
          return (
            <button key={w.date} type="button" aria-pressed={on} aria-label={`${f.date(w.date, { weekday: 'long', month: 'long', day: 'numeric' })}. ${t('learn.today.dayCount', { count: w.items.length })}`} onClick={() => setSel(i)} className="relative flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl text-ink">
              {on ? <motion.span layoutId="week-pill" className="absolute inset-0 rounded-2xl border border-line bg-raised shadow-lift" transition={{ type: 'spring', stiffness: 420, damping: 32 }} /> : null}
              <span className={cn('relative text-xs', i === todayIdx ? 'font-semibold text-accent-soft-ink' : 'text-muted')}>{f.date(w.date, { weekday: 'narrow' })}</span>
              <span className="relative text-lg font-medium tabular-nums">{f.date(w.date, { day: 'numeric' })}</span>
              <span className={cn('relative size-1 rounded-full', w.items.length ? 'bg-accent' : 'bg-transparent')} />
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-3 min-h-12 px-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="flex flex-col gap-1">
            {day?.items.length ? day.items.slice(0, 4).map((it, k) => {
              const Ic = itemIcon[it.kind];
              return (
                <li key={k}><Link to={it.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm transition-colors motion-fast hover:bg-raised/60">
                  <Ic size={18} className={it.kind === 'done' ? 'text-accent' : 'text-muted'} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-ink">{it.message ? msg(it.message) : it.title}</span>
                  {it.kind !== 'done' ? <span className="shrink-0 text-muted">{f.time(it.at)}</span> : null}
                </Link></li>
              );
            }) : <li className="flex min-h-11 items-center px-2 text-sm text-muted">{t('learn.today.dayEmpty')}</li>}
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Row({ icon: Ic, title, body, to, tone }: { icon: Icon; title: string; body: string; to: string; tone?: 'accent' }) {
  return (
    <li>
      <Link to={to} className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors motion-fast hover:bg-raised/60">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tone === 'accent' ? 'bg-accent text-on-accent' : 'bg-raised text-ink shadow-card')}><Ic size={20} aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-base font-medium text-ink">{title}</span><span className="block truncate text-sm text-muted">{body}</span></span>
        <CaretRight size={16} className="shrink-0 text-subtle transition-transform motion-fast group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  );
}

function AlsoToday({ d }: { d: TodayData }) {
  const t = useT();
  const f = useFormat();
  return (
    <section aria-labelledby="also-h" className="enter glass overflow-hidden rounded-3xl border">
      <h2 id="also-h" className="px-5 pb-1 pt-4 font-sans text-sm font-normal text-muted">{t('learn.today.alsoToday')}</h2>
      <ul className="divide-y divide-line">
        {d.feedback && d.feedbackReflection ? <Row tone="accent" icon={ChatCircleText} title={t('learn.today.feedbackTitle', { mentor: d.mentorName ?? '' })} body={excerpt(d.feedback.plainText, 90)} to={`/app/journal/${d.feedbackReflection.id}`} /> : null}
        {d.next ? <ReadingRow lessonId={d.next.lesson.id} /> : null}
        {d.draft
          ? <Row icon={NotePencil} title={t('learn.today.reflectionTitle')} body={t('learn.today.draftBody', { when: f.ago(d.draft.updatedAt) })} to={`/app/journal/${d.draft.id}`} />
          : <Row icon={NotePencil} title={t('learn.today.reflectionTitle')} body={t('learn.today.reflectionShort')} to={d.next ? `/app/journal/new?lessonId=${d.next.lesson.id}` : '/app/journal/new'} />}
        {d.dueVerses > 0 ? <Row icon={Sparkle} title={t('learn.today.versesTitle')} body={t('learn.today.versesBody', { count: d.dueVerses })} to="/app/bible/memorise" /> : null}
        {d.nextMeeting ? <Row icon={UsersThree} title={d.groupName ?? t('learn.today.meetingTitle')} body={f.dateTime(d.nextMeeting.startsAt)} to={`/app/groups/${d.nextMeeting.groupId}`} /> : null}
        {d.recentMilestone ? <Row icon={Trophy} title={t(`milestones.${d.recentMilestone.key}.title`)} body={t(`milestones.${d.recentMilestone.key}.meaning`)} to="/app/journey/milestones" /> : null}
        {d.inOrg && !d.hasMentor ? <Row icon={UsersThree} title={t('learn.today.noMentorTitle')} body={t('learn.today.noMentorBody')} to="/settings" /> : null}
        {!d.inOrg ? <Row icon={UsersThree} title={t('learn.today.soloTitle')} body={t('learn.today.soloBody')} to="/app/journey" /> : null}
      </ul>
    </section>
  );
}

function ReadingRow({ lessonId }: { lessonId: string }) {
  const t = useT();
  const q = useQuery({ queryKey: ['lesson-reading', lessonId], queryFn: () => lessonsService.get(lessonId) });
  const block = q.data?.lesson.blocks.find((b) => b.type === 'scripture');
  if (!block || block.type !== 'scripture') return null;
  return <Row icon={BookOpenText} title={formatRef(block.ref)} body={t('learn.today.readingShort')} to={`/app/bible/${block.ref.book}/${block.ref.chapter}${block.ref.verseEnd ? `?v=${block.ref.verseStart}-${block.ref.verseEnd}` : ''}`} />;
}
