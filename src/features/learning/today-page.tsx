import { useRef } from 'react';
import { motion } from 'motion/react';
import type { Icon } from '@phosphor-icons/react';
import { ArrowRight, BookOpenText, CalendarBlank, CaretLeft, CaretRight, CheckCircle, Compass, FileText, HandsPraying, NotePencil, Path as PathIcon, Sparkle, Signpost, UsersThree } from '@phosphor-icons/react';
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
import { Skeleton } from '@/components/ui/skeleton/skeleton';

type TodayData = NonNullable<ReturnType<typeof useToday>['data']>;

/* Soft tints rotate across cards so neighbouring items read as distinct without extra colour roles. */
const tiles = [
  { bg: 'bg-tint-3', fg: 'text-tag-blue', line: 'border-tint-line-3' },
  { bg: 'bg-tint-1', fg: 'text-tag-amber', line: 'border-tint-line-1' },
  { bg: 'bg-tint-2', fg: 'text-tag-green', line: 'border-tint-line-2' },
  { bg: 'bg-tint-5', fg: 'text-tag-violet', line: 'border-tint-line-5' },
  { bg: 'bg-tint-6', fg: 'text-tag-rose', line: 'border-tint-line-6' },
] as const;
const tileAt = (i: number) => tiles[i % tiles.length] ?? tiles[0];
const levelIcon: Record<string, Icon> = { new_to_faith: Compass, growing: PathIcon, leading: Signpost };
const levelTag: Record<string, string> = { new_to_faith: 'bg-tint-1 text-tag-amber', growing: 'bg-tint-3 text-tag-blue', leading: 'bg-tint-2 text-tag-green' };

function TodaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-4 overflow-hidden">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-60 w-72 shrink-0 rounded-2xl" />)}</div>
        <Skeleton className="mt-4 h-7 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
      </div>
      <div className="flex flex-col gap-4"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
    </div>
  );
}

export function TodayPage() {
  const t = useT();
  const { user } = useSession();
  const q = useToday();
  return (
    <div className="flex flex-col gap-6">
      <div className="lg:hidden">
        <p className="text-sm text-muted">{t('shell.hello')}</p>
        <p className="text-2xl font-semibold tracking-tight">{user?.displayName}</p>
      </div>
      <h1 className="sr-only">{t('learn.today.title')}</h1>
      <QueryState query={q} skeleton={<TodaySkeleton />}>
        {(d) => (
          <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-1 items-start gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-10">
              <motion.div variants={staggerChild}><Schedule d={d} /></motion.div>
              <motion.div variants={staggerChild}><RecentReflections d={d} /></motion.div>
              <motion.div variants={staggerChild}><MyPathways d={d} /></motion.div>
            </div>
            <div className="flex flex-col gap-10">
              <motion.div variants={staggerChild}><Promo /></motion.div>
              <motion.div variants={staggerChild}><Activity d={d} /></motion.div>
              <motion.div variants={staggerChild}><Upcoming d={d} /></motion.div>
            </div>
          </motion.div>
        )}
      </QueryState>
    </div>
  );
}

function SectionHead({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id={id} className="text-2xl">{title}</h2>
      {children}
    </div>
  );
}

function Schedule({ d }: { d: TodayData }) {
  const t = useT();
  const qc = useQueryClient();
  const row = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => row.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  return (
    <section aria-labelledby="sched-h">
      <SectionHead id="sched-h" title={t('learn.today.schedule')}>
        {d.pathways.length > 1 ? (
          <div className="hidden gap-1.5 sm:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label={t('learn.today.scrollBack')} className="grid size-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors motion-fast hover:text-ink"><CaretLeft size={16} aria-hidden="true" /></button>
            <button type="button" onClick={() => scroll(1)} aria-label={t('learn.today.scrollOn')} className="grid size-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors motion-fast hover:text-ink"><CaretRight size={16} aria-hidden="true" /></button>
          </div>
        ) : null}
      </SectionHead>
      {d.pathways.length ? (
        <ul ref={row} className="-mx-4 flex snap-x snap-mandatory scroll-ps-4 gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:scroll-ps-0 lg:px-0">
          {d.pathways.map((p, i) => {
            const tile = tileAt(i);
            const Ic = levelIcon[p.level] ?? BookOpenText;
            const pct = p.total ? Math.round((p.completed / p.total) * 100) : 0;
            const href = p.current ? `/app/pathways/${p.id}/lessons/${p.current.id}` : `/app/pathways/${p.id}`;
            const warm = () => { if (p.current) void qc.prefetchQuery({ queryKey: qk.lesson(p.current.id), queryFn: () => lessonsService.get(p.current?.id ?? '') }); };
            return (
              <li key={p.id} className="w-72 shrink-0 snap-start sm:w-80">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={spring} className="h-full">
                  <Link to={href} onPointerDown={warm} onFocus={warm} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow motion-base hover:shadow-lift">
                    <span className={cn('grid size-14 place-items-center rounded-2xl', tile.bg, tile.fg)} aria-hidden="true"><Ic size={30} weight="duotone" /></span>
                    <span className="mt-5 line-clamp-1 text-lg font-medium text-ink">{p.title}</span>
                    <span className="mt-1 flex items-center justify-between gap-3 text-sm text-muted">
                      <span className="truncate">{p.author}</span>
                      <span className="shrink-0">{t.rich('learn.today.lessonOf', { n: Math.min(p.completed + 1, p.total), total: p.total, b: (c) => <span className="font-medium text-accent">{c}</span> })}</span>
                    </span>
                    <span className="mt-6 flex items-center gap-3">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label={p.title} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <motion.span className="block h-full rounded-full bg-accent-bright" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ ...spring, delay: 0.2 }} />
                      </span>
                      <span className="text-sm font-medium tabular-nums text-ink">{pct}%</span>
                    </span>
                    <span className="mt-3 truncate text-sm text-muted">{p.current ? t.rich('learn.today.nextLesson', { title: p.current.title, b: (c) => <span className="font-medium text-ink">{c}</span> }) : t('learn.today.pathwayDone')}</span>
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <p className="text-lg font-medium">{t(d.enrolledCount ? 'learn.today.allDoneTitle' : 'learn.today.noPathwayTitle')}</p>
          <p className="max-w-md text-base text-muted">{t(d.enrolledCount ? 'learn.today.allDoneBody' : 'learn.today.noPathwayBody')}</p>
          <Link to="/app/journey" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-solid px-4 text-base font-medium text-on-solid">{t('learn.today.choosePathway')}<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      )}
    </section>
  );
}

function RecentReflections({ d }: { d: TodayData }) {
  const t = useT();
  const f = useFormat();
  return (
    <section aria-labelledby="refl-h">
      <SectionHead id="refl-h" title={t('learn.today.recentReflections')}>
        <Link to="/app/journal" className="text-sm font-medium text-accent hover:underline">{t('learn.today.seeAll')}</Link>
      </SectionHead>
      {d.recentReflections.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {d.recentReflections.map((r, i) => {
            const tile = i % 2 ? tiles[1] : tiles[3];
            return (
              <li key={r.id}>
                <Link to={`/app/journal/${r.id}`} className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow motion-base hover:shadow-lift">
                  <span className={cn('relative block h-32 overflow-hidden border-b px-5 pt-4', tile.bg, tile.line)}>
                    <span className="line-clamp-2 font-serif text-sm leading-relaxed text-muted transition-transform motion-base group-hover:-translate-y-1">{excerpt(r.plainText, 220) || t('learn.today.emptyDraft')}</span>
                    <span className={cn('absolute bottom-3 start-5 grid size-11 place-items-center rounded-xl bg-surface shadow-card', tile.fg)} aria-hidden="true"><NotePencil size={22} weight="duotone" /></span>
                  </span>
                  <span className="flex items-end justify-between gap-3 p-5">
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-ink">{r.title ?? t('learn.today.freeReflection')}</span>
                      <span className="block text-sm text-subtle">{t('learn.today.editedAgo', { when: f.ago(r.updatedAt) })}</span>
                    </span>
                    <span className={cn('shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium', r.status === 'draft' ? 'bg-tint-1 text-tag-amber' : 'bg-tint-2 text-tag-green')}>{t(r.status === 'draft' ? 'learn.today.statusDraft' : 'learn.today.statusShared')}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line-strong p-6 text-base text-muted">{t('learn.today.noReflections')}</p>
      )}
    </section>
  );
}

function MyPathways({ d }: { d: TodayData }) {
  const t = useT();
  if (!d.pathways.length) return null;
  return (
    <section aria-labelledby="paths-h">
      <SectionHead id="paths-h" title={t('learn.today.myPathways')}>
        <Link to="/app/journey" className="text-sm font-medium text-accent hover:underline">{t('learn.today.browse')}</Link>
      </SectionHead>
      <ul className="grid gap-4 sm:grid-cols-2">
        {d.pathways.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <div className="p-5">
              <p className="text-lg font-medium text-ink">{p.title}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="truncate text-sm text-muted">{p.author}</span>
                <span className={cn('shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium', levelTag[p.level] ?? 'bg-tint-3 text-tag-blue')}>{t(`learn.level.${p.level}`)}</span>
              </div>
            </div>
            <Link to={`/app/pathways/${p.id}`} className="group flex min-h-12 items-center justify-between border-t border-line bg-sunken px-5 text-sm text-muted transition-colors motion-fast hover:text-ink">
              {t('learn.today.viewDetails')}<ArrowRight size={16} className="transition-transform motion-fast group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Promo() {
  const t = useT();
  return (
    <Link to="/app/companion" className="promo group relative flex min-h-32 items-center overflow-hidden rounded-2xl p-6 shadow-card">
      <span className="relative z-10 flex max-w-56 flex-col gap-1.5">
        <span className="inline-flex items-center gap-2 text-lg font-semibold">{t('learn.today.promoTitle')}<span className="rounded-md bg-surface/25 px-1.5 text-xs font-medium">{t('learn.today.aiTag')}</span></span>
        <span className="text-sm leading-snug opacity-95">{t('learn.today.promoBody')}</span>
      </span>
      <motion.span aria-hidden="true" className="absolute -end-3 -top-3 grid size-32 place-items-center rounded-full bg-surface/15" animate={{ rotate: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <span className="grid size-20 place-items-center rounded-full bg-surface/20"><Sparkle size={40} weight="fill" /></span>
      </motion.span>
    </Link>
  );
}

const activityStyle = (type: string): { tint: string; line: string; fg: string; icon: Icon } => {
  if (type === 'feedback_received' || type === 'milestone_awarded' || type === 'goal_completed' || type === 'plan_completed') return { tint: 'bg-tint-4', line: 'border-tint-line-4', fg: 'text-tag-green', icon: CheckCircle };
  if (type === 'reflection_submitted' || type === 'lesson_completed' || type === 'pathway_started') return { tint: 'bg-tint-5', line: 'border-tint-line-5', fg: 'text-tag-violet', icon: FileText };
  if (type === 'prayer_answered') return { tint: 'bg-tint-1', line: 'border-tint-line-1', fg: 'text-tag-amber', icon: HandsPraying };
  return { tint: 'bg-tint-6', line: 'border-tint-line-6', fg: 'text-tag-rose', icon: UsersThree };
};

function Activity({ d }: { d: TodayData }) {
  const t = useT();
  const f = useFormat();
  const msg = useMsg();
  return (
    <section aria-labelledby="act-h">
      <SectionHead id="act-h" title={t('learn.today.recentActivity')} />
      {d.activity.length ? (
        <ul className="flex flex-col gap-3">
          {d.activity.map((a) => {
            const s = activityStyle(a.type);
            return (
              <li key={a.id}>
                <Link to="/app/journey/timeline" className={cn('flex gap-3 rounded-2xl border p-4 transition-shadow motion-base hover:shadow-card', s.tint, s.line)}>
                  <s.icon size={22} className={cn('mt-0.5 shrink-0', s.fg)} aria-hidden="true" />
                  <span className="min-w-0"><span className="block text-base font-medium leading-snug text-ink">{msg(a.summary)}</span><span className="mt-1.5 block text-sm text-muted">{f.ago(a.at)}</span></span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="text-base text-muted">{t('learn.today.noActivity')}</p>}
    </section>
  );
}

function Upcoming({ d }: { d: TodayData }) {
  const t = useT();
  const f = useFormat();
  return (
    <section aria-labelledby="up-h">
      <SectionHead id="up-h" title={t('learn.today.upcoming')} />
      {d.upcoming.length ? (
        <ul className="flex flex-col gap-3">
          {d.upcoming.map((u) => {
            const days = (new Date(u.at).getTime() - Date.now()) / 86_400_000;
            const tone = days <= 1 ? 'text-danger' : days <= 3 ? 'text-tag-amber' : 'text-success';
            return (
              <li key={u.id}>
                <Link to={u.href} className="block rounded-2xl border border-line bg-surface p-4 shadow-card transition-shadow motion-base hover:shadow-lift">
                  <span className="block text-base font-medium text-ink">{u.title}</span>
                  <span className="mt-1 block truncate text-sm text-muted">{u.detail ?? t(u.kind === 'meeting' ? 'learn.today.kindMeeting' : 'learn.today.kindEvent')}</span>
                  <span className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-ink"><CalendarBlank size={16} aria-hidden="true" />{f.dateTime(u.at)}</span>
                    <span className={cn('font-medium', tone)}>{f.ago(u.at)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="text-base text-muted">{t('learn.today.noUpcoming')}</p>}
    </section>
  );
}
