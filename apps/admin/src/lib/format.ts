export function formatBps(bps: number | null | undefined): string {
  if (bps === null || bps === undefined || !Number.isFinite(bps)) return "—";
  const abs = Math.abs(bps);
  if (abs < 1000) return `${bps.toFixed(0)} bps`;
  if (abs < 1_000_000) return `${(bps / 1000).toFixed(1)} kbps`;
  return `${(bps / 1_000_000).toFixed(2)} Mbps`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms >= 60_000) {
    const minutes = Math.ceil(ms / 60_000);
    return `${minutes}`;
  }
  return `${Math.ceil(ms / 1000)}`;
}

export function formatTimestamp(ts: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function trackSourceLabel(source: string): string {
  const key = source.trim().toLowerCase();
  if (key === "microphone" || key === "mic") return "microphone";
  if (key === "camera") return "camera";
  if (key === "screen_share" || key === "screen" || key === "screenshare") return "screen";
  if (key === "screen_share_audio" || key === "screen_audio") return "screenAudio";
  return "unknown";
}
