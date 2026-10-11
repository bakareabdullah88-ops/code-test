import { Link } from '@/lib/nav';
import { useT } from '@/lib/i18n';
import type { PathwayDetail } from '@/lib/services/learning';
import { Cover } from '@/components/content/cover';
import { Badge } from '@/components/ui/badge/badge';
import { Progress } from '@/components/ui/progress/progress';
import { cn } from '@/lib/cn';

export function PathwayCard({ pathway, href, showProgress = true, className }: { pathway: PathwayDetail; href: string; showProgress?: boolean; className?: string }) {
  const t = useT();
  const { completed, total } = pathway.progress;
  const enrolled = !!pathway.enrollment;
  return (
    <Link to={href} className={cn('group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-colors motion-fast hover:border-line-strong', className)}>
      <div className="h-32"><Cover coverKey={pathway.coverKey} /></div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {pathway.status === 'draft' ? <Badge tone="warning">{t('learn.status.draft')}</Badge> : null}
          {pathway.enrollment?.status === 'completed' ? <Badge tone="success">{t('learn.status.pathwayDone')}</Badge> : null}
          <Badge>{t(`learn.level.${pathway.level}`)}</Badge>
        </div>
        <h3 className="font-sans text-h4 font-semibold group-hover:underline">{pathway.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{pathway.summary}</p>
        <p className="mt-auto text-sm text-subtle">{t('learn.pathway.counts', { lessons: pathway.lessonCount, minutes: pathway.estimatedMinutes })}</p>
        {showProgress && enrolled && total > 0 ? <Progress value={(completed / total) * 100} label={pathway.title} valueText={t('learn.pathway.progressText', { done: completed, total })} /> : null}
      </div>
    </Link>
  );
}
