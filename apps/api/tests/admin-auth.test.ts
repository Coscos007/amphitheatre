import { describe, expect, test } from "bun:test";
import { createGuest, getJson, loginAdmin, makeAdminHarness, makeApp, postJson, TEST_ADMIN } from "./helpers";

describe("admin auth", () => {
  test("login with username, password and API key issues an admin token", async () => {
    const { admin } = await makeAdminHarness();
    const login = await loginAdmin(admin);
    expect(login.status).toBe(200);
    expect(login.token).toBeTruthy();
    const session = await getJson(admin, "/api/admin/session", login.token);
    expect(session.status).toBe(200);
    const body = (await session.json()) as { username: string };
    expect(body.username).toBe("admin");
  });

  test("guest JWT is rejected on the admin app", async () => {
    const { app, admin } = await makeAdminHarness();
    const guest = await createGuest(app, "Visitante");
    const session = await getJson(admin, "/api/admin/session", guest.token);
    expect(session.status).toBe(401);
  });

  test("admin JWT is rejected on the public app", async () => {
    const { app, admin } = await makeAdminHarness();
    const login = await loginAdmin(admin);
    const session = await getJson(app, "/api/session", login.token);
    expect(session.status).toBe(401);
  });

  test("admin routes are absent on the public app", async () => {
    const { app } = makeApp();
    const res = await getJson(app, "/api/admin/session");
    expect(res.status).toBe(404);
  });

  test("wrong credentials lock out after 3 failures", async () => {
    const { admin } = await makeAdminHarness();
    const ip = "198.51.100.40";
    const first = await loginAdmin(admin, { password: "wrong-pass-99" }, ip);
    expect(first.status).toBe(401);
    expect(first.body.error).toBe("invalid_credentials");
    await loginAdmin(admin, { password: "wrong-pass-99" }, ip);
    const third = await loginAdmin(admin, { password: "wrong-pass-99" }, ip);
    expect(third.status).toBe(429);
    expect(third.body.error).toBe("locked_out");
  });

  test("rotating the API key invalidates the previous key", async () => {
    const { admin } = await makeAdminHarness();
    const login = await loginAdmin(admin);
    const rotated = await postJson(admin, "/api/admin/api-key/rotate", {}, login.token);
    expect(rotated.status).toBe(200);
    const body = (await rotated.json()) as { apiKey: string };
    expect(body.apiKey).toMatch(/^amp_/);

    const oldKey = await loginAdmin(admin);
    expect(oldKey.status).toBe(401);

    const next = await loginAdmin(admin, { apiKey: body.apiKey });
    expect(next.status).toBe(200);
  });

  test("cannot disable the last active operator", async () => {
    const { admin } = await makeAdminHarness();
    const login = await loginAdmin(admin);
    const session = await getJson(admin, "/api/admin/session", login.token);
    const me = (await session.json()) as { id: string };
    const { patchJson } = await import("./helpers");
    const res = await patchJson(admin, `/api/admin/users/${me.id}`, { disabled: true }, login.token);
    expect(res.status).toBe(403);
  });

  test("can create another operator", async () => {
    const { admin } = await makeAdminHarness();
    const login = await loginAdmin(admin);
    const created = await postJson(
      admin,
      "/api/admin/users",
      { username: "ops", password: "second-pass-99" },
      login.token,
    );
    expect(created.status).toBe(201);
    const users = await getJson(admin, "/api/admin/users", login.token);
    const list = (await users.json()) as { username: string }[];
    expect(list.map((item) => item.username).sort()).toEqual(["admin", "ops"]);
  });
});

void TEST_ADMIN;
