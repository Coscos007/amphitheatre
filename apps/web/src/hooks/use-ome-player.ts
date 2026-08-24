import Hls from "hls.js";
import OvenPlayer, { type OvenPlayerInstance } from "ovenplayer";
import { useEffect, useRef, useState } from "react";
import type { OmePlayerSource } from "../lib/ome-playback.ts";

const MIN_BOX = 8;
const AUTO_RETRIES = 2;
const RETRY_MS = 450;

function attachHlsGlobal(): void {
  const view = window as Window & { Hls?: typeof Hls };
  if (!view.Hls) view.Hls = Hls;
}

function sourceKey(sources: OmePlayerSource[]): string {
  return sources.map((source) => `${source.type}:${source.file}`).join("|");
}

function hasBox(el: HTMLElement): boolean {
  return el.clientWidth >= MIN_BOX && el.clientHeight >= MIN_BOX;
}

function tearDown(player: OvenPlayerInstance | null): void {
  if (!player) return;
  try {
    player.remove();
  } catch {
    /* already torn down */
  }
}

function mountHost(wrapper: HTMLElement): HTMLDivElement {
  wrapper.replaceChildren();
  const host = document.createElement("div");
  host.style.width = "100%";
  host.style.height = "100%";
  host.style.minHeight = `${MIN_BOX}px`;
  wrapper.appendChild(host);
  return host;
}

/**
 * Create OvenPlayer only after the container has a real box.
 * SPA remounts (home -> room) often run create() at 0x0; a full refresh
 * "fixes" it because layout is ready. Retry on error; `generation` forces a rebuild.
 */
export function useOmePlayer(sources: OmePlayerSource[], generation = 0) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const key = sourceKey(sources);

  useEffect(() => {
    const el = containerRef.current;
    const nextSources = sources;
    if (!el || nextSources.length === 0) {
      setFailed(false);
      return;
    }

    let cancelled = false;
    let player: OvenPlayerInstance | null = null;
    let attempts = 0;
    let retryTimer: number | undefined;
    let onReady: (() => void) | undefined;
    let onError: (() => void) | undefined;
    let onState: ((data?: unknown) => void) | undefined;

    const unbind = () => {
      if (!player) return;
      if (onReady) player.off("ready", onReady);
      if (onError) player.off("error", onError);
      if (onState) player.off("stateChanged", onState);
    };

    const start = () => {
      if (cancelled || !el.isConnected || !hasBox(el)) return;
      unbind();
      tearDown(player);
      player = null;
      const host = mountHost(el);
      setFailed(false);
      attachHlsGlobal();

      try {
        player = OvenPlayer.create(host, {
          autoStart: true,
          autoFallback: true,
          controls: true,
          mute: false,
          disableSeekUI: true,
          // Keep HLS in the playlist so autoFallback can leave WebRTC
          currentProtocolOnly: false,
          showBigPlayButton: false,
          iOSFakeFullScreen: true,
          expandFullScreenUI: true,
          sources: nextSources,
          webrtcConfig: {
            timeoutMaxRetry: 2,
            connectionTimeout: 5000,
            // OvenPlayer only applies a truthy hint (0 is ignored)
            playoutDelayHint: 0.05,
          },
          hlsConfig: {
            lowLatencyMode: true,
            liveSyncDurationCount: 2,
            liveMaxLatencyDurationCount: 5,
            maxLiveSyncPlaybackRate: 1.2,
            liveDurationInfinity: true,
            backBufferLength: 4,
          },
        });
      } catch {
        scheduleRetry();
        return;
      }

      onReady = () => {
        if (cancelled) return;
        setFailed(false);
        try {
          player?.setAutoQuality?.(true);
        } catch {
          /* optional API */
        }
        try {
          player?.play();
        } catch {
          /* autoplay may be blocked */
        }
      };
      onError = () => {
        if (!cancelled) scheduleRetry();
      };
      onState = (data?: unknown) => {
        if (cancelled || !data || typeof data !== "object") return;
        const next = "newstate" in data ? String((data as { newstate: unknown }).newstate) : "";
        if (next === "playing") setFailed(false);
      };

      player.on("ready", onReady);
      player.on("error", onError);
      player.on("stateChanged", onState);
    };

    const scheduleRetry = () => {
      if (cancelled) return;
      attempts += 1;
      unbind();
      tearDown(player);
      player = null;
      if (attempts > AUTO_RETRIES) {
        setFailed(true);
        return;
      }
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        if (!cancelled) start();
      }, RETRY_MS);
    };

    const observer = new ResizeObserver(() => {
      if (!player && hasBox(el)) start();
    });
    observer.observe(el);
    start();

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(retryTimer);
      unbind();
      tearDown(player);
      player = null;
      if (el.isConnected) el.replaceChildren();
    };
  }, [key, generation]);

  return { containerRef, failed };
}
