import type { ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../ui/button/button';
import { cn } from '@/lib/cn';

export interface ErrorStateProps {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
  /** Request ID and technical detail live behind a disclosure. */
  details?: { label: string; requestId: string };
  extraAction?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function ErrorState({ title, description, retryLabel, onRetry, details, extraAction, icon, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-10 text-center', className)}>
      {icon ? <div className="text-ink" aria-hidden="true">{icon}</div> : (
        <span className="text-danger" aria-hidden="true">
          <WarningCircle size={36} />
        </span>
      )}
      <h2 className="text-h4 font-semibold">{title}</h2>
      <p className="text-base text-muted">{description}</p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {onRetry && retryLabel ? (
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {extraAction}
      </div>
      {details ? (
        <details className="mt-2 text-sm text-muted">
          <summary className="min-h-11 cursor-pointer py-2">{details.label}</summary>
          <code className="font-mono text-xs">{details.requestId}</code>
        </details>
      ) : null}
    </div>
  );
}
