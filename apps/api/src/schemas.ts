import { ASSIGNABLE_ROLES, STREAM_PROVIDERS, limits } from "@coliseum/shared";
import { z } from "zod";

const displayName = z
  .string()
  .trim()
  .min(limits.displayName.min)
  .max(limits.displayName.max);

export const sessionBodySchema = z.object({
  displayName,
});

export const createRoomBodySchema = z.object({
  name: z.string().trim().min(limits.roomName.min).max(limits.roomName.max),
  password: z.string().min(limits.roomPassword.min).max(limits.roomPassword.max).optional(),
  memberLimit: z.number().int().min(limits.memberLimit.min).max(limits.memberLimit.max).optional(),
  isPublic: z.boolean().optional(),
});

export const joinBodySchema = z.object({
  password: z.string().min(limits.roomPassword.min).max(limits.roomPassword.max).optional(),
});

export const userIdBodySchema = z.object({
  userId: z.string().uuid(),
});

export const muteBodySchema = z.object({
  userId: z.string().uuid(),
  muted: z.boolean(),
});

export const rolesBodySchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ASSIGNABLE_ROLES),
});

export const chatSettingsBodySchema = z.object({
  floodBanSec: z.union([z.literal(60), z.literal(120)]),
});

export const streamBodySchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(STREAM_PROVIDERS).optional(),
  embed: z.string().trim().max(limits.broadcastEmbed.max).nullable().optional(),
  rotateKey: z.boolean().optional(),
});

export const roomIdParamSchema = z.object({
  id: z
    .string()
    .min(6)
    .max(12)
    .regex(/^[A-Za-z0-9]+$/),
});

export const chatSendSchema = z.object({
  type: z.literal("chat.send"),
  text: z.string().trim().min(limits.chatText.min).max(limits.chatText.max),
});

export const presenceUpdateSchema = z.object({
  type: z.literal("presence.update"),
  speaking: z.boolean().optional(),
  camera: z.boolean().optional(),
  screen: z.boolean().optional(),
  quality: z.enum(["excellent", "good", "poor", "lost"]).optional(),
});

export const clientEventSchema = z.discriminatedUnion("type", [chatSendSchema, presenceUpdateSchema]);
