import { describe, expect, test } from "bun:test";
import { createGuest, createRoom, joinRoom, makeApp } from "./helpers";

describe("password lockout", () => {
  test("3 senhas erradas geram ban de 5 minutos e devolvem tempo restante", async () => {
    const { app, clock } = makeApp();
    const owner = await createGuest(app, "Dona");
    const room = await createRoom(app, owner.token, { name: "Privada", password: "correta" });
    const guest = await createGuest(app, "Visitante", "198.51.100.20");

    const first = await joinRoom(app, guest.token, room.id, "errada", "198.51.100.20");
    expect(first.status).toBe(403);
    expect(first.body.error).toBe("cannot_join");

    const second = await joinRoom(app, guest.token, room.id, "errada", "198.51.100.20");
    expect(second.status).toBe(403);

    const third = await joinRoom(app, guest.token, room.id, "errada", "198.51.100.20");
    expect(third.status).toBe(429);
    expect(third.body.error).toBe("locked_out");
    expect(third.body.retryAfterMs).toBe(5 * 60 * 1000);

    const fourth = await joinRoom(app, guest.token, room.id, "correta", "198.51.100.20");
    expect(fourth.status).toBe(429);
    expect(fourth.body.retryAfterMs).toBeGreaterThan(0);
    expect(fourth.body.retryAfterMs).toBeLessThanOrEqual(5 * 60 * 1000);

    clock.advance(5 * 60 * 1000);
    const after = await joinRoom(app, guest.token, room.id, "correta", "198.51.100.20");
    expect(after.status).toBe(200);
    expect(after.body.role).toBe("member");
  });

  test("sala privada nao distingue inexistente de senha errada", async () => {
    const { app } = makeApp();
    const guest = await createGuest(app, "Visitante");
    const missing = await joinRoom(app, guest.token, "NoSuch01", "x");
    expect(missing.status).toBe(403);
    expect(missing.body.error).toBe("cannot_join");
  });
});
