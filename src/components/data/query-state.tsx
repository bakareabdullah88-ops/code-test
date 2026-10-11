import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { ApiError } from '@/lib/db/errors';
import { useT } from '@/lib/i18n';
import { ErrorState } from '../patterns/error-state/error-state';
import { CloudOffIllustration } from '../icons/illustrations';

/** One place that turns a query into designed loading, error and offline states. */
export function QueryState<T>({ query, skeleton, children }: { query: UseQueryResult<T>; skeleton: ReactNode; children: (data: T) => ReactNode }) {
  const t = useT();
  if (query.isLoading) return <div aria-busy="true" aria-label={t('states.loading')}>{skeleton}</div>;
  if (query.isError || query.data === undefined) {
    const err = query.error;
    const offline = err instanceof ApiError && err.code === 'offline';
    const forbidden = err instanceof ApiError && (err.code === 'forbidden' || err.code === 'not_found');
    return (
      <ErrorState
        title={offline ? t('states.offlineTitle') : forbidden ? (err.code === 'forbidden' ? t('states.noAccess') : t('states.notFoundTitle')) : t('states.errorTitle')}
        description={offline ? t('states.offlineBody') : forbidden ? err.message : t('states.errorBody')}
        retryLabel={forbidden ? undefined : t('actions.retry')}
        onRetry={() => void query.refetch()}
        details={err instanceof ApiError ? { label: t('states.showDetails'), requestId: err.requestId } : undefined}
        icon={offline ? <CloudOffIllustration className="w-28" /> : undefined}
      />
    );
  }
  return <>{children(query.data)}</>;
}
