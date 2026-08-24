import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "danger" | "muted";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "label-caps inline-flex items-center gap-1 rounded-[0.25rem] px-1.5 py-0.5",
        tone === "neutral" && "border border-border text-ink-muted",
        tone === "accent" && "border border-accent/40 bg-accent-soft text-accent",
        tone === "danger" && "border border-danger/30 bg-danger-soft text-danger",
        tone === "muted" && "border border-border text-ink-subtle",
        className,
      )}
      {...props}
    />
  );
}
