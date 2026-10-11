'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Toast as RadixToast } from 'radix-ui';
import { CheckCircle, Info, WarningCircle, X } from '@phosphor-icons/react';
import { cva } from 'class-variance-authority';
import { IconButton } from '../icon-button/icon-button';

export type ToastTone = 'neutral' | 'success' | 'danger';
export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}
interface ToastItem extends ToastInput {
  id: number;
}

// Radix treats a very large duration as persistent; Infinity overflows setTimeout and closes immediately.
const PERSISTENT_MS = 2_000_000_000;

const tone = cva('', {
  variants: { tone: { neutral: 'text-muted', success: 'text-success', danger: 'text-danger' } },
});

const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export interface ToastProviderProps {
  children: ReactNode;
  /** Accessible name for the notification region. */
  regionLabel: string;
  closeLabel: string;
}

export function ToastProvider({ children, regionLabel, closeLabel }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((t: ToastInput) => setItems((cur) => [...cur, { ...t, id: Date.now() + Math.random() }]), []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="down" label={regionLabel}>
        {children}
        {items.map((t) => (
          <RadixToast.Root
            key={t.id}
            // Errors stay until dismissed so they can be read and acted on.
            duration={t.tone === 'danger' ? PERSISTENT_MS : 6000}
            onOpenChange={(open) => {
              if (!open) setItems((cur) => cur.filter((x) => x.id !== t.id));
            }}
            className="toast-root glass-strong flex items-start gap-3 rounded-xl border p-3.5 shadow-lift"
          >
            <span className={tone({ tone: t.tone ?? 'neutral' })} aria-hidden="true">
              {t.tone === 'success' ? <CheckCircle size={22} /> : t.tone === 'danger' ? <WarningCircle size={22} /> : <Info size={22} />}
            </span>
            <div className="min-w-0 flex-1">
              <RadixToast.Title className="text-base font-medium text-ink">{t.title}</RadixToast.Title>
              {t.description ? <RadixToast.Description className="text-sm text-muted">{t.description}</RadixToast.Description> : null}
              {t.actionLabel ? (
                <RadixToast.Action altText={t.actionLabel} onClick={t.onAction} className="mt-1 min-h-11 text-sm font-medium text-accent underline underline-offset-4">
                  {t.actionLabel}
                </RadixToast.Action>
              ) : null}
            </div>
            <RadixToast.Close asChild>
              <IconButton label={closeLabel} size="sm">
                <X size={18} />
              </IconButton>
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed inset-x-0 bottom-0 z-[60] m-0 flex list-none flex-col gap-2 p-4 pb-safe sm:start-auto sm:w-96" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
