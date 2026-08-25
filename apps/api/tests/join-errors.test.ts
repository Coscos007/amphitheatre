import { describe, expect, test } from "bun:test";
import { createGuest, createRoom, getJson, joinRoom, makeApp } from "./helpers";

describe("join and room preview errors", () => {
  test("GET devolve a sala privada (com senha) sem lista de membros", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Dona");
    const room = await createRoom(app, owner.token, { name: "Privada", password: "segredo" });

    const anon = await getJson(app, `/api/rooms/${room.id}`);
    expect(anon.status).toBe(200);
    const body = (await anon.json()) as {
      id: string;
      name: string;
      hasPassword: boolean;
      members?: unknown[];
    };
    expect(body.id).toBe(room.id);
    expect(body.name).toBe("Privada");
    expect(body.hasPassword).toBe(true);
    expect(body.members).toBeUndefined();
  });

  test("GET de sala inexistente e 404 not_found", async () => {
    const { app } = makeApp();
    const res = await getJson(app, "/api/rooms/NoSuch01");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });

  test("join de sala inexistente e 404 not_found, sem lockout", async () => {
    const { app } = makeApp();
    const guest = await createGuest(app, "Visitante");
    for (let i = 0; i < 5; i += 1) {
      const missing = await joinRoom(app, guest.token, "NoSuch01", "x");
      expect(missing.status).toBe(404);
      expect(missing.body.error).toBe("not_found");
    }
  });

  test("senha errada em sala privada e invalid_password", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Dona");
    const room = await createRoom(app, owner.token, { name: "Privada", password: "correta" });
    const guest = await createGuest(app, "Visitante");

    const wrong = await joinRoom(app, guest.token, room.id, "errada");
    expect(wrong.status).toBe(403);
    expect(wrong.body.error).toBe("invalid_password");
  });

  test("sala com senha sem senha no body e invalid_password sem lockout", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Dona");
    const room = await createRoom(app, owner.token, { name: "Trancada", password: "correta" });
    const guest = await createGuest(app, "Visitante");

    for (let i = 0; i < 4; i += 1) {
      const empty = await joinRoom(app, guest.token, room.id);
      expect(empty.status).toBe(403);
      expect(empty.body.error).toBe("invalid_password");
    }

    const ok = await joinRoom(app, guest.token, room.id, "correta");
    expect(ok.status).toBe(200);
    expect(ok.body.role).toBe("member");
  });
});
