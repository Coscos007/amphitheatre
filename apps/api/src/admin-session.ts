import { ADMIN_COOKIE } from "@coliseum/shared";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import type { Env } from "./env";
import { unauthorized } from "./http-error";

const ALG = "HS256";
const TTL_SECONDS = 60 * 60 * 12;
export const ADMIN_AUD = "admin";

export type AdminAuthUser = {
  id: string;
  username: string;
};

type AdminJwtPayload = {
  sub: string;
  username: string;
  aud: typeof ADMIN_AUD;
  exp: number;
  iat: number;
};

export async function issueAdminSession(
  env: Env,
  user: AdminAuthUser,
): Promise<{ token: string; user: AdminAuthUser }> {
  const iat = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: user.id,
      username: user.username,
      aud: ADMIN_AUD,
      iat,
      exp: iat + TTL_SECONDS,
    } satisfies AdminJwtPayload,
    env.SESSION_SECRET,
    ALG,
  );
  return { token, user };
}

export async function decodeAdminSession(env: Env, token: string): Promise<AdminAuthUser> {
  try {
    const payload = (await verify(token, env.SESSION_SECRET, ALG)) as AdminJwtPayload;
    if (payload.aud !== ADMIN_AUD || !payload.sub || typeof payload.username !== "string") {
      throw unauthorized();
    }
    return { id: payload.sub, username: payload.username };
  } catch (err) {
    if (err instanceof Error && err.name === "HttpError") throw err;
    throw unauthorized();
  }
}

export function readAdminToken(c: Context): string | null {
  const header = c.req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token) return token;
  }
  return getCookie(c, ADMIN_COOKIE) ?? null;
}

export async function requireAdmin(c: Context, env: Env): Promise<AdminAuthUser> {
  const token = readAdminToken(c);
  if (!token) throw unauthorized();
  return decodeAdminSession(env, token);
}

export function attachAdminCookie(c: Context, env: Env, token: string): void {
  setCookie(c, ADMIN_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: env.COOKIE_SECURE,
    maxAge: TTL_SECONDS,
  });
}

export function clearAdminCookie(c: Context, env: Env): void {
  deleteCookie(c, ADMIN_COOKIE, {
    path: "/",
    secure: env.COOKIE_SECURE,
    sameSite: "Lax",
  });
}
