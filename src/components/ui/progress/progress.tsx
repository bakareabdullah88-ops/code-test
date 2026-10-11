import { Progress as RadixProgress } from 'radix-ui';
import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export interface ProgressProps {
  value: number;
  /** Spoken value, for example "3 of 8 lessons". */
  valueText: string;
  label: string;
  className?: string;
}

export function Progress({ value, valueText, label, className }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <RadixProgress.Root value={pct} aria-label={label} aria-valuetext={valueText} className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-sunken', className)}>
      <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.15 }} />
    </RadixProgress.Root>
  );
}

export type ThreadStepState = 'done' | 'current' | 'todo';
export interface ThreadStep {
  id: string;
  label: string;
  state: ThreadStepState;
  /** Localised state text for screen readers, for example "Done". */
  stateLabel: string;
}

/** The brand's progress motif: tiles connected by a thread. An ordered list, so it reads naturally. */
export function ProgressThread({ steps, className }: { steps: ThreadStep[]; className?: string }) {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((s, i) => (
        <li key={s.id} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 * i }}
            className={cn('inline-flex size-4 shrink-0 rotate-6 rounded-xs border-2 transition-colors motion-base', s.state === 'done' && 'border-accent bg-accent', s.state === 'current' && 'border-accent bg-surface shadow-lift', s.state === 'todo' && 'border-line-strong bg-surface')}
            aria-current={s.state === 'current' ? 'step' : undefined}
          />
          <span className="sr-only">{s.label}: {s.stateLabel}</span>
          {i < steps.length - 1 ? <span aria-hidden="true" className={cn('mx-1 h-0.5 flex-1 rounded-full transition-colors motion-base', s.state === 'done' ? 'bg-accent' : 'bg-line')} /> : null}
        </li>
      ))}
    </ol>
  );
}

/** Circular progress with the value and a short caption in the middle. */
export function ProgressRing({ value, label, caption, className }: { value: number; label: string; caption: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cn('relative grid size-22 shrink-0 place-items-center', className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-line" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-accent" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct / 100) }} transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.2 }} />
      </svg>
      <span className="flex flex-col items-center leading-tight" aria-hidden="true">
        <span className="text-xl font-semibold tracking-tight text-ink">{pct}%</span>
        <span className="max-w-16 text-center text-xs text-muted">{caption}</span>
      </span>
    </div>
  );
}
