import { websocket } from "hono/bun";
import { createAdminApp } from "./admin-app";
import { bootstrapAdmin } from "./admin-bootstrap";
import { createApp, createDefaultDeps } from "./app";
import { markAllPresentAsLeft } from "./db";
import { loadEnv } from "./env";
import { logger } from "./logger";
import { startMetricsSampler } from "./metrics-sampler";

declare global {
  var __ctPublicServer: ReturnType<typeof Bun.serve> | undefined;
  var __ctAdminServer: ReturnType<typeof Bun.serve> | undefined;
  var __ctSamplerStop: (() => void) | undefined;
  var __ctOmePoller: ReturnType<typeof setInterval> | undefined;
}

globalThis.__ctPublicServer?.stop(true);
globalThis.__ctAdminServer?.stop(true);
globalThis.__ctSamplerStop?.();
if (globalThis.__ctOmePoller) clearInterval(globalThis.__ctOmePoller);

const env = loadEnv();
const deps = createDefaultDeps(env);
await bootstrapAdmin({ db: deps.db, clock: deps.clock, databasePath: env.DATABASE_PATH });
const created = createApp(deps);
const swept = markAllPresentAsLeft(deps.db, deps.clock.now());
if (swept > 0) logger.info("presence_boot_sweep", { marked: swept });
const adminApp = createAdminApp(deps, { rooms: created.rooms, hub: created.hub });

globalThis.__ctOmePoller = created.hub.startOmePoller();
globalThis.__ctSamplerStop = startMetricsSampler({ ...deps, hub: created.hub }).stop;

globalThis.__ctPublicServer = Bun.serve({
  port: env.PORT,
  hostname: "0.0.0.0",
  fetch: created.app.fetch,
  websocket,
  idleTimeout: 120,
});
logger.info("api_listen", { port: env.PORT });

if (env.ADMIN_ENABLED) {
  globalThis.__ctAdminServer = Bun.serve({
    port: env.ADMIN_PORT,
    hostname: env.ADMIN_BIND,
    fetch: adminApp.fetch,
    idleTimeout: 120,
  });
  logger.info("admin_listen", { port: env.ADMIN_PORT, bind: env.ADMIN_BIND });
}
