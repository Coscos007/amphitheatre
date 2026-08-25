import { IconBroadcast, IconRefresh } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { broadcastIframeSrc, type RoomBroadcast } from "@coliseum/shared";
import type { OmeInfo } from "../../shared-types.ts";
import { useOmePlayer } from "../../hooks/use-ome-player.ts";
import { hasOmePlayback, omePlayerSources } from "../../lib/ome-playback.ts";
import { cn } from "../../lib/cn.ts";
import { Alert } from "../ui/alert.tsx";
import { Button } from "../ui/button.tsx";

type BroadcastPaneProps = {
  broadcast: RoomBroadcast;
  ome: OmeInfo | null;
  onReload?: () => void;
};

const MIN_BOX = 8;

function BroadcastEmbed({ src, title }: { src: string; title: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const tryMount = () => {
      if (el.clientWidth < MIN_BOX || el.clientHeight < MIN_BOX) return;
      setReady(true);
    };
    const observer = new ResizeObserver(tryMount);
    observer.observe(el);
    tryMount();
    return () => observer.disconnect();
  }, [src]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setGeneration((value) => value + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <div ref={hostRef} className="relative h-full min-h-32 w-full">
      {ready ? (
        <iframe
          key={`${src}:${generation}`}
          title={title}
          src={src}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : null}
    </div>
  );
}

export function BroadcastPane({ broadcast, ome, onReload }: BroadcastPaneProps) {
  const { t } = useTranslation();
  const [generation, setGeneration] = useState(0);
  const sources = useMemo(
    () =>
      broadcast.enabled && broadcast.provider === "ome"
        ? omePlayerSources(ome, {
            webrtc: t("theater.protocolWebrtc"),
            hls: t("theater.protocolLlhls"),
          })
        : [],
    [broadcast, ome, t],
  );
  const { containerRef, failed } = useOmePlayer(sources, generation);
  const omeLive = sources.length > 0;
  const embedSrc =
    broadcast.enabled && broadcast.provider !== "ome"
      ? broadcastIframeSrc(broadcast, window.location.hostname)
      : null;
  const retry = () => {
    if (onReload) onReload();
    else setGeneration((value) => value + 1);
  };

  if (embedSrc) {
    return <BroadcastEmbed src={embedSrc} title={t("theater.broadcastEmbed")} />;
  }

  if (omeLive) {
    return (
      <div className="relative h-full min-h-32 w-full">
        <div
          ref={containerRef}
          className="ome-player h-full min-h-32 w-full"
          role="region"
          aria-label={t("theater.stage")}
          aria-hidden={failed || undefined}
        />
        {failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
            <Alert tone="warning" title={t("theater.omeDownTitle")}>
              {t("theater.omeDownBody")}
            </Alert>
            <Button variant="secondary" onClick={retry}>
              <IconRefresh aria-hidden="true" />
              {t("theater.reloadStream")}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return <BroadcastOfflineCard ome={ome} />;
}

export function BroadcastOfflineCard({ ome, className }: { ome: OmeInfo | null; className?: string }) {
  const { t } = useTranslation();
  if (ome?.reachable && !ome.healthy) {
    return (
      <Alert tone="warning" title={t("theater.omeDownTitle")} className={cn("w-full min-w-0", className)}>
        {t("theater.omeDownBody")}
      </Alert>
    );
  }
  return (
    <div
      className={cn(
        "flex w-full min-w-0 gap-3 rounded-[var(--radius-panel)] border border-border bg-surface-raised p-4 text-left",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-sunken">
        <IconBroadcast className="size-5 text-ink-subtle" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-base text-ink">{t("theater.broadcastWaiting")}</p>
        <p className="mt-1 text-sm text-ink-muted">{t("theater.broadcastWaitingBody")}</p>
      </div>
    </div>
  );
}

export function hasBroadcastPlayback(broadcast: RoomBroadcast, ome: OmeInfo | null): boolean {
  if (!broadcast.enabled) return false;
  if (broadcast.provider === "ome") return hasOmePlayback(ome);
  return Boolean(broadcast.embed);
}

export function hasBroadcastSurface(broadcast: RoomBroadcast, ome: OmeInfo | null = null): boolean {
  if (!broadcast.enabled) return false;
  if (broadcast.provider === "ome") return true;
  return Boolean(broadcast.embed) || hasBroadcastPlayback(broadcast, ome);
}
