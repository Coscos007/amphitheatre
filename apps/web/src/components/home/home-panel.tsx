import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export function HomePanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 flex-col justify-center xl:w-[480px]">
      <div className="rounded-2xl border border-border bg-surface-overlay/80 p-1 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-8 p-8">{children}</div>
      </div>
    </div>
  );
}

export function HomeFormCard({
  glow = false,
  children,
}: {
  glow?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative", glow && "group")}>
      {glow ? (
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-accent/20 to-transparent opacity-0 blur transition-opacity group-hover:opacity-100" />
      ) : null}
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-raised p-6">{children}</div>
    </div>
  );
}
