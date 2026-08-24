import type { OmeInfo } from "@coliseum/shared";
import { omeConfigured, type Env } from "./env";
import { logger } from "./logger";

export type OmeClient = {
  status: (streamKey: string) => Promise<OmeInfo>;
};

const UNREACHABLE: Pick<OmeInfo, "healthy" | "live" | "reachable" | "playbackUrl" | "llhlsUrl"> = {
  healthy: false,
  live: false,
  reachable: false,
  playbackUrl: null,
  llhlsUrl: null,
};

function omeAuthHeader(token: string): string {
  return `Basic ${Buffer.from(token).toString("base64")}`;
}

function joinUrl(base: string, streamKey: string, suffix = ""): string {
  const trimmed = base.replace(/\/+$/, "");
  return `${trimmed}/${encodeURIComponent(streamKey)}${suffix}`;
}

export function playbackUrls(
  env: Env,
  streamKey: string,
  live: boolean,
): Pick<OmeInfo, "playbackUrl" | "llhlsUrl"> {
  if (!live) return { playbackUrl: null, llhlsUrl: null };
  return {
    playbackUrl: env.OME_PLAYBACK_URL ? joinUrl(env.OME_PLAYBACK_URL, streamKey) : null,
    llhlsUrl: env.OME_LLHLS_PLAYBACK_BASE
      ? joinUrl(env.OME_LLHLS_PLAYBACK_BASE, streamKey, "/llhls.m3u8")
      : null,
  };
}

export function describeFetchError(err: unknown): { name: string; message: string; timeout: boolean } {
  if (err instanceof Error) {
    const timeout = err.name === "AbortError" || err.name === "TimeoutError";
    const cause = err.cause instanceof Error ? err.cause.message : undefined;
    const message = [err.message, cause].filter(Boolean).join(" — ") || err.name;
    return { name: err.name, message, timeout };
  }
  return { name: "unknown", message: String(err), timeout: false };
}

export function createOmeClient(env: Env, fetchImpl: typeof fetch = fetch): OmeClient {
  let lastUnreachableLog = 0;
  return {
    async status(streamKey: string): Promise<OmeInfo> {
      const configured = omeConfigured(env);
      if (!env.OME_API_URL) {
        return { configured, ...UNREACHABLE };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.OME_TIMEOUT_MS);
      try {
        const url = `${env.OME_API_URL.replace(/\/+$/, "")}/v1/vhosts/${encodeURIComponent(env.OME_VHOST)}/apps/${encodeURIComponent(env.OME_APP)}/streams/${encodeURIComponent(streamKey)}`;
        const headers: Record<string, string> = {};
        if (env.OME_API_ACCESS_TOKEN) {
          headers.Authorization = omeAuthHeader(env.OME_API_ACCESS_TOKEN);
        }
        const res = await fetchImpl(url, { method: "GET", headers, signal: controller.signal });
        lastUnreachableLog = 0;
        if (res.ok) {
          const urls = playbackUrls(env, streamKey, true);
          return { configured: true, healthy: true, live: true, reachable: true, ...urls };
        }
        if (res.status === 404) {
          return {
            configured: true,
            healthy: true,
            live: false,
            reachable: true,
            playbackUrl: null,
            llhlsUrl: null,
          };
        }
        logger.warn("ome_status_unexpected", { status: res.status, streamKey });
        return {
          configured: true,
          healthy: false,
          live: false,
          reachable: true,
          playbackUrl: null,
          llhlsUrl: null,
        };
      } catch (err) {
        const parsed = describeFetchError(err);
        const now = Date.now();
        if (now - lastUnreachableLog > 60_000) {
          lastUnreachableLog = now;
          logger.warn("ome_status_failed", {
            name: parsed.name,
            message: parsed.message,
            timeout: parsed.timeout,
            hint: "OME nao esta no ar (esperado sem make ome-up). Chat/voz seguem.",
          });
        }
        return { configured, ...UNREACHABLE };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
