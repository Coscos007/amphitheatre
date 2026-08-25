import { IconMovie } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { OmeInfo, RoomBroadcast } from "../../shared-types.ts";
import type { StageTile } from "../../hooks/use-livekit.ts";
import { cn } from "../../lib/cn.ts";
import { BroadcastOfflineCard, hasBroadcastPlayback } from "./broadcast-pane.tsx";
import { StageGrid } from "./stage-grid.tsx";

type StageProps = {
  broadcast: RoomBroadcast;
  ome: OmeInfo | null;
  tiles: StageTile[];
  compact?: boolean;
};

export function Stage({ broadcast, ome, tiles, compact }: StageProps) {
  const { t } = useTranslation();
  const livePlayback = hasBroadcastPlayback(broadcast, ome);
  const notice = broadcast.enabled && !livePlayback;
  const hasVideo = tiles.length > 0 || livePlayback;
  const empty = !hasVideo && !notice;

  return (
    <section
      className={cn(
        "relative flex min-h-0 w-full flex-col gap-3 p-3",
        hasVideo || empty ? "h-full min-h-0 flex-1" : "h-auto",
      )}
      aria-label={t("a11y.stageRegion")}
    >
      {hasVideo ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-surface-sunken/40" />
      ) : null}
      {notice ? <BroadcastOfflineCard ome={ome} className="relative z-10 shrink-0" /> : null}
      {empty ? (
        <div className="relative z-10 flex min-h-48 w-full flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="mb-6 flex size-20 items-center justify-center rounded-full border border-border/50 bg-surface-sunken shadow-[0_0_40px_var(--hero-glow)]">
            <IconMovie className="size-9 text-ink-subtle" aria-hidden="true" />
          </span>
          <h2 className="font-display mb-3 text-[28px] leading-8 font-bold tracking-tight text-ink">
            {t("theater.emptyStageTitle")}
          </h2>
          <p className="max-w-[280px] text-base leading-6 text-ink-muted">{t("theater.emptyStageBody")}</p>
        </div>
      ) : hasVideo ? (
        <div className="relative z-10 flex min-h-[10rem] min-w-0 flex-1 flex-col">
          <StageGrid broadcast={broadcast} ome={ome} tiles={tiles} compact={compact} playbackOnly />
        </div>
      ) : null}
    </section>
  );
}
