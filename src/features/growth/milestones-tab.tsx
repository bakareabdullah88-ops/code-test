import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { useMilestones } from './hooks';
import { useCreateGoal, useGoals, useUpdateGoal } from '@/features/mentoring/hooks';
import { QueryState } from '@/components/data/query-state';
import { Card } from '@/components/ui/card/card';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { LampIllustration } from '@/components/icons/illustrations';
import { useToast } from '@/components/ui/toast/toast';
import type { Goal } from '@/types';

export function MilestonesTab() {
  const t = useT();
  const f = useFormat();
  const m = useMilestones();
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="ms-h" className="flex flex-col gap-3">
        <h2 id="ms-h" className="text-h3 font-semibold">{t('learn.milestones.earned')}</h2>
        <p className="max-w-prose text-base text-muted">{t('learn.milestones.intro')}</p>
        <QueryState query={m} skeleton={<SkeletonRow />}>
          {(d) => (
            <>
              {d.earned.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {d.earned.map((x) => (
                    <li key={x.id}>
                      <Card className="flex h-full flex-col gap-1 bg-accent-soft">
                        <h3 className="font-sans text-base font-semibold text-ink">{t(`milestones.${x.key}.title`)}</h3>
                        <p className="text-sm text-muted">{t(`milestones.${x.key}.meaning`)}</p>
                        <p className="mt-1 text-sm text-subtle">{f.date(x.awardedAt, { day: 'numeric', month: 'long', year: 'numeric' })}{x.affirmer ? ` · ${t('learn.milestones.affirmedBy', { name: x.affirmer.displayName })}` : ''}</p>
                        {x.note ? <p className="mt-1 font-serif text-base italic text-ink">&ldquo;{x.note}&rdquo;</p> : null}
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState illustration={<LampIllustration />} title={t('learn.milestones.noneTitle')} description={t('learn.milestones.noneBody')} />}
              {d.upcoming.length ? (
                <div className="flex flex-col gap-2">
                  <h3 className="text-h4 font-semibold">{t('learn.milestones.ahead')}</h3>
                  <ul className="flex flex-col gap-2">{d.upcoming.map((u) => <li key={u.key} className="rounded-md border border-line px-4 py-3"><p className="font-medium">{t(`milestones.${u.key}.title`)}</p><p className="text-sm text-muted">{t(`milestones.${u.key}.meaning`)}</p></li>)}</ul>
                </div>
              ) : null}
            </>
          )}
        </QueryState>
      </section>
      <GoalsSection />
    </div>
  );
}

function GoalsSection() {
  const t = useT();
  const f = useFormat();
  const q = useGoals();
  const update = useUpdateGoal();
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="goals-h" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="goals-h" className="text-h3 font-semibold">{t('learn.goals.title')}</h2><Button variant="secondary" onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('learn.goals.new')}</Button></div>
      <QueryState query={q} skeleton={<SkeletonRow />}>
        {(goals) => goals.length ? (
          <ul className="flex flex-col gap-3">
            {goals.map((g) => <li key={g.id}><GoalCard goal={g} onToggleStep={(sid, done) => update.mutate({ id: g.id, patch: { steps: g.steps.map((s) => (s.id === sid ? { ...s, done } : s)) } })} onStatus={(status) => update.mutate({ id: g.id, patch: { status } })} f={f} /></li>)}
          </ul>
        ) : <p className="text-base text-muted">{t('learn.goals.none')}</p>}
      </QueryState>
      <GoalDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}

export function GoalCard({ goal: g, onToggleStep, onStatus, f }: { goal: Goal; onToggleStep: (stepId: string, done: boolean) => void; onStatus: (s: Goal['status']) => void; f: ReturnType<typeof useFormat> }) {
  const t = useT();
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-sans text-base font-semibold">{g.title}</h3>
        {g.status === 'completed' ? <Badge tone="success">{t('learn.goals.completed')}</Badge> : g.status === 'paused' ? <Badge>{t('learn.goals.paused')}</Badge> : null}
        {g.kind === 'mentor_set' ? <Badge tone="accent">{t('learn.goals.fromMentor')}</Badge> : null}
        {g.targetDate ? <span className="ms-auto text-sm text-muted">{t('learn.goals.by', { date: f.date(g.targetDate, { day: 'numeric', month: 'short' }) })}</span> : null}
      </div>
      {g.description ? <p className="text-base text-muted">{g.description}</p> : null}
      {g.mentorNote ? <p className="font-serif text-base italic text-muted">&ldquo;{g.mentorNote}&rdquo;</p> : null}
      {g.steps.length ? <div>{g.steps.map((s) => <Checkbox key={s.id} label={s.label} checked={s.done} disabled={g.status === 'completed'} onCheckedChange={(c) => onToggleStep(s.id, c === true)} />)}</div> : null}
      <div className="flex flex-wrap gap-2">
        {g.status === 'active' ? <><Button size="sm" onClick={() => onStatus('completed')}>{t('learn.goals.complete')}</Button><Button size="sm" variant="ghost" onClick={() => onStatus('paused')}>{t('learn.goals.pause')}</Button></> : null}
        {g.status === 'paused' ? <Button size="sm" variant="secondary" onClick={() => onStatus('active')}>{t('learn.goals.resume')}</Button> : null}
      </div>
    </Card>
  );
}

export function GoalDialog({ open, onOpenChange, userId }: { open: boolean; onOpenChange: (o: boolean) => void; userId?: string }) {
  const t = useT();
  const create = useCreateGoal();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [steps, setSteps] = useState('');
  const [error, setError] = useState<string | undefined>();
  const submit = () => {
    if (!title.trim()) { setError(t('learn.goals.titleRequired')); return; }
    create.mutate({ userId, title: title.trim(), targetDate: date || null, steps: steps.split('\n').map((s) => s.trim()).filter(Boolean) }, {
      onSuccess: () => { toast.show({ title: t('learn.goals.created'), tone: 'success' }); setTitle(''); setDate(''); setSteps(''); setError(undefined); onOpenChange(false); },
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('learn.goals.new')} description={t('learn.goals.newHelp')} closeLabel={t('actions.close')}
        footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} onClick={submit}>{t('learn.goals.create')}</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label={t('learn.goals.titleLabel')} error={error} required>{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
          <Field label={t('learn.goals.dateLabel')}>{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
          <Field label={t('learn.goals.stepsLabel')} description={t('learn.goals.stepsHelp')}>{(p) => <Textarea {...p} rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} />}</Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
