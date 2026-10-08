import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

const base =
  "h-11 w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-ink-soft focus-visible:border-primary disabled:bg-canvas";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

function Wrapper({ id, label, error, hint, children }: FieldProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-desc`} className="text-xs text-ink-soft">{hint}</p>}
      {error && <p id={`${id}-desc`} role="alert" className="text-xs font-medium text-negative">{error}</p>}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function TextInput({ label, error, hint, className, ...rest }, ref) {
    const id = useId();
    return (
      <Wrapper id={id} label={label} error={error} hint={hint}>
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-desc` : undefined}
          className={cn(base, error ? "border-negative" : "border-line", className)}
          {...rest}
        />
      </Wrapper>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(
  function Select({ label, error, hint, className, children, ...rest }, ref) {
    const id = useId();
    return (
      <Wrapper id={id} label={label} error={error} hint={hint}>
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-desc` : undefined}
          className={cn(base, error ? "border-negative" : "border-line", className)}
          {...rest}
        >
          {children}
        </select>
      </Wrapper>
    );
  },
);
