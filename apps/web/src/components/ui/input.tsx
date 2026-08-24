import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "input-glow flex h-11 w-full rounded-[var(--radius-control)] border bg-surface-sunken px-3 text-base text-ink",
        "placeholder:text-ink-subtle",
        "transition-colors duration-150",
        "focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-danger" : "border-border hover:border-border-strong",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "input-glow flex min-h-11 w-full rounded-[var(--radius-control)] border bg-surface-sunken px-3 py-2 text-base text-ink",
        "placeholder:text-ink-subtle",
        "transition-colors duration-150",
        "focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-danger" : "border-border hover:border-border-strong",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}
