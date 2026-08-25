import { IconDownload, IconShare2, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useCompactChrome } from "../../hooks/use-media.ts";
import { usePwaInstall } from "../../hooks/use-pwa-install.ts";
import { Button } from "../ui/button.tsx";
import { Dialog } from "../ui/dialog.tsx";

function InstallHelpDialog({
  help,
  onClose,
}: {
  help: "ios" | "browser" | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!help) return null;
  return (
    <Dialog
      open
      onClose={onClose}
      title={help === "ios" ? t("pwa.iosTitle") : t("pwa.browserTitle")}
      size="md"
    >
      <p>{help === "ios" ? t("pwa.iosBody") : t("pwa.browserBody")}</p>
      {help === "ios" ? (
        <p className="mt-3 inline-flex items-center gap-2 text-ink">
          <IconShare2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
          {t("pwa.iosShareHint")}
        </p>
      ) : null}
    </Dialog>
  );
}

export function PwaInstallAction() {
  const { t } = useTranslation();
  const pwa = usePwaInstall();
  if (pwa.installed) return null;
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="touch"
        className="w-full"
        onClick={() => void pwa.promptInstall()}
      >
        <IconDownload aria-hidden="true" />
        {t("pwa.install")}
      </Button>
      <InstallHelpDialog help={pwa.help} onClose={pwa.closeHelp} />
    </>
  );
}

export function PwaInstallBanner() {
  const { t } = useTranslation();
  const compact = useCompactChrome();
  const pwa = usePwaInstall();
  if (!compact || !pwa.showBanner) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-[var(--radius-panel)] border border-border bg-surface-raised/95 p-3 shadow-[0_12px_40px_rgb(12_10_8/0.35)] backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{t("pwa.bannerTitle")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("pwa.bannerBody")}</p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={() => void pwa.promptInstall()}
            >
              <IconDownload aria-hidden="true" />
              {t("pwa.install")}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={t("pwa.dismiss")}
            onClick={pwa.dismissBanner}
          >
            <IconX aria-hidden="true" />
          </Button>
        </div>
      </div>
      <InstallHelpDialog help={pwa.help} onClose={pwa.closeHelp} />
    </>
  );
}
