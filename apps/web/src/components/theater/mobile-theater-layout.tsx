import type { ReactNode } from "react";
import { SkipLink } from "../chrome/site-header.tsx";
import { TheaterHeader } from "./theater-header.tsx";
import { TheaterSidePanel } from "./theater-side-panel.tsx";

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
}: MobileTheaterLayoutProps) {
  return (
    <div className="cockpit-shell relative flex min-h-dvh flex-col">
      <SkipLink />
      <TheaterHeader
        title={roomName}
        status={status}
        controls={controls}
        onSettings={onSettings}
        onLeaveHome={onLeaveHome}
      />
      <main id="main" className="flex min-h-0 flex-1 flex-col gap-3 px-3 pt-36 pb-3">
        <div className="stage-frame flex min-h-56 shrink-0 flex-col overflow-hidden">{stage}</div>
        <div className="min-h-0 min-w-0 flex-1">
          <TheaterSidePanel members={members} chat={chat} memberCount={memberCount} />
        </div>
      </main>
    </div>
  );
}
