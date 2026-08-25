import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function applyEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function loadDotEnv(): void {
  applyEnvFile(resolve(import.meta.dir, "../../../.env"));
  applyEnvFile(resolve(import.meta.dir, "../.env"));
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Variavel ${name} invalida: ${raw}`);
  }
  return n;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true" || raw === "yes";
}

function strEnv(name: string, fallback: string): string {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw;
}

function optional(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return undefined;
  return raw;
}

function firstDefined(...names: string[]): string | undefined {
  for (const name of names) {
    const v = optional(name);
    if (v) return v;
  }
  return undefined;
}

export type Env = {
  PORT: number;
  CORS_ORIGINS: string[];
  SESSION_SECRET: string;
  DATABASE_PATH: string;
  ADMIN_PORT: number;
  ADMIN_BIND: string;
  ADMIN_ENABLED: boolean;
  LIVEKIT_METRICS_URL: string;
  METRICS_INTERVAL_MS: number;
  METRICS_RETENTION_DAYS: number;
  TRUST_PROXY: boolean;
  COOKIE_SECURE: boolean;
  NODE_ENV: string;
  PUBLIC_APP_HOSTNAME?: string;
  PUBLIC_LIVEKIT_HOSTNAME?: string;
  PUBLIC_OME_HOSTNAME?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
  LIVEKIT_URL?: string;
  LIVEKIT_HTTP_URL?: string;
  OME_API_URL?: string;
  OME_API_ACCESS_TOKEN?: string;
  OME_VHOST: string;
  OME_APP: string;
  OME_RTMP_URL?: string;
  OME_PLAYBACK_URL?: string;
  OME_LLHLS_PLAYBACK_BASE?: string;
  OME_TIMEOUT_MS: number;
  MAX_ROOMS_PER_CREATOR: number;
  MAX_ROOMS_PER_IP: number;
  MAX_MEMBERS_PER_ROOM: number;
  MAX_CONCURRENT_ROOMS: number;
  ROOM_CREATE_WINDOW_MS: number;
  LOCKOUT_MAX_FAILURES: number;
  LOCKOUT_DURATION_MS: number;
  CHAT_HISTORY_LIMIT: number;
  WS_GRACE_MS: number;
  RATE_CREATE: { limit: number; windowMs: number };
  RATE_JOIN: { limit: number; windowMs: number };
  RATE_CHAT: { limit: number; windowMs: number };
  RATE_TOKEN: { limit: number; windowMs: number };
  RATE_ROLES: { limit: number; windowMs: number };
  RATE_ADMIN_LOGIN: { limit: number; windowMs: number };
};

export function loadEnv(overrides: Partial<Env> = {}): Env {
  loadDotEnv();

  // Convenience for self-hosting with a real domain: set only the three
  // PUBLIC_*_HOSTNAME variables (app, LiveKit, OvenMediaEngine) and every
  // public URL below is derived automatically. Any explicit URL variable
  // (CORS_ORIGIN, LIVEKIT_URL, OME_PLAYBACK_URL, ...) always wins over the
  // derived value. See docs/self-hosting.md.
  const publicAppHostname = optional("PUBLIC_APP_HOSTNAME");
  const publicLivekitHostname = optional("PUBLIC_LIVEKIT_HOSTNAME");
  const publicOmeHostname = optional("PUBLIC_OME_HOSTNAME");

  const corsRaw = strEnv(
    "CORS_ORIGIN",
    publicAppHostname
      ? `https://${publicAppHostname}`
      : "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
  );
  const base: Env = {
    PORT: intEnv("API_PORT", intEnv("PORT", 3001)),
    CORS_ORIGINS: corsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    SESSION_SECRET: strEnv("SESSION_SECRET", "coliseum-dev-session-secret-change-me"),
    DATABASE_PATH: strEnv("DATABASE_PATH", "./data/coliseum.sqlite"),
    ADMIN_PORT: intEnv("ADMIN_PORT", 3002),
    ADMIN_BIND: strEnv("ADMIN_BIND", "127.0.0.1"),
    ADMIN_ENABLED: boolEnv("ADMIN_ENABLED", true),
    LIVEKIT_METRICS_URL: strEnv("LIVEKIT_METRICS_URL", "http://127.0.0.1:6789/metrics"),
    METRICS_INTERVAL_MS: intEnv("METRICS_INTERVAL_MS", 15_000),
    METRICS_RETENTION_DAYS: intEnv("METRICS_RETENTION_DAYS", 30),
    TRUST_PROXY: boolEnv("TRUST_PROXY", false),
    COOKIE_SECURE: boolEnv("COOKIE_SECURE", false),
    NODE_ENV: strEnv("NODE_ENV", "development"),
    PUBLIC_APP_HOSTNAME: publicAppHostname,
    PUBLIC_LIVEKIT_HOSTNAME: publicLivekitHostname,
    PUBLIC_OME_HOSTNAME: publicOmeHostname,
    LIVEKIT_API_KEY: optional("LIVEKIT_API_KEY"),
    LIVEKIT_API_SECRET: optional("LIVEKIT_API_SECRET"),
    LIVEKIT_URL: optional("LIVEKIT_URL") ?? (publicLivekitHostname ? `wss://${publicLivekitHostname}` : undefined),
    LIVEKIT_HTTP_URL: optional("LIVEKIT_HTTP_URL"),
    OME_API_URL: optional("OME_API_URL"),
    OME_API_ACCESS_TOKEN: optional("OME_API_ACCESS_TOKEN"),
    OME_VHOST: strEnv("OME_VHOST", "default"),
    OME_APP: strEnv("OME_APP", "app"),
    OME_RTMP_URL:
      firstDefined("OME_RTMP_URL", "OME_RTMP_INGEST_URL") ??
      (publicOmeHostname ? `rtmp://${publicOmeHostname}:1935/app` : undefined),
    OME_PLAYBACK_URL:
      firstDefined("OME_PLAYBACK_URL", "OME_WEBRTC_PLAYBACK_BASE") ??
      (publicOmeHostname ? `wss://${publicOmeHostname}/app` : undefined),
    OME_LLHLS_PLAYBACK_BASE:
      optional("OME_LLHLS_PLAYBACK_BASE") ??
      (publicOmeHostname ? `https://${publicOmeHostname}/app` : undefined),
    OME_TIMEOUT_MS: intEnv("OME_TIMEOUT_MS", 1000),
    MAX_ROOMS_PER_CREATOR: intEnv("MAX_ROOMS_PER_CREATOR", 10),
    MAX_ROOMS_PER_IP: intEnv("MAX_ROOMS_PER_IP", 20),
    MAX_MEMBERS_PER_ROOM: intEnv("MAX_MEMBERS_PER_ROOM", 50),
    MAX_CONCURRENT_ROOMS: intEnv("MAX_CONCURRENT_ROOMS", 200),
    ROOM_CREATE_WINDOW_MS: intEnv("ROOM_CREATE_WINDOW_HOURS", 24) * 60 * 60 * 1000,
    LOCKOUT_MAX_FAILURES: intEnv("LOCKOUT_MAX_FAILURES", 3),
    LOCKOUT_DURATION_MS: intEnv("LOCKOUT_DURATION_MS", 5 * 60 * 1000),
    CHAT_HISTORY_LIMIT: intEnv("CHAT_HISTORY_LIMIT", 200),
    WS_GRACE_MS: intEnv("WS_GRACE_MS", 15_000),
    RATE_CREATE: { limit: 5, windowMs: 10 * 60 * 1000 },
    RATE_JOIN: { limit: 30, windowMs: 60 * 1000 },
    RATE_CHAT: { limit: 20, windowMs: 10 * 1000 },
    RATE_TOKEN: { limit: 20, windowMs: 60 * 1000 },
    RATE_ROLES: { limit: 30, windowMs: 60 * 1000 },
    RATE_ADMIN_LOGIN: { limit: 10, windowMs: 60 * 1000 },
  };
  return { ...base, ...overrides };
}

export function livekitConfigured(env: Env): boolean {
  return Boolean(env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET && env.LIVEKIT_URL);
}

export function omeConfigured(env: Env): boolean {
  return Boolean(env.OME_API_URL || env.OME_RTMP_URL || env.OME_PLAYBACK_URL);
}
