import type { ComponentType, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export function EditorialKicker({ children }: { children: ReactNode }) {
  return <p className="label-caps text-accent">{children}</p>;
}

export function EditorialTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="hero-text font-display mt-2 text-[1.75rem] leading-tight font-bold tracking-tight text-ink sm:text-3xl">
      {children}
    </h1>
  );
}

export function EditorialLead({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans max-w-xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-7">{children}</p>
  );
}

export function EditorialBody({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn("font-sans max-w-prose text-sm leading-6 text-ink-muted sm:text-base sm:leading-7", className)}>
      {children}
    </p>
  );
}

export function EditorialHeading({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">{children}</h2>;
}

type StoryIcon = ComponentType<{
  className?: string;
  stroke?: number;
}>;

type StoryProps = {
  icon: StoryIcon;
  title: string;
  children: string;
};

export function EditorialStory({ icon: Icon, title, children }: StoryProps) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true">
          <Icon className="size-5 shrink-0 text-accent" stroke={1.5} />
        </span>
        <EditorialHeading>{title}</EditorialHeading>
      </div>
      <EditorialBody>{children}</EditorialBody>
    </section>
  );
}
