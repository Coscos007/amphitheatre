import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Avatar } from "../ui/avatar.tsx";
import { BrandWordmark } from "../chrome/brand-mark.tsx";
import { ThemeLocaleBar } from "../chrome/site-header.tsx";

type HomeHeaderProps = {
  displayName: string;
};

export function HomeHeader({ displayName }: HomeHeaderProps) {
  const { t } = useTranslation();
  const name = displayName.trim() || t("home.guestName");

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex w-full shrink-0 items-center justify-between px-8 py-6">
      <Link
        to="/"
        className="flex items-center gap-4 text-ink no-underline"
        aria-label={t("app.name")}
      >
        <BrandWordmark />
      </Link>

      <div className="hidden items-center gap-8 rounded-full border border-border bg-surface-sunken/60 px-8 py-3 backdrop-blur-md md:flex">
        <ThemeLocaleBar compact />
      </div>

      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <ThemeLocaleBar compact />
        </div>
        <div className="flex items-center gap-3 rounded-full border border-border bg-surface-sunken/80 px-4 py-2 backdrop-blur">
          <span className="relative inline-flex">
            <Avatar id={name} name={name} size="sm" />
            <span
              className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-surface-raised bg-success"
              aria-hidden="true"
            />
          </span>
          <div className="hidden min-w-0 text-left lg:block">
            <div className="truncate text-xs font-medium text-ink">{name}</div>
            <div className="truncate text-[10px] text-ink-muted">
              {t("home.statusReady")}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
