import { Link } from "@tanstack/react-router";
import { IconChevronDown, IconMoon, IconSettings, IconSun } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useCompactChrome } from "../../hooks/use-media.ts";
import { useUiStore } from "../../stores/ui-store.ts";
import { Button } from "../ui/button.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { AppearanceMenu } from "./appearance-menu.tsx";
import { BrandMark } from "./brand-mark.tsx";

export function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main" className="skip-link">
      {t("app.skipToContent")}
    </a>
  );
}

export function SettingsButton({ onSettings }: { onSettings: () => void }) {
  const { t } = useTranslation();
  return (
    <Tooltip label={t("settings.title")}>
      <Button
        variant="ghost"
        size="iconTouch"
        className="rounded-full"
        onClick={onSettings}
        aria-label={t("settings.title")}
      >
        <IconSettings aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}

export function ThemeLocaleBar({
  compact,
  onSettings,
  selectId = "locale-select",
}: {
  compact?: boolean;
  onSettings?: () => void;
  selectId?: string;
}) {
  const { t } = useTranslation();
  const { theme, locale, setTheme, setLocale } = useUiStore();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {onSettings ? <SettingsButton onSettings={onSettings} /> : null}
      <div
        className="inline-flex rounded-full border border-border bg-surface-sunken/70 p-0.5"
        role="group"
        aria-label={t("theme.label")}
      >
        <Tooltip label={t("theme.lightHint")}>
          <Button
            variant={theme === "light" ? "primary" : "ghost"}
            size="sm"
            className="rounded-full"
            onClick={() => setTheme("light")}
            aria-pressed={theme === "light"}
            aria-label={t("theme.light")}
          >
            <IconSun aria-hidden="true" />
            {compact ? null : t("theme.light")}
          </Button>
        </Tooltip>
        <Tooltip label={t("theme.darkHint")}>
          <Button
            variant={theme === "dark" ? "primary" : "ghost"}
            size="sm"
            className="rounded-full"
            onClick={() => setTheme("dark")}
            aria-pressed={theme === "dark"}
            aria-label={t("theme.dark")}
          >
            <IconMoon aria-hidden="true" />
            {compact ? null : t("theme.dark")}
          </Button>
        </Tooltip>
      </div>
      <Tooltip label={t("locale.hint")}>
        <div className="relative">
          <label className="sr-only" htmlFor={selectId}>
            {t("locale.label")}
          </label>
          <select
            id={selectId}
            className="h-9 appearance-none rounded-full border border-border bg-surface-sunken/70 py-0 pr-10 pl-3 text-sm text-ink focus-visible:shadow-[var(--shadow-focus)]"
            value={locale}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "en" || value === "pt-BR" || value === "es") setLocale(value);
            }}
          >
            <option value="en">{t("locale.en")}</option>
            <option value="pt-BR">{t("locale.ptBR")}</option>
            <option value="es">{t("locale.es")}</option>
          </select>
          <IconChevronDown
            className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
        </div>
      </Tooltip>
    </div>
  );
}

export function HeaderTools({
  compact,
  onSettings,
  profile,
}: {
  compact?: boolean;
  onSettings?: () => void;
  profile?: ReactNode;
}) {
  if (compact) {
    return (
      <div className="flex shrink-0 items-center justify-end gap-0.5">
        {onSettings ? <SettingsButton onSettings={onSettings} /> : null}
        <AppearanceMenu profile={profile} />
      </div>
    );
  }
  return <ThemeLocaleBar compact onSettings={onSettings} />;
}

type SiteHeaderProps = {
  compact?: boolean;
  title?: string;
  status?: ReactNode;
};

export function SiteHeader({ compact, title, status }: SiteHeaderProps) {
  const { t } = useTranslation();
  const compactChrome = useCompactChrome();
  return (
    <header
      className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5"
      aria-label={t("a11y.headerRegion")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="flex items-center gap-3 text-ink no-underline" aria-label={t("app.name")}>
          <BrandMark />
          <span className="font-display hidden text-sm font-bold tracking-[0.14em] uppercase sm:inline">
            {t("app.name")}
          </span>
        </Link>
        {title ? (
          <>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <h1 className="hidden truncate font-display text-lg font-semibold sm:block">{title}</h1>
          </>
        ) : null}
        {status}
      </div>
      <HeaderTools compact={compact || compactChrome} />
    </header>
  );
}
