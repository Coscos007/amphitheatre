import type { ReactNode } from "react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconCirclePlus, IconLogin } from "@tabler/icons-react";
import { cn } from "../../lib/cn.ts";

export function HomePanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full shrink-0 flex-col justify-center xl:w-[480px]">
      <div className="rounded-2xl border border-border bg-surface-overlay/80 p-1 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col">{children}</div>
      </div>
    </div>
  );
}

type HomeActionTabsProps = {
  join: ReactNode;
  create: ReactNode;
};

export function HomeActionTabs({ join, create }: HomeActionTabsProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"join" | "create">("join");
  const baseId = useId();
  const joinTabId = `${baseId}-join`;
  const createTabId = `${baseId}-create`;
  const joinPanelId = `${baseId}-join-panel`;
  const createPanelId = `${baseId}-create-panel`;

  const tabClass = (active: boolean) =>
    cn(
      "label-caps flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-center tracking-wider sm:flex-row sm:gap-2 sm:py-4",
      active
        ? "border-b-2 border-accent text-accent"
        : "border-b-2 border-transparent text-ink-muted hover:text-ink",
    );

  return (
    <div>
      <div
        className="mt-4 flex border-b border-border/70"
        role="tablist"
        aria-label={t("home.actionTabs")}
      >
        <button
          type="button"
          id={joinTabId}
          role="tab"
          aria-selected={tab === "join"}
          aria-controls={joinPanelId}
          className={tabClass(tab === "join")}
          onClick={() => setTab("join")}
        >
          <IconLogin className="size-4 shrink-0" aria-hidden="true" />
          {t("home.joinTitle")}
        </button>
        <button
          type="button"
          id={createTabId}
          role="tab"
          aria-selected={tab === "create"}
          aria-controls={createPanelId}
          className={tabClass(tab === "create")}
          onClick={() => setTab("create")}
        >
          <IconCirclePlus className="size-4 shrink-0" aria-hidden="true" />
          {t("home.createTitle")}
        </button>
      </div>
      <div className="p-4 sm:p-8">
        <div
          id={joinPanelId}
          role="tabpanel"
          aria-labelledby={joinTabId}
          hidden={tab !== "join"}
        >
          {join}
        </div>
        <div
          id={createPanelId}
          role="tabpanel"
          aria-labelledby={createTabId}
          hidden={tab !== "create"}
        >
          {create}
        </div>
      </div>
    </div>
  );
}
