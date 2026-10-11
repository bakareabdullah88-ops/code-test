import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** One of the spot illustrations, already sized by the caller. */
  illustration?: ReactNode;
  /** One primary action. */
  action?: ReactNode;
  /** `first-use` invites; `filtered` explains and offers to clear. */
  className?: string;
}

export function EmptyState({ title, description, illustration, action, className }: EmptyStateProps) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-10 text-center', className)}>
      {illustration ? <div className="w-32 text-ink md:w-40">{illustration}</div> : null}
      <h2 className="text-h4 font-semibold">{title}</h2>
      {description ? <p className="text-base text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
