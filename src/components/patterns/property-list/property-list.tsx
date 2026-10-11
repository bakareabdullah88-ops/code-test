import type { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

export interface Property { icon: Icon; label: string; value: ReactNode }

/** Label and value rows, like the properties of a document. Rows tint on hover. */
export function PropertyList({ items, className }: { items: Property[]; className?: string }) {
  return (
    <dl className={cn('flex flex-col', className)}>
      {items.map(({ icon: IconCmp, label, value }) => (
        <div key={label} className="group -mx-2 flex min-h-11 flex-wrap items-center gap-x-4 gap-y-0.5 rounded-lg px-2 py-1.5 transition-colors motion-fast hover:bg-sunken sm:flex-nowrap">
          <dt className="flex w-36 shrink-0 items-center gap-2 text-sm text-muted"><IconCmp size={18} aria-hidden="true" />{label}</dt>
          <dd className="min-w-0 text-base">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
