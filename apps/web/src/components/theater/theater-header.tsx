import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SettingsButton } from "../chrome/site-header.tsx";
import { BrandWordmark } from "../chrome/brand-mark.tsx";
import { cn } from "../../lib/cn.ts";

type TheaterHeaderProps = {
  title: string;
  status?: ReactNode;
  controls?: ReactNode;
  mobile?: boolean;
  onSettings?: () => void;
  onLeaveHome?: () => void;
};

export function TheaterHeader({
  title,
  status,
  controls,
  mobile = false,
  onSettings,
  onLeaveHome,
}: TheaterHeaderProps) {
  const { t } = useTranslation();
  const mark = (
    <BrandWordmark
      decorative={Boolean(onLeaveHome)}
      className={cn("h-8 w-auto object-contain", mobile ? "max-w-[8.5rem]" : "max-w-[9.5rem] sm:h-9 sm:max-w-[13rem]")}
    />
  );
  return (
    <header
      className={cn("z-50 px-3 py-3", mobile ? "shrink-0" : "absolute inset-x-0 top-0 sm:px-6 sm:py-4")}
      aria-label={t("a11y.headerRegion")}
    >
      <div
        className={cn(
          "grid items-center gap-2",
          mobile ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onLeaveHome ? (
            <button
              type="button"
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg text-ink focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              aria-label={t("theater.leaveHome")}
              onClick={onLeaveHome}
            >
              {mark}
            </button>
          ) : (
            <Link to="/" className="inline-flex min-h-11 shrink-0 items-center text-ink no-underline" aria-label={t("app.name")}>
              {mark}
            </Link>
          )}
          {mobile ? null : (
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
              <h1 className="truncate font-display text-[16px] leading-6 font-medium sm:text-[18px]">{title}</h1>
              {status}
            </div>
          )}
        </div>
        {mobile ? null : <div className="hidden justify-center sm:flex">{controls}</div>}
        <div className="flex shrink-0 items-center justify-end">
          {onSettings ? <SettingsButton onSettings={onSettings} /> : null}
        </div>
      </div>
      {mobile ? (
        <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
          <h1 className="min-w-0 truncate font-display text-[15px] leading-5 font-medium">{title}</h1>
          <div className="shrink-0">{status}</div>
        </div>
      ) : (
        <div className="mt-2 flex justify-center sm:hidden">{controls}</div>
      )}
    </header>
  );
}
