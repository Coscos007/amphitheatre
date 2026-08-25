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
      aria-label={compact ? (title ?? label) : undefined}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "flex min-h-11 flex-col items-center gap-1 rounded-xl py-2 text-ink-muted",
        compact ? "min-w-11 px-1.5" : "min-w-16 px-2",
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

  const copyInvite = async () => {
    const url = `${window.location.origin}/rooms/${roomId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("toast.copied"));
    } catch {
      toast.error(t("toast.copyFailed"));
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", compact && "w-full max-w-full")}>
      {livekitUnavailable ? <Alert title={t("theater.livekitDown")} /> : null}
      <div
        className={cn("dock max-w-full", compact && "flex-wrap justify-center")}
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
          {micEnabled ? <IconMicrophone className="size-5" aria-hidden="true" /> : <IconMicrophoneOff className="size-5" aria-hidden="true" />}
        </DockButton>
        <DockButton
          compact={compact}
          label={t("theater.dockCamera")}
          pressed={cameraEnabled}
          disabled={livekitUnavailable}
          title={cameraEnabled ? t("theater.camOn") : t("theater.camOff")}
          onClick={() => void onCamera(!cameraEnabled)}
        >
          {cameraEnabled ? <IconVideo className="size-5" aria-hidden="true" /> : <IconVideoOff className="size-5" aria-hidden="true" />}
        </DockButton>
        <span className="mx-1 h-8 w-px bg-border" aria-hidden="true" />
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
          <IconScreenShare className="size-5" aria-hidden="true" />
        </DockButton>
        <span className="mx-1 h-8 w-px bg-border" aria-hidden="true" />
        <DockButton compact={compact} label={t("theater.dockInvite")} title={t("theater.copyInvite")} onClick={() => void copyInvite()}>
          <IconUserPlus className="size-5" aria-hidden="true" />
        </DockButton>
        <DockButton compact={compact} label={t("theater.dockLeave")} danger title={t("theater.leave")} onClick={onLeave}>
          <IconLogout className="size-5" aria-hidden="true" />
        </DockButton>
      </div>
    </div>
  );
}
