'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ToastProvider } from './ui/toast/toast';
import { applyPrefs, usePrefs } from '@/lib/prefs';

export function Providers({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const prefs = usePrefs();
  useEffect(() => applyPrefs(prefs), [prefs]);
  return (
    <ToastProvider regionLabel={t('shell.notifications')} closeLabel={t('actions.close')}>
      {children}
    </ToastProvider>
  );
}
