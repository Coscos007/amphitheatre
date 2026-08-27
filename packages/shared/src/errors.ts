export const errorCodes = [
  "unauthorized",
  "forbidden",
  "validation_error",
  "not_found",
  "cannot_join",
  "invalid_password",
  "invalid_credentials",
  "banned",
  "locked_out",
  "room_full",
  "duplicate_display_name",
  "rate_limited",
  "conflict",
  "livekit_unavailable",
  "internal_error",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export type ApiErrorBody = {
  error: ErrorCode;
  message: string;
  retryAfterMs?: number;
};
