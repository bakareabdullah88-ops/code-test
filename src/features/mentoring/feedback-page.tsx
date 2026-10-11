import { useState } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, Sparkle } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import type { RichDoc } from '@/types';
import { emptyDoc, isEmptyDoc } from '@/lib/editor/text';
import { ApiError } from '@/lib/db/errors';
import { useReflection, useSendFeedback } from '@/features/reflections/hooks';
import { useAffirm } from './hooks';
import { milestoneDefinitions } from '@/lib/services/engine';
import { QueryState } from '@/components/data/query-state';
import { RichEditor } from '@/components/content/rich-editor';
import { RichView } from '@/components/content/rich-view';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Button } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Field } from '@/components/ui/field/field';
import { Select } from '@/components/ui/select/select';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { useToast } from '@/components/ui/toast/toast';
import { Notice } from '@/components/patterns/notice/notice';
import { VisibilityBadge } from '@/features/reflections/reflection-card';

const SNIPPETS = ['mentor.feedback.snippet.thanks', 'mentor.feedback.snippet.notice', 'mentor.feedback.snippet.question', 'mentor.feedback.snippet.pray'] as const;

export function FeedbackPage() {
  const { reflectionId } = useParams();
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const q = useReflection(reflectionId);
  const send = useSendFeedback();
  const affirm = useAffirm();
  const [body, setBody] = useState<RichDoc>(emptyDoc());
  const [editorKey, setEditorKey] = useState(0);
  const [shareable, setShareable] = useState(false);
  const [milestone, setMilestone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const insert = (text: string) => {
    const paras = isEmptyDoc(body) ? [] : body.content;
    setBody({ type: 'doc', content: [...paras, { type: 'paragraph', content: [{ type: 'text', text }] }] });
    setEditorKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/mentor/feedback" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('mentor.feedback.title')}</Link>
      <QueryState query={q} skeleton={<div className="grid gap-6 lg:grid-cols-2"><SkeletonText lines={8} /><Skeleton className="h-64 w-full" /></div>}>
        {({ reflection: r, feedback }) => {
          const first = r.author.displayName.split(' ')[0] ?? '';
          const sentCount = feedback.filter((x) => x.status === 'sent').length;
          return (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <section aria-labelledby="refl-h" className="flex flex-col gap-3">
                <header className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2"><Avatar name={r.author.displayName} /><div><h1 id="refl-h" className="text-h3 font-semibold">{r.author.displayName}</h1><p className="text-sm text-muted">{f.ago(r.submittedAt ?? r.updatedAt)}</p></div><VisibilityBadge r={r} /></div>
                  {r.lessonTitle ? <p className="text-base text-muted">{t('mentor.feedback.onLesson', { lesson: r.lessonTitle, pathway: r.pathwayTitle ?? '' })}</p> : null}
                </header>
                {r.promptText ? <blockquote className="rounded-md border-s-2 border-accent bg-accent-soft px-4 py-3 font-serif text-base italic">{r.promptText}</blockquote> : null}
                <Card padding="lg"><RichView doc={r.body} /></Card>
                {r.lessonId && r.pathwayId ? <Link to={`/app/pathways/${r.pathwayId}/lessons/${r.lessonId}`} className="text-sm text-accent-soft-ink underline underline-offset-4">{t('mentor.feedback.openLesson')}</Link> : null}
              </section>

              <section aria-labelledby="reply-h" className="flex flex-col gap-4">
                <h2 id="reply-h" className="text-h3 font-semibold">{sentCount ? t('mentor.feedback.addReply') : t('mentor.feedback.yourReply')}</h2>
                {feedback.map((fb) => <Card key={fb.id} className="flex flex-col gap-1"><div className="flex items-center gap-2 text-sm text-muted"><Badge tone="accent">{t('mentor.feedback.sent')}</Badge>{f.ago(fb.sentAt ?? fb.createdAt)}</div><RichView doc={fb.body} className="prose-reading text-[length:0.95em]" /></Card>)}
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('mentor.feedback.snippets')}>
                  {SNIPPETS.map((k) => <Button key={k} size="sm" variant="secondary" onClick={() => insert(t(k, { name: first }))}>{t(`${k}Label`)}</Button>)}
                </div>
                <RichEditor key={editorKey} label={t('mentor.feedback.editorLabel')} placeholder={t('mentor.feedback.placeholder', { name: first })} value={body} onChange={setBody} minHeight="md" autoFocus />
                {r.visibility === 'group' ? <Checkbox label={t('mentor.feedback.shareable')} description={t('mentor.feedback.shareableHelp')} checked={shareable} onCheckedChange={(c) => setShareable(c === true)} /> : null}
                <Field label={t('mentor.feedback.affirmLabel')} description={t('mentor.feedback.affirmHelp', { name: first })}>
                  {(p) => <Select {...p} value={milestone} onValueChange={setMilestone} placeholder={t('mentor.feedback.affirmNone')} options={[{ value: 'none', label: t('mentor.feedback.affirmNone') }, ...milestoneDefinitions.map((m) => ({ value: m.key, label: t(m.titleKey) }))]} />}
                </Field>
                <Notice><span className="flex items-start gap-2"><Sparkle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{t('mentor.feedback.aiLater')}</span></Notice>
                {error ? <Notice tone="danger">{error}</Notice> : null}
                <div>
                  <Button size="lg" loading={send.isPending} onClick={() => {
                    setError(null);
                    send.mutate({ reflectionId: r.id, body, shareableToGroup: shareable }, {
                      onSuccess: async () => {
                        if (milestone && milestone !== 'none') await affirm.mutateAsync({ userId: r.authorId, key: milestone });
                        toast.show({ title: t('mentor.feedback.sentToast', { name: first }), tone: 'success' });
                        setBody(emptyDoc()); setEditorKey((k) => k + 1); setMilestone('');
                      },
                      onError: (e) => setError(e instanceof ApiError ? (e.fieldErrors?.body?.[0] ?? e.message) : t('states.errorBody')),
                    });
                  }}>{t('mentor.feedback.send')}</Button>
                </div>
              </section>
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
