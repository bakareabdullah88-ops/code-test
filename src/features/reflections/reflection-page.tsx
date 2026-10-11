import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, PencilSimple, Trash } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { useMarkFeedbackRead, useDeleteReflection, useReflection, useWithdrawReflection } from './hooks';
import { VisibilityBadge } from './reflection-card';
import { ReflectionComposer } from './reflection-composer';
import { QueryState } from '@/components/data/query-state';
import { RichView } from '@/components/content/rich-view';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { useToast } from '@/components/ui/toast/toast';
import { useEffect } from 'react';

export function ReflectionPage({ backTo = '/app/journal' }: { backTo?: string }) {
  const { reflectionId } = useParams();
  const t = useT();
  const f = useFormat();
  const nav = useNavigate();
  const toast = useToast();
  const q = useReflection(reflectionId);
  const markRead = useMarkFeedbackRead();
  const withdraw = useWithdrawReflection();
  const del = useDeleteReflection();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const unread = q.data?.isAuthor ? q.data.feedback.filter((x) => !x.readAt).map((x) => x.id) : [];
  useEffect(() => { for (const id of unread) markRead.mutate(id); }, [unread.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link to={backTo} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('learn.journal.title')}</Link>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-8 w-2/3" /><SkeletonText lines={5} /></div>}>
        {({ reflection: r, feedback, isAuthor, aiNotes }) => (
          <>
            <header className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <VisibilityBadge r={r} />
                <span className="text-sm text-muted">{f.date(r.submittedAt ?? r.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <h1 className="text-h2 font-semibold">{r.title ?? r.lessonTitle ?? t('learn.journal.entry')}</h1>
              {r.lessonId && r.pathwayId ? <Link to={`/app/pathways/${r.pathwayId}/lessons/${r.lessonId}`} className="text-sm text-accent-soft-ink underline underline-offset-4">{t('learn.reflect.fromLesson', { lesson: r.lessonTitle ?? '' })}</Link> : null}
              {!isAuthor ? <p className="flex items-center gap-2 text-sm"><Avatar name={r.author.displayName} size="sm" />{r.author.displayName}</p> : null}
            </header>
            {r.promptText ? <blockquote className="rounded-md border-s-2 border-accent bg-accent-soft px-4 py-3 font-serif text-base italic">{r.promptText}</blockquote> : null}
            {editing && isAuthor ? (
              <Card padding="lg"><ReflectionComposer existing={r} lessonId={r.lessonId} withTitle={!r.lessonId} prompt={null} onSubmitted={() => setEditing(false)} /></Card>
            ) : <RichView doc={r.body} />}
            {isAuthor && !editing ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditing(true)}><PencilSimple size={18} aria-hidden="true" />{t('actions.edit')}</Button>
                {r.visibility !== 'private' && r.status === 'submitted' ? <Button variant="secondary" loading={withdraw.isPending} onClick={() => withdraw.mutate(r.id, { onSuccess: () => toast.show({ title: t('learn.reflect.withdrawn'), tone: 'success' }) })}>{t('learn.reflect.makePrivate')}</Button> : null}
                <Button variant="ghost" onClick={() => setConfirm(true)}><Trash size={18} aria-hidden="true" />{t('actions.delete')}</Button>
              </div>
            ) : null}
            <section aria-labelledby="fb-h" className="flex flex-col gap-3 border-t border-line pt-6">
              <h2 id="fb-h" className="text-h3 font-semibold">{t('learn.reflect.replies')}</h2>
              {feedback.length ? feedback.map((fb) => (
                <Card key={fb.id} className="flex flex-col gap-2 border-accent">
                  <div className="flex flex-wrap items-center gap-2"><Avatar name={fb.mentor.displayName} size="sm" /><span className="font-medium">{fb.mentor.displayName}</span><Badge tone="accent">{t('learn.reflect.mentorLabel')}</Badge><span className="ms-auto text-sm text-muted">{f.ago(fb.sentAt ?? fb.createdAt)}</span></div>
                  <RichView doc={fb.body} />
                </Card>
              )) : <p className="text-base text-muted">{r.visibility === 'private' ? t('learn.reflect.noRepliesPrivate') : r.status === 'draft' ? t('learn.reflect.noRepliesDraft') : t('learn.reflect.noRepliesYet')}</p>}
            </section>
            {aiNotes.length ? <section aria-labelledby="ai-h" className="flex flex-col gap-3"><h2 id="ai-h" className="text-h3 font-semibold">{t('learn.reflect.aiNotes')}</h2>{aiNotes.map((n) => <Card key={n.id} className="flex flex-col gap-2"><div className="flex flex-wrap items-center gap-2"><Badge tone="accent">{t('companion.label')}</Badge><span className="text-sm text-muted">{t('learn.reflect.reviewedBy', { name: n.reviewer.displayName })}</span></div><p className="whitespace-pre-line font-serif text-base">{n.body}</p></Card>)}</section> : null}
            <Dialog open={confirm} onOpenChange={setConfirm}>
              <DialogContent title={t('learn.reflect.deleteTitle')} description={t('learn.reflect.deleteBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('learn.reflect.keep')}</Button></DialogClose><Button variant="danger" loading={del.isPending} onClick={() => del.mutate(r.id, { onSuccess: () => { toast.show({ title: t('learn.reflect.deleted'), tone: 'success' }); nav('/app/journal'); } })}>{t('learn.reflect.deleteConfirm')}</Button></>} />
            </Dialog>
          </>
        )}
      </QueryState>
    </div>
  );
}
