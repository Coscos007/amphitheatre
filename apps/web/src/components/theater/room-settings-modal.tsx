import { IconAdjustments, IconBroadcast, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MediaDeviceKindName } from "../../hooks/use-livekit.ts";
import type { OmeInfo, RoomBroadcast } from "../../shared-types.ts";
import { cn } from "../../lib/cn.ts";
import { Dialog } from "../ui/dialog.tsx";
import { AboutPanel } from "./about-panel.tsx";
import { BroadcastSettingsPanel } from "./broadcast-settings-panel.tsx";
import { ChatSettingsPanel } from "./chat-settings-panel.tsx";
import { MediaSettingsPanel } from "./media-settings-panel.tsx";

type Tab = "admin" | "devices" | "about";

type RoomSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  broadcast: RoomBroadcast;
  floodBanSec: number;
  ingest?: OmeInfo["ingest"];
  canAdmin: boolean;
  listDevices: () => Promise<{
    audioinput: MediaDeviceInfo[];
    audiooutput: MediaDeviceInfo[];
    videoinput: MediaDeviceInfo[];
  }>;
  switchDevice: (kind: MediaDeviceKindName, deviceId: string) => Promise<void>;
  setOutputVolume: (volume: number) => void;
  setInputVolume: (volume: number) => void;
  onChatSaved: (floodBanSec: number) => void;
};

export function RoomSettingsModal({
  open,
  onClose,
  roomId,
  broadcast,
  floodBanSec,
  ingest,
  canAdmin,
  listDevices,
  switchDevice,
  setOutputVolume,
  setInputVolume,
  onChatSaved,
}: RoomSettingsModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("devices");
  const current = tab === "admin" && !canAdmin ? "devices" : tab;

  const tabs: { id: Tab; label: string; icon: typeof IconAdjustments; admin?: boolean }[] = [
    { id: "admin", label: t("settings.adminTab"), icon: IconBroadcast, admin: true },
    { id: "devices", label: t("settings.devicesTab"), icon: IconAdjustments },
    { id: "about", label: t("settings.aboutTab"), icon: IconInfoCircle },
  ];

  return (
    <Dialog open={open} onClose={onClose} title={t("settings.title")} size="xl" bodyClassName="p-0">
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <div
          className="flex shrink-0 flex-row gap-1 overflow-x-auto overflow-y-hidden border-b border-border p-2 sm:w-44 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0"
          role="tablist"
          aria-label={t("settings.title")}
          aria-orientation="vertical"
        >
          {tabs
            .filter((item) => !item.admin || canAdmin)
            .map((item) => {
              const Icon = item.icon;
              const selected = current === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cn(
                    "label-caps flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-left",
                    selected ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                  )}
                  onClick={() => setTab(item.id)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-4">
          {current === "devices" ? (
            <MediaSettingsPanel
              listDevices={listDevices}
              switchDevice={switchDevice}
              setOutputVolume={setOutputVolume}
              setInputVolume={setInputVolume}
            />
          ) : null}
          {current === "about" ? <AboutPanel /> : null}
          {current === "admin" ? (
            <div className="flex flex-col gap-8">
              <ChatSettingsPanel
                roomId={roomId}
                floodBanSec={floodBanSec}
                active={open && current === "admin"}
                onSaved={onChatSaved}
              />
              <BroadcastSettingsPanel
                roomId={roomId}
                broadcast={broadcast}
                ingest={ingest}
                active={open && current === "admin"}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
