import { ADMIN_TIME_RANGES, limits } from "@coliseum/shared";
import { z } from "zod";

const roomId = z
  .string()
  .min(limits.roomId.min)
  .max(limits.roomId.max)
  .regex(/^[A-Za-z0-9]+$/);

const adminUsername = z
  .string()
  .trim()
  .min(limits.adminUsername.min)
  .max(limits.adminUsername.max)
  .regex(/^[a-zA-Z0-9._-]+$/);

const adminPassword = z.string().min(limits.adminPassword.min).max(limits.adminPassword.max);

export const adminLoginBodySchema = z.object({
  username: adminUsername,
  password: z.string().min(1).max(limits.adminPassword.max),
  apiKey: z.string().min(8).max(256),
});

export const adminCreateUserBodySchema = z.object({
  username: adminUsername,
  password: adminPassword,
});

export const adminPatchUserBodySchema = z
  .object({
    password: adminPassword.optional(),
    disabled: z.boolean().optional(),
  })
  .refine((body) => body.password !== undefined || body.disabled !== undefined, {
    message: "empty",
  });

export const adminFactoryResetBodySchema = z.object({
  phrase: z.string().min(1).max(128),
});

export const adminUserIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const adminRangeQuerySchema = z.object({
  range: z.enum(ADMIN_TIME_RANGES).optional(),
  hideEmpty: z
    .union([z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
    .optional(),
});

export const adminCreateRoomBodySchema = z.object({
  id: roomId,
  name: z.string().trim().min(limits.roomName.min).max(limits.roomName.max),
  memberLimit: z
    .number()
    .int()
    .min(limits.adminMemberLimit.min)
    .max(limits.adminMemberLimit.max),
  isPublic: z.boolean(),
  password: z.string().min(limits.roomPassword.min).max(limits.roomPassword.max).optional(),
  expiresInHours: z
    .number()
    .int()
    .min(limits.adminRoomExpiresHours.min)
    .max(limits.adminRoomExpiresHours.max)
    .optional(),
});
