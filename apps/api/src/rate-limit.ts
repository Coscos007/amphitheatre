import type { Clock } from "./clock";

type Bucket = number[];

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, Bucket>();

  constructor(private readonly clock: Clock) {}

  allow(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfterMs: number } {
    const now = this.clock.now();
    const prev = this.hits.get(key) ?? [];
    const fresh = prev.filter((t) => now - t < windowMs);
    if (fresh.length >= limit) {
      this.hits.set(key, fresh);
      const oldest = fresh[0] ?? now;
      return { ok: false, retryAfterMs: Math.max(1, windowMs - (now - oldest)) };
    }
    fresh.push(now);
    this.hits.set(key, fresh);
    if (this.hits.size > 20_000) this.prune(now, windowMs);
    return { ok: true };
  }

  private prune(now: number, windowMs: number): void {
    for (const [key, times] of this.hits) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length === 0) this.hits.delete(key);
      else this.hits.set(key, fresh);
    }
  }
}
