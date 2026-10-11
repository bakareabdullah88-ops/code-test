import type { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { Cover } from '@/components/content/cover';
import { cn } from '@/lib/cn';

/** Page header in the style of a document: a cover with an icon tile resting on its lower edge, then the title block. */
export function PageCover({ coverKey, icon: IconCmp, title, description, children, className }: { coverKey: string; icon: Icon; title: string; description?: string; children?: ReactNode; className?: string }) {
  return (
    <header className={cn('enter flex flex-col', className)}>
      <div className="h-36 overflow-hidden rounded-2xl border border-line shadow-card sm:h-48 md:h-56"><Cover coverKey={coverKey} /></div>
      <div className="px-1 sm:px-4">
        <span className="pop -mt-8 grid size-16 place-items-center rounded-2xl border border-line bg-raised text-accent shadow-lift sm:-mt-10 sm:size-20"><IconCmp size={34} weight="duotone" aria-hidden="true" /></span>
        <h1 className="mt-4 text-h1 font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-prose text-lg text-muted">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </header>
  );
}
