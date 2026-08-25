import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";
import { useCompactChrome } from "../../hooks/use-media.ts";
import { Avatar } from "../ui/avatar.tsx";
import { BrandWordmark } from "../chrome/brand-mark.tsx";
import { HeaderTools } from "../chrome/site-header.tsx";

type HomeGuestIdentityProps = {
  name: string;
  variant?: "chip" | "sheet";
};

export function HomeGuestIdentity({ name, variant = "chip" }: HomeGuestIdentityProps) {
  const { t } = useTranslation();
  const chip = variant === "chip";

  return (
    <div
      className={cn(
        "flex items-center",
        chip
          ? "gap-3 rounded-full border border-border bg-surface-sunken/80 px-3 py-2 backdrop-blur sm:px-4"
          : "gap-4 rounded-2xl border border-border bg-surface-sunken/60 p-4",
      )}
    >
      <span className="relative inline-flex">
        <Avatar id={name} name={name} size={chip ? "sm" : "md"} />
        <span
          className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-surface-raised bg-success"
          aria-hidden="true"
        />
      </span>
      <div className={cn("min-w-0 text-left", chip && "hidden lg:block")}>
        <div className={cn("truncate font-medium text-ink", chip ? "text-xs" : "text-base")}>{name}</div>
        <div className={cn("truncate text-ink-muted", chip ? "text-[10px]" : "text-sm")}>
          {t("home.statusReady")}
        </div>
      </div>
    </div>
  );
}

type HomeHeaderProps = {
  displayName: string;
};

export function HomeHeader({ displayName }: HomeHeaderProps) {
  const { t } = useTranslation();
  const compactChrome = useCompactChrome();
  const name = displayName.trim() || t("home.guestName");

  return (
    <header className="absolute inset-x-0 top-0 z-50 flex w-full shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-6">
      <Link to="/" className="flex min-w-0 items-center text-ink no-underline" aria-label={t("app.name")}>
        <BrandWordmark className="h-8 max-w-[9rem] sm:h-10 sm:max-w-[14rem]" />
      </Link>

      {compactChrome ? null : (
        <div className="hidden items-center gap-8 rounded-full border border-border bg-surface-sunken/60 px-8 py-3 backdrop-blur-md md:flex">
          <HeaderTools />
        </div>
      )}

      {compactChrome ? (
        <HeaderTools compact profile={<HomeGuestIdentity name={name} variant="sheet" />} />
      ) : (
        <HomeGuestIdentity name={name} />
      )}
    </header>
  );
}
