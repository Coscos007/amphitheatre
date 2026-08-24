import type { OmeInfo } from "@coliseum/shared";

export type OmePlayerSource = {
  type: "webrtc" | "hls";
  file: string;
  label: string;
};

export type OmePlayerLabels = {
  webrtc: string;
  hls: string;
};

const DEFAULT_LABELS: OmePlayerLabels = {
  webrtc: "WebRTC",
  hls: "LL-HLS",
};

function isHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function isWsUrl(url: string): boolean {
  return url.startsWith("ws://") || url.startsWith("wss://");
}

/** WebRTC signalling for playlist FileName `webrtc` (H.264 ladder + Opus). Not /llhls (AAC). */
export function webrtcAbrUrl(playbackUrl: string): string {
  const base = playbackUrl.replace(/\/+$/, "").replace(/\/llhls$/i, "").replace(/\/webrtc$/i, "");
  return `${base}/webrtc`;
}

export function omePlayerSources(
  ome: OmeInfo | null | undefined,
  labels: OmePlayerLabels = DEFAULT_LABELS,
): OmePlayerSource[] {
  if (!ome?.healthy || !ome.live) return [];
  const sources: OmePlayerSource[] = [];
  if (ome.playbackUrl && isWsUrl(ome.playbackUrl)) {
    sources.push({
      type: "webrtc",
      file: webrtcAbrUrl(ome.playbackUrl),
      label: labels.webrtc,
    });
  }
  if (ome.llhlsUrl && isHttpUrl(ome.llhlsUrl)) {
    sources.push({
      type: "hls",
      file: ome.llhlsUrl,
      label: labels.hls,
    });
  }
  return sources;
}

export function hasOmePlayback(ome: OmeInfo | null | undefined): boolean {
  return omePlayerSources(ome).length > 0;
}
