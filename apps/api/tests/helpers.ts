import type { JoinResponse, Room, SessionResponse } from "@coliseum/shared";
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
};

export const healthyOme = (live = false): OmeClient => ({
  async status() {
    return {
      configured: true,
      healthy: true,
      live,
      playbackUrl: live ? "ws://localhost:3333/app/x" : null,
      llhlsUrl: null,
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
}): { app: ReturnType<typeof createApp>["app"]; clock: FakeClock; env: Env } {
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
  return { app, clock, env };
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
