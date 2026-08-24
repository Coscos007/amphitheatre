export const STREAM_PROVIDERS = ["ome", "twitch", "youtube", "kick", "custom"] as const;

export type StreamProvider = (typeof STREAM_PROVIDERS)[number];

export type RoomBroadcast = {
  enabled: boolean;
  provider: StreamProvider | "none";
  /** Channel, video id, or https URL. Never the OME stream secret. */
  embed: string | null;
};

export type BroadcastUpdate = {
  enabled: boolean;
  provider?: StreamProvider;
  embed?: string | null;
  rotateKey?: boolean;
};

const CHANNEL = /^[a-zA-Z0-9_]{3,25}$/;
const KICK_CHANNEL = /^[a-zA-Z0-9_-]{3,25}$/;
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function isStreamProvider(value: string): value is StreamProvider {
  return (STREAM_PROVIDERS as readonly string[]).includes(value);
}

export function emptyBroadcast(): RoomBroadcast {
  return { enabled: false, provider: "none", embed: null };
}

function extractYoutubeId(raw: string): string | null {
  const trimmed = raw.trim();
  if (YT_ID.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return YT_ID.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && YT_ID.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts[0];
      const next = parts[1] ?? "";
      if ((marker === "embed" || marker === "live" || marker === "shorts") && YT_ID.test(next)) {
        return next;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function extractChannel(raw: string, hostAllow: string[]): string | null {
  const trimmed = raw.trim();
  if (CHANNEL.test(trimmed) || KICK_CHANNEL.test(trimmed)) return trimmed.replace(/^@/, "");
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");
    if (!hostAllow.includes(host)) return null;
    const slug = url.pathname.split("/").filter(Boolean)[0] ?? "";
    const clean = slug.replace(/^@/, "");
    return clean || null;
  } catch {
    return null;
  }
}

export function normalizeBroadcastEmbed(
  provider: StreamProvider,
  raw: string | null | undefined,
): string | null {
  if (provider === "ome") return null;
  const value = raw?.trim() ?? "";
  if (!value) return null;
  if (provider === "youtube") return extractYoutubeId(value);
  if (provider === "twitch") {
    const channel = extractChannel(value, ["twitch.tv", "m.twitch.tv"]);
    return channel && CHANNEL.test(channel) ? channel : null;
  }
  if (provider === "kick") {
    const channel = extractChannel(value, ["kick.com"]);
    return channel && KICK_CHANNEL.test(channel) ? channel : null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function broadcastIframeSrc(
  broadcast: Pick<RoomBroadcast, "enabled" | "provider" | "embed">,
  parentHost: string,
): string | null {
  if (!broadcast.enabled || !broadcast.embed) return null;
  const parent = parentHost.replace(/:\d+$/, "") || "localhost";
  if (broadcast.provider === "twitch") {
    return `https://player.twitch.tv/?channel=${encodeURIComponent(broadcast.embed)}&parent=${encodeURIComponent(parent)}&muted=false`;
  }
  if (broadcast.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(broadcast.embed)}?autoplay=1&rel=0`;
  }
  if (broadcast.provider === "kick") {
    return `https://player.kick.com/${encodeURIComponent(broadcast.embed)}`;
  }
  if (broadcast.provider === "custom") return broadcast.embed;
  return null;
}
