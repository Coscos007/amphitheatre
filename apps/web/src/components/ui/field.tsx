import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label-caps text-ink-muted", className)} {...props} />;
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: string;
  children: ReactNode;
};

export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {optional ? <span className="text-xs text-ink-subtle">{optional}</span> : null}
      </div>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
