import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
}

export interface FieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** Wires label, helper text and error to a control. Helper text comes before the error. */
export function Field({ label, description, error, required, className, children }: FieldProps) {
  const uid = useId();
  const id = `${uid}-control`;
  const descId = description ? `${uid}-desc` : undefined;
  const errId = error ? `${uid}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? <span aria-hidden="true" className="text-danger"> *</span> : null}
      </label>
      {description ? (
        <p id={descId} className="text-sm text-muted">
          {description}
        </p>
      ) : null}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, 'aria-required': required ? true : undefined })}
      {error ? (
        <p id={errId} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
