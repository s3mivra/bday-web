import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
}

function FieldShell({ label, hint, error, required, htmlFor, children }: FieldShellProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-mist">
        {label}
        {required ? (
          <span className="ml-1 text-champagne" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-rose-300">
          <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, className, required, ...rest }: InputProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn('field-input', error && 'border-rose-400/70', className)}
        {...rest}
      />
      {hint && !error ? (
        <span id={`${id}-hint`} className="sr-only">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="sr-only">
          {error}
        </span>
      ) : null}
    </FieldShell>
  );
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextAreaField({ label, hint, error, className, required, rows = 4, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn('field-input resize-y', error && 'border-rose-400/70', className)}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function SelectField({ label, hint, error, className, required, children, ...rest }: SelectProps) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={id}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn('field-input appearance-none', error && 'border-rose-400/70', className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  legend: string;
  name: string;
  value: string;
  options: RadioOption[];
  error?: string;
  onChange: (value: string) => void;
}

export function RadioGroupField({ legend, name, value, options, error, onChange }: RadioGroupProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium text-mist">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex min-h-[56px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-200',
                selected
                  ? 'border-champagne/70 bg-champagne/10'
                  : 'border-ink-line bg-ink hover:border-ink-line/60',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#E4C285]"
              />
              <span>
                <span className="block text-sm text-mist">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs text-muted">{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-300">
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#E4C285]"
      />
      <span>
        <span className="block text-sm text-mist">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  );
}
