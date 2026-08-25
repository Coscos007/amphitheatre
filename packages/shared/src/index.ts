export type { AssignableRole, ModerationAction, Role } from "./roles";
export {
  ASSIGNABLE_ROLES,
  ROLES,
  canBan,
  canKick,
  canManageBroadcast,
  canManageRoles,
  canModerateTarget,
  canMute,
  canSeeIngest,
  isAssignableRole,
  isRole,
  roleRank,
} from "./roles";

export { STREAM_PROVIDERS, broadcastIframeSrc, emptyBroadcast, isStreamProvider, normalizeBroadcastEmbed } from "./broadcast";
export type { BroadcastUpdate, RoomBroadcast, StreamProvider } from "./broadcast";

export {
  ADMIN_COOKIE,
  ADMIN_TIME_RANGES,
  API_BASE,
  CHAT_FLOOD_BAN_SECONDS,
  DEFAULT_ADMIN_TIME_RANGE,
  SESSION_COOKIE,
  adminPaths,
  adminTimeRangeMs,
  apiPaths,
  isAdminTimeRange,
  limits,
  normalizeAdminTimeRange,
  normalizeChatFloodBanSec,
} from "./paths";
export type { AdminTimeRange, ChatFloodBanSec } from "./paths";

export {
  ADMIN_FACTORY_RESET_PHRASES,
  isAdminFactoryResetPhrase,
} from "./admin";
export type {
  AdminApiKeyRotateResponse,
  AdminFactoryResetResponse,
  AdminLabeledSeries,
  AdminLivekitNodeMetrics,
  AdminLoginResponse,
  AdminOmeStreamMetrics,
  AdminOverview,
  AdminRoomLivekitSnapshot,
  AdminRoomMember,
  AdminRoomMetrics,
  AdminRoomOmeSnapshot,
  AdminRoomRow,
  AdminSeriesPoint,
  AdminSeriesUnit,
  AdminSession,
  AdminTrackBreakdown,
  AdminUser,
} from "./admin";

export type { ApiErrorBody, ErrorCode } from "./errors";
export { errorCodes } from "./errors";

export type {
  ChatMessage,
  ConnectionQuality,
  JoinResponse,
  LivekitInfo,
  MediaStatus,
  OmeInfo,
  OmeIngest,
  PresenceState,
  Room,
  RoomMember,
  SessionResponse,
  SessionUser,
} from "./types";

export type { ClientEvent, ServerEvent } from "./events";
export { isClientEvent } from "./events";
