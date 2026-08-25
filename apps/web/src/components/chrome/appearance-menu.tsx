import { IconMenu2 } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button.tsx";
import { Dialog } from "../ui/dialog.tsx";
import { Tooltip } from "../ui/tooltip.tsx";
import { AppearanceFields } from "./appearance-fields.tsx";
import { PwaInstallAction } from "./pwa-install.tsx";

export function AppearanceMenu({ profile }: { profile?: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip label={t("a11y.appearanceMenu")}>
        <Button
          variant="ghost"
          size="iconTouch"
          className="rounded-full"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={t("a11y.appearanceMenu")}
          onClick={() => setOpen(true)}
        >
          <IconMenu2 aria-hidden="true" />
        </Button>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("a11y.appearanceMenu")}
        size="full"
        bodyClassName="flex-1 overflow-y-auto px-5 py-6"
      >
        <div className="mx-auto flex w-full max-w-md flex-col gap-8">
          {profile ? <div className="text-ink">{profile}</div> : null}
          <AppearanceFields />
          <PwaInstallAction />
        </div>
      </Dialog>
    </>
  );
}
