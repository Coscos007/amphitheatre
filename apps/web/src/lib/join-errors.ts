import { ApiError, isLockoutError } from "./api.ts";

export function joinErrorMessageKey(error: unknown): string {
  if (isLockoutError(error)) return "join.lockout";
  if (!(error instanceof ApiError)) return "toast.joinFailed";
  switch (error.code) {
    case "not_found":
      return "join.notFound";
    case "invalid_password":
      return "join.invalidPassword";
    case "room_full":
    case "conflict":
      return "join.full";
    case "duplicate_display_name":
      return "join.duplicateName";
    case "banned":
      return "join.banned";
    case "unauthorized":
      return "join.needName";
    default:
      return "toast.joinFailed";
  }
}

export function isMissingRoomError(error: unknown): boolean {
  return error instanceof ApiError && (error.code === "not_found" || error.status === 404);
}
