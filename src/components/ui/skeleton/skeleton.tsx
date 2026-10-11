import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Decorative placeholder. Wrap the loading region in `aria-busy` and give it an accessible loading label. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('skeleton', className)} {...props} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cn('skeleton h-4', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3', className)}>
      <div className="skeleton size-10 shrink-0 rounded-md" />
      <div className="flex-1">
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}
