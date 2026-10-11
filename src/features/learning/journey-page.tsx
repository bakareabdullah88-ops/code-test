import { Outlet, useNavigate } from 'react-router';
import { useT } from '@/lib/i18n';
import { usePathname } from '@/lib/nav';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';

export function JourneyPage() {
  const t = useT();
  const nav = useNavigate();
  const path = usePathname();
  const value = path.endsWith('/timeline') ? 'timeline' : path.endsWith('/milestones') ? 'milestones' : path.includes('/library') ? 'library' : 'pathways';
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('learn.journey.title')} description={t('learn.journey.description')} />
      <SegmentedControl
        label={t('learn.journey.views')}
        value={value}
        onValueChange={(v) => nav(v === 'pathways' ? '/app/journey' : `/app/journey/${v}`)}
        options={[{ value: 'pathways', label: t('learn.journey.pathways') }, { value: 'timeline', label: t('learn.journey.timeline') }, { value: 'milestones', label: t('learn.journey.milestones') }, { value: 'library', label: t('learn.journey.library') }]}
        className="self-start"
      />
      <Outlet />
    </div>
  );
}
