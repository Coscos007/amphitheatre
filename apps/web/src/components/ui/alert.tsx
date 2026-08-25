import { IconAlertTriangle, IconBroadcast, IconInfoCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

type AlertProps = {
  tone?: "info" | "warning" | "danger";
  title: string;
  children?: ReactNode;
  className?: string;
};

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const Icon = tone === "info" ? IconInfoCircle : IconAlertTriangle;
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-[var(--radius-panel)] border p-3",
        tone === "info" && "border-border bg-surface-sunken",
        tone === "warning" && "border-warning/40 bg-accent-soft",
        tone === "danger" && "border-danger/40 bg-danger-soft",
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        {children ? <p className="mt-1 text-sm text-ink-muted">{children}</p> : null}
      </div>
    </div>
  );
}

export function LiveBanner({ live, label }: { live: boolean; label: string }) {
  return (
    <span
      className={cn(
        "label-caps inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        live
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-border bg-surface-sunken/70 text-ink-muted",
      )}
    >
      <IconBroadcast className={cn("size-3.5", live ? "text-accent" : "text-ink-subtle")} aria-hidden="true" />
      {label}
    </span>
  );
}
