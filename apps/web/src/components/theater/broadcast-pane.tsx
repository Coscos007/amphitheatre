import { IconBroadcast, IconRefresh } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { broadcastIframeSrc, type RoomBroadcast } from "@coliseum/shared";
import type { OmeInfo } from "../../shared-types.ts";
import { useOmePlayer } from "../../hooks/use-ome-player.ts";
import { omePlayerSources } from "../../lib/ome-playback.ts";
import { Alert } from "../ui/alert.tsx";
import { Button } from "../ui/button.tsx";

type BroadcastPaneProps = {
  broadcast: RoomBroadcast;
  ome: OmeInfo | null;
  onReload?: () => void;
};

const MIN_BOX = 8;

function withEmbedOrigin(src: string, provider: RoomBroadcast["provider"]): string {
  if (provider !== "youtube") return src;
  const origin = encodeURIComponent(window.location.origin);
  return src.includes("origin=") ? src : `${src}&origin=${origin}`;
}

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
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
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
  const rawEmbed =
    broadcast.enabled && broadcast.provider !== "ome"
      ? broadcastIframeSrc(broadcast, window.location.hostname)
      : null;
  const embedSrc = rawEmbed ? withEmbedOrigin(rawEmbed, broadcast.provider) : null;
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

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-black/40 p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-border bg-surface-sunken">
        <IconBroadcast className="size-7 text-ink-subtle" aria-hidden="true" />
      </span>
      {ome?.reachable && !ome.healthy ? (
        <Alert tone="warning" title={t("theater.omeDownTitle")}>
          {t("theater.omeDownBody")}
        </Alert>
      ) : (
        <>
          <p className="font-display text-lg text-ink">{t("theater.broadcastWaiting")}</p>
          <p className="max-w-[32ch] text-sm text-ink-muted">{t("theater.broadcastWaitingBody")}</p>
        </>
      )}
    </div>
  );
}

export function hasBroadcastSurface(broadcast: RoomBroadcast): boolean {
  if (!broadcast.enabled) return false;
  if (broadcast.provider === "ome") return true;
  return Boolean(broadcast.embed);
}
