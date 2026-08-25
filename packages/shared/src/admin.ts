import type { RoomBroadcast } from "./broadcast";
import type { Role } from "./roles";
import type { AdminTimeRange } from "./paths";

export type AdminSession = {
  id: string;
  username: string;
};

export type AdminLoginResponse = AdminSession & {
  token: string;
};

export type AdminUser = {
  id: string;
  username: string;
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminApiKeyRotateResponse = {
  apiKey: string;
};

export type AdminFactoryResetResponse = {
  ok: true;
};

/** Exact phrases the operator must type (any locale) before a theater factory reset. Compared case-insensitively after trim. */
export const ADMIN_FACTORY_RESET_PHRASES = [
  "reset permanently",
  "resetar permanentemente",
  "restablecer permanentemente",
] as const;

export function isAdminFactoryResetPhrase(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (ADMIN_FACTORY_RESET_PHRASES as readonly string[]).includes(normalized);
}

export type AdminTrackBreakdown = {
  microphone: number;
  camera: number;
  screenShare: number;
  screenShareAudio: number;
  unknown: number;
};

export type AdminRoomMember = {
  userId: string;
  displayName: string;
  role: Role;
  muted: boolean;
  present: boolean;
};

export type AdminRoomLivekitSnapshot = {
  participants: number;
  publishers: number;
  tracks: AdminTrackBreakdown;
  announcedBitrateBps: number | null;
  /** SFU fan-out from announced layer bitrates. Not measured bytes. */
  estimatedFanoutBps: number | null;
  estimated: true;
};

export type AdminRoomOmeSnapshot = {
  live: boolean;
  reachable: boolean;
  throughputInBps: number | null;
  throughputOutBps: number | null;
  bytesIn: number | null;
  bytesOut: number | null;
  connectionsWebrtc: number | null;
  connectionsLlhls: number | null;
  totalConnections: number | null;
};

export type AdminRoomRow = {
  id: string;
  name: string;
  isPublic: boolean;
  hasPassword: boolean;
  memberLimit: number;
  present: number;
  uniqueEver: number;
  peak: number;
  createdAt: string;
  ownerId: string;
  streamKey: string;
  broadcast: RoomBroadcast;
  livekit?: AdminRoomLivekitSnapshot | null;
  ome?: AdminRoomOmeSnapshot | null;
  members?: AdminRoomMember[];
};

export type AdminSeriesPoint = {
  ts: number;
  value: number;
};

export type AdminSeriesUnit = "bps" | "bytes" | "count" | "ms" | "percent";

export type AdminLabeledSeries = {
  key: string;
  name: string;
  labels: Record<string, string>;
  points: AdminSeriesPoint[];
  unit: AdminSeriesUnit;
  kind: "counter_rate" | "gauge";
  estimated?: boolean;
};

export type AdminOverview = {
  range: AdminTimeRange;
  roomsTotal: number;
  roomsOccupied: number;
  peopleNow: number;
  peakPeople: number;
  livekit: {
    metricsReachable: boolean;
    bitrateInBps: number | null;
    bitrateOutBps: number | null;
    series: AdminLabeledSeries[];
  };
  ome: {
    configured: boolean;
    healthy: boolean;
    reachable: boolean;
    bitrateInBps: number | null;
    bitrateOutBps: number | null;
    series: AdminLabeledSeries[];
  };
};

export type AdminLivekitNodeMetrics = {
  range: AdminTimeRange;
  metricsReachable: boolean;
  bitrateInBps: number | null;
  bitrateOutBps: number | null;
  series: AdminLabeledSeries[];
};

export type AdminOmeStreamMetrics = {
  range: AdminTimeRange;
  reachable: boolean;
  streams: Array<{
    roomId: string | null;
    streamKey: string;
    live: boolean;
    throughputInBps: number | null;
    throughputOutBps: number | null;
    bytesIn: number | null;
    bytesOut: number | null;
    connectionsWebrtc: number | null;
    connectionsLlhls: number | null;
    totalConnections: number | null;
  }>;
  series: AdminLabeledSeries[];
};

export type AdminRoomMetrics = {
  range: AdminTimeRange;
  room: AdminRoomRow;
  series: AdminLabeledSeries[];
};
