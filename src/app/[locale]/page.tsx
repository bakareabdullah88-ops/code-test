import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonStyles } from '@/components/ui/button/button';
import { Wordmark } from '@/components/icons/logo';
import { PathIllustration } from '@/components/icons/illustrations';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('common.preview');
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-4 py-12">
      <Wordmark />
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-accent-soft-ink">{t('eyebrow')}</p>
        <h1 className="text-h1 font-semibold">{t('title')}</h1>
        <p className="max-w-prose text-lg text-muted">{t('body')}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/design" className={buttonStyles({ variant: 'primary' })}>
          {t('designLink')}
        </Link>
        <Link href="/app/today" className={buttonStyles({ variant: 'secondary' })}>
          {t('shellLink')}
        </Link>
      </div>
      <div className="w-48 text-ink">
        <PathIllustration />
      </div>
    </main>
  );
}
