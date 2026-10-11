import { useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';
import { ArrowLeft, CalendarBlank, ChatCircleText, HandsPraying, Lock, MapPin, Plus, PushPin, UsersThree, Warning } from '@phosphor-icons/react';
import type { PrayerPrivacy, PrayerRequest, RichDoc } from '@/types';
import { useT, useFormat } from '@/lib/i18n';
import { Link, usePathname } from '@/lib/nav';
import { ApiError } from '@/lib/db/errors';
import { emptyDoc, isEmptyDoc } from '@/lib/editor/text';
import { useReflections } from '@/features/reflections/hooks';
import { useCreatePrayer, useCreateThread, useEncourage, useGroup, useGroups, usePost, usePray, usePrayer, usePrayers, useReact, useReportPost, useAnswered, useDeletePrayer } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { PageCover } from '@/components/patterns/page-cover/page-cover';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Notice } from '@/components/patterns/notice/notice';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Chip } from '@/components/ui/chip/chip';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { RadioGroup } from '@/components/ui/radio-group/radio-group';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Select } from '@/components/ui/select/select';
import { Switch } from '@/components/ui/switch/switch';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { RichEditor } from '@/components/content/rich-editor';
import { RichView } from '@/components/content/rich-view';
import { Cover } from '@/components/content/cover';
import { LampIllustration, PathIllustration } from '@/components/icons/illustrations';
import { useToast } from '@/components/ui/toast/toast';
import { cn } from '@/lib/cn';

export function CommunityHub() {
  const t = useT();
  const nav = useNavigate();
  const path = usePathname();
  const value = path.includes('/prayer') ? 'prayer' : path.includes('/events') ? 'events' : 'groups';
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('community.title')} description={t('community.description')} />
      <SegmentedControl label={t('community.sections')} className="self-start" value={value} onValueChange={(v) => nav(v === 'groups' ? '/app/community' : `/app/community/${v}`)} options={[{ value: 'groups', label: t('community.groups') }, { value: 'events', label: t('community.events') }, { value: 'prayer', label: t('community.prayer') }]} />
      <Outlet />
    </div>
  );
}

const covers = ['dawn', 'table', 'path', 'lamp'];

export function GroupsTab() {
  const t = useT();
  const f = useFormat();
  const q = useGroups('mine');
  return (
    <QueryState query={q} skeleton={<div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <Card key={i} padding="none"><Skeleton className="h-28 w-full rounded-none" /><div className="p-4"><Skeleton className="h-5 w-1/2" /></div></Card>)}</div>}>
      {(list) => list.length ? (
        <ul className="stagger grid gap-4 sm:grid-cols-2">
          {list.map((g, i) => (
            <li key={g.id}>
              <Link to={`/app/groups/${g.id}`} className="hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                <div className="h-28"><Cover coverKey={covers[i % covers.length] ?? 'dawn'} /></div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-sans text-h4 font-semibold">{g.name}</h3>
                  {g.description ? <p className="line-clamp-2 text-sm text-muted">{g.description}</p> : null}
                  <p className="mt-auto flex items-center gap-2 text-sm text-muted"><CalendarBlank size={16} aria-hidden="true" />{g.nextMeeting ? f.dateTime(g.nextMeeting.startsAt) : t('community.noMeeting')}</p>
                  <p className="flex items-center gap-2 text-sm text-muted"><UsersThree size={16} aria-hidden="true" />{t('community.members', { count: g.memberCount })}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : <EmptyState illustration={<PathIllustration />} title={t('community.noGroupsTitle')} description={t('community.noGroupsBody')} />}
    </QueryState>
  );
}

export function GroupPage({ leaderView = false }: { leaderView?: boolean }) {
  const { groupId = '' } = useParams();
  const t = useT();
  const f = useFormat();
  const q = useGroup(groupId);
  const [composer, setComposer] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <Link to={leaderView ? '/leader' : '/app/community'} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('community.title')}</Link>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40 w-full" /></div>}>
        {({ group: g, members, threads }) => (
          <>
            <PageCover coverKey={covers[g.name.length % covers.length] ?? 'dawn'} icon={UsersThree} title={g.name} description={g.description ?? undefined}><Button onClick={() => setComposer(true)}><Plus size={18} aria-hidden="true" />{t('community.newThread')}</Button></PageCover>
            <div className="stagger grid gap-4 lg:grid-cols-[1fr_20rem]">
              <section aria-labelledby="th-h" className="flex flex-col gap-3">
                <h2 id="th-h" className="text-h3 font-semibold">{t('community.discussions')}</h2>
                {threads.length ? <ul className="flex flex-col gap-3">{threads.map((th) => (
                  <li key={th.id}><Link to={`/app/groups/${g.id}/discussions/${th.id}`} className="hover-lift flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4 shadow-card">
                    <div className="flex flex-wrap items-center gap-2">{th.pinned ? <Badge icon={<PushPin size={12} />}>{t('community.pinned')}</Badge> : null}{th.locked ? <Badge icon={<Lock size={12} />}>{t('community.locked')}</Badge> : null}<span className="ms-auto text-sm text-muted">{th.lastPostAt ? f.ago(th.lastPostAt) : ''}</span></div>
                    <h3 className="font-sans text-base font-semibold">{th.title}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted"><ChatCircleText size={16} aria-hidden="true" />{t('community.replies', { count: th.postCount })}</p>
                  </Link></li>
                ))}</ul> : <EmptyState illustration={<LampIllustration />} title={t('community.noThreadsTitle')} description={t('community.noThreadsBody')} />}
              </section>
              <aside className="flex flex-col gap-4">
                <Card className="flex flex-col gap-2"><h2 className="text-h4 font-semibold">{t('community.nextMeeting')}</h2>
                  {g.nextMeeting ? <><p className="text-base">{f.dateTime(g.nextMeeting.startsAt)}</p>{g.nextMeeting.location ? <p className="flex items-center gap-1.5 text-sm text-muted"><MapPin size={16} aria-hidden="true" />{g.nextMeeting.location}</p> : null}{g.pathwayTitle ? <p className="text-sm text-muted">{t('community.studying', { pathway: g.pathwayTitle })}</p> : null}{leaderView ? <Link to={`/leader/groups/${g.id}/meetings/${g.nextMeeting.id}`} className={buttonStyles({ variant: 'secondary', size: 'sm' })}>{t('leader.prepare')}</Link> : null}</> : <p className="text-sm text-muted">{t('community.noMeeting')}</p>}
                </Card>
                <Card className="flex flex-col gap-3"><h2 className="text-h4 font-semibold">{t('community.people')}</h2>
                  <ul className="flex flex-col gap-2">{members.map((m) => <li key={m.id} className="flex items-center gap-2"><Avatar name={m.displayName} size="sm" /><span className="text-base">{m.displayName}</span>{m.role !== 'member' ? <Badge tone="accent">{t('community.leader')}</Badge> : null}</li>)}</ul>
                </Card>
              </aside>
            </div>
            <NewThreadDialog open={composer} onOpenChange={setComposer} groupId={g.id} />
          </>
        )}
      </QueryState>
    </div>
  );
}

function NewThreadDialog({ open, onOpenChange, groupId }: { open: boolean; onOpenChange: (o: boolean) => void; groupId: string }) {
  const t = useT();
  const nav = useNavigate();
  const create = useCreateThread();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState<RichDoc>(emptyDoc());
  const [err, setErr] = useState<string | undefined>();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('community.newThread')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} onClick={() => create.mutate({ groupId, title, body }, { onSuccess: (th) => { onOpenChange(false); nav(`/app/groups/${groupId}/discussions/${th.id}`); }, onError: (e) => setErr(e instanceof ApiError ? (e.fieldErrors?.title?.[0] ?? e.message) : t('states.errorBody')) })}>{t('community.start')}</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label={t('community.threadTitle')} error={err} required>{(p) => <Input {...p} value={title} onChange={(e) => { setTitle(e.target.value); setErr(undefined); }} />}</Field>
          <RichEditor label={t('community.threadBody')} placeholder={t('community.threadPlaceholder')} value={body} onChange={setBody} minHeight="sm" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ThreadPage({ leaderView = false }: { leaderView?: boolean }) {
  const { groupId = '', threadId = '' } = useParams();
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const q = useThread2(threadId);
  const post = usePost();
  const react = useReact();
  const report = useReportPost();
  const mine = useReflections({ scope: 'mine' });
  const [body, setBody] = useState<RichDoc>(emptyDoc());
  const [key, setKey] = useState(0);
  const [share, setShare] = useState('');
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reason, setReason] = useState<'unkind' | 'off_topic' | 'private_info' | 'other'>('unkind');
  const [err, setErr] = useState<string | null>(null);
  const reflectionsToShare = (mine.data ?? []).filter((r) => r.status === 'submitted' && r.visibility !== 'private').slice(0, 20);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to={leaderView ? `/leader/groups/${groupId}` : `/app/groups/${groupId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{q.data?.group.name ?? t('community.title')}</Link>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-10 w-2/3" /><SkeletonRow /><SkeletonRow /></div>}>
        {({ thread, posts, lesson, amLeader }) => (
          <>
            <div className="enter flex flex-col gap-2"><div className="flex flex-wrap gap-2">{thread.pinned ? <Badge icon={<PushPin size={12} />}>{t('community.pinned')}</Badge> : null}{thread.locked ? <Badge icon={<Lock size={12} />}>{t('community.locked')}</Badge> : null}</div>
              <h1 className="text-h2 font-semibold tracking-tight">{thread.title}</h1>
              {lesson ? <Link to={`/app/pathways/${lesson.pathwayId}/lessons/${lesson.id}`} className="text-sm text-accent-soft-ink underline underline-offset-4">{t('community.aboutLesson', { lesson: lesson.title })}</Link> : null}
              <Notice>{t('community.guidelines')}</Notice></div>
            <ol className="stagger flex flex-col gap-3">
              {posts.map((p) => (
                <li key={p.id} className={cn(p.parentId && 'ms-8')}>
                  <Card className={cn('flex flex-col gap-2', p.status !== 'visible' && 'opacity-80')}>
                    <div className="flex flex-wrap items-center gap-2"><Avatar name={p.author.displayName} size="sm" /><span className="font-medium">{p.author.displayName}</span><span className="text-sm text-muted">{f.ago(p.createdAt)}</span></div>
                    {p.status !== 'visible' && !amLeader ? <p className="text-base italic text-muted">{t('community.hidden')}</p> : (
                      <>
                        {p.status !== 'visible' ? <Badge tone="warning">{t('community.hiddenForOthers')}</Badge> : null}
                        {p.sharedReflection ? <blockquote className="rounded-md border-s-2 border-accent bg-accent-soft px-3 py-2 font-serif text-base italic">{p.sharedReflection.excerpt}…</blockquote> : null}
                        <RichView doc={p.body} className="prose-reading text-[length:0.95em]" />
                      </>
                    )}
                    <div className="flex flex-wrap items-center gap-1">
                      {(['amen', 'thanks', 'helpful'] as const).map((k) => { const r = p.reactions.find((x) => x.kind === k); return <Chip key={k} selected={!!r?.mine} onClick={() => react.mutate({ postId: p.id, kind: k })}>{t(`community.react.${k}`)}{r?.count ? ` ${r.count}` : ''}</Chip>; })}
                      <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setReportFor(p.id)}><Warning size={16} aria-hidden="true" />{t('community.report')}</Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
            {thread.locked ? <Notice tone="warning">{t('community.lockedNotice')}</Notice> : (
              <Card className="flex flex-col gap-3"><h2 className="text-h4 font-semibold">{t('community.addReply')}</h2>
                <RichEditor key={key} label={t('community.replyLabel')} placeholder={t('community.replyPlaceholder')} value={body} onChange={setBody} minHeight="sm" />
                {reflectionsToShare.length ? <Field label={t('community.shareReflection')} description={t('community.shareReflectionHelp')}>{(p) => <Select {...p} value={share} onValueChange={setShare} placeholder={t('community.noneOption')} options={[{ value: 'none', label: t('community.noneOption') }, ...reflectionsToShare.map((r) => ({ value: r.id, label: r.title ?? r.lessonTitle ?? t('learn.journal.entry') }))]} />}</Field> : null}
                {err ? <Notice tone="danger">{err}</Notice> : null}
                <div><Button loading={post.isPending} disabled={isEmptyDoc(body)} onClick={() => { setErr(null); post.mutate({ threadId, body, sharedReflectionId: share && share !== 'none' ? share : null }, { onSuccess: () => { setBody(emptyDoc()); setKey((k) => k + 1); setShare(''); toast.show({ title: t('community.posted'), tone: 'success' }); }, onError: (e) => setErr(e instanceof ApiError ? e.message : t('states.errorBody')) }); }}>{t('community.post')}</Button></div>
              </Card>
            )}
            <Dialog open={!!reportFor} onOpenChange={(o) => !o && setReportFor(null)}>
              <DialogContent title={t('community.reportTitle')} description={t('community.reportBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button onClick={() => reportFor && report.mutate({ postId: reportFor, reason }, { onSuccess: () => { setReportFor(null); toast.show({ title: t('community.reported'), tone: 'success' }); } })}>{t('community.sendReport')}</Button></>}>
                <RadioGroup aria-label={t('community.reportTitle')} value={reason} onValueChange={(v) => setReason(v as typeof reason)} options={(['unkind', 'off_topic', 'private_info', 'other'] as const).map((r) => ({ value: r, label: t(`community.reason.${r}`) }))} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </QueryState>
    </div>
  );
}
import { useThread as useThread2 } from './hooks';

const privacyOptions: PrayerPrivacy[] = ['only_me', 'mentor', 'group', 'organisation'];

export function PrayerWall() {
  const t = useT();
  const [status, setStatus] = useState<'open' | 'answered'>('open');
  const [scope, setScope] = useState<'all' | 'mine' | 'group' | 'organisation'>('all');
  const [compose, setCompose] = useState(false);
  const q = usePrayers(scope, status);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl label={t('community.prayerFilter')} value={scope} onValueChange={(v) => setScope(v as typeof scope)} options={[{ value: 'all', label: t('community.scope.all') }, { value: 'mine', label: t('community.scope.mine') }, { value: 'group', label: t('community.scope.group') }, { value: 'organisation', label: t('community.scope.organisation') }]} />
        <SegmentedControl label={t('community.prayerStatus')} value={status} onValueChange={(v) => setStatus(v as typeof status)} options={[{ value: 'open', label: t('community.open') }, { value: 'answered', label: t('community.answered') }]} />
        <Button className="ms-auto" onClick={() => setCompose(true)}><Plus size={18} aria-hidden="true" />{t('community.newPrayer')}</Button>
      </div>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>}>
        {(list) => list.length ? <ul className="stagger grid gap-4 md:grid-cols-2">{list.map((p) => <li key={p.id}><PrayerCard p={p} /></li>)}</ul> : <EmptyState illustration={<LampIllustration />} title={t('community.noPrayersTitle')} description={t('community.noPrayersBody')} action={<Button onClick={() => setCompose(true)}>{t('community.newPrayer')}</Button>} />}
      </QueryState>
      <PrayerCompose open={compose} onOpenChange={setCompose} />
    </div>
  );
}

type PV = NonNullable<ReturnType<typeof usePrayers>['data']>[number];

export function PrivacyChip({ privacy, group }: { privacy: PrayerPrivacy; group: string | null }) {
  const t = useT();
  return <Badge icon={<Lock size={12} />}>{privacy === 'group' && group ? t('community.privacyGroupNamed', { group }) : t(`community.privacy.${privacy}`)}</Badge>;
}

function PrayerCard({ p }: { p: PV }) {
  const t = useT();
  const f = useFormat();
  const pray = usePray();
  return (
    <Card interactive className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {p.author ? <span className="flex items-center gap-2 text-sm font-medium"><Avatar name={p.author.displayName} size="sm" />{p.author.displayName}</span> : <span className="flex items-center gap-2 text-sm font-medium text-muted"><span className="grid size-8 place-items-center rounded-md bg-sunken"><HandsPraying size={16} aria-hidden="true" /></span>{t('community.anonymous')}</span>}
        <span className="ms-auto text-sm text-muted">{f.ago(p.createdAt)}</span>
      </div>
      <Link to={`/app/community/prayer/${p.id}`} className="font-serif text-base text-ink hover:underline">{p.body}</Link>
      <div className="mt-auto flex flex-wrap items-center gap-2"><PrivacyChip privacy={p.privacy} group={p.groupName} />{p.status === 'answered' ? <Badge tone="success">{t('community.answered')}</Badge> : null}</div>
      <div className="flex items-center gap-2">
        {p.status === 'open' && !p.mine ? <Button size="sm" variant={p.iAmPraying ? 'primary' : 'secondary'} aria-pressed={p.iAmPraying} loading={pray.isPending} onClick={() => pray.mutate({ id: p.id, praying: !p.iAmPraying })}><HandsPraying size={16} aria-hidden="true" />{p.iAmPraying ? t('community.praying') : t('community.iPray')}</Button> : null}
        <span className="text-sm text-muted">{t('community.supporters', { count: p.supporterCount })}</span>
      </div>
    </Card>
  );
}

function PrayerCompose({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const toast = useToast();
  const create = useCreatePrayer();
  const groups = useGroups('mine');
  const [body, setBody] = useState('');
  const [privacy, setPrivacy] = useState<PrayerPrivacy>('group');
  const [anonymous, setAnonymous] = useState(false);
  const [category, setCategory] = useState<PrayerRequest['category']>(null);
  const [err, setErr] = useState<string | null>(null);
  const gid = groups.data?.[0]?.id ?? null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('community.newPrayer')} description={t('community.composeHelp')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} onClick={() => create.mutate({ body, privacy, groupId: privacy === 'group' ? gid : null, anonymous, category }, { onSuccess: () => { onOpenChange(false); setBody(''); setErr(null); toast.show({ title: t('community.prayerAdded'), tone: 'success' }); }, onError: (e) => setErr(e instanceof ApiError ? (e.fieldErrors?.body?.[0] ?? e.fieldErrors?.groupId?.[0] ?? e.fieldErrors?.privacy?.[0] ?? e.message) : t('states.errorBody')) })}>{t('community.share')}</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label={t('community.requestLabel')} required>{(p) => <Textarea {...p} rows={4} maxLength={1500} value={body} onChange={(e) => setBody(e.target.value)} />}</Field>
          <fieldset className="flex flex-col gap-1"><legend className="text-sm font-semibold">{t('community.whoCanSee')}</legend>
            <RadioGroup aria-label={t('community.whoCanSee')} value={privacy} onValueChange={(v) => setPrivacy(v as PrayerPrivacy)} options={privacyOptions.map((o) => ({ value: o, label: o === 'group' && groups.data?.[0] ? t('community.privacyGroupNamed', { group: groups.data[0].name }) : t(`community.privacy.${o}`), description: t(`community.privacyHelp.${o}`) }))} /></fieldset>
          <Switch label={t('community.anonymousLabel')} description={t('community.anonymousHelp')} checked={anonymous} onCheckedChange={setAnonymous} />
          <Field label={t('community.categoryLabel')}>{(p) => <Select {...p} value={category ?? 'none'} onValueChange={(v) => setCategory(v === 'none' ? null : (v as PrayerRequest['category']))} options={[{ value: 'none', label: t('community.noCategory') }, ...(['health', 'family', 'work', 'faith', 'community', 'thanks', 'other'] as const).map((c) => ({ value: c, label: t(`community.category.${c}`) }))]} />}</Field>
          {err ? <Notice tone="danger">{err}</Notice> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PrayerPage() {
  const { requestId = '' } = useParams();
  const t = useT();
  const f = useFormat();
  const nav = useNavigate();
  const toast = useToast();
  const q = usePrayer(requestId);
  const pray = usePray();
  const answered = useAnswered();
  const del = useDeletePrayer();
  const encourage = useEncourage();
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [markOpen, setMarkOpen] = useState(false);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link to="/app/community/prayer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('community.prayer')}</Link>
      <QueryState query={q} skeleton={<Skeleton className="h-48 w-full" />}>
        {({ prayer: p, comments }) => (
          <>
            <Card padding="lg" className="enter flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">{p.author ? <span className="flex items-center gap-2 font-medium"><Avatar name={p.author.displayName} size="sm" />{p.author.displayName}</span> : <span className="text-muted">{t('community.anonymous')}</span>}<span className="ms-auto text-sm text-muted">{f.date(p.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <p className="prose-reading">{p.body}</p>
              <div className="flex flex-wrap items-center gap-2"><PrivacyChip privacy={p.privacy} group={p.groupName} />{p.category ? <Badge>{t(`community.category.${p.category}`)}</Badge> : null}{p.status === 'answered' ? <Badge tone="success">{t('community.answered')}</Badge> : null}</div>
              {p.status === 'answered' && p.answeredNote ? <Notice tone="success" title={t('community.answeredTitle')}>{p.answeredNote}</Notice> : null}
              <div className="flex flex-wrap items-center gap-2">
                {!p.mine && p.status === 'open' ? <Button variant={p.iAmPraying ? 'primary' : 'secondary'} loading={pray.isPending} aria-pressed={p.iAmPraying} onClick={() => pray.mutate({ id: p.id, praying: !p.iAmPraying })}><HandsPraying size={18} aria-hidden="true" />{p.iAmPraying ? t('community.praying') : t('community.iPray')}</Button> : null}
                <span className="text-sm text-muted">{t('community.supporters', { count: p.supporterCount })}</span>
                {p.mine && p.status === 'open' ? <Button variant="secondary" onClick={() => setMarkOpen(true)}>{t('community.markAnswered')}</Button> : null}
                {p.mine ? <Button variant="ghost" loading={del.isPending} onClick={() => del.mutate(p.id, { onSuccess: () => { toast.show({ title: t('community.deleted'), tone: 'success' }); nav('/app/community/prayer'); } })}>{t('actions.delete')}</Button> : null}
              </div>
            </Card>
            <section aria-labelledby="enc-h" className="flex flex-col gap-3"><h2 id="enc-h" className="text-h3 font-semibold">{t('community.encouragement')}</h2>
              {comments.map((c) => <Card key={c.id} className="flex flex-col gap-1"><p className="flex items-center gap-2 text-sm font-medium"><Avatar name={c.author.displayName} size="sm" />{c.author.displayName}<span className="font-normal text-muted">{f.ago(c.createdAt)}</span></p><p className="text-base">{c.body}</p></Card>)}
              {p.status === 'open' ? <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); encourage.mutate({ id: p.id, body: msg }, { onSuccess: () => { setMsg(''); toast.show({ title: t('community.sent'), tone: 'success' }); } }); }}><Field label={t('community.writeEncouragement')} description={t('community.encouragementHelp')}>{(pp) => <Textarea {...pp} rows={2} maxLength={400} value={msg} onChange={(e) => setMsg(e.target.value)} />}</Field><div><Button type="submit" variant="secondary" loading={encourage.isPending} disabled={!msg.trim()}>{t('community.sendMessage')}</Button></div></form> : null}
            </section>
            <Dialog open={markOpen} onOpenChange={setMarkOpen}>
              <DialogContent title={t('community.markAnswered')} description={t('community.answeredHelp')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={answered.isPending} onClick={() => answered.mutate({ id: p.id, note }, { onSuccess: () => { setMarkOpen(false); toast.show({ title: t('community.answeredToast'), tone: 'success' }); } })}>{t('community.save')}</Button></>}>
                <Field label={t('community.answeredNote')}>{(pp) => <Textarea {...pp} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
              </DialogContent>
            </Dialog>
          </>
        )}
      </QueryState>
    </div>
  );
}
