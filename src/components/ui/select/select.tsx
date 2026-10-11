import { forwardRef, type ReactNode } from 'react';
import { Select as RadixSelect } from 'radix-ui';
import { CaretDown, Check } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { controlStyles } from '../input/input';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { options, placeholder, value, onValueChange, className, disabled, ...aria },
  ref,
) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger ref={ref} className={cn(controlStyles, 'inline-flex min-h-11 items-center justify-between gap-2 text-start data-[placeholder]:text-subtle', className)} {...aria}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <CaretDown size={16} aria-hidden="true" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content position="popper" sideOffset={6} className="popper glass-strong z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border shadow-lift">
          <RadixSelect.Viewport className="p-1">
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});

function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RadixSelect.Item value={value} className="relative flex min-h-11 cursor-pointer select-none items-center rounded-sm ps-8 pe-3 text-base text-ink outline-none data-[highlighted]:bg-sunken data-[disabled]:opacity-50 coarse:min-h-12">
      <RadixSelect.ItemIndicator className="absolute start-2">
        <Check size={16} weight="bold" aria-hidden="true" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
