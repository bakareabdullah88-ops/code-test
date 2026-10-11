import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CalendarBlank, Clock, MapPin, Plus, UserCircle, UsersThree, CheckCircle, Question, XCircle, Armchair } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { ApiError } from '@/lib/db/errors';
import type { EventKind, RsvpStatus } from '@/types';
import { useSession } from '@/features/session/hooks';
import { QueryState } from '@/components/data/query-state';
import { PageCover } from '@/components/patterns/page-cover/page-cover';
import { PropertyList } from '@/components/patterns/property-list/property-list';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { useToast } from '@/components/ui/toast/toast';
import { useCancelEvent, useCreateEvent, useEvent, useEvents, useRsvp } from './hooks';

const kinds: EventKind[] = ['service', 'workshop', 'retreat', 'social', 'prayer'];

function DateTile({ iso }: { iso: string }) {
  const f = useFormat();
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-raised text-center shadow-card transition-transform motion-fast group-hover:-translate-y-0.5" aria-hidden="true">
      <span className="-mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-accent">{f.date(iso, { month: 'short' })}</span>
      <span className="font-serif text-2xl font-semibold leading-none">{f.date(iso, { day: 'numeric' })}</span>
    </span>
  );
}

export function EventsTab() {
  const t = useT();
  const f = useFormat();
  const { roles } = useSession();
  const [scope, setScope] = useState<'upcoming' | 'going' | 'past'>('upcoming');
  const [open, setOpen] = useState(false);
  const q = useEvents(scope);
  const canCreate = roles.includes('leader') || roles.includes('admin');
  const grouped = useMemo(() => {
    const m = new Map<string, NonNullable<typeof q.data>>();
    for (const e of q.data ?? []) { const k = f.date(e.startsAt, { month: 'long', year: 'numeric' }); m.set(k, [...(m.get(k) ?? []), e]); }
    return [...m.entries()];
  // eslint-disable-next-line react-hooks/exhaustive-deps -- f is recreated each render and only formats
  }, [q.data]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label={t('events.scope')} value={scope} onValueChange={(v) => setScope(v as typeof scope)} options={[{ value: 'upcoming', label: t('events.upcoming') }, { value: 'going', label: t('events.going') }, { value: 'past', label: t('events.past') }]} />
        {canCreate ? <Button onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" />{t('events.new')}</Button> : null}
      </div>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}>
        {(list) => list.length ? (
          <div className="flex flex-col gap-8">
            {grouped.map(([month, rows]) => (
              <section key={month} aria-label={month} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{month}</h2>
                <ul className="stagger flex flex-col gap-2">
                  {rows.map((e) => (
                    <li key={e.id}>
                      <Link to={`/app/community/events/${e.id}`} className="group hover-lift flex items-center gap-4 rounded-2xl border border-line bg-surface/80 p-3 pe-4 shadow-card">
                        <DateTile iso={e.startsAt} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-lg font-medium">{e.title}</span>
                          <span className="block truncate text-sm text-muted">{f.dateTime(e.startsAt)} · {e.location}</span>
                        </span>
                        <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                          <Badge tone="neutral">{t(`events.kind.${e.kind}`)}</Badge>
                          <span className="text-xs text-muted">{e.mine ? t(`events.mine.${e.mine}`) : e.full ? t('events.full') : t('events.goingCount', { count: e.goingCount })}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : <EmptyState title={t(scope === 'going' ? 'events.noGoingTitle' : 'events.noneTitle')} description={t(scope === 'going' ? 'events.noGoingBody' : 'events.noneBody')} />}
      </QueryState>
      <CreateEventDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function CreateEventDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const toast = useToast();
  const create = useCreateEvent();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<EventKind>('social');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('90');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [err, setErr] = useState<ApiError | null>(null);
  const fe = (k: string) => (err?.fieldErrors?.[k]?.length ? t(`auth.fieldError.${err.fieldErrors[k]?.[0] ?? 'invalid'}`) : undefined);
  const submit = () => {
    setErr(null);
    create.mutate({ title, kind, startsAt: startsAt ? new Date(startsAt).toISOString() : '', durationMinutes: Number(duration), location, description, capacity: capacity ? Number(capacity) : null }, {
      onSuccess: () => { toast.show({ title: t('events.created') }); onOpenChange(false); setTitle(''); setLocation(''); setDescription(''); setCapacity(''); },
      onError: (e) => setErr(e instanceof ApiError ? e : null),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('events.new')} description={t('events.newBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={create.isPending} onClick={submit}>{t('events.create')}</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label={t('events.title')} error={fe('title')} required>{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('events.kindLabel')}>{(p) => <Select {...p} value={kind} onValueChange={(v) => setKind(v as EventKind)} options={kinds.map((k) => ({ value: k, label: t(`events.kind.${k}`) }))} />}</Field>
            <Field label={t('events.length')}>{(p) => <Select {...p} value={duration} onValueChange={setDuration} options={['60', '90', '120', '180'].map((m) => ({ value: m, label: t('events.minutes', { count: Number(m) }) }))} />}</Field>
          </div>
          <Field label={t('events.when')} error={fe('startsAt')} required>{(p) => <Input {...p} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />}</Field>
          <Field label={t('events.where')} error={fe('location')} required>{(p) => <Input {...p} value={location} onChange={(e) => setLocation(e.target.value)} />}</Field>
          <Field label={t('events.capacity')} description={t('events.capacityHelp')}>{(p) => <Input {...p} type="number" min={1} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} />}</Field>
          <Field label={t('events.about')} description={t('events.aboutHelp')}>{(p) => <Textarea {...p} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const rsvpIcon = { going: CheckCircle, maybe: Question, declined: XCircle } as const;

export function EventPage() {
  const { eventId = '' } = useParams();
  const t = useT();
  const f = useFormat();
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useSession();
  const q = useEvent(eventId);
  const rsvp = useRsvp();
  const cancel = useCancelEvent();
  const set = (id: string, status: RsvpStatus | null, mine: RsvpStatus | null) =>
    rsvp.mutate({ id, status: status === mine ? null : status }, { onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }) });
  return (
    <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-56 w-full" /><Skeleton className="h-10 w-1/2" /></div>}>
      {(e) => {
        const past = new Date(e.endsAt).getTime() < Date.now();
        return (
          <div className="flex flex-col gap-8">
            <PageCover coverKey={e.coverKey} icon={CalendarBlank} title={e.title} description={t(`events.kind.${e.kind}`)} />
            <div className="grid gap-8 px-1 sm:px-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="flex flex-col gap-6">
                <PropertyList items={[
                  { icon: CalendarBlank, label: t('events.when'), value: f.date(e.startsAt, { weekday: 'long', day: 'numeric', month: 'long' }) },
                  { icon: Clock, label: t('events.time'), value: f.date(e.startsAt, { day: 'numeric', month: 'short' }) === f.date(e.endsAt, { day: 'numeric', month: 'short' }) ? `${f.time(e.startsAt)} - ${f.time(e.endsAt)}` : `${f.dateTime(e.startsAt)} - ${f.dateTime(e.endsAt)}` },
                  { icon: MapPin, label: t('events.where'), value: e.location },
                  { icon: UserCircle, label: t('events.host'), value: <span className="inline-flex items-center gap-2"><Avatar name={e.host.displayName} size="sm" />{e.host.displayName}</span> },
                  { icon: Armchair, label: t('events.spots'), value: e.capacity === null ? t('events.openSpots') : t('events.spotsLeft', { left: Math.max(0, e.capacity - e.goingCount), total: e.capacity }) },
                ]} />
                <div className="flex max-w-prose flex-col gap-4 font-serif text-lg leading-relaxed">{e.description.map((p, i) => <p key={i}>{p}</p>)}</div>
              </div>
              <aside className="flex flex-col gap-4 self-start rounded-2xl border border-line bg-surface/80 p-4 shadow-card lg:sticky lg:top-24">
                <h2 className="text-h3 font-semibold">{past ? t('events.finished') : t('events.rsvp')}</h2>
                {past ? <p className="text-muted">{t('events.finishedBody')}</p> : (
                  <div role="group" aria-label={t('events.rsvp')} className="flex flex-col gap-2">
                    {(['going', 'maybe', 'declined'] as const).map((s) => {
                      const Ic = rsvpIcon[s];
                      const on = e.mine === s;
                      return <Button key={s} variant={on ? 'primary' : 'secondary'} aria-pressed={on} disabled={rsvp.isPending || (s === 'going' && e.full && !on)} onClick={() => set(e.id, s, e.mine)} className="justify-start"><Ic size={20} weight={on ? 'fill' : 'regular'} aria-hidden="true" />{t(`events.action.${s}`)}</Button>;
                    })}
                    {e.full && e.mine !== 'going' ? <p className="text-sm text-muted">{t('events.fullNote')}</p> : null}
                  </div>
                )}
                <div className="flex flex-col gap-2 border-t border-line pt-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-muted"><UsersThree size={18} aria-hidden="true" />{t('events.goingCount', { count: e.goingCount })}</h3>
                  <ul className="flex flex-wrap gap-1.5" aria-label={t('events.attendees')}>{e.attendees.slice(0, 12).map((a) => <li key={a.id}><Avatar name={a.displayName} size="sm" /></li>)}</ul>
                </div>
                {e.host.id === user?.id ? <Button variant="ghost" loading={cancel.isPending} onClick={() => cancel.mutate(e.id, { onSuccess: () => { toast.show({ title: t('events.cancelled') }); nav('/app/community/events'); } })}>{t('events.cancel')}</Button> : null}
              </aside>
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
