import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { MotionConfig } from 'motion/react';
import './styles/globals.css';
import { I18nProvider, useT } from '@/lib/i18n';
import { queryClient } from '@/lib/query';
import { applyPrefs, usePrefs } from '@/lib/prefs';
import { bootService } from '@/lib/services/system';
import { ToastProvider } from '@/components/ui/toast/toast';
import { TooltipProvider } from '@/components/ui/tooltip/tooltip';
import { Wordmark } from '@/components/icons/logo';
import { ErrorState } from '@/components/patterns/error-state/error-state';
import { router } from '@/app/routes';

function Boot() {
  const t = useT();
  const prefs = usePrefs();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [seeded, setSeeded] = useState(false);
  useEffect(() => applyPrefs(prefs), [prefs]);
  useEffect(() => {
    bootService.ensureSeeded().then((r) => { setSeeded(r.seeded); setState('ready'); }).catch(() => setState('error'));
  }, []);
  void seeded;

  if (state === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center px-4" role="status" aria-live="polite">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <Wordmark />
          <div className="relative h-1.5 w-44 overflow-hidden rounded-full bg-sunken" aria-hidden="true"><div className="skeleton absolute inset-0" /><div className="grow-x absolute inset-y-0 start-0 w-full rounded-full bg-accent" /></div>
          <h1 className="text-h4 font-semibold">{t('persona.loading')}</h1>
          <p className="text-base text-muted">{t('persona.loadingBody')}</p>
        </div>
      </div>
    );
  }
  if (state === 'error') return <div className="grid min-h-dvh place-items-center"><ErrorState title={t('persona.bootError')} description={t('persona.bootErrorBody')} retryLabel={t('actions.retry')} onRetry={() => window.location.reload()} /></div>;
  return <MotionConfig reducedMotion={prefs.motion === 'reduce' ? 'always' : 'user'}><RouterProvider router={router} /></MotionConfig>;
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ToastProviderBridge />
          </TooltipProvider>
        </QueryClientProvider>
      </I18nProvider>
    </StrictMode>,
  );
}

function ToastProviderBridge() {
  const t = useT();
  return <ToastProvider regionLabel={t('shell.notifications')} closeLabel={t('actions.close')}><Boot /></ToastProvider>;
}
