# Identity and moderation

## Guests

- `POST /api/session` `{ displayName }` → `{ userId, displayName, token }`. The API sets an httpOnly cookie (`ct_session`) and also returns `token` in JSON (Bearer) for Vite.
- `userId` is persistent in the JWT. Rejoining the same room with the same `userId` **keeps the role**.
- Room `ownerId` is **immutable**. The creator stays owner (and therefore de-facto admin) after leaving. Nobody is promoted to owner. The owner rejoins without a password.

## Roles

Hierarchy: `owner` > `admin` > `moderator` > `member`.

- **moderator:** kick and mute (SQLite flag + LiveKit without publishing microphone).
- **admin:** kick, mute, ban/unban, grant/revoke `admin` and `moderator` (never touches owner).
- **owner:** all of the above; never loses the role.

Ban: the user cannot rejoin until unban. Separate from password lockout.

## Privacy of join errors

- Private rooms: a failed join uses `cannot_join` (does not distinguish “does not exist” from “wrong password”).
- Public rooms appear in `GET /api/rooms`. Wrong password on a public room: `invalid_password`.

## Lockout and rate limits

Password lockout: **3 failures** (keys `ip:{ip}:{roomId}` and, if a session exists, `user:{userId}:{roomId}`) → **5 minutes**. Response `locked_out` with `retryAfterMs`. Config: `LOCKOUT_MAX_FAILURES`, `LOCKOUT_DURATION_MS`.

In-memory rate limits (per API process): create room, join, chat, token mint, role change. `429` + `retryAfterMs`. Extra caps via env: rooms per creator/IP (24h window), members per room, concurrent occupied rooms.

Product detail: [identity-and-roles](../knowledge/product/identity-and-roles/identity-and-roles.md), [moderation](../knowledge/product/moderation/moderation.md), [safety-limits](../knowledge/product/safety-limits/safety-limits.md).
