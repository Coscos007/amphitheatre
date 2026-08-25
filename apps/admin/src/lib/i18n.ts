import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "../locales/en.ts";
import { es } from "../locales/es.ts";
import { ptBR } from "../locales/pt-BR.ts";

export type Locale = "en" | "pt-BR" | "es";

const STORAGE_KEY = "amphitheatre.admin.locale";

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "pt-BR" || value === "es";
}

export function mapLanguageTag(tag: string): Locale | null {
  const base = tag.trim().toLowerCase().replaceAll("_", "-");
  if (base === "pt" || base.startsWith("pt-")) return "pt-BR";
  if (base === "es" || base.startsWith("es-")) return "es";
  if (base === "en" || base.startsWith("en-")) return "en";
  return null;
}

export function detectBrowserLocale(): Locale {
  const tags =
    typeof navigator === "undefined"
      ? []
      : [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  for (const tag of tags) {
    const mapped = mapLanguageTag(tag);
    if (mapped) return mapped;
  }
  return "en";
}

export function readStoredLocale(): Locale | null {
  if (typeof localStorage === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return isLocale(value) ? value : null;
}

export function resolveLocale(): Locale {
  return readStoredLocale() ?? detectBrowserLocale();
}

export function applyDocumentLang(locale: Locale) {
  document.documentElement.lang = locale === "pt-BR" ? "pt-BR" : locale;
}

export function persistLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
  applyDocumentLang(locale);
}

const initialLocale = resolveLocale();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBR },
    es: { translation: es },
  },
  lng: initialLocale,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

applyDocumentLang(initialLocale);

export default i18n;
