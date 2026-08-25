import { NativeSelect } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { persistLocale, type Locale } from "../lib/i18n.ts";
import i18n from "../lib/i18n.ts";

const OPTIONS: Locale[] = ["en", "pt-BR", "es"];

export function LocaleSelect() {
  const { t } = useTranslation();
  const value = (i18n.language === "pt-BR" || i18n.language === "es" ? i18n.language : "en") as Locale;
  return (
    <NativeSelect
      aria-label={t("locale.hint")}
      size="sm"
      w={170}
      value={value}
      data={OPTIONS.map((locale) => ({
        value: locale,
        label: locale === "pt-BR" ? t("locale.ptBR") : locale === "es" ? t("locale.es") : t("locale.en"),
      }))}
      onChange={(event) => {
        const next = event.currentTarget.value as Locale;
        persistLocale(next);
        void i18n.changeLanguage(next);
      }}
    />
  );
}
