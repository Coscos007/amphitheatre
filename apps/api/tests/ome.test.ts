import { describe, expect, test } from "bun:test";
import { loadEnv } from "../src/env";
import { createOmeClient } from "../src/ome";
import { createGuest, createRoom, getJson, joinRoom, makeApp, patchJson } from "./helpers";

describe("OME independente", () => {
  test("GET media devolve 200 com ome.healthy=false quando OME cai", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Stream", isPublic: true });
    const enabled = await patchJson(
      app,
      `/api/rooms/${room.id}/stream`,
      { enabled: true, provider: "ome" },
      owner.token,
    );
    expect(enabled.status).toBe(200);

    const media = await getJson(app, `/api/rooms/${room.id}/media`, owner.token);
    expect(media.status).toBe(200);
    const body = (await media.json()) as {
      livekit: { ok: boolean };
      ome: { configured: boolean; healthy: boolean; live: boolean; reachable?: boolean };
    };
    expect(body.ome.healthy).toBe(false);
    expect(body.ome.live).toBe(false);
    expect(body.ome.reachable).toBe(false);
    expect(body.livekit.ok).toBe(false);
  });

  test("join e chat/voz nao dependem de ome.healthy", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Voz" });
    const guest = await createGuest(app, "Ouvinte");
    const joined = await joinRoom(app, guest.token, room.id);
    expect(joined.status).toBe(200);
    expect(joined.body.role).toBe("member");
    expect(joined.body.ome?.healthy).toBe(false);
    expect(joined.body.ome?.live).toBe(false);
  });
});

describe("createOmeClient", () => {
  test("404 do REST e healthy e nao live", async () => {
    const client = createOmeClient(
      loadEnv({
        OME_API_URL: "http://ome.test",
        OME_VHOST: "default",
        OME_APP: "app",
        OME_TIMEOUT_MS: 1000,
      }),
      (async () => new Response("missing", { status: 404 })) as unknown as typeof fetch,
    );
    const status = await client.status("room1234");
    expect(status.reachable).toBe(true);
    expect(status.healthy).toBe(true);
    expect(status.live).toBe(false);
  });

  test("falha de rede marca unreachable, nao healthy-false-com-banner", async () => {
    const client = createOmeClient(
      loadEnv({
        OME_API_URL: "http://ome.test",
        OME_VHOST: "default",
        OME_APP: "app",
        OME_TIMEOUT_MS: 1000,
      }),
      (async () => {
        throw new Error("Unable to connect. Is the computer able to access the url?");
      }) as unknown as typeof fetch,
    );
    const status = await client.status("room1234");
    expect(status.reachable).toBe(false);
    expect(status.healthy).toBe(false);
    expect(status.live).toBe(false);
  });
});
