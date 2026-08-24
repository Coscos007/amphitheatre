import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import type { Role } from "@coliseum/shared";
import { composeStreamKey } from "./ids";

export type RoomRow = {
  id: string;
  name: string;
  password_hash: string | null;
  is_public: number;
  member_limit: number;
  owner_id: string;
  stream_key: string;
  created_at: number;
  creator_ip: string;
  broadcast_enabled: number;
  broadcast_provider: string;
  broadcast_embed: string | null;
  chat_flood_ban_sec: number;
};

export type MembershipRow = {
  room_id: string;
  user_id: string;
  role: Role;
  display_name: string;
  muted: number;
  joined_at: number;
  left_at: number | null;
};

export type BanRow = {
  room_id: string;
  user_id: string;
  banned_by: string;
  created_at: number;
};

export type LockoutRow = {
  lock_key: string;
  fail_count: number;
  locked_until: number | null;
  updated_at: number;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  member_limit INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  stream_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  creator_ip TEXT NOT NULL,
  broadcast_enabled INTEGER NOT NULL DEFAULT 0,
  broadcast_provider TEXT NOT NULL DEFAULT 'none',
  broadcast_embed TEXT,
  chat_flood_ban_sec INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS memberships (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  muted INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER NOT NULL,
  left_at INTEGER,
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS bans (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  banned_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS lockouts (
  lock_key TEXT PRIMARY KEY,
  fail_count INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rooms_public ON rooms(is_public, created_at);
CREATE INDEX IF NOT EXISTS idx_rooms_owner ON rooms(owner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rooms_ip ON rooms(creator_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_memberships_present ON memberships(room_id, left_at);
CREATE INDEX IF NOT EXISTS idx_bans_user ON bans(user_id);
`;

export function openDatabase(path: string): Database {
  if (path !== ":memory:" && path !== "" && path !== ":memory:?cache=shared") {
    const dir = dirname(path);
    if (dir && dir !== ".") mkdirSync(dir, { recursive: true });
  }
  const db = new Database(path, { create: true, strict: true });
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  if (path !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
  }
  db.exec(SCHEMA);
  migrateRooms(db);
  return db;
}

function tableColumns(db: Database, table: string): Set<string> {
  const rows = db.query(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

function migrateRooms(db: Database): void {
  const cols = tableColumns(db, "rooms");
  if (!cols.has("broadcast_enabled")) {
    db.exec("ALTER TABLE rooms ADD COLUMN broadcast_enabled INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.has("broadcast_provider")) {
    db.exec("ALTER TABLE rooms ADD COLUMN broadcast_provider TEXT NOT NULL DEFAULT 'none'");
  }
  if (!cols.has("broadcast_embed")) {
    db.exec("ALTER TABLE rooms ADD COLUMN broadcast_embed TEXT");
  }
  if (!cols.has("chat_flood_ban_sec")) {
    db.exec("ALTER TABLE rooms ADD COLUMN chat_flood_ban_sec INTEGER NOT NULL DEFAULT 60");
  }
  const stale = db
    .query("SELECT id, stream_key FROM rooms WHERE stream_key = id")
    .all() as { id: string; stream_key: string }[];
  for (const row of stale) {
    db.query("UPDATE rooms SET stream_key = ? WHERE id = ?").run(composeStreamKey(row.id), row.id);
  }
}

export function countPresent(db: Database, roomId: string): number {
  const row = db.query("SELECT COUNT(*) AS n FROM memberships WHERE room_id = ? AND left_at IS NULL").get(roomId) as
    | { n: number }
    | null;
  return row?.n ?? 0;
}

export function countOccupiedRooms(db: Database): number {
  const row = db
    .query("SELECT COUNT(DISTINCT room_id) AS n FROM memberships WHERE left_at IS NULL")
    .get() as { n: number } | null;
  return row?.n ?? 0;
}

export function countRoomsCreatedSince(
  db: Database,
  field: "owner_id" | "creator_ip",
  value: string,
  since: number,
): number {
  const sql =
    field === "owner_id"
      ? "SELECT COUNT(*) AS n FROM rooms WHERE owner_id = ? AND created_at > ?"
      : "SELECT COUNT(*) AS n FROM rooms WHERE creator_ip = ? AND created_at > ?";
  const row = db.query(sql).get(value, since) as { n: number } | null;
  return row?.n ?? 0;
}

export function getRoom(db: Database, id: string): RoomRow | null {
  return (db.query("SELECT * FROM rooms WHERE id = ?").get(id) as RoomRow | undefined) ?? null;
}

export function listPublicRooms(db: Database, limit = 100): RoomRow[] {
  return db
    .query("SELECT * FROM rooms WHERE is_public = 1 ORDER BY created_at DESC LIMIT ?")
    .all(limit) as RoomRow[];
}

export function insertRoom(db: Database, row: RoomRow): void {
  db.query(
    `INSERT INTO rooms (id, name, password_hash, is_public, member_limit, owner_id, stream_key, created_at, creator_ip, broadcast_enabled, broadcast_provider, broadcast_embed, chat_flood_ban_sec)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.name,
    row.password_hash,
    row.is_public,
    row.member_limit,
    row.owner_id,
    row.stream_key,
    row.created_at,
    row.creator_ip,
    row.broadcast_enabled,
    row.broadcast_provider,
    row.broadcast_embed,
    row.chat_flood_ban_sec,
  );
}

export function updateBroadcast(
  db: Database,
  roomId: string,
  input: {
    enabled: number;
    provider: string;
    embed: string | null;
    streamKey?: string;
  },
): void {
  if (input.streamKey) {
    db.query(
      `UPDATE rooms SET broadcast_enabled = ?, broadcast_provider = ?, broadcast_embed = ?, stream_key = ?
       WHERE id = ?`,
    ).run(input.enabled, input.provider, input.embed, input.streamKey, roomId);
    return;
  }
  db.query(
    `UPDATE rooms SET broadcast_enabled = ?, broadcast_provider = ?, broadcast_embed = ? WHERE id = ?`,
  ).run(input.enabled, input.provider, input.embed, roomId);
}

export function updateChatFloodBanSec(db: Database, roomId: string, floodBanSec: number): void {
  db.query("UPDATE rooms SET chat_flood_ban_sec = ? WHERE id = ?").run(floodBanSec, roomId);
}

export function getMembership(db: Database, roomId: string, userId: string): MembershipRow | null {
  return (
    (db.query("SELECT * FROM memberships WHERE room_id = ? AND user_id = ?").get(roomId, userId) as
      | MembershipRow
      | undefined) ?? null
  );
}

export function listMemberships(db: Database, roomId: string): MembershipRow[] {
  return db.query("SELECT * FROM memberships WHERE room_id = ?").all(roomId) as MembershipRow[];
}

export function upsertJoin(
  db: Database,
  input: {
    roomId: string;
    userId: string;
    role: Role;
    displayName: string;
    now: number;
  },
): void {
  db.query(
    `INSERT INTO memberships (room_id, user_id, role, display_name, muted, joined_at, left_at)
     VALUES (?, ?, ?, ?, 0, ?, NULL)
     ON CONFLICT (room_id, user_id) DO UPDATE SET
       display_name = excluded.display_name,
       left_at = NULL,
       joined_at = CASE WHEN memberships.left_at IS NULL THEN memberships.joined_at ELSE excluded.joined_at END`,
  ).run(input.roomId, input.userId, input.role, input.displayName, input.now);
}

export function markLeft(db: Database, roomId: string, userId: string, now: number): void {
  db.query("UPDATE memberships SET left_at = ? WHERE room_id = ? AND user_id = ? AND left_at IS NULL").run(
    now,
    roomId,
    userId,
  );
}

export function setMuted(db: Database, roomId: string, userId: string, muted: boolean): void {
  db.query("UPDATE memberships SET muted = ? WHERE room_id = ? AND user_id = ?").run(
    muted ? 1 : 0,
    roomId,
    userId,
  );
}

export function setRole(db: Database, roomId: string, userId: string, role: Role): void {
  db.query("UPDATE memberships SET role = ? WHERE room_id = ? AND user_id = ?").run(role, roomId, userId);
}

export function isBanned(db: Database, roomId: string, userId: string): boolean {
  const row = db.query("SELECT 1 AS n FROM bans WHERE room_id = ? AND user_id = ?").get(roomId, userId) as
    | { n: number }
    | null;
  return Boolean(row);
}

export function insertBan(db: Database, row: BanRow): void {
  db.query(
    `INSERT INTO bans (room_id, user_id, banned_by, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (room_id, user_id) DO NOTHING`,
  ).run(row.room_id, row.user_id, row.banned_by, row.created_at);
}

export function deleteBan(db: Database, roomId: string, userId: string): void {
  db.query("DELETE FROM bans WHERE room_id = ? AND user_id = ?").run(roomId, userId);
}

export function getLockout(db: Database, key: string): LockoutRow | null {
  return (db.query("SELECT * FROM lockouts WHERE lock_key = ?").get(key) as LockoutRow | undefined) ?? null;
}

export function upsertLockout(db: Database, row: LockoutRow): void {
  db.query(
    `INSERT INTO lockouts (lock_key, fail_count, locked_until, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (lock_key) DO UPDATE SET
       fail_count = excluded.fail_count,
       locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`,
  ).run(row.lock_key, row.fail_count, row.locked_until, row.updated_at);
}

export function deleteLockout(db: Database, key: string): void {
  db.query("DELETE FROM lockouts WHERE lock_key = ?").run(key);
}
