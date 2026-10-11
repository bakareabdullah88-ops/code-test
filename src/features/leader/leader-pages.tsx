import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, CalendarBlank, Plus, PushPin, Lock, Trash, Warning } from '@phosphor-icons/react';
import type { AgendaItem } from '@/types';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useQuery } from '@tanstack/react-query';
import { pathwaysService } from '@/lib/services/learning';
import { useCandidates, useCreateMeeting, useDismissReport, useGroupReports, useGroups, useGroupSummary, useMeeting, useMeetings, useModerate, useRemoveMember, useAddMembers, useSetAttendance, useUpdateMeeting, useGroup, useCreateThread } from '@/features/community/hooks';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Notice } from '@/components/patterns/notice/notice';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { RichView } from '@/components/content/rich-view';
import { RichEditor } from '@/components/content/rich-editor';
import { emptyDoc } from '@/lib/editor/text';
import { PathIllustration } from '@/components/icons/illustrations';
import { useToast } from '@/components/ui/toast/toast';
import { Cover } from '@/components/content/cover';
import type { RichDoc } from '@/types';

/** Reads the chosen group from the address, defaulting to the first group this person leads. */
function useLedGroup() {
  const q = useGroups('led');
  const [params, setParams] = useSearchParams();
  const id = params.get('group') ?? q.data?.[0]?.id ?? '';
  return { q, id, set: (g: string) => setParams({ group: g }) };
}

function GroupPicker({ q, id, set }: ReturnType<typeof useLedGroup>) {
  const t = useT();
  if (!q.data || q.data.length < 2) return null;
  return <Field className="max-w-xs" label={t('leader.group')}>{(p) => <Select {...p} value={id} onValueChange={set} options={q.data?.map((g) => ({ value: g.id, label: g.name })) ?? []} />}</Field>;
}

const empty = (t: ReturnType<typeof useT>) => <EmptyState illustration={<PathIllustration />} title={t('leader.noGroupsTitle')} description={t('leader.noGroupsBody')} />;

export function LeaderHome() {
  const t = useT();
  const f = useFormat();
  const q = useGroups('led');
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('leader.title')} description={t('leader.description')} />
      <QueryState query={q} skeleton={<div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>}>
        {(list) => list.length ? (
          <ul className="stagger grid gap-4 sm:grid-cols-2">{list.map((g, i) => (
            <li key={g.id}><Link to={`/leader/groups/${g.id}`} className="hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
              <div className="h-28"><Cover coverKey={['table', 'dawn', 'path', 'lamp'][i % 4] ?? 'dawn'} /></div>
              <div className="flex flex-col gap-1 p-4"><h2 className="font-sans text-h4 font-semibold">{g.name}</h2><p className="flex items-center gap-2 text-sm text-muted"><CalendarBlank size={16} aria-hidden="true" />{g.nextMeeting ? f.dateTime(g.nextMeeting.startsAt) : t('community.noMeeting')}</p><p className="text-sm text-muted">{t('community.members', { count: g.memberCount })}</p></div>
            </Link></li>
          ))}</ul>
        ) : empty(t)}
      </QueryState>
    </div>
  );
}

export function SchedulePage() {
  const t = useT();
  const f = useFormat();
  const led = useLedGroup();
  const meetings = useMeetings(led.id);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('leader.scheduleTitle')} description={t('leader.scheduleBody')} actions={led.id ? <Button onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('leader.newMeeting')}</Button> : undefined} />
      <GroupPicker {...led} />
      {!led.id && !led.q.isLoading ? empty(t) : (
        <QueryState query={meetings} skeleton={<SkeletonRow />}>
          {(list) => {
            const upcoming = list.filter((m) => m.status === 'scheduled' && m.startsAt > new Date().toISOString());
            const past = list.filter((m) => !upcoming.includes(m)).reverse();
            return (
              <div className="flex flex-col gap-8">
                <section aria-labelledby="up-h" className="flex flex-col gap-3"><h2 id="up-h" className="text-h3 font-semibold">{t('leader.upcoming')}</h2>
                  {upcoming.length ? <ul className="stagger flex flex-col gap-3">{upcoming.map((m) => <li key={m.id}><MeetingRow id={m.id} groupId={led.id} startsAt={m.startsAt} location={m.location} f={f} t={t} /></li>)}</ul> : <p className="text-base text-muted">{t('leader.noUpcoming')}</p>}</section>
                <section aria-labelledby="past-h" className="flex flex-col gap-3"><h2 id="past-h" className="text-h3 font-semibold">{t('leader.past')}</h2>
                  {past.length ? <ul className="flex flex-col gap-3">{past.slice(0, 8).map((m) => <li key={m.id}><MeetingRow id={m.id} groupId={led.id} startsAt={m.startsAt} location={m.location} held={m.status === 'held' ? m.attendance.filter((a) => a.present).length : null} f={f} t={t} /></li>)}</ul> : <p className="text-base text-muted">{t('leader.noPast')}</p>}</section>
              </div>
            );
          }}
        </QueryState>
      )}
      <NewMeeting open={open} onOpenChange={setOpen} groupId={led.id} />
    </div>
  );
}

function MeetingRow({ id, groupId, startsAt, location, held, f, t }: { id: string; groupId: string; startsAt: string; location: string | null; held?: number | null; f: ReturnType<typeof useFormat>; t: ReturnType<typeof useT> }) {
  return (
    <Link to={`/leader/groups/${groupId}/meetings/${id}`} className="hover-lift flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent-soft-ink"><CalendarBlank size={24} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block font-medium">{f.dateTime(startsAt)}</span><span className="block truncate text-sm text-muted">{location ?? t('leader.noLocation')}</span></span>
      {held !== undefined && held !== null ? <Badge tone="success">{t('leader.attended', { count: held })}</Badge> : null}
    </Link>
  );
}

function NewMeeting({ open, onOpenChange, groupId }: { open: boolean; onOpenChange: (o: boolean) => void; groupId: string }) {
  const t = useT();
  const toast = useToast();
  const g = useGroup(groupId);
  const create = useCreateMeeting();
  const [when, setWhen] = useState('');
  const [loc, setLoc] = useState('');
  const [weeks, setWeeks] = useState('0');
  const [lesson, setLesson] = useState('');
  const pathwayId = g.data?.group.pathwayId ?? null;
  const lessons = useQuery({ queryKey: ['pathway-lessons', pathwayId], queryFn: () => pathwaysService.get(pathwayId ?? ''), enabled: !!pathwayId && open });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('leader.newMeeting')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} disabled={!when} onClick={() => create.mutate({ groupId, input: { startsAt: new Date(when).toISOString(), durationMin: 90, location: loc || null, lessonId: lesson && lesson !== 'none' ? lesson : null, repeatWeeks: Number(weeks) } }, { onSuccess: () => { onOpenChange(false); toast.show({ title: t('leader.meetingCreated'), tone: 'success' }); } })}>{t('leader.schedule')}</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label={t('leader.when')} required>{(p) => <Input {...p} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>
          <Field label={t('leader.where')}>{(p) => <Input {...p} value={loc} onChange={(e) => setLoc(e.target.value)} />}</Field>
          {lessons.data ? <Field label={t('leader.lessonLink')}>{(p) => <Select {...p} value={lesson} onValueChange={setLesson} placeholder={t('leader.noLesson')} options={[{ value: 'none', label: t('leader.noLesson') }, ...lessons.data!.outline.flatMap((m) => m.lessons).map((l) => ({ value: l.id, label: l.title }))]} />}</Field> : null}
          <Field label={t('leader.repeat')} description={t('leader.repeatHelp')}>{(p) => <Select {...p} value={weeks} onValueChange={setWeeks} options={[{ value: '0', label: t('leader.once') }, { value: '3', label: t('leader.weeks', { count: 4 }) }, { value: '7', label: t('leader.weeks', { count: 8 }) }]} />}</Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MeetingPrepPage() {
  const { groupId = '', meetingId = '' } = useParams();
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const q = useMeeting(meetingId);
  const update = useUpdateMeeting();
  const attend = useSetAttendance();
  const [agenda, setAgenda] = useState<AgendaItem[] | null>(null);
  const [present, setPresent] = useState<Record<string, boolean> | null>(null);
  const [notes, setNotes] = useState<RichDoc>(emptyDoc());
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to={`/leader/groups/${groupId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('leader.backToGroup')}</Link>
      <QueryState query={q} skeleton={<Skeleton className="h-56 w-full" />}>
        {({ meeting: m, group, lesson, people }) => {
          const list = agenda ?? m.agenda;
          const att = present ?? Object.fromEntries(m.attendance.map((a) => [a.userId, a.present]));
          const past = m.startsAt < new Date().toISOString();
          return (
            <>
              <PageHeader title={group.name} description={f.dateTime(m.startsAt)} actions={<Badge tone={m.status === 'held' ? 'success' : 'neutral'}>{t(`mentor.status.${m.status === 'scheduled' ? 'planned' : m.status}`)}</Badge>} />
              {lesson ? <Card className="flex items-center justify-between gap-3"><div><p className="text-sm text-muted">{t('leader.studying')}</p><p className="font-medium">{lesson.title}</p><p className="text-sm text-muted">{lesson.summary}</p></div><Link to={`/app/pathways/${lesson.pathwayId}/lessons/${lesson.id}`} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>{t('leader.openLesson')}</Link></Card> : null}
              <section aria-labelledby="ag-h" className="flex flex-col gap-3"><h2 id="ag-h" className="text-h3 font-semibold">{t('leader.agenda')}</h2>
                <ol className="flex flex-col gap-2">{list.map((a, i) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-2"><Input aria-label={t('leader.agendaItem', { n: i + 1 })} className="min-w-0 flex-1" value={a.title} onChange={(e) => setAgenda(list.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)))} /><Input aria-label={t('leader.minutes')} className="w-20" type="number" min={0} value={a.minutes ?? ''} onChange={(e) => setAgenda(list.map((x) => (x.id === a.id ? { ...x, minutes: Number(e.target.value) || null } : x)))} /><Button size="sm" variant="ghost" aria-label={t('leader.removeItem', { n: i + 1 })} onClick={() => setAgenda(list.filter((x) => x.id !== a.id))}><Trash size={16} aria-hidden="true" /></Button></li>
                ))}</ol>
                <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setAgenda([...list, { id: `a${Date.now()}`, kind: 'discussion', title: '', minutes: 10, detail: null }])}><Plus size={16} aria-hidden="true" />{t('leader.addItem')}</Button><Button size="sm" loading={update.isPending} disabled={!agenda} onClick={() => update.mutate({ id: m.id, patch: { agenda: list } }, { onSuccess: () => { setAgenda(null); toast.show({ title: t('leader.agendaSaved'), tone: 'success' }); } })}>{t('leader.saveAgenda')}</Button></div>
              </section>
              <section aria-labelledby="att-h" className="flex flex-col gap-2"><h2 id="att-h" className="text-h3 font-semibold">{t('leader.attendance')}</h2>
                {!past ? <Notice>{t('leader.attendanceLater')}</Notice> : null}
                <Card padding="sm"><div>{people.map((p) => <Checkbox key={p.id} label={p.displayName} checked={!!att[p.id]} onCheckedChange={(c) => setPresent({ ...att, [p.id]: c === true })} />)}</div></Card>
                <div><Button loading={attend.isPending} onClick={() => attend.mutate({ id: m.id, attendance: people.map((p) => ({ userId: p.id, present: !!att[p.id] })) }, { onSuccess: () => { setPresent(null); toast.show({ title: t('leader.attendanceSaved'), tone: 'success' }); } })}>{t('leader.saveAttendance')}</Button></div>
              </section>
              <section aria-labelledby="nt-h" className="flex flex-col gap-2"><h2 id="nt-h" className="text-h3 font-semibold">{t('leader.notes')}</h2>
                {m.notes ? <RichView doc={m.notes} /> : null}
                <RichEditor label={t('leader.notes')} placeholder={t('leader.notesPlaceholder')} value={notes} onChange={setNotes} minHeight="sm" />
                <div><Button variant="secondary" onClick={() => update.mutate({ id: m.id, patch: { notes } }, { onSuccess: () => toast.show({ title: t('leader.notesSaved'), tone: 'success' }) })}>{t('leader.saveNotes')}</Button></div>
              </section>
            </>
          );
        }}
      </QueryState>
    </div>
  );
}

export function LeaderGroupPage() {
  const { groupId = '' } = useParams();
  const t = useT();
  const reports = useGroupReports(groupId);
  return (
    <div className="flex flex-col gap-6">
      {reports.data?.length ? <Notice tone="warning" title={t('leader.flagged', { count: reports.data.length })}><Link to={`/leader/discussion?group=${groupId}`} className="underline underline-offset-4">{t('leader.reviewFlagged')}</Link></Notice> : null}
      <GroupLeaderView />
    </div>
  );
}
import { GroupPage } from '@/features/community/community-pages';
const GroupLeaderView = () => <GroupPage leaderView />;

export function ModerationPage() {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const led = useLedGroup();
  const g = useGroup(led.id);
  const reports = useGroupReports(led.id);
  const mod = useModerate();
  const dismiss = useDismissReport();
  const nav = useNavigate();
  const create = useCreateThread();
  const [hideFor, setHideFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [announce, setAnnounce] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState<RichDoc>(emptyDoc());
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('leader.moderationTitle')} description={t('leader.moderationBody')} actions={led.id ? <Button onClick={() => setAnnounce(true)}><Plus size={18} aria-hidden="true" />{t('leader.announce')}</Button> : undefined} />
      <GroupPicker {...led} />
      {!led.id && !led.q.isLoading ? empty(t) : (
        <>
          <section aria-labelledby="rep-h" className="flex flex-col gap-3"><h2 id="rep-h" className="text-h3 font-semibold">{t('leader.reported')}</h2>
            <QueryState query={reports} skeleton={<SkeletonRow />}>
              {(list) => list.length ? <ul className="flex flex-col gap-3">{list.map(({ report, post, thread }) => (
                <li key={report.id}><Card className="flex flex-col gap-2 border-warning">
                  <div className="flex flex-wrap items-center gap-2"><Warning size={18} className="text-warning" aria-hidden="true" /><Badge tone="warning">{t(`community.reason.${report.reason}`)}</Badge><span className="text-sm text-muted">{t('leader.inThread', { thread: thread.title })}</span><span className="ms-auto text-sm text-muted">{f.ago(report.createdAt)}</span></div>
                  <p className="flex items-center gap-2 text-sm font-medium"><Avatar name={post.author.displayName} size="sm" />{post.author.displayName}</p>
                  <RichView doc={post.body} className="prose-reading text-[length:0.95em]" />
                  <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => { setHideFor(post.id); setReason(''); }}>{t('leader.hide')}</Button><Button size="sm" variant="secondary" onClick={() => dismiss.mutate(report.id, { onSuccess: () => toast.show({ title: t('leader.dismissed'), tone: 'success' }) })}>{t('leader.dismiss')}</Button></div>
                </Card></li>
              ))}</ul> : <p className="text-base text-muted">{t('leader.nothingFlagged')}</p>}
            </QueryState>
          </section>
          <section aria-labelledby="thr-h" className="flex flex-col gap-3"><h2 id="thr-h" className="text-h3 font-semibold">{t('community.discussions')}</h2>
            <QueryState query={g} skeleton={<SkeletonRow />}>
              {({ threads, group }) => threads.length ? <ul className="flex flex-col gap-2">{threads.map((th) => (
                <li key={th.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3 shadow-card">
                  <Link to={`/leader/groups/${group.id}/discussions/${th.id}`} className="min-w-0 flex-1 font-medium hover:underline">{th.title}</Link>
                  {th.pinned ? <Badge icon={<PushPin size={12} />}>{t('community.pinned')}</Badge> : null}{th.locked ? <Badge icon={<Lock size={12} />}>{t('community.locked')}</Badge> : null}
                  <Button size="sm" variant="ghost" onClick={() => mod.mutate({ threadId: th.id, action: th.pinned ? 'unpin' : 'pin' })}>{th.pinned ? t('leader.unpin') : t('leader.pin')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => mod.mutate({ threadId: th.id, action: th.locked ? 'unlock' : 'lock' })}>{th.locked ? t('leader.unlock') : t('leader.lock')}</Button>
                </li>
              ))}</ul> : <p className="text-base text-muted">{t('community.noThreadsBody')}</p>}
            </QueryState>
          </section>
        </>
      )}
      <Dialog open={!!hideFor} onOpenChange={(o) => !o && setHideFor(null)}>
        <DialogContent title={t('leader.hideTitle')} description={t('leader.hideBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={mod.isPending} onClick={() => hideFor && mod.mutate({ postId: hideFor, action: 'hide', reason }, { onSuccess: () => { setHideFor(null); toast.show({ title: t('leader.hidden'), tone: 'success' }); } })}>{t('leader.hide')}</Button></>}>
          <Field label={t('leader.reason')} description={t('leader.reasonHelp')}>{(p) => <Textarea {...p} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
        </DialogContent>
      </Dialog>
      <Dialog open={announce} onOpenChange={setAnnounce}>
        <DialogContent title={t('leader.announce')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} disabled={!title.trim()} onClick={() => create.mutate({ groupId: led.id, title, body }, { onSuccess: (th) => { mod.mutate({ threadId: th.id, action: 'pin' }); setAnnounce(false); nav(`/leader/groups/${led.id}/discussions/${th.id}`); } })}>{t('leader.post')}</Button></>}>
          <div className="flex flex-col gap-4"><Field label={t('community.threadTitle')} required>{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field><RichEditor label={t('community.threadBody')} value={body} onChange={setBody} minHeight="sm" /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MembersPage() {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const led = useLedGroup();
  const summary = useGroupSummary(led.id);
  const remove = useRemoveMember();
  const add = useAddMembers();
  const [open, setOpen] = useState(false);
  const cands = useCandidates(led.id, open);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => { if (!open) setPicked([]); }, [open]);
  const rows = useMemo(() => summary.data ?? [], [summary.data]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('leader.membersTitle')} description={t('leader.membersBody')} actions={led.id ? <Button onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('leader.addPeople')}</Button> : undefined} />
      <GroupPicker {...led} />
      {!led.id && !led.q.isLoading ? empty(t) : (
        <QueryState query={summary} skeleton={<SkeletonRow />}>
          {() => (
            <ul className="stagger grid gap-3 md:grid-cols-2">{rows.map((r) => (
              <li key={r.user.id}><Card className="flex flex-col gap-2"><div className="flex items-center gap-3"><Avatar name={r.user.displayName} /><div className="min-w-0 flex-1"><p className="font-medium">{r.user.displayName}</p><p className="text-sm text-muted">{r.role !== 'member' ? t('community.leader') : t('leader.member')}</p></div>
                {r.role === 'member' ? <Button size="sm" variant="ghost" aria-label={t('leader.removeFrom', { name: r.user.displayName })} onClick={() => remove.mutate({ groupId: led.id, userId: r.user.id }, { onSuccess: () => toast.show({ title: t('leader.removed'), tone: 'success' }) })}><Trash size={16} aria-hidden="true" /></Button> : null}</div>
                <p className="text-sm text-muted">{r.held ? t('leader.attendedOf', { present: r.present, held: r.held }) : t('leader.noMeetingsYet')} &middot; {r.lastActiveAt ? t('mentor.mentees.lastActive', { when: f.ago(r.lastActiveAt) }) : t('mentor.mentees.neverActive')} &middot; {t('leader.postsCount', { count: r.posts })}</p>
              </Card></li>
            ))}</ul>
          )}
        </QueryState>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t('leader.addPeople')} description={t('leader.addPeopleBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={add.isPending} disabled={!picked.length} onClick={() => add.mutate({ groupId: led.id, userIds: picked }, { onSuccess: () => { setOpen(false); toast.show({ title: t('leader.added', { count: picked.length }), tone: 'success' }); } })}>{t('actions.add')}</Button></>}>
          {cands.data?.length ? <div>{cands.data.map((c) => <Checkbox key={c.id} label={c.displayName} checked={picked.includes(c.id)} onCheckedChange={(v) => setPicked((p) => (v ? [...p, c.id] : p.filter((x) => x !== c.id)))} />)}</div> : <p className="text-base text-muted">{t('leader.noCandidates')}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
