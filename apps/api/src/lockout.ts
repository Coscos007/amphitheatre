import type { Database } from "bun:sqlite";
import type { Clock } from "./clock";
import type { Env } from "./env";
import { deleteLockout, getLockout, upsertLockout } from "./db";

export function lockoutKeys(roomId: string, ip: string, userId?: string): string[] {
  const keys = [`ip:${ip}:${roomId}`];
  if (userId) keys.push(`user:${userId}:${roomId}`);
  return keys;
}

export function remainingLockMs(
  db: Database,
  env: Env,
  clock: Clock,
  roomId: string,
  ip: string,
  userId?: string,
): number {
  const now = clock.now();
  let remaining = 0;
  for (const key of lockoutKeys(roomId, ip, userId)) {
    const row = getLockout(db, key);
    if (!row?.locked_until) continue;
    if (row.locked_until <= now) continue;
    remaining = Math.max(remaining, row.locked_until - now);
  }
  return remaining;
}

export function recordPasswordFailure(
  db: Database,
  env: Env,
  clock: Clock,
  roomId: string,
  ip: string,
  userId?: string,
): number {
  const now = clock.now();
  let remaining = 0;
  for (const key of lockoutKeys(roomId, ip, userId)) {
    const existing = getLockout(db, key);
    let failCount = existing?.fail_count ?? 0;
    if (existing?.locked_until && existing.locked_until <= now) {
      failCount = 0;
    }
    failCount += 1;
    const lockedUntil = failCount >= env.LOCKOUT_MAX_FAILURES ? now + env.LOCKOUT_DURATION_MS : null;
    upsertLockout(db, {
      lock_key: key,
      fail_count: failCount,
      locked_until: lockedUntil,
      updated_at: now,
    });
    if (lockedUntil) remaining = Math.max(remaining, lockedUntil - now);
  }
  return remaining;
}

export function clearLockouts(db: Database, roomId: string, ip: string, userId?: string): void {
  for (const key of lockoutKeys(roomId, ip, userId)) {
    deleteLockout(db, key);
  }
}
