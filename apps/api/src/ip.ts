import type { Context } from "hono";
import type { Env } from "./env";

export function clientIp(c: Context, env: Env): string {
  if (env.TRUST_PROXY) {
    const xff = c.req.header("x-forwarded-for");
    const first = xff?.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = c.req.header("x-real-ip")?.trim();
  if (real) return real;
  return "local";
}
