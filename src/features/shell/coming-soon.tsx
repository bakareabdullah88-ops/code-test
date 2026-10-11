import { useT } from '@/lib/i18n';
import { usePathname } from '@/lib/nav';
import { lensFromPathname, navByLens } from '@/config/nav';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { PathIllustration } from '@/components/icons/illustrations';

/** Marks screens that belong to a later build step, so navigation never dead-ends. */
export function ComingSoon({ title }: { title?: string }) {
  const t = useT();
  const pathname = usePathname();
  const lens = lensFromPathname(pathname);
  const item = navByLens[lens].find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title ?? (item ? t(`nav.${lens}.${item.labelKey}`) : '')} />
      <EmptyState illustration={<PathIllustration />} title={t('shell.comingSoon')} description={t('shell.placeholderBody')} />
    </div>
  );
}
