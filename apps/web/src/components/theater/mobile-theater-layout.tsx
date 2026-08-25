import { IconMessage, IconUsers } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/cn.ts";
import { SkipLink } from "../chrome/site-header.tsx";
import { TheaterHeader } from "./theater-header.tsx";
import { UnreadBadge, unreadChatAria, type SideTab } from "./theater-side-panel.tsx";

type MobileTheaterLayoutProps = {
  roomName: string;
  status: ReactNode;
  memberCount: number;
  stage: ReactNode;
  members: ReactNode;
  chat: ReactNode;
  controls: ReactNode;
  onSettings: () => void;
  onLeaveHome: () => void;
  sideTab: SideTab;
  onSideTabChange: (tab: SideTab) => void;
  unreadChat: number;
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
};

export function MobileTheaterLayout({
  roomName,
  status,
  memberCount,
  stage,
  members,
  chat,
  controls,
  onSettings,
  onLeaveHome,
  sideTab,
  onSideTabChange,
  unreadChat,
  drawerOpen,
  onDrawerOpenChange,
}: MobileTheaterLayoutProps) {
  const { t } = useTranslation();

  const selectTab = (next: SideTab) => {
    if (drawerOpen && sideTab === next) {
      onDrawerOpenChange(false);
      return;
    }
    onSideTabChange(next);
    onDrawerOpenChange(true);
  };

  return (
    <div className="cockpit-shell relative flex h-dvh flex-col overflow-hidden">
      <SkipLink />
      <TheaterHeader
        mobile
        title={roomName}
        status={status}
        onSettings={onSettings}
        onLeaveHome={onLeaveHome}
      />
      <main id="main" className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-1">
        <div className="stage-frame flex min-h-0 w-full flex-1 flex-col overflow-y-auto">{stage}</div>
      </main>
      <div className="relative z-20 shrink-0 px-3 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="glass-panel mb-2 overflow-hidden">
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
              drawerOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="h-[min(42dvh,24rem)]">
                <div className="h-full min-h-0" role="tabpanel">
                  {sideTab === "chat" ? chat : members}
                </div>
              </div>
            </div>
          </div>
          <div
            className={cn("flex", drawerOpen && "border-t border-border")}
            role="tablist"
            aria-label={t("theater.sidePanel")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={drawerOpen && sideTab === "people"}
              aria-expanded={drawerOpen && sideTab === "people"}
              className={cn(
                "label-caps flex min-h-11 flex-1 items-center justify-center gap-2 px-3 tracking-wider",
                drawerOpen && sideTab === "people" ? "bg-accent-soft text-accent" : "text-ink-muted",
              )}
              onClick={() => selectTab("people")}
            >
              <IconUsers className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {t("theater.audience")} ({memberCount})
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={drawerOpen && sideTab === "chat"}
              aria-expanded={drawerOpen && sideTab === "chat"}
              aria-label={unreadChat > 0 ? unreadChatAria(unreadChat, t) : t("theater.chat")}
              className={cn(
                "label-caps flex min-h-11 flex-1 items-center justify-center gap-2 px-3 tracking-wider",
                drawerOpen && sideTab === "chat" ? "bg-accent-soft text-accent" : "text-ink-muted",
              )}
              onClick={() => selectTab("chat")}
            >
              <IconMessage className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t("theater.chat")}</span>
              <UnreadBadge count={unreadChat} />
            </button>
          </div>
        </div>
        {controls}
      </div>
    </div>
  );
}
