import { IconBrandGithub, IconHeart } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { APP_VERSION } from "../../lib/app-meta.ts";
import { BrandWordmark } from "../chrome/brand-mark.tsx";
import { buttonVariants } from "../ui/button.tsx";

const LICENSE_HREF = "https://www.gnu.org/licenses/agpl-3.0.html";
const AUTHOR_HREF = "https://sims.dev.br";

const TOOLS = [
  {
    name: "OvenMediaEngine",
    version: "0.21.0",
    license: "GNU AGPLv3",
    href: "https://github.com/AirenSoft/OvenMediaEngine",
    descKey: "about.toolOme",
  },
  {
    name: "OvenPlayer",
    version: "0.10.53",
    license: "MIT",
    href: "https://github.com/AirenSoft/OvenPlayer",
    descKey: "about.toolOvenPlayer",
  },
  {
    name: "LiveKit",
    version: "1.13.5",
    license: "Apache-2.0",
    href: "https://github.com/livekit/livekit",
    descKey: "about.toolLiveKit",
  },
  {
    name: "Valkey",
    version: "9.1.1",
    license: "BSD-3-Clause",
    href: "https://github.com/valkey-io/valkey",
    descKey: "about.toolValkey",
  },
] as const;

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
          </a>{t("about.licenseTail")}
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
          href="https://github.com/simstm/amphitheatre"
          className={buttonVariants({ variant: "secondary", size: "touch" })}
          target="_blank"
          rel="noreferrer"
        >
          <IconBrandGithub aria-hidden="true" />
          {t("about.github")}
        </a>
        <a
          href="https://buymeacoffee.com/simstm"
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
          {TOOLS.map((tool) => (
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
