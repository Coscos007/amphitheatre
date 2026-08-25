import type { JoinResponse, Room, SessionResponse } from "@coliseum/shared";
import { createAdminApp } from "../src/admin-app";
import { seedAdminCredentials } from "../src/admin-bootstrap";
import { createApp, type AppDeps } from "../src/app";
import { FakeClock } from "../src/clock";
import { openDatabase } from "../src/db";
import { loadEnv, type Env } from "../src/env";
import type { LivekitService } from "../src/livekit";
import type { OmeClient } from "../src/ome";

export const muteLivekit: LivekitService = {
  configured: false,
  url: null,
  health: async () => false,
  mintToken: async () => null,
  applyMute: async () => undefined,
  removeParticipant: async () => undefined,
  receiveWebhook: async () => null,
  listRooms: async () => [],
  listParticipants: async () => [],
};

export const downOme: OmeClient = {
  async status() {
    return {
      configured: true,
      healthy: false,
      live: false,
      reachable: false,
      playbackUrl: null,
      llhlsUrl: null,
    };
  },
  async listStreams() {
    return { reachable: false, keys: [] };
  },
  async streamStats() {
    return {
      reachable: false,
      live: false,
      lastThroughputIn: 0,
      lastThroughputOut: 0,
      totalBytesIn: 0,
      totalBytesOut: 0,
      totalConnections: 0,
      connectionsWebrtc: 0,
      connectionsLlhls: 0,
    };
  },
  async appStats() {
    return {
      reachable: false,
      live: false,
      lastThroughputIn: 0,
      lastThroughputOut: 0,
      totalBytesIn: 0,
      totalBytesOut: 0,
      totalConnections: 0,
      connectionsWebrtc: 0,
      connectionsLlhls: 0,
    };
  },
};

export const healthyOme = (live = false): OmeClient => ({
  async status() {
    return {
      configured: true,
      healthy: true,
      live,
      reachable: true,
      playbackUrl: live ? "ws://localhost:3333/app/x" : null,
      llhlsUrl: null,
    };
  },
  async listStreams() {
    return { reachable: true, keys: live ? ["stream-live"] : [] };
  },
  async streamStats() {
    return {
      reachable: true,
      live,
      lastThroughputIn: live ? 1000 : 0,
      lastThroughputOut: live ? 2000 : 0,
      totalBytesIn: live ? 10_000 : 0,
      totalBytesOut: live ? 20_000 : 0,
      totalConnections: live ? 1 : 0,
      connectionsWebrtc: live ? 1 : 0,
      connectionsLlhls: 0,
    };
  },
  async appStats() {
    return {
      reachable: true,
      live,
      lastThroughputIn: live ? 1000 : 0,
      lastThroughputOut: live ? 2000 : 0,
      totalBytesIn: live ? 10_000 : 0,
      totalBytesOut: live ? 20_000 : 0,
      totalConnections: live ? 1 : 0,
      connectionsWebrtc: live ? 1 : 0,
      connectionsLlhls: 0,
    };
  },
});

export function testEnv(over: Partial<Env> = {}): Env {
  return loadEnv({
    TRUST_PROXY: true,
    DATABASE_PATH: ":memory:",
    SESSION_SECRET: "test-secret-test-secret-test-secret!!",
    CORS_ORIGINS: ["http://localhost:5173"],
    LIVEKIT_API_KEY: undefined,
    LIVEKIT_API_SECRET: undefined,
    LIVEKIT_URL: undefined,
    OME_API_URL: "http://127.0.0.1:9",
    OME_RTMP_URL: "rtmp://localhost:1935/app",
    OME_PLAYBACK_URL: "ws://localhost:3333/app",
    LOCKOUT_MAX_FAILURES: 3,
    LOCKOUT_DURATION_MS: 5 * 60 * 1000,
    ...over,
  });
}

export function makeApp(options?: {
  env?: Partial<Env>;
  clock?: FakeClock;
  ome?: OmeClient;
  livekit?: LivekitService;
}): { app: ReturnType<typeof createApp>["app"]; clock: FakeClock; env: Env; deps: AppDeps } {
  const clock = options?.clock ?? new FakeClock(1_700_000_000_000);
  const env = testEnv(options?.env);
  const deps: AppDeps = {
    env,
    db: openDatabase(":memory:"),
    clock,
    ome: options?.ome ?? downOme,
    livekit: options?.livekit ?? muteLivekit,
  };
  const { app } = createApp(deps);
  return { app, clock, env, deps };
}

export const TEST_ADMIN = {
  username: "admin",
  password: "test-pass-99",
  apiKey: "amp_test_api_key_value12",
};

export async function makeAdminHarness(options?: {
  env?: Partial<Env>;
  clock?: FakeClock;
  ome?: OmeClient;
  livekit?: LivekitService;
}): Promise<{
  app: ReturnType<typeof createApp>["app"];
  admin: ReturnType<typeof createAdminApp>;
  clock: FakeClock;
  env: Env;
  deps: AppDeps;
}> {
  const clock = options?.clock ?? new FakeClock(1_700_000_000_000);
  const env = testEnv(options?.env);
  const db = openDatabase(":memory:");
  await seedAdminCredentials(db, clock, TEST_ADMIN);
  const deps: AppDeps = {
    env,
    db,
    clock,
    ome: options?.ome ?? downOme,
    livekit: options?.livekit ?? muteLivekit,
  };
  const created = createApp(deps);
  const admin = createAdminApp(deps, { rooms: created.rooms, hub: created.hub });
  return { app: created.app, admin, clock, env, deps };
}

export async function loginAdmin(
  admin: ReturnType<typeof createAdminApp>,
  over: Partial<typeof TEST_ADMIN> = {},
  ip = "203.0.113.10",
): Promise<{ status: number; token?: string; body: Record<string, unknown> }> {
  const res = await postJson(
    admin,
    "/api/admin/login",
    { ...TEST_ADMIN, ...over },
    undefined,
    ip,
  );
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, token: typeof body.token === "string" ? body.token : undefined, body };
}

export async function patchJson(
  app: ReturnType<typeof createApp>["app"],
  path: string,
  body: unknown,
  token?: string,
  ip = "203.0.113.10",
): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": ip,
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return app.request(path, { method: "PATCH", headers, body: JSON.stringify(body) });
}

export async function postJson(
  app: ReturnType<typeof createApp>["app"],
  path: string,
  body: unknown,
  token?: string,
  ip = "203.0.113.10",
): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": ip,
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return app.request(path, { method: "POST", headers, body: JSON.stringify(body) });
}

export async function getJson(
  app: ReturnType<typeof createApp>["app"],
  path: string,
  token?: string,
): Promise<Response> {
  const headers: Record<string, string> = { "x-forwarded-for": "203.0.113.10" };
  if (token) headers.authorization = `Bearer ${token}`;
  return app.request(path, { headers });
}

export async function createGuest(
  app: ReturnType<typeof createApp>["app"],
  displayName: string,
  ip?: string,
): Promise<SessionResponse> {
  const res = await postJson(app, "/api/session", { displayName }, undefined, ip);
  if (res.status !== 200) {
    throw new Error(`session failed ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as SessionResponse;
}

export async function createRoom(
  app: ReturnType<typeof createApp>["app"],
  token: string,
  body: { name: string; password?: string; memberLimit?: number; isPublic?: boolean },
  ip?: string,
): Promise<Room> {
  const res = await postJson(app, "/api/rooms", body, token, ip);
  if (res.status !== 201) {
    throw new Error(`create room failed ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Room;
}

export async function joinRoom(
  app: ReturnType<typeof createApp>["app"],
  token: string,
  roomId: string,
  password?: string,
  ip?: string,
): Promise<{ status: number; body: JoinResponse & { error?: string; retryAfterMs?: number } }> {
  const res = await postJson(app, `/api/rooms/${roomId}/join`, { password }, token, ip);
  return { status: res.status, body: (await res.json()) as JoinResponse & { error?: string; retryAfterMs?: number } };
}
