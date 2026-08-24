import type { RoomBroadcast } from "./broadcast";
import type { AssignableRole, Role } from "./roles";
import type { ChatMessage, ConnectionQuality, OmeInfo, PresenceState } from "./types";

export type ClientEvent =
  | { type: "chat.send"; text: string }
  | {
      type: "presence.update";
      speaking?: boolean;
      camera?: boolean;
      screen?: boolean;
      quality?: ConnectionQuality;
    };

export type ServerEvent =
  | { type: "chat"; payload: ChatMessage }
  | { type: "presence"; payload: { members: PresenceState[] } }
  | { type: "speaking"; payload: { userId: string; speaking: boolean } }
  | { type: "transmitting"; payload: { userId: string; camera: boolean; screen: boolean } }
  | { type: "quality"; payload: { userId: string; connectionQuality: ConnectionQuality } }
  | { type: "ome"; payload: OmeInfo }
  | { type: "broadcast"; payload: RoomBroadcast }
  | {
      type: "moderation";
      payload: {
        action: "kick" | "mute" | "ban" | "unban" | "role";
        userId: string;
        muted?: boolean;
        role?: Role | AssignableRole;
        byUserId: string;
      };
    }
  | {
      type: "system";
      payload: { code: string; message: string; userId?: string; retryAfterMs?: number };
    };

export function isClientEvent(value: unknown): value is ClientEvent {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return type === "chat.send" || type === "presence.update";
}
