import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Plus } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useAffirm, useMentee, useSaveNote, useScheduleCheckIn, useUpdateCheckIn, useUpdateGoal } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/tabs';
import { Progress } from '@/components/ui/progress/progress';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { Field } from '@/components/ui/field/field';
import { Input } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { RichEditor } from '@/components/content/rich-editor';
import { RichView } from '@/components/content/rich-view';
import { TimelineList } from '@/features/growth/timeline';
import { GoalCard, GoalDialog } from '@/features/growth/milestones-tab';
import { emptyDoc } from '@/lib/editor/text';
import { excerpt } from '@/lib/editor/text';
import { useToast } from '@/components/ui/toast/toast';
import { Notice } from '@/components/patterns/notice/notice';
import { milestoneDefinitions } from '@/lib/services/engine';
import type { CheckIn, RichDoc } from '@/types';

export function MenteePage() {
  const { menteeId = '' } = useParams();
  const t = useT();
  const f = useFormat();
  const [params, setParams] = useSearchParams();
  const q = useMentee(menteeId);
  return (
    <div className="flex flex-col gap-6">
      <Link to="/mentor/mentees" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('mentor.mentees.title')}</Link>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-16 w-full" /><SkeletonText lines={5} /></div>}>
        {(d) => (
          <>
            <header className="flex flex-wrap items-center gap-4">
              <Avatar name={d.user?.displayName ?? ''} size="lg" />
              <div className="min-w-0 flex-1"><h1 className="text-h2 font-semibold">{d.user?.displayName}</h1><p className="text-base text-muted">{d.user?.bio}</p><p className="text-sm text-subtle">{d.lastActiveAt ? t('mentor.mentees.lastActive', { when: f.ago(d.lastActiveAt) }) : t('mentor.mentees.neverActive')}</p></div>
            </header>
            <Notice>{t('mentor.mentee.visibilityNote', { name: d.user?.displayName.split(' ')[0] ?? '' })}</Notice>
            <Tabs value={params.get('tab') ?? 'overview'} onValueChange={(v) => setParams({ tab: v })}>
              <TabsList aria-label={t('mentor.mentee.sections')}>
                {(['overview', 'reflections', 'goals', 'sessions'] as const).map((k) => <TabsTrigger key={k} value={k}>{t(`mentor.mentee.tab.${k}`)}</TabsTrigger>)}
              </TabsList>
              <TabsContent value="overview"><Overview d={d} menteeId={menteeId} /></TabsContent>
              <TabsContent value="reflections">
                {d.reflections.length ? <ul className="flex flex-col gap-3">{d.reflections.map((r) => (
                  <li key={r.id}><Link to={`/mentor/feedback/${r.id}`} className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4 hover:bg-sunken"><div className="flex items-center gap-2"><span className="font-medium">{r.lessonTitle ?? r.title ?? t('learn.journal.entry')}</span>{r.feedbackStatus === 'awaiting' ? <Badge tone="accent">{t('mentor.feedback.waiting')}</Badge> : <Badge tone="success">{t('mentor.feedback.replied')}</Badge>}<span className="ms-auto text-sm text-muted">{r.submittedAt ? f.ago(r.submittedAt) : ''}</span></div><p className="line-clamp-2 font-serif text-base text-muted">{excerpt(r.plainText, 180)}</p></Link></li>
                ))}</ul> : <p className="text-base text-muted">{t('mentor.mentee.noReflections', { name: d.user?.displayName.split(' ')[0] ?? '' })}</p>}
              </TabsContent>
              <TabsContent value="goals"><GoalsTab menteeId={menteeId} goals={d.goals} /></TabsContent>
              <TabsContent value="sessions"><SessionsTab menteeId={menteeId} d={d} /></TabsContent>
            </Tabs>
          </>
        )}
      </QueryState>
    </div>
  );
}

type Overview = NonNullable<ReturnType<typeof useMentee>['data']>;

function Overview({ d, menteeId }: { d: Overview; menteeId: string }) {
  const t = useT();
  const f = useFormat();
  const affirm = useAffirm();
  const toast = useToast();
  const [key, setKey] = useState('');
  const first = d.user?.displayName.split(' ')[0] ?? '';
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3"><h2 className="text-h3 font-semibold">{t('mentor.mentee.pathways')}</h2>
          {d.enrollments.length ? d.enrollments.map((e) => (
            <Card key={e.id} className="flex flex-col gap-2"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{e.pathwayTitle}</span><Badge tone={e.status === 'completed' ? 'success' : 'neutral'}>{t(`mentor.mentee.enrol.${e.status}`)}</Badge></div><Progress value={e.total ? (e.completed / e.total) * 100 : 0} label={e.pathwayTitle} valueText={t('learn.pathway.progressText', { done: e.completed, total: e.total })} /><p className="text-sm text-muted">{t('learn.pathway.progressText', { done: e.completed, total: e.total })}</p></Card>
          )) : <p className="text-base text-muted">{t('mentor.mentee.noPathways')}</p>}
        </section>
        <section className="flex flex-col gap-3"><h2 className="text-h3 font-semibold">{t('mentor.mentee.journey')}</h2><TimelineList userId={menteeId} showFilters={false} /></section>
      </div>
      <aside className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3"><h2 className="text-h4 font-semibold">{t('mentor.mentee.milestones')}</h2>
          {d.milestones.length ? <ul className="flex flex-col gap-2">{d.milestones.map((m) => <li key={m.id} className="text-base"><span className="font-medium">{t(`milestones.${m.key}.title`)}</span><span className="block text-sm text-muted">{f.date(m.awardedAt)}{m.affirmedBy ? ` · ${t('mentor.mentee.affirmed')}` : ''}</span></li>)}</ul> : <p className="text-sm text-muted">{t('mentor.mentee.noMilestones')}</p>}
          <Field label={t('mentor.mentee.affirmLabel')} description={t('mentor.mentee.affirmHelp', { name: first })}>
            {(p) => <Select {...p} value={key} onValueChange={setKey} placeholder={t('mentor.mentee.affirmPlaceholder')} options={milestoneDefinitions.map((m) => ({ value: m.key, label: t(m.titleKey) }))} />}
          </Field>
          <Button variant="secondary" disabled={!key} loading={affirm.isPending} onClick={() => affirm.mutate({ userId: menteeId, key }, { onSuccess: () => { toast.show({ title: t('mentor.mentee.affirmedToast', { name: first }), tone: 'success' }); setKey(''); } })}>{t('mentor.mentee.affirm')}</Button>
        </Card>
      </aside>
    </div>
  );
}

function GoalsTab({ menteeId, goals }: { menteeId: string; goals: Overview['goals'] }) {
  const t = useT();
  const f = useFormat();
  const update = useUpdateGoal();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div><Button variant="secondary" onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('mentor.mentee.newGoal')}</Button></div>
      {goals.length ? <ul className="flex flex-col gap-3">{goals.map((g) => <li key={g.id}><GoalCard goal={g} f={f} onToggleStep={(sid, done) => update.mutate({ id: g.id, patch: { steps: g.steps.map((s) => (s.id === sid ? { ...s, done } : s)) } })} onStatus={(status) => update.mutate({ id: g.id, patch: { status } })} /></li>)}</ul> : <p className="text-base text-muted">{t('learn.goals.none')}</p>}
      <GoalDialog open={open} onOpenChange={setOpen} userId={menteeId} />
    </div>
  );
}

function SessionsTab({ menteeId, d }: { menteeId: string; d: Overview }) {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const schedule = useScheduleCheckIn();
  const updateC = useUpdateCheckIn();
  const saveNote = useSaveNote();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState('');
  const [mode, setMode] = useState<CheckIn['mode']>('call');
  const [agenda, setAgenda] = useState('');
  const [note, setNote] = useState<RichDoc>(emptyDoc());
  const [noteKey, setNoteKey] = useState(0);
  const first = d.user?.displayName.split(' ')[0] ?? '';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2"><h2 className="text-h3 font-semibold">{t('mentor.mentee.checkIns')}</h2><Button variant="secondary" size="sm" onClick={() => setOpen(true)}><Plus size={16} aria-hidden="true" />{t('mentor.mentee.schedule')}</Button></div>
        {d.checkIns.length ? <ul className="flex flex-col gap-3">{d.checkIns.map((c) => (
          <li key={c.id}><Card className="flex flex-col gap-2"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{f.dateTime(c.scheduledAt)}</span><Badge tone={c.status === 'held' ? 'success' : 'neutral'}>{t(`mentor.status.${c.status}`)}</Badge><span className="text-sm text-muted">{t(`mentor.mode.${c.mode}`)}</span></div>
            {c.agenda.length ? <ul className="list-disc ps-5 text-base text-muted">{c.agenda.map((a) => <li key={a}>{a}</li>)}</ul> : null}
            {c.sharedSummary ? <div className="rounded-md bg-sunken p-3"><p className="text-sm font-semibold">{t('mentor.mentee.sharedSummary')}</p><RichView doc={c.sharedSummary} className="prose-reading text-[length:0.9em]" /></div> : null}
            {c.status === 'planned' ? <div className="flex gap-2"><Button size="sm" onClick={() => updateC.mutate({ id: c.id, patch: { status: 'held' } }, { onSuccess: () => toast.show({ title: t('mentor.mentee.markedHeld'), tone: 'success' }) })}>{t('mentor.mentee.markHeld')}</Button><Button size="sm" variant="ghost" onClick={() => updateC.mutate({ id: c.id, patch: { status: 'cancelled' } })}>{t('mentor.mentee.cancelCheckIn')}</Button></div> : null}
          </Card></li>
        ))}</ul> : <p className="text-base text-muted">{t('mentor.mentee.noCheckIns')}</p>}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-h3 font-semibold">{t('mentor.mentee.notes')}</h2>
        <Notice>{t('mentor.mentee.notesPrivate', { name: first })}</Notice>
        <RichEditor key={noteKey} label={t('mentor.mentee.noteLabel')} placeholder={t('mentor.mentee.notePlaceholder')} value={note} onChange={setNote} minHeight="sm" />
        <div><Button loading={saveNote.isPending} onClick={() => saveNote.mutate({ menteeId, body: note }, { onSuccess: () => { setNote(emptyDoc()); setNoteKey((k) => k + 1); toast.show({ title: t('mentor.mentee.noteSaved'), tone: 'success' }); } })}>{t('mentor.mentee.saveNote')}</Button></div>
        {d.notes.map((n) => <Card key={n.id} className="flex flex-col gap-1"><p className="text-sm text-muted">{f.date(n.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p><RichView doc={n.body} className="prose-reading text-[length:0.95em]" /></Card>)}
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t('mentor.mentee.schedule')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={schedule.isPending} disabled={!when} onClick={() => schedule.mutate({ menteeId, scheduledAt: new Date(when).toISOString(), durationMin: 30, mode, agenda: agenda.split('\n').map((x) => x.trim()).filter(Boolean) }, { onSuccess: () => { setOpen(false); toast.show({ title: t('mentor.mentee.scheduled'), tone: 'success' }); } })}>{t('mentor.mentee.scheduleConfirm')}</Button></>}>
          <div className="flex flex-col gap-4">
            <Field label={t('mentor.mentee.when')} required>{(p) => <Input {...p} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>
            <Field label={t('mentor.mentee.how')}>{(p) => <Select {...p} value={mode} onValueChange={(v) => setMode(v as CheckIn['mode'])} options={(['call', 'video', 'in_person', 'message'] as const).map((m) => ({ value: m, label: t(`mentor.mode.${m}`) }))} />}</Field>
            <Field label={t('mentor.mentee.agenda')} description={t('mentor.mentee.agendaHelp')}>{(p) => <Input {...p} value={agenda} onChange={(e) => setAgenda(e.target.value)} />}</Field>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
