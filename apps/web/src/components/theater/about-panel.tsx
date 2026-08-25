import { IconBrandGithub, IconHeart } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  ABOUT_TOOLS,
  AUTHOR_HREF,
  COFFEE_HREF,
  GITHUB_HREF,
  LICENSE_HREF,
} from "../../lib/about-credits.ts";
import { APP_VERSION } from "../../lib/app-meta.ts";
import { BrandWordmark } from "../chrome/brand-mark.tsx";
import { buttonVariants } from "../ui/button.tsx";

export function AboutPanel() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-2 text-center">
      <BrandWordmark className="h-12 max-w-[16rem] sm:h-14 sm:max-w-[18rem]" />
      <p className="font-sans text-sm font-medium text-ink">{t("about.version", { version: APP_VERSION })}</p>
      <div className="flex flex-col gap-3 text-sm text-ink-muted">
        <p>{t("about.body")}</p>
        <p>
          {t("about.licenseLead")}{" "}
          <a href={LICENSE_HREF} className="text-accent hover:underline" target="_blank" rel="noreferrer">
            GNU AGPLv3
          </a>
          {t("about.licenseTail")}
        </p>
        <p>
          {t("about.creatorLead")}{" "}
          <a href={AUTHOR_HREF} className="text-accent hover:underline" target="_blank" rel="noreferrer">
            {t("about.creatorName")}
          </a>
          .
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={GITHUB_HREF}
          className={buttonVariants({ variant: "secondary", size: "touch" })}
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
      <div className="w-full">
        <p className="label-caps mb-3 text-ink-muted">{t("about.tools")}</p>
        <ul className="flex flex-col gap-4">
          {ABOUT_TOOLS.map((tool) => (
            <li key={tool.name} className="flex flex-col gap-1">
              <a
                href={tool.href}
                className="text-sm font-semibold text-ink hover:text-accent hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {tool.name}
              </a>
              <p className="text-xs text-ink-subtle">
                {t("about.toolMeta", { version: tool.version, license: tool.license })}
              </p>
              <p className="text-sm text-ink-muted">{t(tool.descKey)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
