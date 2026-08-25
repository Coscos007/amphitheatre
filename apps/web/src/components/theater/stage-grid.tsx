import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RoomBroadcast } from "@coliseum/shared";
import type { OmeInfo } from "../../shared-types.ts";
import type { StageTile } from "../../hooks/use-livekit.ts";
import { cn } from "../../lib/cn.ts";
import { AttachVideo } from "./livekit-tiles.tsx";
import { BroadcastPane, hasBroadcastPlayback, hasBroadcastSurface } from "./broadcast-pane.tsx";
import { StageTileChrome } from "./stage-tile.tsx";

type StageItem = {
  id: string;
  title: string;
  source: "camera" | "screen" | "broadcast";
  tile?: StageTile;
};

function autoGridClass(count: number, compact?: boolean): string {
  if (compact) return count <= 1 ? "grid-cols-1" : "grid-cols-2";
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-2 lg:grid-cols-3";
}

type StageGridProps = {
  broadcast: RoomBroadcast;
  ome: OmeInfo | null;
  tiles: StageTile[];
  compact?: boolean;
  playbackOnly?: boolean;
};

export function StageGrid({ broadcast, ome, tiles, compact, playbackOnly = false }: StageGridProps) {
  const { t } = useTranslation();
  const showBroadcast = playbackOnly
    ? hasBroadcastPlayback(broadcast, ome)
    : hasBroadcastSurface(broadcast, ome);
  const items = useMemo<StageItem[]>(() => {
    const next: StageItem[] = [];
    if (showBroadcast) {
      next.push({
        id: "broadcast",
        title: t("theater.broadcastTile"),
        source: "broadcast",
      });
    }
    for (const tile of tiles) {
      next.push({
        id: tile.id,
        title: tile.isLocal ? `${tile.name} (${t("app.you")})` : tile.name,
        source: tile.source,
        tile,
      });
    }
    return next;
  }, [showBroadcast, tiles, t]);

  const [pinned, setPinned] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (touched) {
      setPinned((current) => current.filter((id) => items.some((item) => item.id === id)));
      return;
    }
    if (showBroadcast) {
      setPinned(["broadcast"]);
      return;
    }
    const screen = items.find((item) => item.source === "screen");
    setPinned(screen ? [screen.id] : []);
  }, [items, showBroadcast, touched]);

  const togglePin = (id: string) => {
    setTouched(true);
    setPinned((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const pinnedItems = items.filter((item) => pinned.includes(item.id));
  const sideItems = items.filter((item) => !pinned.includes(item.id));
  const split = !compact && pinnedItems.length > 0 && sideItems.length > 0;
  const main = split ? pinnedItems : items;
  const rail = split ? sideItems : [];

  const reloadBroadcast = () => setReloadToken((value) => value + 1);

  const renderItem = (item: StageItem, featured: boolean, wide = false) => (
    <StageTileChrome
      key={item.id}
      title={item.title}
      source={item.source}
      pinned={pinned.includes(item.id)}
      onTogglePin={() => togglePin(item.id)}
      onReload={item.source === "broadcast" ? reloadBroadcast : undefined}
      className={cn(
        featured ? (compact ? "h-full min-h-24" : "h-full min-h-40") : compact ? "min-h-24" : "min-h-32",
        wide && "col-span-2",
      )}
    >
      {item.source === "broadcast" ? (
        <BroadcastPane key={reloadToken} broadcast={broadcast} ome={ome} onReload={reloadBroadcast} />
      ) : item.tile ? (
        <AttachVideo track={item.tile.track} />
      ) : null}
    </StageTileChrome>
  );

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 gap-3",
        compact ? "flex-col" : "flex-col md:flex-row",
      )}
    >
      <div className={cn("grid h-full min-h-0 flex-1 auto-rows-fr gap-3", autoGridClass(main.length, compact))}>
        {main.map((item, index) =>
          renderItem(
            item,
            true,
            Boolean(compact && main.length > 1 && main.length % 2 === 1 && index === main.length - 1),
          ),
        )}
      </div>
      {rail.length > 0 ? (
        <aside
          className={cn(
            "flex shrink-0 gap-2",
            compact
              ? "h-28 flex-row overflow-x-auto"
              : "h-28 flex-row overflow-x-auto md:h-auto md:w-[168px] md:flex-col md:overflow-y-auto",
          )}
          aria-label={t("theater.sideTiles")}
        >
          {rail.map((item) => (
            <div key={item.id} className={cn(compact ? "w-40 shrink-0" : "w-40 shrink-0 md:w-full md:flex-none")}>
              {renderItem(item, false)}
            </div>
          ))}
        </aside>
      ) : null}
    </div>
  );
}
