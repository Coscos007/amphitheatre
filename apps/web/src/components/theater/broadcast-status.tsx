import { useTranslation } from "react-i18next";
import type { RoomBroadcast } from "../../shared-types.ts";
import { cn } from "../../lib/cn.ts";

type BroadcastStatusProps = {
  broadcast: RoomBroadcast;
  omeLive: boolean;
};

export function BroadcastStatus({ broadcast, omeLive }: BroadcastStatusProps) {
  const { t } = useTranslation();
  const live = broadcast.enabled && (broadcast.provider === "ome" ? omeLive : Boolean(broadcast.embed));
  const label = !broadcast.enabled
    ? t("theater.broadcastOff")
    : live
      ? t("theater.omeLive")
      : t("theater.broadcastWaiting");

  return (
    <span
      className={cn(
        "label-caps ml-0 inline-flex max-w-[9.5rem] items-center gap-1.5 truncate rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider sm:ml-2 sm:max-w-none",
        live
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-border bg-surface-raised/50 text-ink-muted",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", live ? "bg-success" : "bg-border")}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
