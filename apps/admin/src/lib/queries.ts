import { useQuery } from "@tanstack/react-query";
import type { AdminSession } from "@coliseum/shared";
import { AdminApiError, fetchSession } from "./api.ts";

export const sessionQueryKey = ["admin-session"] as const;
export const POLL_MS = 12_000;

export async function fetchSessionOrNull(): Promise<AdminSession | null> {
  try {
    return await fetchSession();
  } catch (err) {
    if (
      err instanceof AdminApiError &&
      (err.status === 401 || err.body.error === "unauthorized" || err.body.error === "invalid_credentials")
    ) {
      return null;
    }
    throw err;
  }
}

export function useAdminSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSessionOrNull,
    retry: false,
    staleTime: 15_000,
  });
}
