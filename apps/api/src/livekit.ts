import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
  WebhookReceiver,
  type ParticipantInfo,
  type Room,
  type VideoGrant,
  type WebhookEvent,
} from "livekit-server-sdk";
import { livekitConfigured, type Env } from "./env";
import { logger } from "./logger";

export type MintInput = {
  roomId: string;
  userId: string;
  displayName: string;
  muted: boolean;
};

export type LivekitService = {
  configured: boolean;
  url: string | null;
  health: () => Promise<boolean>;
  mintToken: (input: MintInput) => Promise<string | null>;
  applyMute: (roomId: string, userId: string, muted: boolean) => Promise<void>;
  removeParticipant: (roomId: string, userId: string) => Promise<void>;
  receiveWebhook: (body: string, authHeader: string | undefined) => Promise<WebhookEvent | null>;
  listRooms: () => Promise<Room[]>;
  listParticipants: (roomId: string) => Promise<ParticipantInfo[]>;
};

function grantFor(roomId: string, muted: boolean): VideoGrant {
  const sources = muted
    ? [TrackSource.CAMERA, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO]
    : [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO];
  return {
    room: roomId,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    canPublishSources: sources,
  };
}

export function createLivekitService(env: Env, fetchImpl: typeof fetch = fetch): LivekitService {
  const configured = livekitConfigured(env);
  const httpUrl = env.LIVEKIT_HTTP_URL ?? (env.LIVEKIT_URL ? env.LIVEKIT_URL.replace(/^ws/i, "http") : undefined);
  const roomService =
    configured && httpUrl && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET
      ? new RoomServiceClient(httpUrl, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET)
      : null;
  const receiver =
    configured && env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET
      ? new WebhookReceiver(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET)
      : null;

  return {
    configured,
    url: env.LIVEKIT_URL ?? null,
    async health() {
      if (!configured || !httpUrl) return false;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1000);
      try {
        const res = await fetchImpl(httpUrl, { method: "GET", signal: controller.signal });
        return res.ok || res.status === 404 || res.status === 401 || res.status === 200;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    },
    async mintToken(input) {
      if (!configured || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) return null;
      const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
        identity: input.userId,
        name: input.displayName,
        ttl: "6h",
      });
      token.addGrant(grantFor(input.roomId, input.muted));
      return token.toJwt();
    },
    async applyMute(roomId, userId, muted) {
      if (!roomService) return;
      try {
        await roomService.updateParticipant(roomId, userId, undefined, {
          canSubscribe: true,
          canPublish: true,
          canPublishData: true,
          canPublishSources: grantFor(roomId, muted).canPublishSources,
        });
      } catch (err) {
        logger.warn("livekit_mute_failed", {
          reason: err instanceof Error ? err.name : "error",
        });
      }
    },
    async removeParticipant(roomId, userId) {
      if (!roomService) return;
      try {
        await roomService.removeParticipant(roomId, userId);
      } catch (err) {
        logger.warn("livekit_remove_failed", {
          reason: err instanceof Error ? err.name : "error",
        });
      }
    },
    async receiveWebhook(body, authHeader) {
      if (!receiver || !authHeader) return null;
      try {
        return await receiver.receive(body, authHeader);
      } catch (err) {
        logger.warn("livekit_webhook_invalid", {
          reason: err instanceof Error ? err.name : "error",
        });
        return null;
      }
    },
    async listRooms() {
      if (!roomService) return [];
      try {
        return await roomService.listRooms();
      } catch (err) {
        logger.warn("livekit_list_rooms_failed", {
          reason: err instanceof Error ? err.name : "error",
        });
        return [];
      }
    },
    async listParticipants(roomId) {
      if (!roomService) return [];
      try {
        return await roomService.listParticipants(roomId);
      } catch (err) {
        logger.warn("livekit_list_participants_failed", {
          reason: err instanceof Error ? err.name : "error",
        });
        return [];
      }
    },
  };
}
