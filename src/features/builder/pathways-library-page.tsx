import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { usePathways } from '@/features/learning/hooks';
import { PathwayCard } from '@/features/learning/pathway-card';
import { useCreatePathway } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { PathIllustration } from '@/components/icons/illustrations';
import { Cover, coverKeys } from '@/components/content/cover';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/toast/toast';

export function PathwaysLibraryPage() {
  const t = useT();
  const nav = useNavigate();
  const toast = useToast();
  const mine = usePathways('mine');
  const lib = usePathways('library');
  const create = useCreatePathway();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [level, setLevel] = useState<'new_to_faith' | 'growing' | 'leading'>('growing');
  const [cover, setCover] = useState('dawn');
  const [from, setFrom] = useState('blank');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    if (!title.trim()) { setError(t('mentor.builder.titleRequired')); return; }
    create.mutate({ title: title.trim(), summary: summary.trim(), audience: t(`learn.level.${level}`), level, coverKey: cover, fromPathwayId: from === 'blank' ? undefined : from }, {
      onSuccess: (p) => { setOpen(false); toast.show({ title: t('mentor.builder.created'), tone: 'success' }); nav(`/mentor/pathways/${p.id}`); },
    });
  };

  const grid = <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Card key={i} padding="none"><Skeleton className="h-32 w-full rounded-none" /><div className="p-4"><Skeleton className="h-5 w-2/3" /></div></Card>)}</div>;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('mentor.builder.libraryTitle')} description={t('mentor.builder.libraryDescription')} actions={<Button onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('mentor.builder.new')}</Button>} />
      <section aria-labelledby="mine-p" className="flex flex-col gap-3">
        <h2 id="mine-p" className="text-h3 font-semibold">{t('mentor.builder.mine')}</h2>
        <QueryState query={mine} skeleton={grid}>
          {(list) => list.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <li key={p.id} className="flex"><PathwayCard className="w-full" pathway={p} href={`/mentor/pathways/${p.id}`} showProgress={false} /></li>)}</ul> : <EmptyState illustration={<PathIllustration />} title={t('mentor.builder.noneTitle')} description={t('mentor.builder.noneBody')} action={<Button onClick={() => setOpen(true)}>{t('mentor.builder.new')}</Button>} />}
        </QueryState>
      </section>
      <section aria-labelledby="all-p" className="flex flex-col gap-3">
        <h2 id="all-p" className="text-h3 font-semibold">{t('mentor.builder.organisation')}</h2>
        <QueryState query={lib} skeleton={grid}>
          {(list) => <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <li key={p.id} className="flex"><PathwayCard className="w-full" pathway={p} href={`/mentor/pathways/${p.id}`} showProgress={false} /></li>)}</ul>}
        </QueryState>
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t('mentor.builder.new')} description={t('mentor.builder.newHelp')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} onClick={submit}>{t('mentor.builder.createConfirm')}</Button></>}>
          <div className="flex flex-col gap-4">
            <Field label={t('mentor.builder.titleLabel')} error={error} required>{(p) => <Input {...p} value={title} onChange={(e) => { setTitle(e.target.value); setError(undefined); }} />}</Field>
            <Field label={t('mentor.builder.summaryLabel')}>{(p) => <Textarea {...p} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />}</Field>
            <Field label={t('mentor.builder.levelLabel')}>{() => <SegmentedControl label={t('mentor.builder.levelLabel')} value={level} onValueChange={(v) => setLevel(v as typeof level)} options={(['new_to_faith', 'growing', 'leading'] as const).map((l) => ({ value: l, label: t(`learn.level.${l}`) }))} />}</Field>
            <Field label={t('mentor.builder.fromLabel')} description={t('mentor.builder.fromHelp')}>{(p) => <Select {...p} value={from} onValueChange={setFrom} options={[{ value: 'blank', label: t('mentor.builder.fromBlank') }, ...(lib.data ?? []).map((x) => ({ value: x.id, label: x.title }))]} />}</Field>
            <fieldset><legend className="mb-1.5 text-sm font-medium">{t('mentor.builder.coverLabel')}</legend>
              <div className="grid grid-cols-4 gap-2">{coverKeys.map((k) => <button key={k} type="button" aria-pressed={cover === k} aria-label={t(`mentor.builder.cover.${k}`)} onClick={() => setCover(k)} className={cn('h-14 overflow-hidden rounded-md border-2', cover === k ? 'border-accent' : 'border-line')}><Cover coverKey={k} /></button>)}</div>
            </fieldset>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
