import type { ReactNode } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { X } from '@phosphor-icons/react';
import { IconButton } from '../icon-button/icon-button';
import { cn } from '@/lib/cn';

export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;

export interface SheetContentProps {
  title: string;
  description?: string;
  closeLabel: string;
  /** `responsive` is a bottom sheet on phones and a side panel from md up. */
  side?: 'responsive' | 'bottom' | 'end';
  children?: ReactNode;
  className?: string;
}

const sideStyles = {
  responsive: 'sheet-bottom md:sheet-end inset-x-0 bottom-0 max-h-[90dvh] rounded-t-3xl md:inset-y-0 md:start-auto md:end-0 md:max-h-none md:w-96 md:rounded-none md:rounded-s-3xl',
  bottom: 'sheet-bottom inset-x-0 bottom-0 max-h-[90dvh] rounded-t-xl',
  end: 'sheet-end inset-y-0 end-0 w-full max-w-sm rounded-s-xl',
} as const;

export function SheetContent({ title, description, closeLabel, side = 'responsive', children, className }: SheetContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="overlay" />
      <RadixDialog.Content
        className={cn('glass-strong fixed z-50 flex flex-col border pb-safe shadow-lift', sideStyles[side], className)}
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-2">
          <div>
            <RadixDialog.Title className="font-serif text-h4 font-semibold">{title}</RadixDialog.Title>
            {description ? <RadixDialog.Description className="mt-1 text-sm text-muted">{description}</RadixDialog.Description> : null}
          </div>
          <RadixDialog.Close asChild>
            <IconButton label={closeLabel} size="sm">
              <X size={20} />
            </IconButton>
          </RadixDialog.Close>
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
