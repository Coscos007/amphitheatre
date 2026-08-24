import type { Database } from "bun:sqlite";
import {
  canManageBroadcast,
  canModerateTarget,
  canSeeIngest,
  emptyBroadcast,
  isStreamProvider,
  normalizeBroadcastEmbed,
  normalizeChatFloodBanSec,
  type AssignableRole,
  type BroadcastUpdate,
  type JoinResponse,
  type MediaStatus,
  type OmeInfo,
  type Role,
  type Room,
  type RoomBroadcast,
  type RoomMember,
  type SessionUser,
} from "@coliseum/shared";
import type { Clock } from "./clock";
import {
  countOccupiedRooms,
  countPresent,
  countRoomsCreatedSince,
  deleteBan,
  getMembership,
  getRoom,
  insertBan,
  insertRoom,
  isBanned,
  listMemberships,
  listPublicRooms,
  markLeft,
  setMuted,
  setRole,
  updateBroadcast,
  updateChatFloodBanSec,
  upsertJoin,
  type MembershipRow,
  type RoomRow,
} from "./db";
import type { Env } from "./env";
import { cannotJoin, forbidden, HttpError, lockedOut } from "./http-error";
import { composeStreamKey, newRoomId } from "./ids";
import type { LivekitService } from "./livekit";
import { logger } from "./logger";
import { clearLockouts, recordPasswordFailure, remainingLockMs } from "./lockout";
import { playbackUrls, type OmeClient } from "./ome";

export type RoomServiceDeps = {
  db: Database;
  env: Env;
  clock: Clock;
  ome: OmeClient;
  livekit: LivekitService;
};

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function toMember(row: MembershipRow): RoomMember {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    muted: row.muted === 1,
    present: row.left_at === null,
  };
}

function toBroadcast(row: RoomRow): RoomBroadcast {
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

function publicRoom(row: RoomRow, memberCount: number, members?: RoomMember[]): Room {
  return {
    id: row.id,
    name: row.name,
    isPublic: row.is_public === 1,
    hasPassword: Boolean(row.password_hash),
    memberLimit: row.member_limit,
    memberCount,
    ownerId: row.owner_id,
    createdAt: toIso(row.created_at),
    broadcast: toBroadcast(row),
    chatFloodBanSec: normalizeChatFloodBanSec(row.chat_flood_ban_sec),
    ...(members ? { members } : {}),
  };
}

export class RoomService {
  constructor(private readonly deps: RoomServiceDeps) {}

  listPublic(): Room[] {
    const { db } = this.deps;
    return listPublicRooms(db).map((row) => publicRoom(row, countPresent(db, row.id)));
  }

  getVisible(id: string, viewer: SessionUser | null): Room {
    const row = getRoom(this.deps.db, id);
    if (!row) {
      throw new HttpError(404, "not_found", "Sala nao encontrada");
    }
    const membership = viewer ? getMembership(this.deps.db, id, viewer.userId) : null;
    const isMember = Boolean(membership);
    if (!isMember && row.is_public !== 1) {
      throw new HttpError(404, "not_found", "Sala nao encontrada");
    }
    const members = isMember ? listMemberships(this.deps.db, id).map(toMember) : undefined;
    return publicRoom(row, countPresent(this.deps.db, id), members);
  }

  async create(
    owner: SessionUser,
    ip: string,
    input: { name: string; password?: string; memberLimit?: number; isPublic?: boolean },
  ): Promise<Room> {
    const { db, env, clock } = this.deps;
    const now = clock.now();
    const since = now - env.ROOM_CREATE_WINDOW_MS;
    if (countRoomsCreatedSince(db, "owner_id", owner.userId, since) >= env.MAX_ROOMS_PER_CREATOR) {
      throw new HttpError(429, "rate_limited", "Limite de salas por criador atingido");
    }
    if (countRoomsCreatedSince(db, "creator_ip", ip, since) >= env.MAX_ROOMS_PER_IP) {
      throw new HttpError(429, "rate_limited", "Limite de salas por IP atingido");
    }
    if (countOccupiedRooms(db) >= env.MAX_CONCURRENT_ROOMS) {
      throw new HttpError(429, "rate_limited", "Limite de salas simultaneas atingido");
    }

    const cap = Math.min(input.memberLimit ?? env.MAX_MEMBERS_PER_ROOM, env.MAX_MEMBERS_PER_ROOM);
    const passwordHash = input.password ? await Bun.password.hash(input.password) : null;

    let id = newRoomId();
    for (let i = 0; i < 8 && getRoom(db, id); i += 1) {
      id = newRoomId();
    }
    if (getRoom(db, id)) {
      throw new HttpError(500, "internal_error", "Falha ao gerar id da sala");
    }

    const row: RoomRow = {
      id,
      name: input.name,
      password_hash: passwordHash,
      is_public: input.isPublic ? 1 : 0,
      member_limit: cap,
      owner_id: owner.userId,
      stream_key: composeStreamKey(id),
      created_at: now,
      creator_ip: ip,
      broadcast_enabled: 0,
      broadcast_provider: "none",
      broadcast_embed: null,
      chat_flood_ban_sec: 60,
    };
    insertRoom(db, row);
    upsertJoin(db, {
      roomId: id,
      userId: owner.userId,
      role: "owner",
      displayName: owner.displayName,
      now,
    });
    logger.info("room_created", { roomId: id });
    return publicRoom(row, 1, [
      {
        userId: owner.userId,
        displayName: owner.displayName,
        role: "owner",
        muted: false,
        present: true,
      },
    ]);
  }

  async join(user: SessionUser, ip: string, roomId: string, password?: string): Promise<JoinResponse> {
    const { db, env, clock, livekit } = this.deps;
    const remaining = remainingLockMs(db, env, clock, roomId, ip, user.userId);
    if (remaining > 0) throw lockedOut(remaining);

    const row = getRoom(db, roomId);
    if (!row) {
      const locked = recordPasswordFailure(db, env, clock, roomId, ip, user.userId);
      if (locked > 0) throw lockedOut(locked);
      throw cannotJoin();
    }

    if (isBanned(db, roomId, user.userId)) {
      throw new HttpError(403, "banned", "Voce foi banido desta sala");
    }

    const existing = getMembership(db, roomId, user.userId);
    const skipPassword = existing?.left_at === null || row.owner_id === user.userId;
    if (row.password_hash && !skipPassword) {
      const ok = password ? await Bun.password.verify(password, row.password_hash) : false;
      if (!ok) {
        const locked = recordPasswordFailure(db, env, clock, roomId, ip, user.userId);
        if (locked > 0) throw lockedOut(locked);
        if (row.is_public === 1) {
          throw new HttpError(403, "invalid_password", "Senha invalida");
        }
        throw cannotJoin();
      }
    }

    const present = countPresent(db, roomId);
    const alreadyIn = existing?.left_at === null;
    if (!alreadyIn && present >= row.member_limit) {
      throw new HttpError(409, "room_full", "A sala esta cheia");
    }

    const role: Role = row.owner_id === user.userId ? "owner" : (existing?.role ?? "member");
    upsertJoin(db, {
      roomId,
      userId: user.userId,
      role,
      displayName: user.displayName,
      now: clock.now(),
    });
    clearLockouts(db, roomId, ip, user.userId);

    const membership = getMembership(db, roomId, user.userId);
    const muted = membership?.muted === 1;
    const members = listMemberships(db, roomId).map(toMember);
    const room = publicRoom(row, countPresent(db, roomId), members);
    const ome = await this.omeInfo(row, role);
    const livekitToken = (await livekit.mintToken({
      roomId,
      userId: user.userId,
      displayName: user.displayName,
      muted,
    })) ?? undefined;

    return {
      room,
      role,
      livekitToken,
      livekitUrl: livekit.url ?? undefined,
      ome,
    };
  }

  leave(user: SessionUser, roomId: string): void {
    const row = getRoom(this.deps.db, roomId);
    if (!row) throw new HttpError(404, "not_found", "Sala nao encontrada");
    markLeft(this.deps.db, roomId, user.userId, this.deps.clock.now());
    logger.info("room_leave", { roomId });
  }

  requireMember(roomId: string, userId: string): { room: RoomRow; membership: MembershipRow } {
    const room = getRoom(this.deps.db, roomId);
    if (!room) throw new HttpError(404, "not_found", "Sala nao encontrada");
    const membership = getMembership(this.deps.db, roomId, userId);
    if (!membership) throw forbidden();
    return { room, membership };
  }

  requirePresent(roomId: string, userId: string): { room: RoomRow; membership: MembershipRow } {
    const found = this.requireMember(roomId, userId);
    if (found.membership.left_at !== null) {
      throw forbidden("Entre na sala novamente");
    }
    return found;
  }

  kick(actor: SessionUser, roomId: string, targetUserId: string): { target: MembershipRow; actorRole: Role } {
    const { room, membership } = this.requireMember(roomId, actor.userId);
    const target = getMembership(this.deps.db, roomId, targetUserId);
    if (!target) throw new HttpError(404, "not_found", "Usuario nao esta na sala");
    if (targetUserId === actor.userId) throw new HttpError(400, "conflict", "Use leave para sair");
    if (!canModerateTarget(membership.role, target.role, "kick")) throw forbidden();
    markLeft(this.deps.db, roomId, targetUserId, this.deps.clock.now());
    logger.info("room_kick", { roomId });
    void room;
    return { target, actorRole: membership.role };
  }

  mute(
    actor: SessionUser,
    roomId: string,
    targetUserId: string,
    muted: boolean,
  ): { target: MembershipRow } {
    const { membership } = this.requireMember(roomId, actor.userId);
    const target = getMembership(this.deps.db, roomId, targetUserId);
    if (!target) throw new HttpError(404, "not_found", "Usuario nao esta na sala");
    if (!canModerateTarget(membership.role, target.role, "mute")) throw forbidden();
    setMuted(this.deps.db, roomId, targetUserId, muted);
    logger.info("room_mute", { roomId, muted });
    return { target: { ...target, muted: muted ? 1 : 0 } };
  }

  ban(actor: SessionUser, roomId: string, targetUserId: string): { target: MembershipRow } {
    const { membership } = this.requireMember(roomId, actor.userId);
    const target = getMembership(this.deps.db, roomId, targetUserId);
    const targetRole: Role = target?.role ?? "member";
    if (!canModerateTarget(membership.role, targetRole, "ban")) throw forbidden();
    if (targetUserId === actor.userId) throw new HttpError(400, "conflict", "Nao e possivel banir a si mesmo");
    insertBan(this.deps.db, {
      room_id: roomId,
      user_id: targetUserId,
      banned_by: actor.userId,
      created_at: this.deps.clock.now(),
    });
    markLeft(this.deps.db, roomId, targetUserId, this.deps.clock.now());
    logger.info("room_ban", { roomId });
    return { target: target ?? {
      room_id: roomId,
      user_id: targetUserId,
      role: "member",
      display_name: "",
      muted: 0,
      joined_at: this.deps.clock.now(),
      left_at: this.deps.clock.now(),
    } };
  }

  unban(actor: SessionUser, roomId: string, targetUserId: string): void {
    const { membership } = this.requireMember(roomId, actor.userId);
    if (!canModerateTarget(membership.role, "member", "unban")) throw forbidden();
    deleteBan(this.deps.db, roomId, targetUserId);
    logger.info("room_unban", { roomId });
  }

  assignRole(actor: SessionUser, roomId: string, targetUserId: string, role: AssignableRole): MembershipRow {
    const { membership } = this.requireMember(roomId, actor.userId);
    const target = getMembership(this.deps.db, roomId, targetUserId);
    if (!target) throw new HttpError(404, "not_found", "Usuario nao esta na sala");
    if (!canModerateTarget(membership.role, target.role, "role")) throw forbidden();
    setRole(this.deps.db, roomId, targetUserId, role);
    logger.info("room_role", { roomId, role });
    return { ...target, role };
  }

  async mintLivekit(user: SessionUser, roomId: string): Promise<{ token: string; url: string | null }> {
    const { room, membership } = this.requireMember(roomId, user.userId);
    if (isBanned(this.deps.db, roomId, user.userId)) {
      throw new HttpError(403, "banned", "Voce foi banido desta sala");
    }
    if (membership.left_at !== null && room.owner_id !== user.userId) {
      throw forbidden("Entre na sala novamente");
    }
    const token = await this.deps.livekit.mintToken({
      roomId,
      userId: user.userId,
      displayName: user.displayName,
      muted: membership.muted === 1,
    });
    if (!token) throw new HttpError(503, "livekit_unavailable", "LiveKit nao configurado");
    return { token, url: this.deps.livekit.url };
  }

  async media(user: SessionUser | null, roomId: string): Promise<MediaStatus> {
    const row = getRoom(this.deps.db, roomId);
    if (!row) throw new HttpError(404, "not_found", "Sala nao encontrada");
    const membership = user ? getMembership(this.deps.db, roomId, user.userId) : null;
    if (!membership && row.is_public !== 1) {
      throw new HttpError(404, "not_found", "Sala nao encontrada");
    }
    const role: Role | null = membership
      ? row.owner_id === user?.userId
        ? "owner"
        : membership.role
      : null;
    const ome = await this.omeInfo(row, role);
    let livekitOk = false;
    try {
      livekitOk = await this.deps.livekit.health();
    } catch {
      livekitOk = false;
    }
    return {
      livekit: { ok: livekitOk, url: this.deps.livekit.url },
      ome,
      broadcast: toBroadcast(row),
    };
  }

  setChatSettings(actor: SessionUser, roomId: string, floodBanSec: number): Room {
    const { membership } = this.requireMember(roomId, actor.userId);
    if (!canManageBroadcast(membership.role)) throw forbidden();
    const row = getRoom(this.deps.db, roomId);
    if (!row) throw new HttpError(404, "not_found", "Sala nao encontrada");
    const next = normalizeChatFloodBanSec(floodBanSec);
    updateChatFloodBanSec(this.deps.db, roomId, next);
    const updated = getRoom(this.deps.db, roomId);
    if (!updated) throw new HttpError(404, "not_found", "Sala nao encontrada");
    logger.info("room_chat_settings", { roomId, floodBanSec: next });
    return publicRoom(updated, countPresent(this.deps.db, roomId), listMemberships(this.deps.db, roomId).map(toMember));
  }

  chatFloodBanSec(roomId: string): number {
    const row = getRoom(this.deps.db, roomId);
    return normalizeChatFloodBanSec(row?.chat_flood_ban_sec);
  }

  async setBroadcast(actor: SessionUser, roomId: string, input: BroadcastUpdate): Promise<Room> {
    const { membership } = this.requireMember(roomId, actor.userId);
    if (!canManageBroadcast(membership.role)) throw forbidden();
    const row = getRoom(this.deps.db, roomId);
    if (!row) throw new HttpError(404, "not_found", "Sala nao encontrada");

    if (!input.enabled) {
      const nextKey = input.rotateKey ? composeStreamKey(row.id) : undefined;
      updateBroadcast(this.deps.db, roomId, {
        enabled: 0,
        provider: "none",
        embed: row.broadcast_embed,
        streamKey: nextKey,
      });
      const updated = getRoom(this.deps.db, roomId);
      if (!updated) throw new HttpError(404, "not_found", "Sala nao encontrada");
      logger.info("room_broadcast", { roomId, enabled: false });
      return publicRoom(updated, countPresent(this.deps.db, roomId), listMemberships(this.deps.db, roomId).map(toMember));
    }

    const provider = input.provider;
    if (!provider || !isStreamProvider(provider)) {
      throw new HttpError(400, "validation_error", "Provedor de stream invalido");
    }
    const embed = provider === "ome" ? null : normalizeBroadcastEmbed(provider, input.embed);
    if (provider !== "ome" && !embed) {
      throw new HttpError(400, "validation_error", "Link ou canal de stream invalido");
    }
    const needsRotate = input.rotateKey || row.stream_key === row.id;
    updateBroadcast(this.deps.db, roomId, {
      enabled: 1,
      provider,
      embed,
      streamKey: needsRotate ? composeStreamKey(row.id) : undefined,
    });
    const updated = getRoom(this.deps.db, roomId);
    if (!updated) throw new HttpError(404, "not_found", "Sala nao encontrada");
    logger.info("room_broadcast", { roomId, enabled: true, provider });
    return publicRoom(updated, countPresent(this.deps.db, roomId), listMemberships(this.deps.db, roomId).map(toMember));
  }

  async omeInfo(row: RoomRow, role: Role | null): Promise<OmeInfo> {
    const omeEnabled = row.broadcast_enabled === 1 && row.broadcast_provider === "ome";
    if (!omeEnabled) {
      return {
        configured: Boolean(this.deps.env.OME_API_URL),
        healthy: false,
        live: false,
        playbackUrl: null,
        llhlsUrl: null,
        ingest: null,
      };
    }
    let status: OmeInfo;
    try {
      status = await this.deps.ome.status(row.stream_key);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("ome_status_threw", { message });
      status = {
        configured: Boolean(this.deps.env.OME_API_URL),
        healthy: false,
        live: false,
        reachable: false,
        playbackUrl: null,
        llhlsUrl: null,
      };
    }
    const urls = playbackUrls(this.deps.env, row.stream_key, status.live);
    const ingest =
      role && canSeeIngest(role) && this.deps.env.OME_RTMP_URL
        ? { rtmpUrl: this.deps.env.OME_RTMP_URL, streamKey: row.stream_key }
        : null;
    return {
      ...status,
      ...urls,
      ingest,
    };
  }

  getRoomRow(roomId: string): RoomRow | null {
    return getRoom(this.deps.db, roomId);
  }

  broadcastOf(row: RoomRow): RoomBroadcast {
    return toBroadcast(row);
  }

  getMembership(roomId: string, userId: string): MembershipRow | null {
    return getMembership(this.deps.db, roomId, userId);
  }

  listMemberships(roomId: string): MembershipRow[] {
    return listMemberships(this.deps.db, roomId);
  }

  markLeftIfPresent(roomId: string, userId: string): void {
    markLeft(this.deps.db, roomId, userId, this.deps.clock.now());
  }
}
