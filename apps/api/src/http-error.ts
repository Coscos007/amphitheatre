import type { ErrorCode } from "@coliseum/shared";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: ErrorCode;
  readonly retryAfterMs?: number;

  constructor(
    status: ContentfulStatusCode,
    code: ErrorCode,
    message: string,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

export function unauthorized(message = "Sessao ausente ou invalida"): HttpError {
  return new HttpError(401, "unauthorized", message);
}

export function forbidden(message = "Voce nao tem permissao para isso"): HttpError {
  return new HttpError(403, "forbidden", message);
}

export function cannotJoin(message = "Nao foi possivel entrar na sala"): HttpError {
  return new HttpError(403, "cannot_join", message);
}

export function invalidPassword(message = "Senha invalida"): HttpError {
  return new HttpError(403, "invalid_password", message);
}

export function invalidCredentials(message = "Credenciais invalidas"): HttpError {
  return new HttpError(401, "invalid_credentials", message);
}

export function lockedOut(retryAfterMs: number): HttpError {
  return new HttpError(
    429,
    "locked_out",
    "Muitas tentativas. Tente de novo em alguns minutos.",
    retryAfterMs,
  );
}

export function rateLimited(retryAfterMs = 10_000): HttpError {
  return new HttpError(429, "rate_limited", "Muitas requisicoes. Aguarde um momento.", retryAfterMs);
}
