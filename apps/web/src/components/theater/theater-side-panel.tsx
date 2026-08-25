import { IconMessage, IconUsers } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";

export type SideTab = "people" | "chat";

export function unreadChatAria(count: number, t: (key: string, opts?: { count: number }) => string): string {
  return count === 1
    ? t("a11y.unreadChatOne", { count })
    : t("a11y.unreadChat", { count });
}

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] leading-none font-semibold text-ink-on-accent">
      {label}
    </span>
  );
}

type TheaterSidePanelProps = {
  members: ReactNode;
  chat: ReactNode;
  memberCount: number;
  tab: SideTab;
  onTabChange: (tab: SideTab) => void;
  unreadChat?: number;
};

export function TheaterSidePanel({
  members,
  chat,
  memberCount,
  tab,
  onTabChange,
  unreadChat = 0,
}: TheaterSidePanelProps) {
  const { t } = useTranslation();

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
          onClick={() => onTabChange("people")}
        >
          <IconUsers className="size-4" aria-hidden="true" />
          {t("theater.audience")} ({memberCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chat"}
          aria-label={unreadChat > 0 ? unreadChatAria(unreadChat, t) : t("theater.chat")}
          className={cn(
            "label-caps flex flex-1 items-center justify-center gap-2 py-4 tracking-wider",
            tab === "chat"
              ? "border-b-2 border-accent text-accent"
              : "border-b-2 border-transparent text-ink-muted hover:text-ink",
          )}
          onClick={() => onTabChange("chat")}
        >
          <IconMessage className="size-4" aria-hidden="true" />
          {t("theater.chat")}
          <UnreadBadge count={unreadChat} />
        </button>
      </div>
      <div className="min-h-0 flex-1" role="tabpanel">
        {tab === "chat" ? chat : members}
      </div>
    </aside>
  );
}
