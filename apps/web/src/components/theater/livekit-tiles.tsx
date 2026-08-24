import { useEffect, useRef } from "react";
import { IconScreenShare, IconVideo } from "@tabler/icons-react";
import type { Track } from "livekit-client";
import { useTranslation } from "react-i18next";
import type { StageTile } from "../../hooks/use-livekit.ts";
import { cn } from "../../lib/cn.ts";

export function AttachVideo({ track, className }: { track: Track; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  return (
    <video
      ref={ref}
      className={cn("h-full w-full object-contain", className)}
      autoPlay
      playsInline
      muted={false}
    />
  );
}

export function LivekitTiles({ tiles, featured }: { tiles: StageTile[]; featured?: boolean }) {
  const { t } = useTranslation();
  if (tiles.length === 0) return null;
  return (
    <ul
      className={cn(
        "grid gap-2",
        featured ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
      )}
    >
      {tiles.map((tile) => (
        <li
          key={tile.id}
          className="relative min-h-32 overflow-hidden rounded-[var(--radius-panel)] bg-surface-sunken"
        >
          <AttachVideo track={tile.track} />
          <p className="absolute bottom-2 left-2 inline-flex items-center gap-1 bg-surface-inverse/80 px-2 py-1 text-xs text-surface-page">
            {tile.source === "screen" ? (
              <IconScreenShare className="size-3.5" aria-hidden="true" />
            ) : (
              <IconVideo className="size-3.5" aria-hidden="true" />
            )}
            {tile.name}
            {tile.isLocal ? ` (${t("app.you")})` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
