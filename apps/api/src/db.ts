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
  peak_members: number;
  expires_at: number | null;
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
  chat_flood_ban_sec INTEGER NOT NULL DEFAULT 60,
  peak_members INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER
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

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  disabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS admin_instance (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  api_key_hash TEXT NOT NULL,
  bootstrap_completed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metrics_livekit_samples (
  ts INTEGER NOT NULL,
  name TEXT NOT NULL,
  labels_json TEXT NOT NULL,
  value REAL NOT NULL,
  kind TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics_ome_samples (
  ts INTEGER NOT NULL,
  room_id TEXT,
  stream_key TEXT NOT NULL,
  bytes_in REAL NOT NULL DEFAULT 0,
  bytes_out REAL NOT NULL DEFAULT 0,
  throughput_in REAL NOT NULL DEFAULT 0,
  throughput_out REAL NOT NULL DEFAULT 0,
  connections_webrtc INTEGER NOT NULL DEFAULT 0,
  connections_llhls INTEGER NOT NULL DEFAULT 0,
  total_connections INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metrics_room_samples (
  ts INTEGER NOT NULL,
  room_id TEXT NOT NULL,
  present INTEGER NOT NULL,
  unique_ever INTEGER NOT NULL,
  peak INTEGER NOT NULL,
  lk_participants INTEGER NOT NULL DEFAULT 0,
  tracks_mic INTEGER NOT NULL DEFAULT 0,
  tracks_camera INTEGER NOT NULL DEFAULT 0,
  tracks_screen INTEGER NOT NULL DEFAULT 0,
  tracks_screen_audio INTEGER NOT NULL DEFAULT 0,
  announced_bitrate_bps REAL NOT NULL DEFAULT 0,
  estimated_fanout_bps REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metrics_overview_samples (
  ts INTEGER PRIMARY KEY,
  rooms_occupied INTEGER NOT NULL,
  people_now INTEGER NOT NULL,
  livekit_bytes_in REAL,
  livekit_bytes_out REAL,
  ome_bytes_in REAL,
  ome_bytes_out REAL,
  ome_reachable INTEGER NOT NULL DEFAULT 0,
  livekit_metrics_reachable INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_metrics_livekit_ts ON metrics_livekit_samples(ts);
CREATE INDEX IF NOT EXISTS idx_metrics_livekit_name_ts ON metrics_livekit_samples(name, ts);
CREATE INDEX IF NOT EXISTS idx_metrics_ome_ts ON metrics_ome_samples(ts);
CREATE INDEX IF NOT EXISTS idx_metrics_ome_room_ts ON metrics_ome_samples(room_id, ts);
CREATE INDEX IF NOT EXISTS idx_metrics_room_ts ON metrics_room_samples(ts);
CREATE INDEX IF NOT EXISTS idx_metrics_room_id_ts ON metrics_room_samples(room_id, ts);
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
  if (!cols.has("peak_members")) {
    db.exec("ALTER TABLE rooms ADD COLUMN peak_members INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.has("expires_at")) {
    db.exec("ALTER TABLE rooms ADD COLUMN expires_at INTEGER");
  }
  db.exec(`
    UPDATE rooms SET peak_members = MAX(
      peak_members,
      (SELECT COUNT(*) FROM memberships m WHERE m.room_id = rooms.id AND m.left_at IS NULL)
    )
  `);
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
    `INSERT INTO rooms (id, name, password_hash, is_public, member_limit, owner_id, stream_key, created_at, creator_ip, broadcast_enabled, broadcast_provider, broadcast_embed, chat_flood_ban_sec, peak_members, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    row.peak_members,
    row.expires_at,
  );
}

export function updateRoomOwner(db: Database, roomId: string, ownerId: string): void {
  db.query("UPDATE rooms SET owner_id = ? WHERE id = ?").run(ownerId, roomId);
}

/** Removes rooms past `expires_at` and their memberships, bans, and room-scoped lockouts. */
export function deleteExpiredRooms(db: Database, now: number): number {
  const expired = db
    .query("SELECT id FROM rooms WHERE expires_at IS NOT NULL AND expires_at <= ?")
    .all(now) as { id: string }[];
  if (expired.length === 0) return 0;
  const wipe = db.transaction((ids: string[]) => {
    for (const id of ids) {
      db.query("DELETE FROM memberships WHERE room_id = ?").run(id);
      db.query("DELETE FROM bans WHERE room_id = ?").run(id);
      db.query("DELETE FROM lockouts WHERE lock_key GLOB ?").run(`*:${id}`);
    }
    db.query("DELETE FROM rooms WHERE expires_at IS NOT NULL AND expires_at <= ?").run(now);
  });
  wipe(expired.map((row) => row.id));
  return expired.length;
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

export function listPresentMemberships(db: Database): Array<{ room_id: string; user_id: string; joined_at: number }> {
  return db
    .query("SELECT room_id, user_id, joined_at FROM memberships WHERE left_at IS NULL")
    .all() as Array<{ room_id: string; user_id: string; joined_at: number }>;
}

export function markAllPresentAsLeft(db: Database, now: number): number {
  return db.query("UPDATE memberships SET left_at = ? WHERE left_at IS NULL").run(now).changes;
}

/** Wipes theater rooms and metrics. Keeps operator accounts and the instance API key. */
export function resetTheaterState(db: Database): void {
  const wipe = db.transaction(() => {
    db.exec("DELETE FROM memberships");
    db.exec("DELETE FROM bans");
    db.exec("DELETE FROM rooms");
    db.exec("DELETE FROM lockouts WHERE lock_key NOT LIKE 'admin:%'");
    db.exec("DELETE FROM metrics_livekit_samples");
    db.exec("DELETE FROM metrics_ome_samples");
    db.exec("DELETE FROM metrics_room_samples");
    db.exec("DELETE FROM metrics_overview_samples");
  });
  wipe();
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

export function countUniqueMembers(db: Database, roomId: string): number {
  const row = db.query("SELECT COUNT(*) AS n FROM memberships WHERE room_id = ?").get(roomId) as { n: number } | null;
  return row?.n ?? 0;
}

export function countPeopleNow(db: Database): number {
  const row = db.query("SELECT COUNT(*) AS n FROM memberships WHERE left_at IS NULL").get() as { n: number } | null;
  return row?.n ?? 0;
}

export function countAllRooms(db: Database): number {
  const row = db.query("SELECT COUNT(*) AS n FROM rooms").get() as { n: number } | null;
  return row?.n ?? 0;
}

export function maxPeakMembers(db: Database): number {
  const row = db.query("SELECT COALESCE(MAX(peak_members), 0) AS n FROM rooms").get() as { n: number } | null;
  return row?.n ?? 0;
}

export function listAllRooms(db: Database): RoomRow[] {
  return db.query("SELECT * FROM rooms ORDER BY created_at DESC").all() as RoomRow[];
}

export function listRoomsByStreamKey(db: Database): Map<string, RoomRow> {
  const map = new Map<string, RoomRow>();
  for (const row of listAllRooms(db)) {
    map.set(row.stream_key, row);
  }
  return map;
}

export function updatePeakMembers(db: Database, roomId: string): number {
  const present = countPresent(db, roomId);
  db.query("UPDATE rooms SET peak_members = MAX(peak_members, ?) WHERE id = ?").run(present, roomId);
  const row = getRoom(db, roomId);
  return row?.peak_members ?? present;
}

export type AdminUserRow = {
  id: string;
  username: string;
  password_hash: string;
  disabled: number;
  created_at: number;
  last_login_at: number | null;
};

export type AdminInstanceRow = {
  id: number;
  api_key_hash: string;
  bootstrap_completed: number;
};

export function countAdminUsers(db: Database): number {
  const row = db.query("SELECT COUNT(*) AS n FROM admin_users").get() as { n: number } | null;
  return row?.n ?? 0;
}

export function countActiveAdminUsers(db: Database): number {
  const row = db
    .query("SELECT COUNT(*) AS n FROM admin_users WHERE disabled = 0")
    .get() as { n: number } | null;
  return row?.n ?? 0;
}

export function getAdminInstance(db: Database): AdminInstanceRow | null {
  return (db.query("SELECT * FROM admin_instance WHERE id = 1").get() as AdminInstanceRow | undefined) ?? null;
}

export function upsertAdminInstance(db: Database, apiKeyHash: string, bootstrapCompleted: boolean): void {
  db.query(
    `INSERT INTO admin_instance (id, api_key_hash, bootstrap_completed)
     VALUES (1, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       api_key_hash = excluded.api_key_hash,
       bootstrap_completed = excluded.bootstrap_completed`,
  ).run(apiKeyHash, bootstrapCompleted ? 1 : 0);
}

export function insertAdminUser(db: Database, row: AdminUserRow): void {
  db.query(
    `INSERT INTO admin_users (id, username, password_hash, disabled, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(row.id, row.username, row.password_hash, row.disabled, row.created_at, row.last_login_at);
}

export function getAdminUserById(db: Database, id: string): AdminUserRow | null {
  return (db.query("SELECT * FROM admin_users WHERE id = ?").get(id) as AdminUserRow | undefined) ?? null;
}

export function getAdminUserByUsername(db: Database, username: string): AdminUserRow | null {
  return (
    (db.query("SELECT * FROM admin_users WHERE username = ? COLLATE NOCASE").get(username) as
      | AdminUserRow
      | undefined) ?? null
  );
}

export function listAdminUsers(db: Database): AdminUserRow[] {
  return db.query("SELECT * FROM admin_users ORDER BY created_at ASC").all() as AdminUserRow[];
}

export function updateAdminUser(
  db: Database,
  id: string,
  patch: { password_hash?: string; disabled?: number },
): void {
  if (patch.password_hash !== undefined) {
    db.query("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(patch.password_hash, id);
  }
  if (patch.disabled !== undefined) {
    db.query("UPDATE admin_users SET disabled = ? WHERE id = ?").run(patch.disabled, id);
  }
}

export function touchAdminLogin(db: Database, id: string, now: number): void {
  db.query("UPDATE admin_users SET last_login_at = ? WHERE id = ?").run(now, id);
}

export type LivekitSampleRow = {
  ts: number;
  name: string;
  labels_json: string;
  value: number;
  kind: string;
};

export function insertLivekitSamples(db: Database, rows: LivekitSampleRow[]): void {
  if (rows.length === 0) return;
  const stmt = db.query(
    "INSERT INTO metrics_livekit_samples (ts, name, labels_json, value, kind) VALUES (?, ?, ?, ?, ?)",
  );
  const tx = db.transaction((batch: LivekitSampleRow[]) => {
    for (const row of batch) {
      stmt.run(row.ts, row.name, row.labels_json, row.value, row.kind);
    }
  });
  tx(rows);
}

export function listLivekitSamples(db: Database, since: number, names?: string[]): LivekitSampleRow[] {
  if (names && names.length > 0) {
    const placeholders = names.map(() => "?").join(",");
    return db
      .query(
        `SELECT ts, name, labels_json, value, kind FROM metrics_livekit_samples
         WHERE ts >= ? AND name IN (${placeholders}) ORDER BY ts ASC`,
      )
      .all(since, ...names) as LivekitSampleRow[];
  }
  return db
    .query("SELECT ts, name, labels_json, value, kind FROM metrics_livekit_samples WHERE ts >= ? ORDER BY ts ASC")
    .all(since) as LivekitSampleRow[];
}

export type OmeSampleRow = {
  ts: number;
  room_id: string | null;
  stream_key: string;
  bytes_in: number;
  bytes_out: number;
  throughput_in: number;
  throughput_out: number;
  connections_webrtc: number;
  connections_llhls: number;
  total_connections: number;
};

export function insertOmeSamples(db: Database, rows: OmeSampleRow[]): void {
  if (rows.length === 0) return;
  const stmt = db.query(
    `INSERT INTO metrics_ome_samples
      (ts, room_id, stream_key, bytes_in, bytes_out, throughput_in, throughput_out, connections_webrtc, connections_llhls, total_connections)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const tx = db.transaction((batch: OmeSampleRow[]) => {
    for (const row of batch) {
      stmt.run(
        row.ts,
        row.room_id,
        row.stream_key,
        row.bytes_in,
        row.bytes_out,
        row.throughput_in,
        row.throughput_out,
        row.connections_webrtc,
        row.connections_llhls,
        row.total_connections,
      );
    }
  });
  tx(rows);
}

export function listOmeSamples(db: Database, since: number, roomId?: string): OmeSampleRow[] {
  if (roomId) {
    return db
      .query("SELECT * FROM metrics_ome_samples WHERE ts >= ? AND room_id = ? ORDER BY ts ASC")
      .all(since, roomId) as OmeSampleRow[];
  }
  return db.query("SELECT * FROM metrics_ome_samples WHERE ts >= ? ORDER BY ts ASC").all(since) as OmeSampleRow[];
}

export type RoomSampleRow = {
  ts: number;
  room_id: string;
  present: number;
  unique_ever: number;
  peak: number;
  lk_participants: number;
  tracks_mic: number;
  tracks_camera: number;
  tracks_screen: number;
  tracks_screen_audio: number;
  announced_bitrate_bps: number;
  estimated_fanout_bps: number;
};

export function insertRoomSamples(db: Database, rows: RoomSampleRow[]): void {
  if (rows.length === 0) return;
  const stmt = db.query(
    `INSERT INTO metrics_room_samples
      (ts, room_id, present, unique_ever, peak, lk_participants, tracks_mic, tracks_camera, tracks_screen, tracks_screen_audio, announced_bitrate_bps, estimated_fanout_bps)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const tx = db.transaction((batch: RoomSampleRow[]) => {
    for (const row of batch) {
      stmt.run(
        row.ts,
        row.room_id,
        row.present,
        row.unique_ever,
        row.peak,
        row.lk_participants,
        row.tracks_mic,
        row.tracks_camera,
        row.tracks_screen,
        row.tracks_screen_audio,
        row.announced_bitrate_bps,
        row.estimated_fanout_bps,
      );
    }
  });
  tx(rows);
}

export function listRoomSamples(db: Database, since: number, roomId?: string): RoomSampleRow[] {
  if (roomId) {
    return db
      .query("SELECT * FROM metrics_room_samples WHERE ts >= ? AND room_id = ? ORDER BY ts ASC")
      .all(since, roomId) as RoomSampleRow[];
  }
  return db.query("SELECT * FROM metrics_room_samples WHERE ts >= ? ORDER BY ts ASC").all(since) as RoomSampleRow[];
}

export type OverviewSampleRow = {
  ts: number;
  rooms_occupied: number;
  people_now: number;
  livekit_bytes_in: number | null;
  livekit_bytes_out: number | null;
  ome_bytes_in: number | null;
  ome_bytes_out: number | null;
  ome_reachable: number;
  livekit_metrics_reachable: number;
};

export function insertOverviewSample(db: Database, row: OverviewSampleRow): void {
  db.query(
    `INSERT INTO metrics_overview_samples
      (ts, rooms_occupied, people_now, livekit_bytes_in, livekit_bytes_out, ome_bytes_in, ome_bytes_out, ome_reachable, livekit_metrics_reachable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (ts) DO UPDATE SET
       rooms_occupied = excluded.rooms_occupied,
       people_now = excluded.people_now,
       livekit_bytes_in = excluded.livekit_bytes_in,
       livekit_bytes_out = excluded.livekit_bytes_out,
       ome_bytes_in = excluded.ome_bytes_in,
       ome_bytes_out = excluded.ome_bytes_out,
       ome_reachable = excluded.ome_reachable,
       livekit_metrics_reachable = excluded.livekit_metrics_reachable`,
  ).run(
    row.ts,
    row.rooms_occupied,
    row.people_now,
    row.livekit_bytes_in,
    row.livekit_bytes_out,
    row.ome_bytes_in,
    row.ome_bytes_out,
    row.ome_reachable,
    row.livekit_metrics_reachable,
  );
}

export function listOverviewSamples(db: Database, since: number): OverviewSampleRow[] {
  return db
    .query("SELECT * FROM metrics_overview_samples WHERE ts >= ? ORDER BY ts ASC")
    .all(since) as OverviewSampleRow[];
}

export function latestOverviewSample(db: Database): OverviewSampleRow | null {
  return (
    (db.query("SELECT * FROM metrics_overview_samples ORDER BY ts DESC LIMIT 1").get() as
      | OverviewSampleRow
      | undefined) ?? null
  );
}

export function pruneMetrics(db: Database, olderThan: number): void {
  db.query("DELETE FROM metrics_livekit_samples WHERE ts < ?").run(olderThan);
  db.query("DELETE FROM metrics_ome_samples WHERE ts < ?").run(olderThan);
  db.query("DELETE FROM metrics_room_samples WHERE ts < ?").run(olderThan);
  db.query("DELETE FROM metrics_overview_samples WHERE ts < ?").run(olderThan);
}
