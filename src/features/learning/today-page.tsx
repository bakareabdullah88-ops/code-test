import { ArrowRight, BookOpenText, CalendarBlank, ChatCircleText, NotePencil, Path as PathIcon, Sparkle, UsersThree } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useSession } from '@/features/session/hooks';
import { useToday } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Card } from '@/components/ui/card/card';
import { buttonStyles } from '@/components/ui/button/button';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { ProgressThread } from '@/components/ui/progress/progress';
import { Cover } from '@/components/content/cover';
import { PathIllustration } from '@/components/icons/illustrations';
import { formatRef } from '@/lib/bible/ref';
import { lessonsService } from '@/lib/services/learning';
import { useQuery } from '@tanstack/react-query';
import { excerpt } from '@/lib/editor/text';

function greetingKey(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

function TodaySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2"><Skeleton className="h-40 w-full" /></Card>
      <Card><SkeletonText lines={3} /></Card>
      <Card><SkeletonText lines={3} /></Card>
    </div>
  );
}

export function TodayPage() {
  const t = useT();
  const f = useFormat();
  const { user } = useSession();
  const q = useToday();
  const firstName = user?.displayName.split(' ')[0] ?? '';
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t(`learn.today.greeting.${greetingKey()}`, { name: firstName })} description={f.date(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' })} />
      <QueryState query={q} skeleton={<TodaySkeleton />}>
        {(d) => {
          const lessonId = d.next?.lesson.id ?? '';
          return (
            <div className="stagger grid gap-4 md:grid-cols-2">
              {d.next ? (
                <section aria-labelledby="hero-h" className="relative isolate overflow-hidden rounded-3xl border border-line shadow-lift md:col-span-2">
                  <div className="absolute inset-0 -z-10"><Cover coverKey={d.next.pathway.coverKey} className="scale-110" /></div>
                  <div className="flex min-h-72 items-end p-3 md:min-h-80 md:p-5">
                    <div className="glass-strong flex w-full max-w-lg flex-col gap-3 rounded-2xl border p-5 md:p-6">
                      <p className="text-sm font-semibold uppercase tracking-wider text-accent-soft-ink">{t('learn.today.lessonLabel')}</p>
                      <h2 id="hero-h" className="text-h2 font-semibold tracking-tight">{d.next.lesson.title}</h2>
                      <p className="text-base text-muted">{d.next.lesson.summary}</p>
                      <p className="text-sm text-muted">{d.next.pathway.title} &middot; {t('learn.minutes', { minutes: d.next.lesson.estimatedMinutes })}</p>
                      <ProgressThread className="max-w-sm" steps={d.next.pathway.outline.flatMap((m) => m.lessons).map((l) => ({ id: l.id, label: l.title, state: l.progress === 'completed' ? 'done' : l.id === lessonId ? 'current' : 'todo', stateLabel: t(`learn.status.${l.progress === 'completed' ? 'done' : l.id === lessonId ? 'current' : 'todo'}`) }))} />
                      <div className="mt-1">
                        <Link to={`/app/pathways/${d.next.pathway.id}/lessons/${d.next.lesson.id}`} className={buttonStyles({ size: 'lg' })}>
                          {d.next.lesson.progress === 'in_progress' ? t('learn.today.continue') : t('learn.today.start')}<ArrowRight size={18} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <Card className="md:col-span-2">
                  <EmptyState illustration={<PathIllustration />} title={t(d.enrolledCount ? 'learn.today.allDoneTitle' : 'learn.today.noPathwayTitle')} description={t(d.enrolledCount ? 'learn.today.allDoneBody' : 'learn.today.noPathwayBody')} action={<Link to="/app/journey" className={buttonStyles()}>{t('learn.today.choosePathway')}</Link>} />
                </Card>
              )}

              {d.next ? <ReadingCard lessonId={lessonId} /> : null}

              <Card interactive className="flex flex-col gap-3">
                <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-soft-ink"><NotePencil size={22} aria-hidden="true" /></span><h2 className="text-h4 font-semibold text-ink">{t('learn.today.reflectionTitle')}</h2></div>
                {d.draft ? (
                  <>
                    <p className="text-base text-muted">{t('learn.today.draftBody', { when: f.ago(d.draft.updatedAt) })}</p>
                    <p className="line-clamp-2 font-serif text-base italic text-muted">{excerpt(d.draft.plainText, 140)}</p>
                    <Link to={`/app/journal/${d.draft.id}`} className={buttonStyles({ variant: 'secondary' })}>{t('learn.today.continueWriting')}</Link>
                  </>
                ) : (
                  <>
                    <p className="text-base text-muted">{t('learn.today.reflectionBody')}</p>
                    <Link to={d.next ? `/app/journal/new?lessonId=${d.next.lesson.id}` : '/app/journal/new'} className={buttonStyles({ variant: 'secondary' })}>{t('learn.today.newReflection')}</Link>
                  </>
                )}
              </Card>

              {d.feedback && d.feedbackReflection ? (
                <Card interactive className="flex flex-col gap-2 border-accent">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-soft-ink"><ChatCircleText size={22} aria-hidden="true" /></span><h2 className="text-h4 font-semibold text-ink">{t('learn.today.feedbackTitle', { mentor: d.mentorName ?? '' })}</h2></div>
                  <p className="line-clamp-3 font-serif text-base text-muted">{excerpt(d.feedback.plainText, 220)}</p>
                  <Link to={`/app/journal/${d.feedbackReflection.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent-soft-ink underline underline-offset-4">{t('learn.today.readReply')}<ArrowRight size={14} aria-hidden="true" /></Link>
                </Card>
              ) : null}

              {d.dueVerses > 0 ? (
                <Card interactive className="flex flex-col gap-3">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-soft-ink"><Sparkle size={22} aria-hidden="true" /></span><h2 className="text-h4 font-semibold text-ink">{t('learn.today.versesTitle')}</h2></div>
                  <p className="text-base text-muted">{t('learn.today.versesBody', { count: d.dueVerses })}</p>
                  <Link to="/app/bible/memorise" className={buttonStyles({ variant: 'secondary' })}>{t('learn.today.reviewVerses')}</Link>
                </Card>
              ) : null}

              {d.nextMeeting ? (
                <Card interactive className="flex flex-col gap-2">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-soft-ink"><CalendarBlank size={22} aria-hidden="true" /></span><h2 className="text-h4 font-semibold text-ink">{t('learn.today.meetingTitle')}</h2></div>
                  <p className="text-base text-ink">{d.groupName}</p>
                  <p className="text-sm text-muted">{f.dateTime(d.nextMeeting.startsAt)}</p>
                  <Link to={`/app/groups/${d.nextMeeting.groupId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent-soft-ink underline underline-offset-4">{t('learn.today.openGroup')}</Link>
                </Card>
              ) : null}

              {d.recentMilestone ? (
                <Card className="flex flex-col gap-2 bg-accent-soft">
                  <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-soft-ink"><PathIcon size={22} aria-hidden="true" /></span><h2 className="text-h4 font-semibold text-ink">{t(`milestones.${d.recentMilestone.key}.title`)}</h2></div>
                  <p className="text-base text-muted">{t(`milestones.${d.recentMilestone.key}.meaning`)}</p>
                  <Link to="/app/journey/milestones" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-soft-ink underline underline-offset-4">{t('learn.today.seeMilestones')}</Link>
                </Card>
              ) : null}

              {d.inOrg && !d.hasMentor ? (
                <Card interactive className="flex flex-col gap-2"><div className="flex items-center gap-2"><UsersThree size={20} aria-hidden="true" /><h2 className="text-h4 font-semibold">{t('learn.today.noMentorTitle')}</h2></div><p className="text-base text-muted">{t('learn.today.noMentorBody')}</p></Card>
              ) : null}
              {!d.inOrg ? (
                <Card interactive className="flex flex-col gap-2"><div className="flex items-center gap-2"><UsersThree size={20} aria-hidden="true" /><h2 className="text-h4 font-semibold">{t('learn.today.soloTitle')}</h2></div><p className="text-base text-muted">{t('learn.today.soloBody')}</p></Card>
              ) : null}
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}

function ReadingCard({ lessonId }: { lessonId: string }) {
  const t = useT();
  const q = useQuery({ queryKey: ['lesson-reading', lessonId], queryFn: () => lessonsService.get(lessonId) });
  const block = q.data?.lesson.blocks.find((b) => b.type === 'scripture');
  if (!block || block.type !== 'scripture') return null;
  return (
    <Card interactive className="flex flex-col gap-3">
      <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-soft-ink"><BookOpenText size={22} aria-hidden="true" /></span><h2 className="text-h4 font-semibold text-ink">{t('learn.today.readingTitle')}</h2></div>
      <p className="font-serif text-lg text-ink">{formatRef(block.ref)}</p>
      <p className="text-base text-muted">{t('learn.today.readingBody')}</p>
      <Link to={`/app/bible/${block.ref.book}/${block.ref.chapter}${block.ref.verseEnd ? `?v=${block.ref.verseStart}-${block.ref.verseEnd}` : ''}`} className={buttonStyles({ variant: 'secondary' })}>{t('learn.today.openReading')}</Link>
    </Card>
  );
}
