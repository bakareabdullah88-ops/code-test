import { useSearchParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { lessonsService } from '@/lib/services/learning';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { ReflectionComposer } from './reflection-composer';
import { Card } from '@/components/ui/card/card';

export function NewReflectionPage() {
  const t = useT();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const lessonId = params.get('lessonId');
  const lesson = useQuery({ queryKey: ['lesson-for-reflection', lessonId], queryFn: () => lessonsService.get(lessonId ?? ''), enabled: !!lessonId });
  const prompt = lesson.data?.lesson.blocks.find((b) => b.type === 'reflectionPrompt');
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link to="/app/journal" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('learn.journal.title')}</Link>
      <PageHeader title={lesson.data ? t('learn.reflect.forLesson', { lesson: lesson.data.lesson.title }) : t('learn.reflect.newTitle')} description={t('learn.reflect.newBody')} />
      <Card padding="lg">
        <ReflectionComposer lessonId={lessonId} withTitle={!lessonId} prompt={prompt?.type === 'reflectionPrompt' ? prompt.prompt : null} autoFocus onSubmitted={(r) => window.setTimeout(() => nav(`/app/journal/${r.id}`), 1400)} />
      </Card>
    </div>
  );
}
