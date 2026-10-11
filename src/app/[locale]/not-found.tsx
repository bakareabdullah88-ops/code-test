import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/components/ui/button/button';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { BookIllustration } from '@/components/icons/illustrations';

export default function NotFound() {
  const t = useTranslations('common.notFound');
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center">
      <EmptyState
        illustration={<BookIllustration />}
        title={t('title')}
        description={t('body')}
        action={
          <Link href="/" className={buttonStyles({ variant: 'secondary' })}>
            {t('home')}
          </Link>
        }
      />
    </main>
  );
}
