import type { ErrorCode } from "@coliseum/shared";
import type { TFunction } from "i18next";
import { AdminApiError } from "./api.ts";
import { formatMs } from "./format.ts";

const known: ErrorCode[] = [
  "unauthorized",
  "forbidden",
  "validation_error",
  "not_found",
  "invalid_credentials",
  "locked_out",
  "rate_limited",
  "conflict",
];

export function describeApiError(
  err: unknown,
  t: TFunction,
): { title: string; what: string; why: string; how: string } {
  const code =
    err instanceof AdminApiError && known.includes(err.body.error) ? err.body.error : "generic";
  const seconds =
    err instanceof AdminApiError && err.body.retryAfterMs
      ? formatMs(err.body.retryAfterMs)
      : "—";
  return {
    title: t("errors.what"),
    what: t(`errors.${code}.what`),
    why: t(`errors.${code}.why`),
    how: t(`errors.${code}.how`, { seconds }),
  };
}
