import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { openDatabase } from "../src/db";
import { createGuest, createRoom, joinRoom, makeApp, muteLivekit, postJson, testEnv, downOme } from "./helpers";

describe("owner e admin persistem apos sair e voltar", () => {
  test("owner permanece owner depois de leave/rejoin e apos novo processo com o mesmo sqlite", async () => {
    const env = testEnv();
    const db = openDatabase(":memory:");
    const clock = { now: () => 1_700_000_000_000 };
    const first = createApp({ env, db, clock, ome: downOme, livekit: muteLivekit });
    const app = first.app;

    const owner = await createGuest(app, "Chefe");
    const room = await createRoom(app, owner.token, { name: "Persistente", password: "abc" });
    expect(room.ownerId).toBe(owner.userId);

    const leave = await postJson(app, `/api/rooms/${room.id}/leave`, {}, owner.token);
    expect(leave.status).toBe(200);

    const back = await joinRoom(app, owner.token, room.id);
    expect(back.status).toBe(200);
    expect(back.body.role).toBe("owner");
    expect(back.body.room.ownerId).toBe(owner.userId);

    const helper = await createGuest(app, "Ajuda");
    expect((await joinRoom(app, helper.token, room.id, "abc")).status).toBe(200);
    const grant = await postJson(
      app,
      `/api/rooms/${room.id}/roles`,
      { userId: helper.userId, role: "admin" },
      owner.token,
    );
    expect(grant.status).toBe(200);
    expect((await postJson(app, `/api/rooms/${room.id}/leave`, {}, helper.token)).status).toBe(200);

    const second = createApp({ env, db, clock, ome: downOme, livekit: muteLivekit });
    const helperBack = await joinRoom(second.app, helper.token, room.id, "abc");
    expect(helperBack.status).toBe(200);
    expect(helperBack.body.role).toBe("admin");

    const ownerBack = await joinRoom(second.app, owner.token, room.id);
    expect(ownerBack.status).toBe(200);
    expect(ownerBack.body.role).toBe("owner");
    expect(ownerBack.body.room.ownerId).toBe(owner.userId);
  });

  test("ninguem herda owner se o dono sai", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Dona");
    const other = await createGuest(app, "Outro");
    const room = await createRoom(app, owner.token, { name: "Sem heranca" });
    expect((await joinRoom(app, other.token, room.id)).status).toBe(200);
    expect((await postJson(app, `/api/rooms/${room.id}/leave`, {}, owner.token)).status).toBe(200);
    const still = await joinRoom(app, other.token, room.id);
    expect(still.status).toBe(200);
    expect(still.body.role).toBe("member");
    expect(still.body.room.ownerId).toBe(owner.userId);
  });
});
