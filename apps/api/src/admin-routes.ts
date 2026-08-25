import {
  DEFAULT_ADMIN_TIME_RANGE,
  isAdminFactoryResetPhrase,
  normalizeAdminTimeRange,
  type ApiErrorBody,
} from "@coliseum/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { newAdminApiKey } from "./admin-bootstrap";
import { getAdminRoom, listAdminRooms } from "./admin-inventory";
import {
  adminCreateUserBodySchema,
  adminFactoryResetBodySchema,
  adminLoginBodySchema,
  adminPatchUserBodySchema,
  adminRangeQuerySchema,
  adminUserIdParamSchema,
} from "./admin-schemas";
import {
  attachAdminCookie,
  clearAdminCookie,
  issueAdminSession,
  requireAdmin,
} from "./admin-session";
import type { Clock } from "./clock";
import {
  countActiveAdminUsers,
  getAdminInstance,
  getAdminUserById,
  getAdminUserByUsername,
  insertAdminUser,
  listAdminUsers,
  resetTheaterState,
  touchAdminLogin,
  updateAdminUser,
  upsertAdminInstance,
} from "./db";
import type { Env } from "./env";
import { HttpError, forbidden, invalidCredentials, lockedOut, rateLimited } from "./http-error";
import { newUserId } from "./ids";
import { clientIp } from "./ip";
import { clearAdminLockouts, recordAdminFailure, remainingAdminLockMs } from "./lockout";
import type { RoomHub } from "./hub";
import { logger } from "./logger";
import { queryLivekitMetrics, queryOmeMetrics, queryOverview, queryRoomMetrics } from "./metrics-query";
import { SlidingWindowLimiter } from "./rate-limit";
import { reconcileStalePresence } from "./presence";
import type { AppBindings } from "./routes";
import type { RoomService } from "./rooms";
import { roomIdParamSchema } from "./schemas";

function validatorHook<T>(
  result: { success: true; data: T } | { success: false; error: unknown },
  c: { json: (body: unknown, status: 400) => Response },
) {
  if (!result.success) {
    return c.json({ error: "validation_error", message: "Dados invalidos" } satisfies ApiErrorBody, 400);
  }
  return undefined;
}

function toPublicUser(row: {
  id: string;
  username: string;
  disabled: number;
  created_at: number;
  last_login_at: number | null;
}) {
  return {
    id: row.id,
    username: row.username,
    disabled: row.disabled === 1,
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  };
}

function parseHideEmpty(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

export function registerAdminRoutes(
  app: Hono<AppBindings>,
  deps: {
    env: Env;
    clock: Clock;
    rooms: RoomService;
    limiter: SlidingWindowLimiter;
    hub?: RoomHub;
  },
): void {
  const { env, clock, rooms, limiter, hub } = deps;
  const db = rooms.deps.db;

  app.post("/api/admin/login", zValidator("json", adminLoginBodySchema, validatorHook), async (c) => {
    const ip = clientIp(c, env);
    const limited = limiter.allow(`admin-login:${ip}`, env.RATE_ADMIN_LOGIN.limit, env.RATE_ADMIN_LOGIN.windowMs);
    if (!limited.ok) throw rateLimited(limited.retryAfterMs);
    const body = c.req.valid("json");
    const remaining = remainingAdminLockMs(db, clock, ip, body.username);
    if (remaining > 0) throw lockedOut(remaining);

    const user = getAdminUserByUsername(db, body.username);
    const instance = getAdminInstance(db);
    const passwordOk = user ? await Bun.password.verify(body.password, user.password_hash) : false;
    const keyOk = instance ? await Bun.password.verify(body.apiKey, instance.api_key_hash) : false;
    if (!user || user.disabled === 1 || !passwordOk || !keyOk) {
      const locked = recordAdminFailure(db, env, clock, ip, body.username);
      if (locked > 0) throw lockedOut(locked);
      throw invalidCredentials();
    }

    clearAdminLockouts(db, ip, body.username);
    touchAdminLogin(db, user.id, clock.now());
    const issued = await issueAdminSession(env, { id: user.id, username: user.username });
    attachAdminCookie(c, env, issued.token);
    return c.json({ id: user.id, username: user.username, token: issued.token });
  });

  app.post("/api/admin/logout", async (c) => {
    clearAdminCookie(c, env);
    return c.json({ ok: true });
  });

  app.get("/api/admin/session", async (c) => {
    const user = await requireAdmin(c, env);
    const row = getAdminUserById(db, user.id);
    if (!row || row.disabled === 1) throw invalidCredentials();
    return c.json({ id: row.id, username: row.username });
  });

  app.use("/api/admin/*", async (c, next) => {
    if (c.req.path === "/api/admin/login" || c.req.path === "/api/admin/logout") {
      return next();
    }
    const user = await requireAdmin(c, env);
    const row = getAdminUserById(db, user.id);
    if (!row || row.disabled === 1) throw invalidCredentials();
    return next();
  });

  app.get("/api/admin/overview", zValidator("query", adminRangeQuerySchema, validatorHook), (c) => {
    if (hub) {
      const marked = reconcileStalePresence(db, hub, clock.now(), env.WS_GRACE_MS);
      if (marked > 0) logger.info("presence_reconcile", { marked });
    }
    const range = normalizeAdminTimeRange(c.req.valid("query").range ?? DEFAULT_ADMIN_TIME_RANGE);
    return c.json(queryOverview(db, range));
  });

  app.get("/api/admin/rooms", zValidator("query", adminRangeQuerySchema, validatorHook), async (c) => {
    const hideEmpty = parseHideEmpty(c.req.valid("query").hideEmpty);
    return c.json(await listAdminRooms(rooms.deps, hideEmpty, hub));
  });

  app.get(
    "/api/admin/rooms/:id",
    zValidator("param", roomIdParamSchema, validatorHook),
    async (c) => {
      const { id } = c.req.valid("param");
      const room = await getAdminRoom(rooms.deps, id, hub);
      if (!room) throw new HttpError(404, "not_found", "Sala nao encontrada");
      return c.json(room);
    },
  );

  app.get(
    "/api/admin/rooms/:id/metrics",
    zValidator("param", roomIdParamSchema, validatorHook),
    zValidator("query", adminRangeQuerySchema, validatorHook),
    async (c) => {
      const { id } = c.req.valid("param");
      const range = normalizeAdminTimeRange(c.req.valid("query").range ?? DEFAULT_ADMIN_TIME_RANGE);
      const room = await getAdminRoom(rooms.deps, id, hub);
      if (!room) throw new HttpError(404, "not_found", "Sala nao encontrada");
      return c.json(queryRoomMetrics(db, room, range));
    },
  );

  app.get("/api/admin/metrics/livekit", zValidator("query", adminRangeQuerySchema, validatorHook), (c) => {
    const range = normalizeAdminTimeRange(c.req.valid("query").range ?? DEFAULT_ADMIN_TIME_RANGE);
    return c.json(queryLivekitMetrics(db, range));
  });

  app.get("/api/admin/metrics/ome", zValidator("query", adminRangeQuerySchema, validatorHook), (c) => {
    const range = normalizeAdminTimeRange(c.req.valid("query").range ?? DEFAULT_ADMIN_TIME_RANGE);
    return c.json(queryOmeMetrics(db, range));
  });

  app.get("/api/admin/users", async (c) => {
    await requireAdmin(c, env);
    return c.json(listAdminUsers(db).map(toPublicUser));
  });

  app.post("/api/admin/users", zValidator("json", adminCreateUserBodySchema, validatorHook), async (c) => {
    await requireAdmin(c, env);
    const body = c.req.valid("json");
    if (getAdminUserByUsername(db, body.username)) {
      throw new HttpError(409, "conflict", "Username already exists");
    }
    const row = {
      id: newUserId(),
      username: body.username,
      password_hash: await Bun.password.hash(body.password),
      disabled: 0,
      created_at: clock.now(),
      last_login_at: null,
    };
    insertAdminUser(db, row);
    return c.json(toPublicUser(row), 201);
  });

  app.patch(
    "/api/admin/users/:id",
    zValidator("param", adminUserIdParamSchema, validatorHook),
    zValidator("json", adminPatchUserBodySchema, validatorHook),
    async (c) => {
      const actor = await requireAdmin(c, env);
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const target = getAdminUserById(db, id);
      if (!target) throw new HttpError(404, "not_found", "User not found");
      if (body.disabled === true) {
        const active = countActiveAdminUsers(db);
        const wouldLeaveNone = target.disabled === 0 && active <= 1;
        if (wouldLeaveNone) throw forbidden("Cannot disable the last active operator");
        if (actor.id === id && active <= 1) throw forbidden("Cannot disable the last active operator");
      }
      updateAdminUser(db, id, {
        password_hash: body.password ? await Bun.password.hash(body.password) : undefined,
        disabled: body.disabled === undefined ? undefined : body.disabled ? 1 : 0,
      });
      const updated = getAdminUserById(db, id);
      if (!updated) throw new HttpError(404, "not_found", "User not found");
      return c.json(toPublicUser(updated));
    },
  );

  app.post("/api/admin/api-key/rotate", async (c) => {
    await requireAdmin(c, env);
    const apiKey = newAdminApiKey();
    const hash = await Bun.password.hash(apiKey);
    upsertAdminInstance(db, hash, true);
    return c.json({ apiKey });
  });

  app.post(
    "/api/admin/factory-reset",
    zValidator("json", adminFactoryResetBodySchema, validatorHook),
    async (c) => {
      const actor = await requireAdmin(c, env);
      const limited = limiter.allow(`admin-reset:${actor.id}`, 3, 60 * 60 * 1000);
      if (!limited.ok) throw rateLimited(limited.retryAfterMs);
      const { phrase } = c.req.valid("json");
      if (!isAdminFactoryResetPhrase(phrase)) {
        throw new HttpError(400, "validation_error", "Confirmation phrase does not match");
      }
      hub?.resetSessionState();
      resetTheaterState(db);
      logger.info("admin_factory_reset", { operatorId: actor.id });
      return c.json({ ok: true as const });
    },
  );
}
