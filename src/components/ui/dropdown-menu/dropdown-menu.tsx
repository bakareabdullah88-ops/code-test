import type { ComponentPropsWithoutRef } from 'react';
import { DropdownMenu as RadixMenu } from 'radix-ui';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

export const DropdownMenu = RadixMenu.Root;
export const DropdownMenuTrigger = RadixMenu.Trigger;
export const DropdownMenuRadioGroup = RadixMenu.RadioGroup;

export function DropdownMenuContent({ className, ...props }: ComponentPropsWithoutRef<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        sideOffset={6}
        align="end"
        className={cn('popper glass-strong z-50 min-w-52 rounded-xl border p-1.5 shadow-lift', className)}
        {...props}
      />
    </RadixMenu.Portal>
  );
}

const itemStyles =
  'relative flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-sm px-3 text-base text-ink outline-none data-[highlighted]:bg-sunken data-[disabled]:opacity-50 coarse:min-h-12';

export function DropdownMenuItem({ className, ...props }: ComponentPropsWithoutRef<typeof RadixMenu.Item>) {
  return <RadixMenu.Item className={cn(itemStyles, className)} {...props} />;
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentPropsWithoutRef<typeof RadixMenu.RadioItem>) {
  return (
    <RadixMenu.RadioItem className={cn(itemStyles, 'ps-8', className)} {...props}>
      <RadixMenu.ItemIndicator className="absolute start-2">
        <Check size={16} weight="bold" aria-hidden="true" />
      </RadixMenu.ItemIndicator>
      {children}
    </RadixMenu.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithoutRef<typeof RadixMenu.Label>) {
  return <RadixMenu.Label className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted', className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentPropsWithoutRef<typeof RadixMenu.Separator>) {
  return <RadixMenu.Separator className={cn('my-1 h-px bg-line', className)} {...props} />;
}
