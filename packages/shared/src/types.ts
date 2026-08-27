import type { RoomBroadcast } from "./broadcast";
import type { Role } from "./roles";

export type SessionUser = {
  userId: string;
  displayName: string;
};

export type SessionResponse = SessionUser & {
  token: string;
};

export type RoomMember = {
  userId: string;
  displayName: string;
  role: Role;
  muted: boolean;
  present: boolean;
  /** Live WS attachment; omitted on REST join until the first presence frame. */
  connected?: boolean;
};

export type Room = {
  id: string;
  name: string;
  isPublic: boolean;
  hasPassword: boolean;
  memberLimit: number;
  memberCount: number;
  ownerId: string;
  createdAt: string;
  broadcast: RoomBroadcast;
  chatFloodBanSec: number;
  members?: RoomMember[];
};

export type OmeIngest = {
  rtmpUrl: string;
  streamKey: string;
};

export type OmeInfo = {
  configured: boolean;
  healthy: boolean;
  live: boolean;
  /** false when the OME process is absent / connection failed. Omit or true when REST answered. */
  reachable?: boolean;
  playbackUrl?: string | null;
  llhlsUrl?: string | null;
  ingest?: OmeIngest | null;
};

export type LivekitInfo = {
  ok: boolean;
  url?: string | null;
};

export type MediaStatus = {
  livekit: LivekitInfo;
  ome: OmeInfo;
  broadcast: RoomBroadcast;
};

export type JoinResponse = {
  room: Room;
  role: Role;
  livekitToken?: string;
  livekitUrl?: string;
  ome?: OmeInfo;
};

export type ConnectionQuality = "excellent" | "good" | "poor" | "lost";

export type PresenceState = {
  userId: string;
  displayName: string;
  role: Role;
  muted: boolean;
  speaking: boolean;
  camera: boolean;
  screen: boolean;
  quality: ConnectionQuality | null;
  present: boolean;
  connected: boolean;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: string;
};
