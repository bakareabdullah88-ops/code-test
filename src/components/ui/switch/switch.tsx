import { forwardRef, useId, type ComponentPropsWithoutRef } from 'react';
import { Switch as RadixSwitch } from 'radix-ui';
import { cn } from '@/lib/cn';

export interface SwitchProps extends Omit<ComponentPropsWithoutRef<typeof RadixSwitch.Root>, 'children'> {
  label: string;
  description?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ label, description, className, id, ...props }, ref) {
  const uid = useId();
  const sid = id ?? `${uid}-sw`;
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-4 py-2', className)}>
      <div className="flex flex-col">
        <label htmlFor={sid} className="cursor-pointer text-base text-ink">
          {label}
        </label>
        {description ? (
          <span id={`${sid}-d`} className="text-sm text-muted">
            {description}
          </span>
        ) : null}
      </div>
      <RadixSwitch.Root
        ref={ref}
        id={sid}
        aria-describedby={description ? `${sid}-d` : undefined}
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-line-strong bg-sunken transition-colors motion-fast data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50"
        {...props}
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-1 rounded-full bg-ink transition-transform motion-fast data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-accent rtl:-translate-x-1 rtl:data-[state=checked]:-translate-x-6" />
      </RadixSwitch.Root>
    </div>
  );
});
