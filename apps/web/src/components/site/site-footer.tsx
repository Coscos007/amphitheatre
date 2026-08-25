import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";

type SiteFooterProps = {
  overlay?: boolean;
};

export function SiteFooter({ overlay = false }: SiteFooterProps) {
  const { t } = useTranslation();
  return (
    <footer
      className={cn(
        "z-20 flex flex-col items-center gap-3 px-4 py-5 text-center",
        overlay
          ? "pointer-events-none absolute inset-x-0 bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
          : "relative mt-auto",
      )}
    >
      <nav
        className="pointer-events-auto flex flex-wrap items-center justify-center gap-6"
        aria-label={t("nav.label")}
      >
        <Link
          to="/what-is"
          className="text-sm font-medium text-ink-muted no-underline hover:text-accent"
        >
          {t("nav.whatIs")}
        </Link>
        <Link to="/about" className="text-sm font-medium text-ink-muted no-underline hover:text-accent">
          {t("nav.about")}
        </Link>
      </nav>
      <p className="max-w-md text-xs text-ink-subtle">{t("home.footer")}</p>
    </footer>
  );
}
