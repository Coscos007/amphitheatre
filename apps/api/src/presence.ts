import type { Database } from "bun:sqlite";
import { listPresentMemberships, markLeft } from "./db";
import type { RoomHub } from "./hub";

/**
 * SQLite `left_at IS NULL` is the theater roster, not LiveKit.
 * After a process restart or a dropped WS that never hit /leave, those rows stay
 * "present" forever. Mark them left unless they still have a live socket, a
 * pending WS grace timer, or they joined within the grace window (join → WS).
 */
export function reconcileStalePresence(
  db: Database,
  hub: RoomHub,
  now: number,
  graceMs: number,
): number {
  let marked = 0;
  for (const row of listPresentMemberships(db)) {
    if (hub.isConnected(row.room_id, row.user_id)) continue;
    if (hub.hasPendingLeave(row.room_id, row.user_id)) continue;
    if (now - row.joined_at < graceMs) continue;
    markLeft(db, row.room_id, row.user_id, now);
    marked += 1;
  }
  return marked;
}
