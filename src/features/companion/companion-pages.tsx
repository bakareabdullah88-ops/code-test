import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, PaperPlaneTilt, Plus, Robot, Sparkle, Trash } from '@phosphor-icons/react';
import type { AiMessage } from '@/types';
import { useT, useFormat } from '@/lib/i18n';
import { aiService } from '@/lib/services/ai';
import { reflectionsService } from '@/lib/services/reflections';
import { formatRef } from '@/lib/bible/ref';
import { ApiError } from '@/lib/db/errors';
import { useSessionState } from '@/lib/db/session';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Notice } from '@/components/patterns/notice/notice';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { Textarea } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { Skeleton } from '@/components/ui/skeleton/skeleton';
import { PassageText } from '@/components/content/scripture';
import { LampIllustration } from '@/components/icons/illustrations';
import { useToast } from '@/components/ui/toast/toast';
import { cn } from '@/lib/cn';
import { useMentees } from '@/features/mentoring/hooks';
import { useQueryClient } from '@tanstack/react-query';

export function AiLabel() {
  const t = useT();
  return <Badge tone="accent" icon={<Robot size={12} />}>{t('companion.label')}</Badge>;
}

export function CompanionPage() {
  const t = useT();
  const toast = useToast();
  const nav = useNavigate();
  const qc = useQueryClient();
  const who = useSessionState();
  const status = useQuery({ queryKey: ['ai-status', who.userId, who.orgId], queryFn: aiService.status });
  const convs = useQuery({ queryKey: ['ai-convs', who.userId], queryFn: aiService.conversations });
  const [active, setActive] = useState<string | null>(null);
  const create = useMutation({ mutationFn: () => aiService.create(null) });
  const remove = useMutation({ mutationFn: (id: string) => aiService.remove(id) });
  const msgs = useQuery({ queryKey: ['ai-msgs', active], queryFn: () => aiService.messages(active ?? ''), enabled: !!active });
  const ask = useMutation({ mutationFn: (v: { id: string; content: string }) => aiService.ask(v.id, v.content) });
  const [text, setText] = useState('');
  const [typing, setTyping] = useState<{ id: string; shown: number } | null>(null);
  const [shareFor, setShareFor] = useState<AiMessage | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!active && convs.data?.[0]) setActive(convs.data[0].id); }, [convs.data, active]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.data?.length, typing?.shown]);

  const send = async (content: string) => {
    if (!content.trim()) return;
    let id = active;
    if (!id) { const c = await create.mutateAsync(); id = c.id; setActive(c.id); }
    setText('');
    ask.mutate({ id, content }, {
      onSuccess: (r) => {
        const reduce = document.documentElement.getAttribute('data-motion') === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        void qc.invalidateQueries();
        if (reduce) return;
        const words = r.assistant.content.split(' ').length;
        setTyping({ id: r.assistant.id, shown: 0 });
        let n = 0;
        const timer = window.setInterval(() => { n += 3; setTyping({ id: r.assistant.id, shown: n }); if (n >= words) { window.clearInterval(timer); setTyping(null); } }, 45);
      },
      onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }),
    });
  };

  const prompts = [t('companion.prompt1'), t('companion.prompt2'), t('companion.prompt3'), t('companion.prompt4')];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('companion.title')} description={t('companion.description')} actions={<AiLabel />} />
      <QueryState query={status} skeleton={<Skeleton className="h-40 w-full" />}>
        {(s) => !s.enabled ? <EmptyState illustration={<LampIllustration />} title={t('companion.offTitle')} description={t('companion.offBody')} /> : (
          <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
            <aside className="flex flex-col gap-2" aria-label={t('companion.history')}>
              <Button variant="secondary" loading={create.isPending} onClick={() => create.mutate(undefined, { onSuccess: (c) => { setActive(c.id); void qc.invalidateQueries(); } })}><Plus size={18} aria-hidden="true" />{t('companion.new')}</Button>
              <ul className="flex flex-col gap-1">
                {convs.data?.map((c) => (
                  <li key={c.id} className="flex items-center gap-1">
                    <button type="button" aria-current={c.id === active} onClick={() => setActive(c.id)} className={cn('min-h-11 flex-1 truncate rounded-xl px-3 text-start text-base transition-colors motion-fast', c.id === active ? 'bg-accent-soft text-accent-soft-ink' : 'hover:bg-sunken')}>{c.title || t('companion.untitled')}</button>
                    <button type="button" aria-label={t('companion.delete')} onClick={() => remove.mutate(c.id, { onSuccess: () => { if (active === c.id) setActive(null); } })} className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-sunken"><Trash size={18} aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            </aside>
            <section className="glass flex min-h-[28rem] flex-col rounded-2xl border" aria-label={t('companion.conversation')}>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6" role="log" aria-live="polite">
                <Notice>{t('companion.disclaimer')}</Notice>
                {!msgs.data?.length && !ask.isPending ? (
                  <div className="flex flex-col gap-3"><p className="text-base text-muted">{t('companion.start')}</p><div className="flex flex-wrap gap-2">{prompts.map((p) => <Button key={p} variant="secondary" size="sm" onClick={() => void send(p)}>{p}</Button>)}</div></div>
                ) : null}
                {msgs.data?.map((m) => {
                  const words = m.content.split(' ');
                  const partial = typing?.id === m.id ? words.slice(0, typing.shown).join(' ') : m.content;
                  return (
                    <div key={m.id} className={cn('enter flex max-w-[92%] flex-col gap-2', m.role === 'user' ? 'self-end' : 'self-start')}>
                      {m.role === 'assistant' ? <div className="flex items-center gap-2"><AiLabel /><span className="text-xs text-muted">{t('companion.canned')}</span></div> : null}
                      <div className={cn('rounded-2xl px-4 py-3 text-base', m.role === 'user' ? 'bg-accent text-on-accent' : m.safety === 'handoff' ? 'border border-warning bg-warning-soft text-ink' : 'border border-line bg-surface text-ink')}>
                        {partial.split('\n\n').map((p, i) => <p key={i} className={i ? 'mt-2' : undefined}>{p}</p>)}
                      </div>
                      {m.role === 'assistant' && typing?.id !== m.id ? (
                        <>
                          {m.citations.length ? <details className="text-sm"><summary className="min-h-11 cursor-pointer py-2 text-accent-soft-ink">{t('companion.passages', { count: m.citations.length })}</summary><div className="flex flex-col gap-3 rounded-lg bg-sunken p-3">{m.citations.map((c) => <div key={formatRef(c)}><p className="text-sm font-medium">{formatRef(c)}</p><PassageText range={c} className="text-base" /></div>)}</div></details> : null}
                          {m.safety === 'ok' ? <div className="flex flex-wrap gap-2"><SaveButton content={m.content} /><Button size="sm" variant="secondary" onClick={() => setShareFor(m)}>{t('companion.share')}</Button></div> : null}
                        </>
                      ) : null}
                    </div>
                  );
                })}
                {ask.isPending ? <div className="self-start rounded-2xl border border-line bg-surface px-4 py-3 text-muted" role="status"><span className="inline-flex gap-1" aria-label={t('companion.thinking')}>{[0, 1, 2].map((i) => <span key={i} className="size-2 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 150}ms` }} />)}</span></div> : null}
                <div ref={endRef} />
              </div>
              <form className="flex items-end gap-2 border-t border-glass-line p-3" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
                <Field className="flex-1" label={t('companion.ask')}>{(p) => <Textarea {...p} rows={2} value={text} maxLength={2000} placeholder={t('companion.placeholder')} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(text); } }} />}</Field>
                <Button type="submit" size="lg" loading={ask.isPending} disabled={!text.trim()} className="mb-0.5"><PaperPlaneTilt size={18} aria-hidden="true" />{t('companion.send')}</Button>
              </form>
            </section>
          </div>
        )}
      </QueryState>
      <ShareDialog message={shareFor} onClose={() => setShareFor(null)} onDone={() => { setShareFor(null); nav('/app/companion'); }} />
    </div>
  );
}

function SaveButton({ content }: { content: string }) {
  const t = useT();
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  return (
    <Button size="sm" variant="secondary" disabled={saved} onClick={async () => {
      try {
        await reflectionsService.create({ title: t('companion.savedTitle'), body: { type: 'doc', content: content.split('\n\n').map((x) => ({ type: 'paragraph', content: [{ type: 'text', text: x }] })) } });
        setSaved(true);
        toast.show({ title: t('companion.savedToast'), description: t('companion.savedPrivate'), tone: 'success' });
      } catch { toast.show({ title: t('states.errorTitle'), tone: 'danger' }); }
    }}>{saved ? <><Check size={16} aria-hidden="true" />{t('companion.saved')}</> : t('companion.save')}</Button>
  );
}

function ShareDialog({ message, onClose, onDone }: { message: AiMessage | null; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const who = useSessionState();
  const mine = useQuery({ queryKey: ['my-reflections-ai', who.userId], queryFn: () => reflectionsService.list({ scope: 'mine' }), enabled: !!message });
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const req = useMutation({ mutationFn: () => aiService.requestShare(message?.id ?? '', { type: 'reflection', id: target }, note) });
  const list = (mine.data ?? []).filter((r) => r.status === 'submitted' && r.visibility !== 'private');
  return (
    <Dialog open={!!message} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={t('companion.shareTitle')} description={t('companion.shareBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={req.isPending} disabled={!target} onClick={() => req.mutate(undefined, { onSuccess: () => { toast.show({ title: t('companion.shareSent'), description: t('companion.shareSentBody'), tone: 'success' }); onDone(); }, onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }) })}>{t('companion.askMentor')}</Button></>}>
        <div className="flex flex-col gap-4">
          {list.length ? <Field label={t('companion.shareWhere')} description={t('companion.shareWhereHelp')}>{(p) => <Select {...p} value={target} onValueChange={setTarget} placeholder={t('companion.chooseReflection')} options={list.map((r) => ({ value: r.id, label: r.title ?? r.lessonTitle ?? t('learn.journal.entry') }))} />}</Field> : <Notice tone="warning">{t('companion.noSharedReflections')}</Notice>}
          <Field label={t('companion.shareNote')}>{(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ApprovalsPage() {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const who = useSessionState();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const q = useQuery({ queryKey: ['approvals', tab, who.userId], queryFn: () => aiService.approvals(tab) });
  const decide = useMutation({ mutationFn: (v: { id: string; decision: 'approve' | 'decline'; editedContent?: string; note?: string }) => aiService.decide(v.id, v) });
  const qc = useQueryClient();
  const mentees = useMentees();
  void mentees;
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('companion.approvalsTitle')} description={t('companion.approvalsBody')} />
      <div role="group" aria-label={t('companion.approvalsFilter')} className="flex gap-2">{(['pending', 'all'] as const).map((k) => <Button key={k} size="sm" variant={tab === k ? 'primary' : 'secondary'} aria-pressed={tab === k} onClick={() => setTab(k)}>{t(`companion.tab.${k}`)}</Button>)}</div>
      <QueryState query={q} skeleton={<Skeleton className="h-40 w-full" />}>
        {(list) => list.length ? (
          <ul className="stagger flex flex-col gap-4">{list.map((a) => (
            <li key={a.id}><Card padding="lg" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{t('companion.fromPerson', { name: a.requester.displayName })}</span><AiLabel /><Badge tone={a.status === 'approved' ? 'success' : a.status === 'declined' ? 'danger' : 'warning'}>{t(`companion.status.${a.status}`)}</Badge><span className="ms-auto text-sm text-muted">{f.ago(a.createdAt)}</span></div>
              {a.question ? <p className="text-base"><span className="font-medium">{t('companion.theyAsked')}</span> {a.question}</p> : null}
              {a.decisionNote && a.status === 'pending' ? <p className="text-sm text-muted">{t('companion.theirNote')} {a.decisionNote}</p> : null}
              {a.status === 'pending' ? (
                <>
                  <Field label={t('companion.reviewLabel')} description={t('companion.reviewHelp')}>{(p) => <Textarea {...p} rows={6} value={edits[a.id] ?? a.content} onChange={(e) => setEdits((s) => ({ ...s, [a.id]: e.target.value }))} />}</Field>
                  <Field label={t('companion.noteLabel')}>{(p) => <Textarea {...p} rows={2} value={notes[a.id] ?? ''} onChange={(e) => setNotes((s) => ({ ...s, [a.id]: e.target.value }))} />}</Field>
                  <div className="flex flex-wrap gap-2">
                    <Button loading={decide.isPending} onClick={() => decide.mutate({ id: a.id, decision: 'approve', editedContent: edits[a.id], note: notes[a.id] }, { onSuccess: () => { toast.show({ title: t('companion.approvedToast'), tone: 'success' }); void qc.invalidateQueries(); } })}>{t('companion.approve')}</Button>
                    <Button variant="secondary" onClick={() => decide.mutate({ id: a.id, decision: 'decline', note: notes[a.id] }, { onSuccess: () => { toast.show({ title: t('companion.declinedToast'), tone: 'success' }); void qc.invalidateQueries(); } })}>{t('companion.decline')}</Button>
                  </div>
                </>
              ) : <p className="whitespace-pre-line text-base text-muted">{a.editedContent ?? a.content}</p>}
            </Card></li>
          ))}</ul>
        ) : <EmptyState illustration={<Sparkle size={48} aria-hidden="true" />} title={t('companion.approvalsEmptyTitle')} description={t('companion.approvalsEmptyBody')} />}
      </QueryState>
    </div>
  );
}
