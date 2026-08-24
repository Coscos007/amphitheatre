import { limits } from "@coliseum/shared";

export function pruneChatTimes(
  times: number[],
  now: number,
  windowMs = limits.chatBurst.windowMs,
): number[] {
  return times.filter((stamp) => now - stamp < windowMs);
}

export function isChatBurst(times: number[], now: number): boolean {
  return pruneChatTimes(times, now).length >= limits.chatBurst.count;
}
