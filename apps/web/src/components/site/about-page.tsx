import { IconBrandGithub, IconHeart } from "@tabler/icons-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ABOUT_TOOLS,
  AUTHOR_HREF,
  COFFEE_HREF,
  GITHUB_HREF,
  LICENSE_HREF,
} from "../../lib/about-credits.ts";
import { APP_VERSION } from "../../lib/app-meta.ts";
import { useCompactChrome } from "../../hooks/use-media.ts";
import { BrandWordmark } from "../chrome/brand-mark.tsx";
import { HeaderTools, SkipLink } from "../chrome/site-header.tsx";
import { InfiniteGrid3D } from "../home/infinite-grid-3d.tsx";
import { buttonVariants } from "../ui/button.tsx";
import { SiteFooter } from "./site-footer.tsx";

export function AboutPage() {
  const { t } = useTranslation();
  const compactChrome = useCompactChrome();
  const title = t("pages.aboutTitle");

  useEffect(() => {
    document.title = `${title} · Amphitheatre`;
    return () => {
      document.title = "Amphitheatre";
    };
  }, [title]);

  return (
    <div className="home-shell relative flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto md:h-dvh">
      <InfiniteGrid3D
        cellWidth={80}
        cellHeight={35}
        lineWidth={2}
        perspective={300}
        duration={1}
      />
      <SkipLink />
      <header className="absolute inset-x-0 top-0 z-50 flex w-full justify-end px-5 py-4 sm:px-8 sm:py-6">
        <HeaderTools compact={compactChrome} />
      </header>
      <main
        id="main"
        className="relative z-10 flex min-h-dvh flex-1 flex-col items-center justify-center px-6 pt-16 pb-24 text-center"
      >
        <div className="flex w-full max-w-2xl flex-col items-center gap-6">
          <BrandWordmark
            overrideClasses
            className="h-10 w-auto max-w-[20rem] object-contain"
          />
          <div className="flex max-w-xl flex-col items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="text-sm font-medium text-ink-muted">
              {t("about.version", { version: APP_VERSION })}
            </p>
            <p className="text-base leading-7 text-ink-muted">
              {t("pages.aboutLead")}
            </p>
            <p className="text-base leading-7 text-ink-muted">
              {t("pages.aboutContribute")}
            </p>
            <p className="text-sm leading-6 text-ink-muted">
              {t("pages.aboutLicenseLead")}{" "}
              <a
                href={LICENSE_HREF}
                className="text-accent hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                GNU AGPLv3
              </a>
              {t("pages.aboutLicenseTail")}{" "}
              <a
                href={AUTHOR_HREF}
                className="text-accent hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {t("about.creatorName")}
              </a>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={GITHUB_HREF}
              className={buttonVariants({
                variant: "secondary",
                size: "touch",
              })}
              target="_blank"
              rel="noreferrer"
            >
              <IconBrandGithub aria-hidden="true" />
              {t("about.github")}
            </a>
            <a
              href={COFFEE_HREF}
              className={buttonVariants({ variant: "primary", size: "touch" })}
              target="_blank"
              rel="noreferrer"
            >
              <IconHeart aria-hidden="true" />
              {t("about.coffee")}
            </a>
          </div>

          <section
            className="w-full text-left"
            aria-labelledby="about-tools-heading"
          >
            <h2
              id="about-tools-heading"
              className="font-display text-center text-lg font-semibold tracking-tight text-ink"
            >
              {t("pages.aboutToolsTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-6 text-ink-muted">
              {t("pages.aboutToolsLead")}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ABOUT_TOOLS.map((tool) => (
                <li
                  key={tool.name}
                  className="flex min-w-0 flex-col gap-1 text-center"
                >
                  <a
                    href={tool.href}
                    className="font-display text-base font-semibold text-ink hover:text-accent hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {tool.name}
                  </a>
                  <p className="text-xs text-ink-subtle">
                    {t("about.toolMeta", {
                      version: tool.version,
                      license: tool.license,
                    })}
                  </p>
                  <p className="text-sm leading-6 text-ink-muted">
                    {t(tool.descKey)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter overlay />
    </div>
  );
}
