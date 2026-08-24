import { limits } from "@coliseum/shared";
import { z } from "zod";

export const displayNameSchema = z
  .string()
  .trim()
  .min(limits.displayName.min, "validation.displayNameMin")
  .max(limits.displayName.max, "validation.displayNameMax");

export const createRoomSchema = z.object({
  displayName: displayNameSchema,
  name: z
    .string()
    .trim()
    .min(limits.roomName.min, "validation.roomNameMin")
    .max(limits.roomName.max, "validation.roomNameMax"),
  password: z.string().max(limits.roomPassword.max),
  memberLimit: z
    .number()
    .min(limits.memberLimit.min, "validation.memberLimit")
    .max(limits.memberLimit.max, "validation.memberLimit"),
});

export const joinRoomSchema = z.object({
  displayName: displayNameSchema,
  roomId: z.string().trim().min(1, "validation.roomIdRequired"),
  password: z.string().max(limits.roomPassword.max),
});

export const gateJoinSchema = z.object({
  displayName: displayNameSchema,
  password: z.string().max(limits.roomPassword.max),
});

export const chatSchema = z.object({
  text: z
    .string()
    .trim()
    .min(limits.chatText.min, "validation.chatRequired")
    .max(limits.chatText.max, "validation.chatMax"),
});

export type CreateRoomValues = z.infer<typeof createRoomSchema>;
export type JoinRoomValues = z.infer<typeof joinRoomSchema>;
export type GateJoinValues = z.infer<typeof gateJoinSchema>;
