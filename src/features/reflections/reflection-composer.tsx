import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Id, ReflectionVisibility, RichDoc } from '@/types';
import { useT, useFormat } from '@/lib/i18n';
import { ApiError } from '@/lib/db/errors';
import { emptyDoc, isEmptyDoc } from '@/lib/editor/text';
import { reflectionsService, type ReflectionView } from '@/lib/services/reflections';
import { RichEditor } from '@/components/content/rich-editor';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input/input';
import { Field } from '@/components/ui/field/field';
import { RadioGroup } from '@/components/ui/radio-group/radio-group';
import { Notice } from '@/components/patterns/notice/notice';
import { useToast } from '@/components/ui/toast/toast';
import { useCreateReflection, useSubmitReflection, useUpdateReflection } from './hooks';
import { useSessionState } from '@/lib/db/session';

type Save = 'idle' | 'saving' | 'saved' | 'error';

export interface ComposerProps {
  lessonId?: string | null;
  existing?: ReflectionView | null;
  prompt?: string | null;
  onSubmitted?: (r: ReflectionView) => void;
  /** Hide the title field (lesson reflections are named by their lesson). */
  withTitle?: boolean;
  autoFocus?: boolean;
}

/** Writing space with autosaved drafts, an explicit choice of who can read it, and a clear submit action. */
export function ReflectionComposer({ lessonId = null, existing = null, prompt, onSubmitted, withTitle = false, autoFocus }: ComposerProps) {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const who = useSessionState();
  const options = useQuery({ queryKey: ['share-options', who.userId, who.orgId], queryFn: reflectionsService.shareOptions });
  const create = useCreateReflection();
  const update = useUpdateReflection();
  const submit = useSubmitReflection();

  const [body, setBody] = useState<RichDoc>(existing?.body ?? emptyDoc());
  const [title, setTitle] = useState(existing?.title ?? '');
  const [visibility, setVisibility] = useState<ReflectionVisibility>(existing && existing.visibility !== 'private' ? existing.visibility : existing ? 'private' : 'mentor');
  const [save, setSave] = useState<Save>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const idRef = useRef<{ id: string; version: number } | null>(existing ? { id: existing.id, version: existing.version } : null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ body, title });
  latest.current = { body, title };
  const dirty = useRef(false);
  const inFlight = useRef<Promise<unknown> | null>(null);

  const persist = useCallback(async () => {
    const { body: b, title: ti } = latest.current;
    if (isEmptyDoc(b) && !idRef.current) return;
    setSave('saving');
    try {
      const run = async () => {
        if (!idRef.current) {
          const r = await create.mutateAsync({ lessonId, body: b, title: ti || null });
          idRef.current = { id: r.id, version: r.version };
        } else {
          const r = await update.mutateAsync({ id: idRef.current.id, patch: { body: b, title: ti || null }, version: idRef.current.version });
          idRef.current = { id: r.id, version: r.version };
        }
      };
      inFlight.current = run();
      await inFlight.current;
      dirty.current = false;
      setSave('saved');
      setSavedAt(new Date().toISOString());
    } catch (e) {
      setSave('error');
      if (e instanceof ApiError && e.code === 'conflict') setError(t('learn.reflect.conflict'));
    }
  }, [create, update, lessonId, t]);

  // The mutation objects change identity on every render, so effects use the latest persist through a ref.
  const persistRef = useRef(persist);
  persistRef.current = persist;

  // Debounced autosave: nothing a person writes is lost to navigation or a failed request.
  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persistRef.current(), 1200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [body, title]);

  useEffect(() => {
    const flush = () => { if (dirty.current) void persistRef.current(); };
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, []);

  const hasMentor = !!options.data?.mentorName;
  const hasGroup = !!options.data?.groups.length;

  const onSubmit = async () => {
    setError(null);
    if (isEmptyDoc(body)) { setError(t('learn.reflect.emptyError')); return; }
    if (timer.current) clearTimeout(timer.current);
    await persist();
    if (inFlight.current) await inFlight.current.catch(() => undefined);
    if (!idRef.current) return;
    try {
      const res = await submit.mutateAsync({ id: idRef.current.id, visibility, groupId: visibility === 'group' ? options.data?.groups[0]?.id : null });
      idRef.current = { id: res.reflection.id, version: res.reflection.version };
      setDone(true);
      for (const m of res.newMilestones) toast.show({ title: t('learn.reflect.milestone', { title: t(`milestones.${m.key}.title`) }), description: t(`milestones.${m.key}.meaning`), tone: 'success' });
      onSubmitted?.(res.reflection);
    } catch (e) {
      setError(e instanceof ApiError ? (e.fieldErrors?.visibility?.[0] ?? e.fieldErrors?.body?.[0] ?? e.message) : t('states.errorBody'));
    }
  };

  if (done) {
    const shared = visibility !== 'private';
    return (
      <div className="flex flex-col gap-3" role="status">
        <h2 className="text-h4 font-semibold">{t(shared ? 'learn.reflect.sharedTitle' : 'learn.reflect.savedTitle')}</h2>
        <p className="text-base text-muted">{visibility === 'mentor' ? t('learn.reflect.sharedMentor', { mentor: options.data?.mentorName ?? '' }) : visibility === 'group' ? t('learn.reflect.sharedGroup', { group: options.data?.groups[0]?.name ?? '' }) : t('learn.reflect.savedPrivate')}</p>
      </div>
    );
  }

  const status = save === 'saving' ? t('states.saving') : save === 'saved' && savedAt ? t('states.savedAt', { time: f.time(savedAt) }) : save === 'error' ? t('learn.reflect.saveError') : '';

  return (
    <div className="flex flex-col gap-4">
      {prompt ? <blockquote className="rounded-md border-s-2 border-accent bg-accent-soft px-4 py-3 font-serif text-base italic text-ink">{prompt}</blockquote> : null}
      {withTitle ? <Field label={t('learn.reflect.titleLabel')}>{(p) => <Input {...p} value={title} onChange={(e) => { setTitle(e.target.value); dirty.current = true; }} maxLength={120} />}</Field> : null}
      <RichEditor label={t('learn.reflect.editorLabel')} placeholder={t('learn.reflect.placeholder')} value={body} onChange={(d) => { setBody(d); dirty.current = true; setSave('idle'); }} autoFocus={autoFocus} minHeight="md" />
      <p className="min-h-5 text-sm text-muted" role="status" aria-live="polite">{status}</p>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-semibold text-ink">{t('learn.reflect.whoCanRead')}</legend>
        <RadioGroup
          aria-label={t('learn.reflect.whoCanRead')}
          value={visibility}
          onValueChange={(v) => setVisibility(v as ReflectionVisibility)}
          options={[
            { value: 'private', label: t('learn.reflect.private'), description: t('learn.reflect.privateHelp') },
            { value: 'mentor', label: hasMentor ? t('learn.reflect.mentorNamed', { mentor: options.data?.mentorName ?? '' }) : t('learn.reflect.mentor'), description: hasMentor ? t('learn.reflect.mentorHelp') : t('learn.reflect.mentorNone') },
            { value: 'group', label: hasGroup ? t('learn.reflect.groupNamed', { group: options.data?.groups[0]?.name ?? '' }) : t('learn.reflect.group'), description: hasGroup ? t('learn.reflect.groupHelp') : t('learn.reflect.groupNone') },
          ]}
        />
      </fieldset>
      {(visibility === 'mentor' && options.data && !hasMentor) || (visibility === 'group' && options.data && !hasGroup) ? <Notice tone="warning">{visibility === 'mentor' ? t('learn.reflect.mentorNone') : t('learn.reflect.groupNone')}</Notice> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button size="lg" loading={submit.isPending} onClick={() => void onSubmit()}>{visibility === 'private' ? t('learn.reflect.saveToJournal') : t('learn.reflect.share')}</Button>
      </div>
    </div>
  );
}
export type { Id };
