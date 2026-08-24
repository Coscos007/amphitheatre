import { websocket } from "hono/bun";
import { createApp, createDefaultDeps } from "./app";
import { loadEnv } from "./env";
import { logger } from "./logger";

const env = loadEnv();
const deps = createDefaultDeps(env);
const { app, hub } = createApp(deps);

hub.startOmePoller();
logger.info("api_listen", { port: env.PORT });

export default {
  port: env.PORT,
  fetch: app.fetch,
  websocket,
  idleTimeout: 120,
};
