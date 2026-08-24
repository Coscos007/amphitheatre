import { SESSION_COOKIE, type SessionUser } from "@coliseum/shared";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import type { Env } from "./env";
import { unauthorized } from "./http-error";

const ALG = "HS256";
const TTL_SECONDS = 60 * 60 * 24 * 30;

type JwtPayload = {
  sub: string;
  displayName: string;
  exp: number;
  iat: number;
};

export async function issueSession(
  env: Env,
  user: SessionUser,
): Promise<{ token: string; user: SessionUser }> {
  const iat = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: user.userId,
      displayName: user.displayName,
      iat,
      exp: iat + TTL_SECONDS,
    } satisfies JwtPayload,
    env.SESSION_SECRET,
    ALG,
  );
  return { token, user };
}

export async function decodeSession(env: Env, token: string): Promise<SessionUser> {
  try {
    const payload = (await verify(token, env.SESSION_SECRET, ALG)) as JwtPayload;
    if (!payload.sub || typeof payload.displayName !== "string") {
      throw unauthorized();
    }
    return { userId: payload.sub, displayName: payload.displayName };
  } catch (err) {
    if (err instanceof Error && err.name === "HttpError") throw err;
    throw unauthorized();
  }
}

export function readTokenFromRequest(c: Context): string | null {
  const header = c.req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token) return token;
  }
  const queryToken = c.req.query("token");
  if (queryToken) return queryToken;
  const cookie = getCookie(c, SESSION_COOKIE);
  return cookie ?? null;
}

export async function requireUser(c: Context, env: Env): Promise<SessionUser> {
  const token = readTokenFromRequest(c);
  if (!token) throw unauthorized();
  return decodeSession(env, token);
}

export async function optionalUser(c: Context, env: Env): Promise<SessionUser | null> {
  const token = readTokenFromRequest(c);
  if (!token) return null;
  try {
    return await decodeSession(env, token);
  } catch {
    return null;
  }
}

export function attachSessionCookie(c: Context, env: Env, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    secure: env.COOKIE_SECURE,
    maxAge: TTL_SECONDS,
  });
}
