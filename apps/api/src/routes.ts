import { zValidator } from "@hono/zod-validator";
import type { ApiErrorBody } from "@coliseum/shared";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import type { Env } from "./env";
import { HttpError, rateLimited } from "./http-error";
import type { RoomHub } from "./hub";
import { clientIp } from "./ip";
import type { LivekitService } from "./livekit";
import { logger } from "./logger";
import { SlidingWindowLimiter } from "./rate-limit";
import type { RoomService } from "./rooms";
import {
  chatSettingsBodySchema,
  clientEventSchema,
  createRoomBodySchema,
  joinBodySchema,
  muteBodySchema,
  rolesBodySchema,
  roomIdParamSchema,
  sessionBodySchema,
  streamBodySchema,
  userIdBodySchema,
} from "./schemas";
import { attachSessionCookie, issueSession, optionalUser, requireUser } from "./session";
import { newUserId } from "./ids";

export type AppBindings = {
  Variables: {
    requestId: string;
  };
};

function jsonError(error: HttpError): ApiErrorBody {
  return {
    error: error.code,
    message: error.message,
    ...(error.retryAfterMs !== undefined ? { retryAfterMs: error.retryAfterMs } : {}),
  };
}

function validatorHook<T>(
  result: { success: true; data: T } | { success: false; error: unknown },
  c: { json: (body: unknown, status: 400) => Response },
) {
  if (!result.success) {
    return c.json({ error: "validation_error", message: "Dados invalidos" } satisfies ApiErrorBody, 400);
  }
  return undefined;
}

export function registerRoutes(
  app: Hono<AppBindings>,
  deps: {
    env: Env;
    rooms: RoomService;
    hub: RoomHub;
    limiter: SlidingWindowLimiter;
    livekit: LivekitService;
  },
): void {
  const { env, rooms, hub, limiter, livekit } = deps;

  app.get("/health", (c) => c.json({ ok: true }));

  app.post("/api/session", zValidator("json", sessionBodySchema, validatorHook), async (c) => {
    const body = c.req.valid("json");
    const existing = await optionalUser(c, env);
    const user = {
      userId: existing?.userId ?? newUserId(),
      displayName: body.displayName,
    };
    const issued = await issueSession(env, user);
    attachSessionCookie(c, env, issued.token);
    return c.json({ userId: user.userId, displayName: user.displayName, token: issued.token });
  });

  app.get("/api/session", async (c) => {
    const user = await requireUser(c, env);
    return c.json(user);
  });

  app.post("/api/rooms", zValidator("json", createRoomBodySchema, validatorHook), async (c) => {
    const user = await requireUser(c, env);
    const ip = clientIp(c, env);
    const limited = limiter.allow(`create:${ip}`, env.RATE_CREATE.limit, env.RATE_CREATE.windowMs);
    if (!limited.ok) throw rateLimited(limited.retryAfterMs);
    const body = c.req.valid("json");
    const room = await rooms.create(user, ip, body);
    return c.json(room, 201);
  });

  app.get("/api/rooms", (c) => c.json(rooms.listPublic()));

  app.get("/api/rooms/:id", zValidator("param", roomIdParamSchema, validatorHook), async (c) => {
    const { id } = c.req.valid("param");
    const user = await optionalUser(c, env);
    return c.json(rooms.getVisible(id, user));
  });

  app.post(
    "/api/rooms/:id/join",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", joinBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const ip = clientIp(c, env);
      const limited = limiter.allow(`join:${ip}`, env.RATE_JOIN.limit, env.RATE_JOIN.windowMs);
      if (!limited.ok) throw rateLimited(limited.retryAfterMs);
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const result = await rooms.join(user, ip, id, body.password);
      hub.broadcastPresence(id);
      hub.broadcast(id, {
        type: "system",
        payload: { code: "joined", message: "Alguem entrou", userId: user.userId },
      });
      return c.json(result);
    },
  );

  app.post("/api/rooms/:id/leave", zValidator("param", roomIdParamSchema, validatorHook), async (c) => {
    const user = await requireUser(c, env);
    const { id } = c.req.valid("param");
    rooms.leave(user, id);
    hub.disconnectUser(id, user.userId, "left", "Voce saiu da sala");
    hub.broadcast(id, {
      type: "system",
      payload: { code: "left", message: "Alguem saiu", userId: user.userId },
    });
    return c.json({ ok: true });
  });

  app.post(
    "/api/rooms/:id/kick",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", userIdBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const { id } = c.req.valid("param");
      const { userId } = c.req.valid("json");
      rooms.kick(user, id, userId);
      hub.disconnectUser(id, userId, "kicked", "Voce foi removido da sala");
      hub.broadcast(id, {
        type: "moderation",
        payload: { action: "kick", userId, byUserId: user.userId },
      });
      await livekit.removeParticipant(id, userId);
      return c.json({ ok: true });
    },
  );

  app.post(
    "/api/rooms/:id/mute",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", muteBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const { id } = c.req.valid("param");
      const { userId, muted } = c.req.valid("json");
      rooms.mute(user, id, userId, muted);
      hub.broadcast(id, {
        type: "moderation",
        payload: { action: "mute", userId, muted, byUserId: user.userId },
      });
      hub.broadcastPresence(id);
      await livekit.applyMute(id, userId, muted);
      return c.json({ ok: true });
    },
  );

  app.post(
    "/api/rooms/:id/ban",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", userIdBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const { id } = c.req.valid("param");
      const { userId } = c.req.valid("json");
      rooms.ban(user, id, userId);
      hub.disconnectUser(id, userId, "banned", "Voce foi banido desta sala");
      hub.broadcast(id, {
        type: "moderation",
        payload: { action: "ban", userId, byUserId: user.userId },
      });
      await livekit.removeParticipant(id, userId);
      return c.json({ ok: true });
    },
  );

  app.post(
    "/api/rooms/:id/unban",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", userIdBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const { id } = c.req.valid("param");
      const { userId } = c.req.valid("json");
      rooms.unban(user, id, userId);
      hub.broadcast(id, {
        type: "moderation",
        payload: { action: "unban", userId, byUserId: user.userId },
      });
      return c.json({ ok: true });
    },
  );

  app.post(
    "/api/rooms/:id/roles",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", rolesBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const ip = clientIp(c, env);
      const limited = limiter.allow(
        `roles:${user.userId}:${ip}`,
        env.RATE_ROLES.limit,
        env.RATE_ROLES.windowMs,
      );
      if (!limited.ok) throw rateLimited(limited.retryAfterMs);
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const updated = rooms.assignRole(user, id, body.userId, body.role);
      hub.broadcast(id, {
        type: "moderation",
        payload: { action: "role", userId: body.userId, role: updated.role, byUserId: user.userId },
      });
      hub.broadcastPresence(id);
      return c.json({ ok: true, role: updated.role });
    },
  );

  app.get(
    "/api/rooms/:id/livekit-token",
    zValidator("param", roomIdParamSchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const limited = limiter.allow(`token:${user.userId}`, env.RATE_TOKEN.limit, env.RATE_TOKEN.windowMs);
      if (!limited.ok) throw rateLimited(limited.retryAfterMs);
      const { id } = c.req.valid("param");
      const minted = await rooms.mintLivekit(user, id);
      return c.json({ token: minted.token, livekitUrl: minted.url });
    },
  );

  app.get("/api/rooms/:id/media", zValidator("param", roomIdParamSchema, validatorHook), async (c) => {
    const { id } = c.req.valid("param");
    const user = await optionalUser(c, env);
    return c.json(await rooms.media(user, id));
  });

  app.patch(
    "/api/rooms/:id/stream",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", streamBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const ip = clientIp(c, env);
      const limited = limiter.allow(
        `stream:${user.userId}:${ip}`,
        env.RATE_ROLES.limit,
        env.RATE_ROLES.windowMs,
      );
      if (!limited.ok) throw rateLimited(limited.retryAfterMs);
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const room = await rooms.setBroadcast(user, id, body);
      hub.broadcast(id, { type: "broadcast", payload: room.broadcast });
      void hub.pushOme(id);
      const row = rooms.getRoomRow(id);
      const membership = rooms.getMembership(id, user.userId);
      const ome = row ? await rooms.omeInfo(row, membership?.role ?? null) : undefined;
      return c.json({ room, ome });
    },
  );

  app.patch(
    "/api/rooms/:id/chat",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("json", chatSettingsBodySchema, validatorHook),
    async (c) => {
      const user = await requireUser(c, env);
      const ip = clientIp(c, env);
      const limited = limiter.allow(
        `chatcfg:${user.userId}:${ip}`,
        env.RATE_ROLES.limit,
        env.RATE_ROLES.windowMs,
      );
      if (!limited.ok) throw rateLimited(limited.retryAfterMs);
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const room = rooms.setChatSettings(user, id, body.floodBanSec);
      return c.json({ room });
    },
  );

  app.get("/api/rooms/:id/ws", async (c, next) => {
    const parsed = roomIdParamSchema.safeParse({ id: c.req.param("id") });
    if (!parsed.success) {
      return c.json({ error: "validation_error", message: "Dados invalidos" }, 400);
    }
    const id = parsed.data.id;
    let user;
    try {
      user = await requireUser(c, env);
      rooms.requirePresent(id, user.userId);
    } catch {
      return c.json({ error: "unauthorized", message: "Sessao ausente ou invalida" }, 401);
    }
    const session = user;
    return upgradeWebSocket(() => ({
      onOpen(_evt, ws) {
        hub.attach(id, session.userId, session.displayName, ws);
      },
      onMessage(evt) {
        if (typeof evt.data !== "string") return;
        let parsedMsg: unknown;
        try {
          parsedMsg = JSON.parse(evt.data);
        } catch {
          return;
        }
        const event = clientEventSchema.safeParse(parsedMsg);
        if (!event.success) return;
        hub.handleClient(id, session.userId, session.displayName, event.data);
      },
      onClose(_evt, ws) {
        hub.detach(id, session.userId, ws);
      },
      onError() {
        logger.warn("ws_error", { roomId: id });
      },
    }))(c, next);
  });

  app.post("/webhooks/livekit", async (c) => {
    if (!livekit.configured) return c.json({ ok: true, ignored: true });
    const body = await c.req.text();
    const event = await livekit.receiveWebhook(
      body,
      c.req.header("Authorization") ?? c.req.header("Authorize"),
    );
    if (!event) return c.json({ ok: false }, 401);
    const roomId = event.room?.name;
    const identity = event.participant?.identity;
    if (roomId && identity && event.event === "track_published" && event.track?.source) {
      hub.applyTrack(roomId, identity, String(event.track.source), true);
    }
    if (roomId && identity && event.event === "track_unpublished" && event.track?.source) {
      hub.applyTrack(roomId, identity, String(event.track.source), false);
    }
    return c.json({ ok: true });
  });

  app.notFound((c) =>
    c.json({ error: "not_found", message: "Nao encontrado" } satisfies ApiErrorBody, 404),
  );

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      if (err.retryAfterMs) {
        c.header("Retry-After", String(Math.ceil(err.retryAfterMs / 1000)));
      }
      return c.json(jsonError(err), err.status);
    }
    logger.error("unhandled", { reason: err instanceof Error ? err.name : "error" });
    return c.json(
      { error: "internal_error", message: "Erro interno" } satisfies ApiErrorBody,
      500,
    );
  });
}
