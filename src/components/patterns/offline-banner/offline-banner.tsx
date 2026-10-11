import { CloudSlash } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

/** A slim, persistent notice; polite so it does not interrupt screen reader users. */
export function OfflineBanner({ message, className }: { message: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-2 border-b border-line bg-warning-soft px-4 py-2 text-sm text-warning', className)}>
      <CloudSlash size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
