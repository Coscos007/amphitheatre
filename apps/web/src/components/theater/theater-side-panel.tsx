import { IconMessage, IconUsers } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";

type TheaterSidePanelProps = {
  members: ReactNode;
  chat: ReactNode;
  memberCount: number;
  defaultTab?: "people" | "chat";
};

export function TheaterSidePanel({
  members,
  chat,
  memberCount,
  defaultTab = "chat",
}: TheaterSidePanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"people" | "chat">(defaultTab);

  return (
    <aside className="glass-panel flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex border-b border-border/70" role="tablist" aria-label={t("theater.sidePanel")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "people"}
          className={cn(
            "label-caps flex flex-1 items-center justify-center gap-2 py-4 tracking-wider",
            tab === "people"
              ? "border-b-2 border-accent text-accent"
              : "border-b-2 border-transparent text-ink-muted hover:text-ink",
          )}
          onClick={() => setTab("people")}
        >
          <IconUsers className="size-4" aria-hidden="true" />
          {t("theater.audience")} ({memberCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chat"}
          className={cn(
            "label-caps flex flex-1 items-center justify-center gap-2 py-4 tracking-wider",
            tab === "chat"
              ? "border-b-2 border-accent text-accent"
              : "border-b-2 border-transparent text-ink-muted hover:text-ink",
          )}
          onClick={() => setTab("chat")}
        >
          <IconMessage className="size-4" aria-hidden="true" />
          {t("theater.chat")}
        </button>
      </div>
      <div className="min-h-0 flex-1" role="tabpanel">
        {tab === "chat" ? chat : members}
      </div>
    </aside>
  );
}
