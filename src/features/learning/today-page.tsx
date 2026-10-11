import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CaretRight, Clock, Play, Sparkle } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useMsg, useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { cn } from '@/lib/cn';
import { spring, staggerChild, staggerParent } from '@/lib/motion';
import { excerpt } from '@/lib/editor/text';
import { lessonsService } from '@/lib/services/learning';
import { qk } from '@/lib/query';
import { useSession } from '@/features/session/hooks';
import { useToday } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { ProgressRing } from '@/components/ui/progress/progress';

type TodayData = NonNullable<ReturnType<typeof useToday>['data']>;

function greetingKey(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

const pathwayPct = (d: TodayData) => {
  const lessons = d.next?.pathway.outline.flatMap((m) => m.lessons) ?? [];
  return lessons.length ? (lessons.filter((l) => l.progress === 'completed').length / lessons.length) * 100 : 0;
};

function TodaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col"><Skeleton className="mx-4 h-14 rounded-t-3xl" /><Skeleton className="h-80 rounded-3xl" /></div>
      <div className="flex flex-col gap-6"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-48 rounded-3xl" /></div>
    </div>
  );
}

export function TodayPage() {
  const t = useT();
  const f = useFormat();
  const { user } = useSession();
  const q = useToday();
  const now = new Date().toISOString();
  return (
    <div className="flex flex-col gap-8 pb-28 lg:pb-24">
      <header className="flex items-start justify-between gap-4 pt-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <p className="text-xs font-medium text-muted">{t(`learn.today.greeting.${greetingKey()}`, { name: user?.displayName.split(' ')[0] ?? '' })}</p>
          <h1 className="mt-1 text-4xl text-ink">{t('learn.today.title')}</h1>
          <p className="text-4xl font-normal leading-tight tracking-tight text-subtle">{f.date(now, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        </motion.div>
        {q.data?.next ? <ProgressRing value={pathwayPct(q.data)} label={t('learn.today.ringLabel', { pathway: q.data.next.pathway.title })} caption={t('learn.today.ringCaption')} /> : null}
      </header>

      <QueryState query={q} skeleton={<TodaySkeleton />}>
        {(d) => (
          <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <motion.div variants={staggerChild}><FocusStack d={d} /></motion.div>
            <div className="flex flex-col gap-6">
              <motion.div variants={staggerChild}><WeekStrip week={d.week} /></motion.div>
              <motion.div variants={staggerChild}><Quiet d={d} /></motion.div>
            </div>
          </motion.div>
        )}
      </QueryState>

      <AskPill />
    </div>
  );
}

function FocusStack({ d }: { d: TodayData }) {
  const t = useT();
  const qc = useQueryClient();
  if (!d.next) {
    return (
      <section aria-labelledby="focus-h" className="glass-strong flex min-h-80 flex-col rounded-3xl border p-6 shadow-lift md:p-8">
        <p className="text-xs font-medium text-muted">{t('learn.today.focus')}</p>
        <h2 id="focus-h" className="mt-8 text-3xl">{t(d.enrolledCount ? 'learn.today.allDoneTitle' : 'learn.today.noPathwayTitle')}</h2>
        <p className="mt-3 max-w-md text-base text-muted">{t(d.enrolledCount ? 'learn.today.allDoneBody' : 'learn.today.noPathwayBody')}</p>
        <div className="mt-auto pt-8"><Pill to="/app/journey" label={t('learn.today.choosePathway')} /></div>
      </section>
    );
  }
  const { pathway, lesson } = d.next;
  const href = `/app/pathways/${pathway.id}/lessons/${lesson.id}`;
  // Warm the lesson before navigation so the lesson screen can render its header straight away.
  const prefetch = () => void qc.prefetchQuery({ queryKey: qk.lesson(lesson.id), queryFn: () => lessonsService.get(lesson.id) });
  return (
    <section aria-labelledby="focus-h" className="relative">
      {d.upNext ? (
        <Link to={`/app/pathways/${pathway.id}/lessons/${d.upNext.id}`} className="mx-4 -mb-7 flex min-h-11 items-start gap-3 rounded-t-3xl bg-raised/55 px-5 pb-9 pt-3.5 text-sm shadow-card transition-colors motion-fast hover:bg-raised/80 md:mx-6">
          <span className="text-muted">{t('learn.today.upNext')}</span>
          <span className="min-w-0 flex-1 truncate font-medium text-ink">{d.upNext.title}</span>
        </Link>
      ) : null}
      <motion.div layoutId={`lesson-card-${lesson.id}`} whileTap={{ scale: 0.98 }} whileHover={{ y: -2 }} transition={spring} className="glass-strong relative flex min-h-80 flex-col rounded-3xl border bg-raised/90 p-6 shadow-lift md:min-h-96 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted">{t('learn.today.focus')}</p>
          {d.mentorName ? <Avatar name={d.mentorName} size="sm" /> : null}
        </div>
        <h2 id="focus-h" className="mt-8 text-3xl text-ink">{lesson.title}</h2>
        <p className="mt-3 line-clamp-3 max-w-md text-base text-muted">{lesson.summary}</p>
        <p className="mt-2 text-xs text-subtle">{pathway.title}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-8">
          <Pill to={href} play onIntent={prefetch} label={lesson.progress === 'in_progress' ? t('learn.today.continue') : t('learn.today.start')} />
          <span className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted"><Clock size={16} aria-hidden="true" />{t('learn.today.minShort', { minutes: lesson.estimatedMinutes })}</span>
        </div>
      </motion.div>
    </section>
  );
}

function Pill({ to, label, play, onIntent }: { to: string; label: string; play?: boolean; onIntent?: () => void }) {
  return (
    <Link to={to} onPointerDown={onIntent} onFocus={onIntent} className="group inline-flex min-h-12 shrink-0 items-center gap-3 whitespace-nowrap rounded-full bg-solid pe-6 ps-1.5 text-base font-medium text-on-solid shadow-lift transition-transform motion-fast active:scale-95">
      <span className="grid size-9 place-items-center rounded-full bg-accent-bright text-on-accent-bright transition-transform motion-base group-hover:scale-105" aria-hidden="true">{play ? <Play size={15} weight="fill" /> : <CaretRight size={15} weight="bold" />}</span>
      {label}
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
  return (
    <section aria-labelledby="week-h" className="glass rounded-3xl border p-4 shadow-card md:p-5">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="week-h" className="text-xs font-medium tracking-normal text-muted">{t('learn.today.thisWeek')}</h2>
        {first && last ? <p className="text-xs font-medium text-ink">{f.date(first, { month: 'short', day: 'numeric' })} - {f.date(last, { day: 'numeric' })}</p> : null}
      </div>
      <div role="group" aria-label={t('learn.today.thisWeek')} className="mt-3 grid grid-cols-7">
        {week.map((w, i) => {
          const on = i === sel;
          return (
            <button key={w.date} type="button" aria-pressed={on} aria-label={`${f.date(w.date, { weekday: 'long', month: 'long', day: 'numeric' })}. ${w.reflected ? t('learn.today.reflected') : t('learn.today.notReflected')}`} onClick={() => setSel(i)} className="relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-full">
              {on ? <motion.span layoutId="week-pill" className="absolute inset-x-0.5 inset-y-0 rounded-full bg-raised shadow-lift" transition={spring} /> : null}
              <span className={cn('relative text-xs', i === todayIdx ? 'font-semibold text-accent-soft-ink' : 'text-muted')}>{f.date(w.date, { weekday: 'narrow' })}</span>
              <span className="relative text-lg font-medium tabular-nums text-ink">{f.date(w.date, { day: 'numeric' })}</span>
              <span className={cn('relative size-1 rounded-full', w.reflected ? 'bg-accent-bright' : 'bg-transparent')} />
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-2 min-h-11 px-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={sel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col">
            {day?.items.length ? day.items.slice(0, 3).map((it, k) => (
              <li key={k}><Link to={it.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm transition-colors motion-fast hover:bg-raised/60">
                <span className="min-w-0 flex-1 truncate text-ink">{it.message ? msg(it.message) : it.title}</span>
                {it.kind !== 'done' ? <span className="shrink-0 text-muted">{f.time(it.at)}</span> : null}
              </Link></li>
            )) : <li className="flex min-h-11 items-center px-2 text-sm text-subtle">{t('learn.today.dayEmpty')}</li>}
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}

function QuietRow({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <li>
      <Link to={to} className="group flex min-h-14 items-center gap-3 px-5 py-3 transition-colors motion-fast hover:bg-raised/50">
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-ink">{title}</span><span className="block truncate text-xs text-muted">{body}</span></span>
        <CaretRight size={14} className="shrink-0 text-subtle transition-transform motion-fast group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  );
}

function Quiet({ d }: { d: TodayData }) {
  const t = useT();
  const f = useFormat();
  return (
    <section aria-labelledby="quiet-h" className="glass overflow-hidden rounded-3xl border shadow-card">
      <h2 id="quiet-h" className="px-5 pb-1 pt-4 text-xs font-medium tracking-normal text-muted">{t('learn.today.alsoToday')}</h2>
      <ul className="divide-y divide-line/60">
        {d.feedback && d.feedbackReflection ? <QuietRow title={t('learn.today.feedbackTitle', { mentor: d.mentorName ?? '' })} body={excerpt(d.feedback.plainText, 90)} to={`/app/journal/${d.feedbackReflection.id}`} /> : null}
        {d.draft
          ? <QuietRow title={t('learn.today.reflectionTitle')} body={t('learn.today.draftBody', { when: f.ago(d.draft.updatedAt) })} to={`/app/journal/${d.draft.id}`} />
          : <QuietRow title={t('learn.today.reflectionTitle')} body={t('learn.today.reflectionShort')} to={d.next ? `/app/journal/new?lessonId=${d.next.lesson.id}` : '/app/journal/new'} />}
        {d.dueVerses > 0 ? <QuietRow title={t('learn.today.versesTitle')} body={t('learn.today.versesBody', { count: d.dueVerses })} to="/app/bible/memorise" /> : null}
        {d.nextMeeting ? <QuietRow title={d.groupName ?? t('learn.today.meetingTitle')} body={f.dateTime(d.nextMeeting.startsAt)} to={`/app/groups/${d.nextMeeting.groupId}`} /> : null}
        {d.recentMilestone ? <QuietRow title={t(`milestones.${d.recentMilestone.key}.title`)} body={t(`milestones.${d.recentMilestone.key}.meaning`)} to="/app/journey/milestones" /> : null}
        {d.inOrg && !d.hasMentor ? <QuietRow title={t('learn.today.noMentorTitle')} body={t('learn.today.noMentorBody')} to="/settings" /> : null}
        {!d.inOrg ? <QuietRow title={t('learn.today.soloTitle')} body={t('learn.today.soloBody')} to="/app/journey" /> : null}
      </ul>
    </section>
  );
}

/** Floating AI entry point. Fixed above the mobile tab bar; centred in the content column on desktop. */
function AskPill() {
  const t = useT();
  // Portalled so the route's entrance transform cannot turn `fixed` into "fixed to the page wrapper".
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-4 lg:bottom-6 lg:ps-64">
      <Link to="/app/companion" className="glass-strong group pointer-events-auto inline-flex min-h-12 w-full max-w-sm items-center gap-3 rounded-full border ps-4 pe-2 text-sm text-muted shadow-lift transition-transform motion-base hover:-translate-y-0.5 hover:text-ink">
        <Sparkle size={18} weight="fill" className="shrink-0 text-accent-bright" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{t('learn.today.askPassage')}</span>
        <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted">{t('learn.today.aiTag')}</span>
      </Link>
    </div>,
    document.body,
  );
}
