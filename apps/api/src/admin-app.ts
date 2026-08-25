import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ApiErrorBody } from "@coliseum/shared";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { registerAdminRoutes } from "./admin-routes";
import type { AppDeps } from "./app";
import type { RoomHub } from "./hub";
import { HttpError } from "./http-error";
import { logger } from "./logger";
import { SlidingWindowLimiter } from "./rate-limit";
import type { AppBindings } from "./routes";
import { RoomService } from "./rooms";

export function createAdminApp(
  deps: AppDeps,
  extras?: { rooms?: RoomService; hub?: RoomHub },
): Hono<AppBindings> {
  const limiter = deps.limiter ?? new SlidingWindowLimiter(deps.clock);
  const rooms = extras?.rooms ?? new RoomService(deps);
  const app = new Hono<AppBindings>();

  app.use("*", secureHeaders({ referrerPolicy: "strict-origin-when-cross-origin" }));
  app.use(
    "*",
    cors({
      origin: deps.env.CORS_ORIGINS,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      if (err.retryAfterMs) {
        c.header("Retry-After", String(Math.ceil(err.retryAfterMs / 1000)));
      }
      return c.json(
        {
          error: err.code,
          message: err.message,
          ...(err.retryAfterMs !== undefined ? { retryAfterMs: err.retryAfterMs } : {}),
        } satisfies ApiErrorBody,
        err.status,
      );
    }
    logger.error("admin_unhandled", { reason: err instanceof Error ? err.name : "error" });
    return c.json({ error: "internal_error", message: "Erro interno" } satisfies ApiErrorBody, 500);
  });

  registerAdminRoutes(app, {
    env: deps.env,
    clock: deps.clock,
    rooms,
    limiter,
    hub: extras?.hub,
  });

  serveAdminBuildIfPresent(app);

  app.notFound((c) => {
    if (c.req.path.startsWith("/api")) {
      return c.json({ error: "not_found", message: "Nao encontrado" }, 404);
    }
    return c.json({ error: "not_found", message: "Nao encontrado" }, 404);
  });

  return app;
}

function serveAdminBuildIfPresent(app: Hono<AppBindings>): void {
  const publicDir = resolve(import.meta.dir, "../public-admin");
  if (!existsSync(resolve(publicDir, "index.html"))) return;

  const isApiPath = (path: string) => path.startsWith("/api");

  app.use("*", async (c, next) => {
    if (isApiPath(c.req.path)) return next();
    return serveStatic({ root: publicDir })(c, next);
  });

  app.get("*", async (c, next) => {
    if (isApiPath(c.req.path)) return next();
    return serveStatic({ root: publicDir, path: "index.html" })(c, next);
  });
}
