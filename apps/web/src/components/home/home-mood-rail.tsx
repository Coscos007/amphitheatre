import { IconBook, IconCode, IconDeviceGamepad2 } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";

export function HomeMoodRail() {
  const { t } = useTranslation();
  const items = [
    { id: "gaming", label: t("home.moodGaming"), Icon: IconDeviceGamepad2, featured: true },
    { id: "study", label: t("home.moodStudy"), Icon: IconBook, featured: false },
    { id: "dev", label: t("home.moodDev"), Icon: IconCode, featured: false },
  ] as const;

  return (
    <div className="mt-4">
      <div className="flex gap-3 overflow-visible pt-1 pb-10">
        {items.map((item) => (
          <div
            key={item.id}
            role="img"
            aria-label={item.label}
            className={cn(
              "arena-card group relative z-0 flex size-16 shrink-0 items-center justify-center rounded-xl p-3 hover:z-10",
              item.featured && "border-accent/30 shadow-lg",
            )}
          >
            {item.featured ? (
              <div className="absolute inset-0 rounded-xl bg-accent/5 transition-colors group-hover:bg-accent/10" />
            ) : null}
            <item.Icon
              className={cn(
                "relative z-10 size-full",
                item.featured ? "text-accent" : "text-ink-muted group-hover:text-ink",
              )}
              stroke={1.6}
              aria-hidden="true"
            />
            <span
              className={cn(
                "pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-20",
                "-translate-x-1/2 rounded-md border border-border bg-surface-raised px-2 py-1",
                "whitespace-nowrap font-label text-[10px] font-semibold tracking-[0.08em] text-ink uppercase",
                "opacity-0 shadow-lg transition-opacity group-hover:opacity-100",
              )}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
