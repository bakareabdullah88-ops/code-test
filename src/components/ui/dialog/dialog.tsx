import type { ReactNode } from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { X } from '@phosphor-icons/react';
import { IconButton } from '../icon-button/icon-button';
import { cn } from '@/lib/cn';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export interface DialogContentProps {
  title: string;
  description?: string;
  closeLabel: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DialogContent({ title, description, closeLabel, children, footer, className }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="overlay" />
      <RadixDialog.Content
        className={cn(
          'dialog-panel fixed start-1/2 top-1/2 z-50 glass-strong flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border shadow-lift rtl:translate-x-1/2',
          className,
        )}
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
        {children ? <div className="overflow-y-auto px-5 py-2">{children}</div> : null}
        {footer ? <div className="flex flex-wrap justify-end gap-2 p-5 pt-3">{footer}</div> : null}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
