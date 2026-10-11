import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Check, Copy, MagnifyingGlass, Plus, Table as TableIcon, ChartBar } from '@phosphor-icons/react';
import type { Role } from '@/types';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { adminService } from '@/lib/services/admin';
import { useSession } from '@/features/session/hooks';
import { useSessionState } from '@/lib/db/session';
import { ApiError } from '@/lib/db/errors';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Notice } from '@/components/patterns/notice/notice';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Chip } from '@/components/ui/chip/chip';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Select } from '@/components/ui/select/select';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { Switch } from '@/components/ui/switch/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/tabs';
import { PathIllustration } from '@/components/icons/illustrations';
import { Cover } from '@/components/content/cover';
import { useToast } from '@/components/ui/toast/toast';
import { cn } from '@/lib/cn';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };
const roles: Role[] = ['student', 'mentor', 'leader', 'admin'];

// ---- Overview ----
export function AdminOverview() {
  const t = useT();
  const w = useWho();
  const q = useQuery({ queryKey: ['admin-report', 90, w], queryFn: () => adminService.report(90) });
  const { org } = useSession();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('admin.overviewTitle', { org: org?.name ?? '' })} description={t('admin.overviewBody')} />
      <QueryState query={q} skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>}>
        {(r) => (
          <>
            <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {([['members', r.totals.members], ['lessons', r.totals.lessonsCompleted], ['reflections', r.totals.reflections], ['awaiting', r.totals.awaiting]] as const).map(([k, v]) => (
                <li key={k}><Card interactive className="flex flex-col gap-1"><p className="text-sm text-muted">{t(`admin.stat.${k}`)}</p><p className="font-serif text-4xl font-semibold tracking-tight">{v}</p><p className="text-xs text-subtle">{t('admin.last90')}</p></Card></li>
              ))}
            </ul>
            <section aria-labelledby="setup-h" className="flex flex-col gap-3"><h2 id="setup-h" className="text-h3 font-semibold">{t('admin.setup')}</h2>
              <Card className="flex flex-col gap-1">{([['invited', '/admin/members?tab=invites'], ['groups', '/admin/groups'], ['mentors', '/admin/members']] as const).map(([k, to]) => (
                <Link key={k} to={to} className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-sunken"><span className={cn('grid size-6 place-items-center rounded-full border', r.setup[k] ? 'border-accent bg-accent text-on-accent' : 'border-line-strong')}>{r.setup[k] ? <Check size={14} weight="bold" aria-hidden="true" /> : null}</span><span className="text-base">{t(`admin.setupStep.${k}`)}</span><span className="sr-only">{t(r.setup[k] ? 'learn.status.done' : 'learn.status.todo')}</span></Link>
              ))}</Card>
            </section>
            <Notice>{t('admin.privacyNote')}</Notice>
            <div className="flex flex-wrap gap-2"><Link to="/admin/reports" className={buttonStyles()}>{t('admin.openReports')}</Link></div>
          </>
        )}
      </QueryState>
    </div>
  );
}

// ---- Members and invites ----
export function MembersPage() {
  const t = useT();
  const [tab, setTab] = useState('people');
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('admin.membersTitle')} description={t('admin.membersBody')} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label={t('admin.membersTitle')}><TabsTrigger value="people">{t('admin.tabPeople')}</TabsTrigger><TabsTrigger value="invites">{t('admin.tabInvites')}</TabsTrigger></TabsList>
        <TabsContent value="people"><PeopleTab /></TabsContent>
        <TabsContent value="invites"><InvitesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function PeopleTab() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const w = useWho();
  const q = useQuery({ queryKey: ['admin-members', w], queryFn: adminService.members });
  const mentors = useMemo(() => (q.data ?? []).filter((m) => m.membership.roles.includes('mentor')), [q.data]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [edit, setEdit] = useState<string | null>(null);
  const [picked, setPicked] = useState<Role[]>([]);
  const [mentor, setMentor] = useState('');
  const update = useMutation({ mutationFn: (v: { id: string; patch: { roles?: Role[]; status?: 'active' | 'suspended' } }) => adminService.updateMember(v.id, v.patch) });
  const assign = useMutation({ mutationFn: (v: { mentee: string; mentor: string | null }) => adminService.assignMentor(v.mentee, v.mentor) });
  const list = (q.data ?? []).filter((m) => (role === 'all' || m.membership.roles.includes(role)) && (!search || m.user.displayName.toLowerCase().includes(search.toLowerCase())));
  const row = q.data?.find((m) => m.membership.id === edit);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm"><MagnifyingGlass size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" /><Input aria-label={t('admin.searchPeople')} placeholder={t('admin.searchPeople')} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10" /></div>
        <div role="group" aria-label={t('admin.filterRole')} className="flex flex-wrap gap-2"><Chip selected={role === 'all'} onClick={() => setRole('all')}>{t('admin.allRoles')}</Chip>{roles.map((r) => <Chip key={r} selected={role === r} onClick={() => setRole(r)}>{t(`persona.role${r[0]?.toUpperCase()}${r.slice(1)}`)}</Chip>)}</div>
      </div>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-3">{[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}</div>}>
        {() => (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[40rem] text-start text-base">
              <caption className="sr-only">{t('admin.membersTitle')}</caption>
              <thead><tr className="border-b border-line text-sm text-muted"><th scope="col" className="px-4 py-3 text-start font-medium">{t('admin.colPerson')}</th><th scope="col" className="px-4 py-3 text-start font-medium">{t('admin.colRoles')}</th><th scope="col" className="px-4 py-3 text-start font-medium">{t('admin.colMentor')}</th><th scope="col" className="px-4 py-3 text-start font-medium">{t('admin.colGroups')}</th><th scope="col" className="px-4 py-3"><span className="sr-only">{t('admin.colActions')}</span></th></tr></thead>
              <tbody>{list.map((m) => (
                <tr key={m.membership.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2"><div className="flex items-center gap-3"><Avatar name={m.user.displayName} size="sm" /><div><p className="font-medium">{m.user.displayName}</p><p className="text-sm text-muted">{m.user.email}</p></div></div></td>
                  <td className="px-4 py-2"><div className="flex flex-wrap gap-1">{m.membership.roles.map((r) => <Badge key={r} tone={r === 'admin' ? 'accent' : 'neutral'}>{t(`persona.role${r[0]?.toUpperCase()}${r.slice(1)}`)}</Badge>)}{m.membership.status === 'suspended' ? <Badge tone="danger">{t('admin.suspended')}</Badge> : null}</div></td>
                  <td className="px-4 py-2 text-sm">{m.mentors[0]?.displayName ?? <span className="text-muted">{t('admin.noMentor')}</span>}</td>
                  <td className="px-4 py-2 text-sm text-muted">{m.groups.map((g) => g.name).join(', ') || '—'}</td>
                  <td className="px-4 py-2 text-end"><Button size="sm" variant="secondary" onClick={() => { setEdit(m.membership.id); setPicked(m.membership.roles); setMentor(m.mentors[0]?.id ?? 'none'); }}>{t('actions.edit')}<span className="sr-only"> {m.user.displayName}</span></Button></td>
                </tr>
              ))}</tbody>
            </table>
            {!list.length ? <p className="p-6 text-center text-base text-muted">{t('admin.noPeople')}</p> : null}
          </div>
        )}
      </QueryState>
      <Dialog open={!!row} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent title={row ? t('admin.editPerson', { name: row.user.displayName }) : ''} description={t('admin.editBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose>{row ? <Button variant={row.membership.status === 'suspended' ? 'secondary' : 'ghost'} onClick={() => update.mutate({ id: row.membership.id, patch: { status: row.membership.status === 'suspended' ? 'active' : 'suspended' } }, { onSuccess: () => { setEdit(null); toast.show({ title: t('admin.updated'), tone: 'success' }); } })}>{row.membership.status === 'suspended' ? t('admin.restore') : t('admin.suspend')}</Button> : null}<Button loading={update.isPending || assign.isPending} onClick={async () => { if (!row) return; try { await update.mutateAsync({ id: row.membership.id, patch: { roles: picked } }); await assign.mutateAsync({ mentee: row.user.id, mentor: mentor === 'none' ? null : mentor }); setEdit(null); void qc.invalidateQueries(); toast.show({ title: t('admin.updated'), tone: 'success' }); } catch (e) { toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }); } }}>{t('actions.save')}</Button></>}>
          <div className="flex flex-col gap-4">
            <fieldset><legend className="mb-1 text-sm font-semibold">{t('admin.colRoles')}</legend>{roles.map((r) => <Checkbox key={r} label={t(`persona.role${r[0]?.toUpperCase()}${r.slice(1)}`)} checked={picked.includes(r)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, r] : p.filter((x) => x !== r)))} />)}</fieldset>
            <Field label={t('admin.colMentor')} description={t('admin.mentorHelp')}>{(p) => <Select {...p} value={mentor} onValueChange={setMentor} options={[{ value: 'none', label: t('admin.noMentor') }, ...mentors.filter((m) => m.user.id !== row?.user.id).map((m) => ({ value: m.user.id, label: m.user.displayName }))]} />}</Field>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvitesTab() {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const w = useWho();
  const q = useQuery({ queryKey: ['admin-invites', w], queryFn: adminService.invites });
  const create = useMutation({ mutationFn: adminService.createInvite });
  const revoke = useMutation({ mutationFn: (id: string) => adminService.revokeInvite(id) });
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Role[]>(['student']);
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('7');
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div><Button onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('admin.newInvite')}</Button></div>
      <QueryState query={q} skeleton={<SkeletonRow />}>
        {(list) => list.length ? <ul className="flex flex-col gap-3">{list.map((i) => (
          <li key={i.id}><Card className="flex flex-wrap items-center gap-3"><code className="rounded-md bg-sunken px-3 py-1.5 font-mono text-base tracking-widest">{i.code}</code><div className="min-w-0 flex-1"><p className="text-base">{i.roles.map((r) => t(`persona.role${r[0]?.toUpperCase()}${r.slice(1)}`)).join(', ')}{i.email ? ` · ${i.email}` : ''}</p><p className="text-sm text-muted">{t('admin.expires', { date: f.date(i.expiresAt) })}</p></div><Badge tone={i.status === 'pending' ? 'accent' : 'neutral'}>{t(`admin.inviteStatus.${i.status}`)}</Badge>
            <Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(i.code); toast.show({ title: t('admin.copied'), tone: 'success' }); } catch { toast.show({ title: i.code }); } }}><Copy size={16} aria-hidden="true" />{t('admin.copy')}</Button>
            {i.status === 'pending' ? <Button size="sm" variant="ghost" onClick={() => revoke.mutate(i.id)}>{t('admin.revoke')}</Button> : null}</Card></li>
        ))}</ul> : <EmptyState illustration={<PathIllustration />} title={t('admin.noInvitesTitle')} description={t('admin.noInvitesBody')} />}
      </QueryState>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t('admin.newInvite')} description={t('admin.inviteBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} onClick={() => create.mutate({ roles: picked, email, expiresInDays: Number(days) }, { onSuccess: () => { setOpen(false); setEmail(''); toast.show({ title: t('admin.inviteCreated'), tone: 'success' }); }, onError: (e) => setErr(e instanceof ApiError ? (e.fieldErrors?.roles?.[0] ?? e.message) : t('states.errorBody')) })}>{t('admin.createInvite')}</Button></>}>
          <div className="flex flex-col gap-4">
            <fieldset><legend className="mb-1 text-sm font-semibold">{t('admin.inviteRoles')}</legend>{roles.map((r) => <Checkbox key={r} label={t(`persona.role${r[0]?.toUpperCase()}${r.slice(1)}`)} checked={picked.includes(r)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, r] : p.filter((x) => x !== r)))} />)}</fieldset>
            <Field label={t('admin.inviteEmail')} description={t('admin.inviteEmailHelp')}>{(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
            <Field label={t('admin.inviteExpiry')}>{(p) => <Select {...p} value={days} onValueChange={setDays} options={[{ value: '1', label: t('admin.days', { count: 1 }) }, { value: '7', label: t('admin.days', { count: 7 }) }, { value: '30', label: t('admin.days', { count: 30 }) }]} />}</Field>
            {err ? <Notice tone="danger">{err}</Notice> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Groups ----
export function AdminGroups() {
  const t = useT();
  const toast = useToast();
  const w = useWho();
  const q = useQuery({ queryKey: ['admin-groups', w], queryFn: adminService.groups });
  const members = useQuery({ queryKey: ['admin-members', w], queryFn: adminService.members });
  const pathways = useQuery({ queryKey: ['admin-pathways', w], queryFn: () => import('@/lib/services/learning').then((m) => m.pathwaysService.list('library')) });
  const create = useMutation({ mutationFn: adminService.createGroup });
  const archive = useMutation({ mutationFn: (v: { id: string; archived: boolean }) => adminService.archiveGroup(v.id, v.archived) });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [leader, setLeader] = useState('');
  const [pathway, setPathway] = useState('none');
  const [err, setErr] = useState<string | undefined>();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('admin.groupsTitle')} description={t('admin.groupsBody')} actions={<Button onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('admin.newGroup')}</Button>} />
      <QueryState query={q} skeleton={<SkeletonRow />}>
        {(list) => <ul className="stagger grid gap-4 md:grid-cols-2">{list.map((g, i) => (
          <li key={g.id}><Card padding="none" className={cn('overflow-hidden', g.archivedAt && 'opacity-70')}><div className="h-20"><Cover coverKey={['table', 'dawn', 'path', 'lamp'][i % 4] ?? 'dawn'} /></div><div className="flex flex-col gap-2 p-4"><div className="flex flex-wrap items-center gap-2"><h2 className="font-sans text-h4 font-semibold">{g.name}</h2>{g.archivedAt ? <Badge>{t('admin.archived')}</Badge> : null}</div><p className="text-sm text-muted">{t('admin.ledBy', { names: g.leaders.map((l) => l.displayName).join(', ') })} &middot; {t('community.members', { count: g.memberCount })}</p>{g.pathwayTitle ? <p className="text-sm text-muted">{t('community.studying', { pathway: g.pathwayTitle })}</p> : null}<div><Button size="sm" variant="ghost" onClick={() => archive.mutate({ id: g.id, archived: !g.archivedAt })}>{g.archivedAt ? t('admin.restore') : t('admin.archive')}</Button></div></div></Card></li>
        ))}</ul>}
      </QueryState>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t('admin.newGroup')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} disabled={!leader} onClick={() => create.mutate({ name, description: desc, leaderId: leader, pathwayId: pathway === 'none' ? null : pathway }, { onSuccess: () => { setOpen(false); setName(''); toast.show({ title: t('admin.groupCreated'), tone: 'success' }); }, onError: (e) => setErr(e instanceof ApiError ? (e.fieldErrors?.name?.[0] ?? e.message) : t('states.errorBody')) })}>{t('actions.create')}</Button></>}>
          <div className="flex flex-col gap-4">
            <Field label={t('admin.groupName')} error={err} required>{(p) => <Input {...p} value={name} onChange={(e) => { setName(e.target.value); setErr(undefined); }} />}</Field>
            <Field label={t('admin.groupDesc')}>{(p) => <Textarea {...p} rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />}</Field>
            <Field label={t('admin.groupLeader')} required>{(p) => <Select {...p} value={leader} onValueChange={setLeader} placeholder={t('admin.chooseLeader')} options={(members.data ?? []).filter((m) => m.membership.status === 'active').map((m) => ({ value: m.user.id, label: m.user.displayName }))} />}</Field>
            <Field label={t('admin.groupPathway')}>{(p) => <Select {...p} value={pathway} onValueChange={setPathway} options={[{ value: 'none', label: t('admin.noPathway') }, ...(pathways.data ?? []).map((x) => ({ value: x.id, label: x.title }))]} />}</Field>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Reports ----
const axis = { stroke: 'var(--text-muted)', fontSize: 12 } as const;

function ChartCard({ title, summary, table, children }: { title: string; summary: string; table: ReactNode; children: ReactNode }) {
  const t = useT();
  const [asTable, setAsTable] = useState(false);
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-h4 font-semibold">{title}</h2><p className="text-sm text-muted">{summary}</p></div>
        <Button size="sm" variant="ghost" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>{asTable ? <ChartBar size={16} aria-hidden="true" /> : <TableIcon size={16} aria-hidden="true" />}{asTable ? t('admin.showChart') : t('admin.showTable')}</Button></div>
      {asTable ? <div className="overflow-x-auto">{table}</div> : <div className="h-64" role="img" aria-label={summary}>{children}</div>}
    </Card>
  );
}

const tip = { contentStyle: { background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 13 }, cursor: { fill: 'var(--surface-sunken)' } } as const;

export function ReportsPage() {
  const t = useT();
  const f = useFormat();
  const w = useWho();
  const [days, setDays] = useState('90');
  const q = useQuery({ queryKey: ['admin-report', Number(days), w], queryFn: () => adminService.report(Number(days)) });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('admin.reportsTitle')} description={t('admin.reportsBody')} actions={<SegmentedControl label={t('admin.range')} value={days} onValueChange={setDays} options={[{ value: '30', label: t('admin.days', { count: 30 }) }, { value: '90', label: t('admin.days', { count: 90 }) }, { value: '180', label: t('admin.days', { count: 180 }) }]} />} />
      <Notice>{t('admin.privacyNote')}</Notice>
      <QueryState query={q} skeleton={<div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>}>
        {(r) => {
          const act = r.activity.map((a) => ({ ...a, label: f.date(a.weekStart) }));
          const peak = act.reduce((m, a) => (a.activeMembers > m.activeMembers ? a : m), act[0] ?? { activeMembers: 0, label: '' });
          const tbl = (head: string[], rows: (string | number)[][]) => <table className="w-full text-start text-sm"><thead><tr className="border-b border-line text-muted">{head.map((h) => <th key={h} scope="col" className="py-2 pe-3 text-start font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-b border-line last:border-0">{row.map((c, j) => <td key={j} className="py-2 pe-3">{c}</td>)}</tr>)}</tbody></table>;
          return (
            <div className="stagger grid gap-4 lg:grid-cols-2">
              <ChartCard title={t('admin.chart.activity')} summary={act.length ? t('admin.chart.activitySummary', { peak: peak.activeMembers, week: peak.label }) : t('admin.chart.noData')} table={tbl([t('admin.chart.week'), t('admin.chart.active'), t('admin.chart.lessons'), t('admin.chart.reflections')], act.map((a) => [a.label, a.activeMembers, a.lessons, a.reflections]))}>
                <ResponsiveContainer><LineChart data={act} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" {...axis} tickLine={false} axisLine={false} /><YAxis {...axis} tickLine={false} axisLine={false} allowDecimals={false} /><RTooltip {...tip} /><Line type="monotone" dataKey="activeMembers" name={t('admin.chart.active')} stroke="var(--accent)" strokeWidth={3} dot={{ r: 3, fill: 'var(--accent)' }} isAnimationActive={false} /><Line type="monotone" dataKey="lessons" name={t('admin.chart.lessons')} stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t('admin.chart.pathways')} summary={t('admin.chart.pathwaysSummary', { count: r.pathways.length })} table={tbl([t('admin.chart.pathway'), t('admin.chart.started'), t('admin.chart.finished')], r.pathways.map((p) => [p.title, p.started, p.completed]))}>
                <ResponsiveContainer><BarChart data={r.pathways.map((p) => ({ ...p, short: p.title.length > 16 ? `${p.title.slice(0, 15)}…` : p.title }))} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="short" {...axis} tickLine={false} axisLine={false} /><YAxis {...axis} tickLine={false} axisLine={false} allowDecimals={false} /><RTooltip {...tip} /><Bar dataKey="started" name={t('admin.chart.started')} fill="var(--border-strong)" radius={[6, 6, 0, 0]} isAnimationActive={false} /><Bar dataKey="completed" name={t('admin.chart.finished')} fill="var(--accent)" radius={[6, 6, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t('admin.chart.response')} summary={t('admin.chart.responseSummary')} table={tbl([t('admin.chart.within'), t('admin.chart.count')], r.responseTime.map((x) => [x.bucket, x.count]))}>
                <ResponsiveContainer><BarChart data={r.responseTime} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="bucket" {...axis} tickLine={false} axisLine={false} /><YAxis {...axis} tickLine={false} axisLine={false} allowDecimals={false} /><RTooltip {...tip} /><Bar dataKey="count" name={t('admin.chart.count')} fill="var(--accent)" radius={[6, 6, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer>
              </ChartCard>
              <ChartCard title={t('admin.chart.groups')} summary={t('admin.chart.groupsSummary')} table={tbl([t('admin.groupName'), t('admin.chart.meetings'), t('admin.chart.attendance')], r.groups.map((g) => [g.name, g.meetings, g.averageAttendance]))}>
                <ResponsiveContainer><BarChart data={r.groups.map((g) => ({ ...g, short: g.name.length > 14 ? `${g.name.slice(0, 13)}…` : g.name }))} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="short" {...axis} tickLine={false} axisLine={false} /><YAxis {...axis} tickLine={false} axisLine={false} allowDecimals={false} /><RTooltip {...tip} /><Bar dataKey="averageAttendance" name={t('admin.chart.attendance')} fill="var(--accent)" radius={[6, 6, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer>
              </ChartCard>
              <Card padding="lg" className="flex flex-col gap-2 lg:col-span-2"><h2 className="text-h4 font-semibold">{t('admin.chart.milestones')}</h2>
                {r.milestones.length ? <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{r.milestones.map((m) => <li key={m.key} className="flex items-center justify-between rounded-lg bg-sunken px-3 py-2"><span>{t(`milestones.${m.key}.title`)}</span><span className="font-semibold">{m.count}</span></li>)}</ul> : <p className="text-base text-muted">{t('admin.chart.noData')}</p>}</Card>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}

// ---- Settings, branding, audit ----
const accents = ['clay', 'moss', 'ochre', 'slate'] as const;

export function AdminSettings() {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const qc = useQueryClient();
  const { org } = useSession();
  const w = useWho();
  const audit = useQuery({ queryKey: ['admin-audit', w], queryFn: adminService.audit });
  const update = useMutation({ mutationFn: adminService.updateOrg });
  const [name, setName] = useState(org?.name ?? '');
  const [welcome, setWelcome] = useState(org?.branding.welcomeMessage ?? '');
  if (!org) return null;
  const save = (patch: Parameters<typeof adminService.updateOrg>[0], msg = t('admin.saved')) => update.mutate(patch, { onSuccess: () => { void qc.invalidateQueries(); toast.show({ title: msg, tone: 'success' }); }, onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }) });
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('admin.settingsTitle')} description={t('admin.settingsBody')} />
      <Card padding="lg" className="flex flex-col gap-4"><h2 className="text-h4 font-semibold">{t('admin.branding')}</h2>
        <Field label={t('admin.orgName')}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label={t('admin.welcome')} description={t('admin.welcomeHelp')}>{(p) => <Textarea {...p} rows={2} value={welcome} onChange={(e) => setWelcome(e.target.value)} />}</Field>
        <fieldset><legend className="mb-2 text-sm font-semibold">{t('admin.accent')}</legend><p className="mb-2 text-sm text-muted">{t('admin.accentHelp')}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{accents.map((a) => (
            <button key={a} type="button" aria-pressed={org.branding.accent === a} onClick={() => save({ branding: { accent: a } }, t('admin.accentSaved'))} data-accent={a === 'clay' ? undefined : a} className={cn('hover-lift flex flex-col gap-2 rounded-2xl border-2 bg-surface p-3 text-start', org.branding.accent === a ? 'border-accent' : 'border-line')}>
              <span className="h-10 rounded-lg bg-accent" /><span className="flex items-center gap-1.5 text-sm font-medium">{org.branding.accent === a ? <Check size={14} weight="bold" aria-hidden="true" /> : null}{t(`admin.accentName.${a}`)}</span>
            </button>
          ))}</div>
        </fieldset>
        <div><Button loading={update.isPending} onClick={() => save({ name, branding: { welcomeMessage: welcome || null } })}>{t('actions.save')}</Button></div>
      </Card>
      <Card padding="lg" className="flex flex-col gap-3"><h2 className="text-h4 font-semibold">{t('admin.careSettings')}</h2>
        <Field label={t('admin.quietDays')} description={t('admin.quietHelp')}>{(p) => <Select {...p} value={String(org.settings.attentionAfterDays)} onValueChange={(v) => save({ settings: { attentionAfterDays: Number(v) } })} options={[7, 10, 14, 21, 30].map((d) => ({ value: String(d), label: t('admin.days', { count: d }) }))} />}</Field>
        <Field label={t('admin.responseTarget')} description={t('admin.responseHelp')}>{(p) => <Select {...p} value={String(org.settings.reflectionResponseTargetDays)} onValueChange={(v) => save({ settings: { reflectionResponseTargetDays: Number(v) } })} options={[2, 3, 4, 5, 7].map((d) => ({ value: String(d), label: t('admin.days', { count: d }) }))} />}</Field>
        <Switch label={t('admin.aiToggle')} description={t('admin.aiToggleHelp')} checked={org.settings.aiCompanionEnabled} onCheckedChange={(c) => save({ settings: { aiCompanionEnabled: c } })} />
      </Card>
      <Card padding="lg" className="flex flex-col gap-3"><h2 className="text-h4 font-semibold">{t('admin.audit')}</h2><p className="text-sm text-muted">{t('admin.auditHelp')}</p>
        <QueryState query={audit} skeleton={<SkeletonRow />}>{(list) => list.length ? <ul className="divide-y divide-line">{list.map((e) => <li key={e.id} className="flex flex-wrap items-center gap-2 py-2 text-sm"><span className="font-medium">{e.actor.displayName}</span><span className="text-muted">{t(`admin.auditAction.${e.action.replace('.', '_')}`)}</span><span className="ms-auto text-muted">{f.ago(e.at)}</span></li>)}</ul> : <p className="text-base text-muted">{t('admin.noAudit')}</p>}</QueryState>
      </Card>
    </div>
  );
}
