import { IconChevronDown, IconMoon, IconSun } from "@tabler/icons-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui-store.ts";
import { Button } from "../ui/button.tsx";

export function AppearanceFields() {
  const { t } = useTranslation();
  const { theme, locale, setTheme, setLocale } = useUiStore();
  const localeId = useId();

  return (
    <div className="flex flex-col gap-8 text-ink">
      <div className="flex flex-col gap-2">
        <p className="label-caps text-ink-muted">{t("theme.label")}</p>
        <div
          className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface-sunken/70 p-1"
          role="group"
          aria-label={t("theme.label")}
        >
          <Button
            variant={theme === "light" ? "primary" : "ghost"}
            size="touch"
            className="rounded-lg"
            onClick={() => setTheme("light")}
            aria-pressed={theme === "light"}
          >
            <IconSun aria-hidden="true" />
            {t("theme.light")}
          </Button>
          <Button
            variant={theme === "dark" ? "primary" : "ghost"}
            size="touch"
            className="rounded-lg"
            onClick={() => setTheme("dark")}
            aria-pressed={theme === "dark"}
          >
            <IconMoon aria-hidden="true" />
            {t("theme.dark")}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="label-caps text-ink-muted" htmlFor={localeId}>
          {t("locale.label")}
        </label>
        <div className="relative">
          <select
            id={localeId}
            className="h-11 w-full appearance-none rounded-[var(--radius-control)] border border-border bg-surface-sunken py-0 pr-10 pl-3 text-sm text-ink focus-visible:shadow-[var(--shadow-focus)]"
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
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
