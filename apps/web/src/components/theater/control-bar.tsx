import {
  IconLogout,
  IconMicrophone,
  IconMicrophoneOff,
  IconScreenShare,
  IconUserPlus,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { canShareScreen } from "../../hooks/use-media.ts";
import { cn } from "../../lib/cn.ts";
import { canShareInvite, shareOrCopyInvite } from "../../lib/share-invite.ts";
import { Alert } from "../ui/alert.tsx";

type ControlBarProps = {
  roomName: string;
  roomId: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  screenEnabled: boolean;
  micLocked: boolean;
  livekitUnavailable: boolean;
  onMic: (next: boolean) => Promise<void>;
  onCamera: (next: boolean) => Promise<void>;
  onScreen: (next: boolean) => Promise<void>;
  onLeave: () => void;
  compact?: boolean;
};

function DockButton({
  label,
  pressed,
  danger,
  disabled,
  title,
  compact,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  compact?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={title ?? label}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-xl text-ink-muted",
        compact ? "relative h-12 min-h-12 min-w-0 flex-1 px-0" : "min-h-11 min-w-16 flex-col gap-1 px-2 py-2",
        "hover:bg-surface-sunken hover:text-accent",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        "disabled:pointer-events-none disabled:opacity-50",
        pressed && "bg-surface-sunken text-accent",
        danger && "text-danger hover:bg-danger-soft hover:text-danger",
      )}
    >
      {children}
      <span className={cn("label-caps opacity-80", compact && "sr-only")}>{label}</span>
    </button>
  );
}

export function ControlBar({
  roomName,
  roomId,
  micEnabled,
  cameraEnabled,
  screenEnabled,
  micLocked,
  livekitUnavailable,
  compact,
  onMic,
  onCamera,
  onScreen,
  onLeave,
}: ControlBarProps) {
  const { t } = useTranslation();
  const shareOk = canShareScreen();
  const iconClass = compact ? "size-6" : "size-5";

  const invite = async () => {
    const url = `${window.location.origin}/rooms/${roomId}`;
    const name = roomName.trim() || t("join.untitled");
    const title = t("theater.shareInviteTitle", { name });
    const text = t("theater.shareInviteText", { name, url });
    try {
      const result = await shareOrCopyInvite({ title, text, url });
      if (result === "copied") toast.success(t("toast.copied"));
    } catch {
      toast.error(t("toast.copyFailed"));
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", compact && "w-full")}>
      {livekitUnavailable ? <Alert title={t("theater.livekitDown")} /> : null}
      <div
        className={cn("dock", compact ? "dock-footer w-full" : "max-w-full")}
        role="toolbar"
        aria-label={t("a11y.controlsRegion")}
      >
        <DockButton
          compact={compact}
          label={t("theater.dockMic")}
          pressed={micEnabled}
          disabled={livekitUnavailable || micLocked}
          title={micLocked ? t("theater.mutedLocked") : micEnabled ? t("theater.micOn") : t("theater.micOff")}
          onClick={() => void onMic(!micEnabled)}
        >
          {micEnabled ? <IconMicrophone className={iconClass} aria-hidden="true" /> : <IconMicrophoneOff className={iconClass} aria-hidden="true" />}
        </DockButton>
        <DockButton
          compact={compact}
          label={t("theater.dockCamera")}
          pressed={cameraEnabled}
          disabled={livekitUnavailable}
          title={cameraEnabled ? t("theater.camOn") : t("theater.camOff")}
          onClick={() => void onCamera(!cameraEnabled)}
        >
          {cameraEnabled ? <IconVideo className={iconClass} aria-hidden="true" /> : <IconVideoOff className={iconClass} aria-hidden="true" />}
        </DockButton>
        <span className="mx-0.5 h-8 w-px shrink-0 bg-border" aria-hidden="true" />
        <DockButton
          compact={compact}
          label={t("theater.dockShare")}
          pressed={screenEnabled}
          disabled={livekitUnavailable || !shareOk}
          title={
            !shareOk
              ? t("theater.shareUnavailable")
              : screenEnabled
                ? t("theater.shareOn")
                : t("theater.shareAudioHint")
          }
          onClick={() => void onScreen(!screenEnabled)}
        >
          <IconScreenShare className={iconClass} aria-hidden="true" />
        </DockButton>
        <span className="mx-0.5 h-8 w-px shrink-0 bg-border" aria-hidden="true" />
        <DockButton
          compact={compact}
          label={t("theater.dockInvite")}
          title={canShareInvite() ? t("theater.shareInvite") : t("theater.copyInvite")}
          onClick={() => void invite()}
        >
          <IconUserPlus className={iconClass} aria-hidden="true" />
        </DockButton>
        <DockButton compact={compact} label={t("theater.dockLeave")} danger title={t("theater.leave")} onClick={onLeave}>
          <IconLogout className={iconClass} aria-hidden="true" />
        </DockButton>
      </div>
    </div>
  );
}
