import { useId } from 'react';
import { ToggleGroup } from 'radix-ui';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface SegmentOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentOption[];
  className?: string;
}

/** Single-choice switcher for sibling views. The selected pill slides between options. */
export function SegmentedControl({ label, value, onValueChange, options, className }: SegmentedControlProps) {
  const id = useId();
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(v) => {
        if (v) onValueChange(v);
      }}
      className={cn('glass inline-flex rounded-full border p-1', className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <ToggleGroup.Item
            key={o.value}
            value={o.value}
            className={cn('relative inline-flex min-h-9 items-center rounded-full px-4 text-sm font-medium transition-colors motion-fast coarse:min-h-10', on ? 'text-ink' : 'text-muted hover:text-ink')}
          >
            {on ? <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-raised shadow-card" transition={{ type: 'spring', stiffness: 520, damping: 38 }} aria-hidden="true" /> : null}
            <span className="relative">{o.label}</span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
