import { describe, expect, test } from "bun:test";
import type { AdminRoomRow } from "@coliseum/shared";
import { createGuest, createRoom, getJson, joinRoom, loginAdmin, makeAdminHarness, postJson } from "./helpers";

describe("admin rooms occupancy", () => {
  test("lists private and empty rooms without leaking the password", async () => {
    const { app, admin } = await makeAdminHarness();
    const owner = await createGuest(app, "Dona");
    const room = await createRoom(app, owner.token, { name: "Privada", password: "segredo-ok", isPublic: false });
    await postJson(app, `/api/rooms/${room.id}/leave`, {}, owner.token);

    const login = await loginAdmin(admin);
    const list = await getJson(admin, "/api/admin/rooms", login.token);
    expect(list.status).toBe(200);
    const rooms = (await list.json()) as AdminRoomRow[];
    expect(rooms.some((item) => item.id === room.id)).toBe(true);
    const row = rooms.find((item) => item.id === room.id);
    expect(row?.hasPassword).toBe(true);
    expect(row?.present).toBe(0);
    expect(row?.uniqueEver).toBe(1);
    expect(JSON.stringify(row)).not.toContain("segredo-ok");
    expect(row?.streamKey).toContain(room.id);
  });

  test("peak members increases on the second join", async () => {
    const { app, admin } = await makeAdminHarness();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Cheia" });
    const guest = await createGuest(app, "Visitante");
    const joined = await joinRoom(app, guest.token, room.id);
    expect(joined.status).toBe(200);

    const login = await loginAdmin(admin);
    const detail = await getJson(admin, `/api/admin/rooms/${room.id}`, login.token);
    expect(detail.status).toBe(200);
    const body = (await detail.json()) as AdminRoomRow;
    expect(body.present).toBe(2);
    expect(body.uniqueEver).toBe(2);
    expect(body.peak).toBe(2);
  });

  test("hideEmpty filters vacant rooms", async () => {
    const { app, admin } = await makeAdminHarness();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Vazia depois" });
    await postJson(app, `/api/rooms/${room.id}/leave`, {}, owner.token);
    const login = await loginAdmin(admin);
    const hidden = await getJson(admin, "/api/admin/rooms?hideEmpty=true", login.token);
    const rooms = (await hidden.json()) as AdminRoomRow[];
    expect(rooms.some((item) => item.id === room.id)).toBe(false);
  });

  test("stale present rows are cleared after the WS grace window", async () => {
    const { app, admin, clock } = await makeAdminHarness();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Fantasma" });
    clock.advance(20_000);
    const login = await loginAdmin(admin);
    const overview = await getJson(admin, "/api/admin/overview", login.token);
    const overviewBody = (await overview.json()) as { peopleNow: number; roomsOccupied: number; peakPeople: number };
    expect(overviewBody.peopleNow).toBe(0);
    expect(overviewBody.roomsOccupied).toBe(0);
    expect(overviewBody.peakPeople).toBe(1);
    const detail = await getJson(admin, `/api/admin/rooms/${room.id}`, login.token);
    const body = (await detail.json()) as AdminRoomRow;
    expect(body.present).toBe(0);
    expect(body.uniqueEver).toBe(1);
    expect(body.peak).toBe(1);
    expect(body.livekit?.tracks.microphone).toBe(0);
  });
});
