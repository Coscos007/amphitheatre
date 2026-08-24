import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

type TooltipProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-md border border-border bg-surface-raised px-2 py-1 text-[11px] leading-4 font-medium whitespace-nowrap text-ink opacity-0 shadow-[0_8px_24px_rgb(12_10_8/0.28)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
