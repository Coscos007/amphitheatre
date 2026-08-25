import { describe, expect, test } from "bun:test";
import type { AdminOverview, AdminRoomRow } from "@coliseum/shared";
import { createGuest, createRoom, getJson, loginAdmin, makeAdminHarness, postJson } from "./helpers";

describe("admin factory reset", () => {
  test("rejects the wrong confirmation phrase", async () => {
    const { admin } = await makeAdminHarness();
    const login = await loginAdmin(admin);
    const res = await postJson(admin, "/api/admin/factory-reset", { phrase: "nao" }, login.token);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("validation_error");
  });

  test("wipes rooms and metrics and keeps operators", async () => {
    const { app, admin } = await makeAdminHarness();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Temp" });
    const login = await loginAdmin(admin);
    const reset = await postJson(
      admin,
      "/api/admin/factory-reset",
      { phrase: "resetar permanentemente" },
      login.token,
    );
    expect(reset.status).toBe(200);

    const list = await getJson(admin, "/api/admin/rooms", login.token);
    const rooms = (await list.json()) as AdminRoomRow[];
    expect(rooms.some((item) => item.id === room.id)).toBe(false);

    const overview = await getJson(admin, "/api/admin/overview", login.token);
    const body = (await overview.json()) as AdminOverview;
    expect(body.roomsTotal).toBe(0);
    expect(body.peopleNow).toBe(0);
    expect(body.peakPeople).toBe(0);

    const users = await getJson(admin, "/api/admin/users", login.token);
    expect(users.status).toBe(200);
    const listUsers = (await users.json()) as Array<{ username: string }>;
    expect(listUsers.some((item) => item.username === "admin")).toBe(true);
  });
});
