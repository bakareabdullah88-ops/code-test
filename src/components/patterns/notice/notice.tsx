import type { ReactNode } from 'react';
import { CheckCircle, Info, Warning, WarningCircle } from '@phosphor-icons/react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const notice = cva('flex gap-3 rounded-md border p-3.5', {
  variants: {
    tone: {
      info: 'border-line bg-sunken text-ink',
      success: 'border-line bg-success-soft text-ink',
      warning: 'border-line bg-warning-soft text-ink',
      danger: 'border-line bg-danger-soft text-ink',
    },
  },
  defaultVariants: { tone: 'info' },
});
const iconTone = { info: 'text-muted', success: 'text-success', warning: 'text-warning', danger: 'text-danger' } as const;
const icons = { info: Info, success: CheckCircle, warning: Warning, danger: WarningCircle } as const;

export interface NoticeProps {
  tone?: keyof typeof icons;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Information is neutral ink (no blue); other tones always pair colour with an icon. */
export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  const Icon = icons[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'note'} className={cn(notice({ tone }), className)}>
      <span className={iconTone[tone]} aria-hidden="true">
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="text-base text-muted">{children}</div>
      </div>
    </div>
  );
}
