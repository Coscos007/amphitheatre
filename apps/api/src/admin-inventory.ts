import type { AdminRoomMember, AdminRoomOmeSnapshot, AdminRoomRow } from "@coliseum/shared";
import { emptyBroadcast, isStreamProvider } from "@coliseum/shared";
import {
  countPresent,
  countUniqueMembers,
  getRoom,
  listAllRooms,
  listMemberships,
  type MembershipRow,
  type RoomRow,
} from "./db";
import type { RoomHub } from "./hub";
import { livekitSnapshotFromParticipants } from "./livekit-stats";
import { logger } from "./logger";
import { reconcileStalePresence } from "./presence";
import type { RoomServiceDeps } from "./rooms";

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function toBroadcast(row: RoomRow) {
  const provider = row.broadcast_provider;
  if (provider === "none" || !isStreamProvider(provider)) {
    return emptyBroadcast();
  }
  return {
    enabled: row.broadcast_enabled === 1,
    provider,
    embed: row.broadcast_embed,
  };
}

function toMember(row: MembershipRow): AdminRoomMember {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    muted: row.muted === 1,
    present: row.left_at === null,
  };
}

function emptyOmeSnapshot(live: boolean, reachable: boolean): AdminRoomOmeSnapshot {
  return {
    live,
    reachable,
    throughputInBps: null,
    throughputOutBps: null,
    bytesIn: null,
    bytesOut: null,
    connectionsWebrtc: null,
    connectionsLlhls: null,
    totalConnections: null,
  };
}

function syncOccupancy(deps: RoomServiceDeps, hub: RoomHub | undefined): void {
  if (!hub) return;
  const marked = reconcileStalePresence(deps.db, hub, deps.clock.now(), deps.env.WS_GRACE_MS);
  if (marked > 0) logger.info("presence_reconcile", { marked });
}

export function adminRoomFromRow(db: Parameters<typeof countPresent>[0], row: RoomRow): AdminRoomRow {
  return {
    id: row.id,
    name: row.name,
    isPublic: row.is_public === 1,
    hasPassword: Boolean(row.password_hash),
    memberLimit: row.member_limit,
    present: countPresent(db, row.id),
    uniqueEver: countUniqueMembers(db, row.id),
    peak: row.peak_members,
    createdAt: toIso(row.created_at),
    ownerId: row.owner_id,
    streamKey: row.stream_key,
    broadcast: toBroadcast(row),
  };
}

export async function listAdminRooms(
  deps: RoomServiceDeps,
  hideEmpty: boolean,
  hub?: RoomHub,
): Promise<AdminRoomRow[]> {
  syncOccupancy(deps, hub);
  let rows = listAllRooms(deps.db).map((row) => adminRoomFromRow(deps.db, row));
  if (hideEmpty) rows = rows.filter((item) => item.present > 0);

  const [listed, lkRooms] = await Promise.all([deps.ome.listStreams(), deps.livekit.listRooms()]);
  const liveKeys = new Set(listed.keys);
  const lkNames = new Set(lkRooms.map((room) => room.name).filter(Boolean));

  return Promise.all(
    rows.map(async (row) => {
      const wantTracks = row.present > 0 || lkNames.has(row.id);
      const participants = wantTracks ? await deps.livekit.listParticipants(row.id) : [];
      return {
        ...row,
        livekit: livekitSnapshotFromParticipants(participants),
        ome: emptyOmeSnapshot(listed.reachable && liveKeys.has(row.streamKey), listed.reachable),
      };
    }),
  );
}

export async function getAdminRoom(
  deps: RoomServiceDeps,
  id: string,
  hub?: RoomHub,
): Promise<AdminRoomRow | null> {
  syncOccupancy(deps, hub);
  const row = getRoom(deps.db, id);
  if (!row) return null;
  const base = adminRoomFromRow(deps.db, row);
  const members = listMemberships(deps.db, id).map(toMember);
  const participants = await deps.livekit.listParticipants(id);
  const livekit = livekitSnapshotFromParticipants(participants);
  const omeStatus = await deps.ome.status(row.stream_key);
  let ome: AdminRoomOmeSnapshot | null = {
    live: omeStatus.live,
    reachable: omeStatus.reachable !== false,
    throughputInBps: null,
    throughputOutBps: null,
    bytesIn: null,
    bytesOut: null,
    connectionsWebrtc: null,
    connectionsLlhls: null,
    totalConnections: null,
  };
  if (ome.reachable) {
    const stats = await deps.ome.streamStats(row.stream_key);
    ome = {
      live: stats.live || omeStatus.live,
      reachable: stats.reachable,
      throughputInBps: stats.lastThroughputIn * 8,
      throughputOutBps: stats.lastThroughputOut * 8,
      bytesIn: stats.totalBytesIn,
      bytesOut: stats.totalBytesOut,
      connectionsWebrtc: stats.connectionsWebrtc,
      connectionsLlhls: stats.connectionsLlhls,
      totalConnections: stats.totalConnections,
    };
  }
  return { ...base, members, livekit, ome };
}
