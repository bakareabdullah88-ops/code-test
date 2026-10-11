'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { lensFromPathname, navByLens } from '@/config/nav';
import { PageHeader } from '../patterns/page-header/page-header';
import { EmptyState } from '../patterns/empty-state/empty-state';
import { PathIllustration } from '../icons/illustrations';

/** Stands in for screens built in later roadmap phases, so layouts can be checked on real devices now. */
export function PlaceholderScreen({ title }: { title?: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const lens = lensFromPathname(pathname);
  const item = navByLens[lens].find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  const heading = title ?? (item ? t(`nav.${lens}.${item.labelKey}`) : t('common.shell.notifications'));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={heading} />
      <EmptyState illustration={<PathIllustration />} title={t('common.shell.comingSoon')} description={t('common.shell.placeholderBody')} />
    </div>
  );
}
