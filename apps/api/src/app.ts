import type { Database } from "bun:sqlite";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Clock } from "./clock";
import { systemClock } from "./clock";
import { openDatabase } from "./db";
import type { Env } from "./env";
import { loadEnv } from "./env";
import { RoomHub } from "./hub";
import { createLivekitService, type LivekitService } from "./livekit";
import { createOmeClient, type OmeClient } from "./ome";
import { SlidingWindowLimiter } from "./rate-limit";
import { registerRoutes, type AppBindings } from "./routes";
import { RoomService } from "./rooms";

export type AppDeps = {
  env: Env;
  db: Database;
  clock: Clock;
  ome: OmeClient;
  livekit: LivekitService;
  limiter?: SlidingWindowLimiter;
};

export type CreatedApp = {
  app: Hono<AppBindings>;
  rooms: RoomService;
  hub: RoomHub;
  deps: AppDeps;
};

export function createDefaultDeps(env: Env = loadEnv(), clock: Clock = systemClock): AppDeps {
  return {
    env,
    db: openDatabase(env.DATABASE_PATH),
    clock,
    ome: createOmeClient(env),
    livekit: createLivekitService(env),
  };
}

export function createApp(deps: AppDeps): CreatedApp {
  const limiter = deps.limiter ?? new SlidingWindowLimiter(deps.clock);
  const rooms = new RoomService(deps);
  const hub = new RoomHub(deps.env, deps.clock, rooms, limiter);
  const app = new Hono<AppBindings>();

  app.use("*", async (c, next) => {
    if (c.req.path.endsWith("/ws")) return next();
    return secureHeaders()(c, next);
  });

  app.use("*", async (c, next) => {
    if (c.req.path.endsWith("/ws")) return next();
    return cors({
      origin: deps.env.CORS_ORIGINS,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    })(c, next);
  });

  registerRoutes(app, {
    env: deps.env,
    rooms,
    hub,
    limiter,
    livekit: deps.livekit,
  });

  return { app, rooms, hub, deps };
}
