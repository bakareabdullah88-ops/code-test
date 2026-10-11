import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const controlStyles =
  'w-full rounded-xl border border-line-strong bg-raised/70 px-3.5 text-base text-ink placeholder:text-subtle transition-colors motion-fast hover:border-ink focus-visible:border-accent aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, type, ...props }, ref) {
  return <input ref={ref} type={type ?? 'text'} className={cn(controlStyles, 'min-h-11', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows, ...props }, ref) {
  return <textarea ref={ref} rows={rows ?? 4} className={cn(controlStyles, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />;
});
