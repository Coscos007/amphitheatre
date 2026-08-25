import type { OmeInfo } from "@coliseum/shared";
import { omeConfigured, type Env } from "./env";
import { logger } from "./logger";

export type OmeStreamStats = {
  reachable: boolean;
  live: boolean;
  lastThroughputIn: number;
  lastThroughputOut: number;
  totalBytesIn: number;
  totalBytesOut: number;
  totalConnections: number;
  connectionsWebrtc: number;
  connectionsLlhls: number;
};

export type OmeClient = {
  status: (streamKey: string) => Promise<OmeInfo>;
  listStreams: () => Promise<{ reachable: boolean; keys: string[] }>;
  streamStats: (streamKey: string) => Promise<OmeStreamStats>;
  appStats: () => Promise<OmeStreamStats>;
};

const UNREACHABLE: Pick<OmeInfo, "healthy" | "live" | "reachable" | "playbackUrl" | "llhlsUrl"> = {
  healthy: false,
  live: false,
  reachable: false,
  playbackUrl: null,
  llhlsUrl: null,
};

const STATS_DOWN: OmeStreamStats = {
  reachable: false,
  live: false,
  lastThroughputIn: 0,
  lastThroughputOut: 0,
  totalBytesIn: 0,
  totalBytesOut: 0,
  totalConnections: 0,
  connectionsWebrtc: 0,
  connectionsLlhls: 0,
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

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseStatsBody(json: unknown, live: boolean): OmeStreamStats {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const response = (root.response && typeof root.response === "object" ? root.response : root) as Record<
    string,
    unknown
  >;
  const connections =
    response.connections && typeof response.connections === "object"
      ? (response.connections as Record<string, unknown>)
      : {};
  return {
    reachable: true,
    live,
    lastThroughputIn: num(response.lastThroughputIn),
    lastThroughputOut: num(response.lastThroughputOut),
    totalBytesIn: num(response.totalBytesIn),
    totalBytesOut: num(response.totalBytesOut),
    totalConnections: num(response.totalConnections),
    connectionsWebrtc: num(connections.webrtc),
    connectionsLlhls: num(connections.llhls),
  };
}

function parseStreamKeys(json: unknown): string[] {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const response = root.response;
  if (Array.isArray(response)) {
    return response
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "name" in item && typeof item.name === "string") {
          return item.name;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
  }
  return [];
}

export function createOmeClient(env: Env, fetchImpl: typeof fetch = fetch): OmeClient {
  let lastUnreachableLog = 0;

  async function omeGet(path: string): Promise<{ ok: boolean; status: number; json: unknown } | null> {
    if (!env.OME_API_URL) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.OME_TIMEOUT_MS);
    try {
      const url = `${env.OME_API_URL.replace(/\/+$/, "")}${path}`;
      const headers: Record<string, string> = {};
      if (env.OME_API_ACCESS_TOKEN) {
        headers.Authorization = omeAuthHeader(env.OME_API_ACCESS_TOKEN);
      }
      const res = await fetchImpl(url, { method: "GET", headers, signal: controller.signal });
      lastUnreachableLog = 0;
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      return { ok: res.ok, status: res.status, json };
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
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const vhost = () => encodeURIComponent(env.OME_VHOST);
  const app = () => encodeURIComponent(env.OME_APP);

  return {
    async status(streamKey: string): Promise<OmeInfo> {
      const configured = omeConfigured(env);
      if (!env.OME_API_URL) {
        return { configured, ...UNREACHABLE };
      }
      const res = await omeGet(
        `/v1/vhosts/${vhost()}/apps/${app()}/streams/${encodeURIComponent(streamKey)}`,
      );
      if (!res) return { configured, ...UNREACHABLE };
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
    },
    async listStreams() {
      if (!env.OME_API_URL) return { reachable: false, keys: [] };
      const res = await omeGet(`/v1/vhosts/${vhost()}/apps/${app()}/streams`);
      if (!res) return { reachable: false, keys: [] };
      if (!res.ok) return { reachable: true, keys: [] };
      return { reachable: true, keys: parseStreamKeys(res.json) };
    },
    async streamStats(streamKey: string) {
      if (!env.OME_API_URL) return { ...STATS_DOWN };
      const res = await omeGet(
        `/v1/stats/current/vhosts/${vhost()}/apps/${app()}/streams/${encodeURIComponent(streamKey)}`,
      );
      if (!res) return { ...STATS_DOWN };
      if (res.status === 404) return { ...STATS_DOWN, reachable: true, live: false };
      if (!res.ok) return { ...STATS_DOWN, reachable: true };
      return parseStatsBody(res.json, true);
    },
    async appStats() {
      if (!env.OME_API_URL) return { ...STATS_DOWN };
      const res = await omeGet(`/v1/stats/current/vhosts/${vhost()}/apps/${app()}`);
      if (!res) return { ...STATS_DOWN };
      if (!res.ok) return { ...STATS_DOWN, reachable: res.status !== 0 };
      return parseStatsBody(res.json, true);
    },
  };
}
