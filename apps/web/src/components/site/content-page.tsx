import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useCompactChrome } from "../../hooks/use-media.ts";
import { BrandWordmark } from "../chrome/brand-mark.tsx";
import { HeaderTools, SkipLink } from "../chrome/site-header.tsx";
import { InfiniteGrid3D } from "../home/infinite-grid-3d.tsx";
import { SiteFooter } from "./site-footer.tsx";

type ContentPageProps = {
  title: string;
  children: ReactNode;
};

export function ContentPage({ title, children }: ContentPageProps) {
  const { t } = useTranslation();
  const compactChrome = useCompactChrome();

  useEffect(() => {
    document.title = `${title} · Amphitheatre`;
    return () => {
      document.title = "Amphitheatre";
    };
  }, [title]);

  return (
    <div className="home-shell relative flex min-h-dvh flex-col overflow-x-hidden">
      <InfiniteGrid3D
        cellWidth={80}
        cellHeight={35}
        lineWidth={2}
        perspective={300}
        duration={1}
      />
      <SkipLink />
      <header className="absolute inset-x-0 top-0 z-50 flex w-full shrink-0 items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-6 lg:px-10 xl:px-12">
        <Link to="/" className="flex min-w-0 items-center text-ink no-underline" aria-label={t("app.name")}>
          <BrandWordmark className="h-8 max-w-[9rem] sm:h-10 sm:max-w-[14rem]" />
        </Link>
        <HeaderTools compact={compactChrome} />
      </header>
      <main
        id="main"
        className="relative z-10 flex w-full min-w-0 flex-1 flex-col px-5 pt-28 pb-16 sm:px-8 sm:pt-32 sm:pb-20 lg:px-10 lg:pt-36 xl:px-12"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
