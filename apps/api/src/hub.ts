import type {
  ChatMessage,
  ClientEvent,
  ConnectionQuality,
  PresenceState,
  ServerEvent,
} from "@coliseum/shared";
import type { WSContext } from "hono/ws";
import type { Clock } from "./clock";
import type { Env } from "./env";
import { newMessageId } from "./ids";
import { logger } from "./logger";
import { SlidingWindowLimiter } from "./rate-limit";
import { isChatBurst, pruneChatTimes } from "./chat-flood";
import type { RoomService } from "./rooms";

type Socket = WSContext;

type Conn = {
  userId: string;
  displayName: string;
  ws: Socket;
};

type LivePresence = {
  speaking: boolean;
  camera: boolean;
  screen: boolean;
  quality: ConnectionQuality | null;
};

export class RoomHub {
  private readonly rooms = new Map<string, Map<string, Set<Conn>>>();
  private readonly chat = new Map<string, ChatMessage[]>();
  private readonly live = new Map<string, Map<string, LivePresence>>();
  private readonly leaveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly pingTimers = new WeakMap<Socket, ReturnType<typeof setInterval>>();
  private readonly omeSnapshots = new Map<string, string>();
  private readonly chatTimes = new Map<string, number[]>();
  private readonly chatMuteUntil = new Map<string, number>();

  constructor(
    private readonly env: Env,
    private readonly clock: Clock,
    private readonly roomsApi: RoomService,
    private readonly limiter: SlidingWindowLimiter,
  ) {}

  attach(roomId: string, userId: string, displayName: string, ws: Socket): void {
    this.cancelLeave(roomId, userId);
    let users = this.rooms.get(roomId);
    if (!users) {
      users = new Map();
      this.rooms.set(roomId, users);
    }
    let conns = users.get(userId);
    if (!conns) {
      conns = new Set();
      users.set(userId, conns);
    }
    conns.add({ userId, displayName, ws });
    this.ensureLive(roomId, userId);

    const ping = setInterval(() => {
      this.send(ws, { type: "system", payload: { code: "ping", message: "ping" } });
    }, 25_000);
    this.pingTimers.set(ws, ping);

    for (const msg of this.chat.get(roomId) ?? []) {
      this.send(ws, { type: "chat", payload: msg });
    }
    this.send(ws, { type: "presence", payload: { members: this.snapshot(roomId) } });
    const row = this.roomsApi.getRoomRow(roomId);
    if (row) {
      this.send(ws, { type: "broadcast", payload: this.roomsApi.broadcastOf(row) });
    }
    this.broadcast(roomId, {
      type: "system",
      payload: { code: "joined", message: "Alguem entrou", userId },
    });
    this.broadcastPresence(roomId);
    void this.pushOme(roomId);
  }

  detach(roomId: string, userId: string, ws: Socket): void {
    const ping = this.pingTimers.get(ws);
    if (ping) clearInterval(ping);
    const users = this.rooms.get(roomId);
    const conns = users?.get(userId);
    if (conns) {
      for (const conn of [...conns]) {
        if (conn.ws === ws) conns.delete(conn);
      }
      if (conns.size === 0) users?.delete(userId);
    }
    if (users && users.size === 0) this.rooms.delete(roomId);
    if (!this.isConnected(roomId, userId)) {
      this.scheduleLeave(roomId, userId);
    }
  }

  isConnected(roomId: string, userId: string): boolean {
    return (this.rooms.get(roomId)?.get(userId)?.size ?? 0) > 0;
  }

  hasPendingLeave(roomId: string, userId: string): boolean {
    return this.leaveTimers.has(`${roomId}:${userId}`);
  }

  resetSessionState(): void {
    for (const timer of this.leaveTimers.values()) clearTimeout(timer);
    this.leaveTimers.clear();
    this.rooms.clear();
    this.chat.clear();
    this.live.clear();
    this.omeSnapshots.clear();
    this.chatTimes.clear();
    this.chatMuteUntil.clear();
  }

  disconnectUser(roomId: string, userId: string, code: string, message: string): void {
    this.cancelLeave(roomId, userId);
    const conns = this.rooms.get(roomId)?.get(userId);
    if (conns) {
      for (const conn of conns) {
        this.send(conn.ws, { type: "system", payload: { code, message, userId } });
        try {
          conn.ws.close();
        } catch {
          /* already closed */
        }
      }
    }
    this.rooms.get(roomId)?.delete(userId);
    this.live.get(roomId)?.delete(userId);
    this.broadcastPresence(roomId);
  }

  handleClient(roomId: string, userId: string, displayName: string, event: ClientEvent): void {
    if (event.type === "chat.send") {
      const now = this.clock.now();
      const key = `${roomId}:${userId}`;
      const mutedUntil = this.chatMuteUntil.get(key) ?? 0;
      if (mutedUntil > now) {
        this.sendToUser(roomId, userId, {
          type: "system",
          payload: {
            code: "chat_slow",
            message: "Chat temporariamente limitado",
            retryAfterMs: mutedUntil - now,
          },
        });
        return;
      }
      const limited = this.limiter.allow(
        `chat:${userId}`,
        this.env.RATE_CHAT.limit,
        this.env.RATE_CHAT.windowMs,
      );
      const times = pruneChatTimes(this.chatTimes.get(key) ?? [], now);
      if (!limited.ok || isChatBurst(times, now)) {
        const banMs = this.roomsApi.chatFloodBanSec(roomId) * 1000;
        this.chatMuteUntil.set(key, now + banMs);
        this.sendToUser(roomId, userId, {
          type: "system",
          payload: {
            code: "chat_slow",
            message: "Chat temporariamente limitado",
            retryAfterMs: banMs,
          },
        });
        return;
      }
      times.push(now);
      this.chatTimes.set(key, times);
      const msg: ChatMessage = {
        id: newMessageId(),
        roomId,
        userId,
        displayName,
        text: event.text,
        createdAt: new Date(this.clock.now()).toISOString(),
      };
      const list = this.chat.get(roomId) ?? [];
      list.push(msg);
      const overflow = list.length - this.env.CHAT_HISTORY_LIMIT;
      if (overflow > 0) list.splice(0, overflow);
      this.chat.set(roomId, list);
      this.broadcast(roomId, { type: "chat", payload: msg });
      return;
    }

    const state = this.ensureLive(roomId, userId);
    if (event.speaking !== undefined) {
      state.speaking = event.speaking;
      this.broadcast(roomId, { type: "speaking", payload: { userId, speaking: event.speaking } });
    }
    if (event.camera !== undefined || event.screen !== undefined) {
      if (event.camera !== undefined) state.camera = event.camera;
      if (event.screen !== undefined) state.screen = event.screen;
      this.broadcast(roomId, {
        type: "transmitting",
        payload: { userId, camera: state.camera, screen: state.screen },
      });
    }
    if (event.quality !== undefined) {
      state.quality = event.quality;
      this.broadcast(roomId, {
        type: "quality",
        payload: { userId, connectionQuality: event.quality },
      });
    }
  }

  applyTrack(roomId: string, userId: string, source: string, published: boolean): void {
    const state = this.ensureLive(roomId, userId);
    const src = source.toLowerCase();
    if (src.includes("screen")) state.screen = published;
    else if (src.includes("camera") || src.includes("microphone")) {
      if (src.includes("camera")) state.camera = published;
    }
    this.broadcast(roomId, {
      type: "transmitting",
      payload: { userId, camera: state.camera, screen: state.screen },
    });
  }

  private sendToUser(roomId: string, userId: string, event: ServerEvent): void {
    const conns = this.rooms.get(roomId)?.get(userId);
    if (!conns) return;
    for (const conn of conns) this.send(conn.ws, event);
  }

  broadcast(roomId: string, event: ServerEvent): void {
    const users = this.rooms.get(roomId);
    if (!users) return;
    const payload = JSON.stringify(event);
    for (const conns of users.values()) {
      for (const conn of conns) {
        try {
          conn.ws.send(payload);
        } catch {
          /* drop */
        }
      }
    }
  }

  broadcastPresence(roomId: string): void {
    this.broadcast(roomId, { type: "presence", payload: { members: this.snapshot(roomId) } });
  }

  async pushOme(roomId: string): Promise<void> {
    const row = this.roomsApi.getRoomRow(roomId);
    if (!row || row.broadcast_enabled !== 1 || row.broadcast_provider !== "ome") return;
    try {
      const ome = await this.roomsApi.omeInfo(row, "member");
      const encoded = JSON.stringify(ome);
      if (this.omeSnapshots.get(roomId) === encoded) return;
      this.omeSnapshots.set(roomId, encoded);
      this.broadcast(roomId, { type: "ome", payload: ome });
    } catch {
      /* chat/voice never depend on OME */
    }
  }

  startOmePoller(): ReturnType<typeof setInterval> {
    return setInterval(() => {
      for (const roomId of this.rooms.keys()) {
        void this.pushOme(roomId);
      }
    }, 15_000);
  }

  snapshot(roomId: string): PresenceState[] {
    const liveRoom = this.live.get(roomId);
    return this.roomsApi.listPresentMemberships(roomId).map((m) => {
      const p = liveRoom?.get(m.user_id);
      return {
        userId: m.user_id,
        displayName: m.display_name,
        role: m.role,
        muted: m.muted === 1,
        speaking: p?.speaking ?? false,
        camera: p?.camera ?? false,
        screen: p?.screen ?? false,
        quality: p?.quality ?? null,
        present: true,
        connected: this.isConnected(roomId, m.user_id),
      };
    });
  }

  private ensureLive(roomId: string, userId: string): LivePresence {
    let room = this.live.get(roomId);
    if (!room) {
      room = new Map();
      this.live.set(roomId, room);
    }
    let state = room.get(userId);
    if (!state) {
      state = { speaking: false, camera: false, screen: false, quality: null };
      room.set(userId, state);
    }
    return state;
  }

  private send(ws: Socket, event: ServerEvent): void {
    try {
      ws.send(JSON.stringify(event));
    } catch {
      /* closed */
    }
  }

  private scheduleLeave(roomId: string, userId: string): void {
    this.cancelLeave(roomId, userId);
    const key = `${roomId}:${userId}`;
    const timer = setTimeout(() => {
      this.leaveTimers.delete(key);
      if (this.isConnected(roomId, userId)) return;
      this.roomsApi.markLeftIfPresent(roomId, userId);
      this.live.get(roomId)?.delete(userId);
      this.broadcast(roomId, {
        type: "system",
        payload: { code: "left", message: "Alguem saiu", userId },
      });
      this.broadcastPresence(roomId);
      logger.info("ws_grace_leave", { roomId });
    }, this.env.OFFLINE_REMOVE_MS);
    this.leaveTimers.set(key, timer);
  }

  private cancelLeave(roomId: string, userId: string): void {
    const key = `${roomId}:${userId}`;
    const timer = this.leaveTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.leaveTimers.delete(key);
    }
  }
}
