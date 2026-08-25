import { dirname, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import type { Database } from "bun:sqlite";
import {
  countAdminUsers,
  getAdminInstance,
  insertAdminUser,
  upsertAdminInstance,
} from "./db";
import type { Clock } from "./clock";
import { newUserId } from "./ids";
import { logger } from "./logger";

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function randomSecret(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += PASSWORD_ALPHABET[(bytes[i] ?? 0) % PASSWORD_ALPHABET.length];
  }
  return out;
}

export function newAdminApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `amp_${Buffer.from(bytes).toString("base64url")}`;
}

export function bootstrapFilePath(databasePath: string): string | null {
  if (databasePath === ":memory:" || databasePath.startsWith(":memory:")) return null;
  return resolve(dirname(databasePath), "admin-bootstrap.txt");
}

export async function seedAdminCredentials(
  db: Database,
  clock: Clock,
  input: { username: string; password: string; apiKey: string },
): Promise<void> {
  const passwordHash = await Bun.password.hash(input.password);
  const apiKeyHash = await Bun.password.hash(input.apiKey);
  insertAdminUser(db, {
    id: newUserId(),
    username: input.username,
    password_hash: passwordHash,
    disabled: 0,
    created_at: clock.now(),
    last_login_at: null,
  });
  upsertAdminInstance(db, apiKeyHash, true);
}

export async function bootstrapAdmin(input: {
  db: Database;
  clock: Clock;
  databasePath: string;
}): Promise<{ created: boolean }> {
  const { db, clock, databasePath } = input;
  if (countAdminUsers(db) > 0 && getAdminInstance(db)) {
    return { created: false };
  }
  if (countAdminUsers(db) > 0 || getAdminInstance(db)) {
    return { created: false };
  }

  const username = "admin";
  const password = randomSecret(20);
  const apiKey = newAdminApiKey();
  await seedAdminCredentials(db, clock, { username, password, apiKey });

  logger.info("admin_bootstrap_created", {
    username,
    hint: "Plaintext credentials were written once. They will not be printed again.",
  });

  const file = bootstrapFilePath(databasePath);
  if (file) {
    mkdirSync(dirname(file), { recursive: true });
    const body = [
      "Amphitheatre operator console — first-boot credentials",
      "Store these somewhere safe. This file is not rewritten.",
      "",
      `Username: ${username}`,
      `Password: ${password}`,
      `API key:  ${apiKey}`,
      "",
      "Sign in on the admin port (default http://127.0.0.1:3002).",
      "",
    ].join("\n");
    writeFileSync(file, body, { encoding: "utf8", mode: 0o600 });
    logger.info("admin_bootstrap_file", { path: file });
  } else {
    logger.info("admin_bootstrap_credentials", { username, password, apiKey });
  }

  return { created: true };
}
