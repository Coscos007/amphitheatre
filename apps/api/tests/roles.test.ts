import { describe, expect, test } from "bun:test";
import { createGuest, createRoom, joinRoom, makeApp, postJson } from "./helpers";

describe("papeis e moderacao", () => {
  test("owner nao pode ser kick/mute/ban/demote; admin concede moderator", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Owner");
    const room = await createRoom(app, owner.token, { name: "Arena", password: "s3nha" });
    const adminUser = await createGuest(app, "Admin");
    const modUser = await createGuest(app, "Mod");
    const member = await createGuest(app, "Membro");

    expect((await joinRoom(app, adminUser.token, room.id, "s3nha")).status).toBe(200);
    expect((await joinRoom(app, modUser.token, room.id, "s3nha")).status).toBe(200);
    expect((await joinRoom(app, member.token, room.id, "s3nha")).status).toBe(200);

    const grantAdmin = await postJson(
      app,
      `/api/rooms/${room.id}/roles`,
      { userId: adminUser.userId, role: "admin" },
      owner.token,
    );
    expect(grantAdmin.status).toBe(200);

    const grantMod = await postJson(
      app,
      `/api/rooms/${room.id}/roles`,
      { userId: modUser.userId, role: "moderator" },
      adminUser.token,
    );
    expect(grantMod.status).toBe(200);

    const demoteOwner = await postJson(
      app,
      `/api/rooms/${room.id}/roles`,
      { userId: owner.userId, role: "member" },
      adminUser.token,
    );
    expect(demoteOwner.status).toBe(403);

    const kickOwner = await postJson(
      app,
      `/api/rooms/${room.id}/kick`,
      { userId: owner.userId },
      adminUser.token,
    );
    expect(kickOwner.status).toBe(403);

    const banOwner = await postJson(
      app,
      `/api/rooms/${room.id}/ban`,
      { userId: owner.userId },
      adminUser.token,
    );
    expect(banOwner.status).toBe(403);

    const muteOwner = await postJson(
      app,
      `/api/rooms/${room.id}/mute`,
      { userId: owner.userId, muted: true },
      adminUser.token,
    );
    expect(muteOwner.status).toBe(403);

    const modBan = await postJson(
      app,
      `/api/rooms/${room.id}/ban`,
      { userId: member.userId },
      modUser.token,
    );
    expect(modBan.status).toBe(403);

    const modKick = await postJson(
      app,
      `/api/rooms/${room.id}/kick`,
      { userId: member.userId },
      modUser.token,
    );
    expect(modKick.status).toBe(200);

    const memberKick = await postJson(
      app,
      `/api/rooms/${room.id}/kick`,
      { userId: modUser.userId },
      member.token,
    );
    expect(memberKick.status).toBe(403);
  });
});
