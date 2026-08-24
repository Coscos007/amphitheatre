import type { ReactNode } from "react";
import { SkipLink } from "../chrome/site-header.tsx";
import { TheaterHeader } from "./theater-header.tsx";
import { TheaterSidePanel } from "./theater-side-panel.tsx";

type DesktopTheaterLayoutProps = {
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

export function DesktopTheaterLayout({
  roomName,
  status,
  memberCount,
  stage,
  members,
  chat,
  controls,
  onSettings,
  onLeaveHome,
}: DesktopTheaterLayoutProps) {
  return (
    <div className="cockpit-shell relative flex h-dvh flex-col overflow-hidden">
      <SkipLink />
      <TheaterHeader
        title={roomName}
        status={status}
        controls={controls}
        onSettings={onSettings}
        onLeaveHome={onLeaveHome}
      />
      <main id="main" className="flex min-h-0 flex-1 gap-6 overflow-hidden px-6 pt-28 pb-6">
        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="stage-frame flex min-h-0 flex-1 flex-col">{stage}</div>
        </section>
        <div className="flex h-full min-h-0 w-[340px] shrink-0 flex-col">
          <TheaterSidePanel members={members} chat={chat} memberCount={memberCount} />
        </div>
      </main>
    </div>
  );
}
