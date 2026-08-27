export const API_BASE = "/api";

export const SESSION_COOKIE = "ct_session";

export const ADMIN_COOKIE = "ct_admin";

export const apiPaths = {
  health: "/health",
  session: "/api/session",
  rooms: "/api/rooms",
  room: (id: string) => `/api/rooms/${id}` as const,
  roomJoin: (id: string) => `/api/rooms/${id}/join` as const,
  roomLeave: (id: string) => `/api/rooms/${id}/leave` as const,
  roomKick: (id: string) => `/api/rooms/${id}/kick` as const,
  roomMute: (id: string) => `/api/rooms/${id}/mute` as const,
  roomBan: (id: string) => `/api/rooms/${id}/ban` as const,
  roomUnban: (id: string) => `/api/rooms/${id}/unban` as const,
  roomRoles: (id: string) => `/api/rooms/${id}/roles` as const,
  roomLivekitToken: (id: string) => `/api/rooms/${id}/livekit-token` as const,
  roomMedia: (id: string) => `/api/rooms/${id}/media` as const,
  roomStream: (id: string) => `/api/rooms/${id}/stream` as const,
  roomChat: (id: string) => `/api/rooms/${id}/chat` as const,
  roomWs: (id: string) => `/api/rooms/${id}/ws` as const,
  livekitWebhook: "/webhooks/livekit",
} as const;

export const adminPaths = {
  login: "/api/admin/login",
  logout: "/api/admin/logout",
  session: "/api/admin/session",
  overview: "/api/admin/overview",
  rooms: "/api/admin/rooms",
  room: (id: string) => `/api/admin/rooms/${id}` as const,
  roomMetrics: (id: string) => `/api/admin/rooms/${id}/metrics` as const,
  livekitMetrics: "/api/admin/metrics/livekit",
  omeMetrics: "/api/admin/metrics/ome",
  users: "/api/admin/users",
  user: (id: string) => `/api/admin/users/${id}` as const,
  apiKeyRotate: "/api/admin/api-key/rotate",
  factoryReset: "/api/admin/factory-reset",
} as const;

export const limits = {
  displayName: { min: 1, max: 32 },
  roomName: { min: 1, max: 64 },
  roomPassword: { min: 1, max: 128 },
  chatText: { min: 1, max: 1024 },
  chatBurst: { count: 6, windowMs: 8000 },
  chatFloodBanSec: { min: 60, max: 120, default: 60 },
  memberLimit: { min: 2, max: 50 },
  /** Operator-provisioned rooms may exceed the theater guest cap. */
  adminMemberLimit: { min: 2, max: 500 },
  roomIdLength: 8,
  roomId: { min: 6, max: 12 },
  adminRoomExpiresHours: { min: 1, max: 8760 },
  chatHistory: 200,
  streamSecretLength: 10,
  broadcastEmbed: { min: 1, max: 512 },
  adminUsername: { min: 1, max: 32 },
  adminPassword: { min: 8, max: 128 },
} as const;

export const ADMIN_TIME_RANGES = ["1h", "6h", "24h", "7d", "30d"] as const;

export type AdminTimeRange = (typeof ADMIN_TIME_RANGES)[number];

export const DEFAULT_ADMIN_TIME_RANGE: AdminTimeRange = "24h";

export function isAdminTimeRange(value: unknown): value is AdminTimeRange {
  return typeof value === "string" && (ADMIN_TIME_RANGES as readonly string[]).includes(value);
}

export function normalizeAdminTimeRange(value: unknown): AdminTimeRange {
  return isAdminTimeRange(value) ? value : DEFAULT_ADMIN_TIME_RANGE;
}

export function adminTimeRangeMs(range: AdminTimeRange): number {
  switch (range) {
    case "1h":
      return 60 * 60 * 1000;
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

export const CHAT_FLOOD_BAN_SECONDS = [60, 120] as const;

export type ChatFloodBanSec = (typeof CHAT_FLOOD_BAN_SECONDS)[number];

export function normalizeChatFloodBanSec(value: unknown): ChatFloodBanSec {
  return value === 120 ? 120 : 60;
}
