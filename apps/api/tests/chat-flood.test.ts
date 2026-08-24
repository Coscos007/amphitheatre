import { describe, expect, test } from "bun:test";
import { limits, normalizeChatFloodBanSec } from "@coliseum/shared";
import { isChatBurst, pruneChatTimes } from "../src/chat-flood";
import { createGuest, createRoom, joinRoom, makeApp, patchJson } from "./helpers";

describe("chat flood helpers", () => {
  test("6 mensagens na janela disparam burst", () => {
    const now = 80_000;
    const times = Array.from({ length: 6 }, (_, i) => now - i * 200);
    expect(isChatBurst(times, now)).toBe(true);
    expect(isChatBurst(times.slice(1), now)).toBe(false);
  });

  test("mensagens antigas saem da janela", () => {
    const now = 20_000;
    const times = [now - limits.chatBurst.windowMs - 1, now - 100];
    expect(pruneChatTimes(times, now)).toEqual([now - 100]);
  });

  test("normalizeChatFloodBanSec so aceita 60 ou 120", () => {
    expect(normalizeChatFloodBanSec(120)).toBe(120);
    expect(normalizeChatFloodBanSec(60)).toBe(60);
    expect(normalizeChatFloodBanSec(90)).toBe(60);
  });
});

describe("PATCH /api/rooms/:id/chat", () => {
  test("sala nova nasce com 60s; owner troca para 120; membro recebe 403", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Chat" });
    expect(room.chatFloodBanSec).toBe(60);

    const guest = await createGuest(app, "Ouvinte");
    expect((await joinRoom(app, guest.token, room.id)).status).toBe(200);

    const denied = await patchJson(app, `/api/rooms/${room.id}/chat`, { floodBanSec: 120 }, guest.token);
    expect(denied.status).toBe(403);

    const ok = await patchJson(app, `/api/rooms/${room.id}/chat`, { floodBanSec: 120 }, owner.token);
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { room: { chatFloodBanSec: number } };
    expect(body.room.chatFloodBanSec).toBe(120);
  });
});
