import { describe, expect, test } from "bun:test";
import { broadcastIframeSrc, normalizeBroadcastEmbed } from "@coliseum/shared";
import { createGuest, createRoom, getJson, joinRoom, makeApp, patchJson } from "./helpers";

describe("normalizeBroadcastEmbed", () => {
  test("aceita canal Twitch e id YouTube", () => {
    expect(normalizeBroadcastEmbed("twitch", "https://www.twitch.tv/amphitheatre")).toBe("amphitheatre");
    expect(normalizeBroadcastEmbed("youtube", "https://www.youtube.com/watch?v=dQw4w9wgGcQ")).toBe("dQw4w9wgGcQ");
    expect(normalizeBroadcastEmbed("kick", "someone")).toBe("someone");
    expect(normalizeBroadcastEmbed("custom", "http://evil.example")).toBeNull();
    expect(normalizeBroadcastEmbed("custom", "https://player.example/embed")).toBe("https://player.example/embed");
    expect(
      broadcastIframeSrc(
        { enabled: true, provider: "twitch", embed: "amphitheatre" },
        "localhost:5173",
      ),
    ).toContain("parent=localhost");
  });
});

describe("broadcast opt-in", () => {
  test("sala nova nasce com broadcast desligado", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Palco", isPublic: true });
    expect(room.broadcast.enabled).toBe(false);
    expect(room.broadcast.provider).toBe("none");
    expect(room.broadcast.embed).toBeNull();

    const media = await getJson(app, `/api/rooms/${room.id}/media`, owner.token);
    expect(media.status).toBe(200);
    const body = (await media.json()) as {
      ome: { live: boolean; ingest: { streamKey: string } | null };
      broadcast: { enabled: boolean };
    };
    expect(body.broadcast.enabled).toBe(false);
    expect(body.ome.live).toBe(false);
    expect(body.ome.ingest).toBeNull();
  });

  test("membro nao altera stream; owner ativa OME com stream key secreto", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "OBS" });
    const guest = await createGuest(app, "Ouvinte");
    expect((await joinRoom(app, guest.token, room.id)).status).toBe(200);

    const denied = await patchJson(
      app,
      `/api/rooms/${room.id}/stream`,
      { enabled: true, provider: "ome" },
      guest.token,
    );
    expect(denied.status).toBe(403);

    const enabled = await patchJson(
      app,
      `/api/rooms/${room.id}/stream`,
      { enabled: true, provider: "ome" },
      owner.token,
    );
    expect(enabled.status).toBe(200);
    const payload = (await enabled.json()) as {
      room: { broadcast: { enabled: boolean; provider: string } };
      ome: { ingest: { rtmpUrl: string; streamKey: string } | null };
    };
    expect(payload.room.broadcast.enabled).toBe(true);
    expect(payload.room.broadcast.provider).toBe("ome");
    expect(payload.ome.ingest?.rtmpUrl).toContain("rtmp://");
    const key = payload.ome.ingest?.streamKey ?? "";
    expect(key.startsWith(`${room.id}-`)).toBe(true);
    expect(key).not.toBe(room.id);
    expect(key.length).toBeGreaterThan(room.id.length + 4);
  });

  test("owner ativa embed Twitch e membro ve o canal sem ingest", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Twitch" });
    const guest = await createGuest(app, "Ouvinte");
    await joinRoom(app, guest.token, room.id);

    const bad = await patchJson(
      app,
      `/api/rooms/${room.id}/stream`,
      { enabled: true, provider: "twitch", embed: "??" },
      owner.token,
    );
    expect(bad.status).toBe(400);

    const ok = await patchJson(
      app,
      `/api/rooms/${room.id}/stream`,
      { enabled: true, provider: "twitch", embed: "https://www.twitch.tv/amphitheatre" },
      owner.token,
    );
    expect(ok.status).toBe(200);

    const visible = await getJson(app, `/api/rooms/${room.id}`, guest.token);
    const body = (await visible.json()) as {
      broadcast: { enabled: boolean; provider: string; embed: string | null };
    };
    expect(body.broadcast.enabled).toBe(true);
    expect(body.broadcast.provider).toBe("twitch");
    expect(body.broadcast.embed).toBe("amphitheatre");

    const media = await getJson(app, `/api/rooms/${room.id}/media`, guest.token);
    const mediaBody = (await media.json()) as { ome: { ingest: unknown } };
    expect(mediaBody.ome.ingest).toBeNull();
  });

  test("rotateKey troca o sufixo do stream key", async () => {
    const { app } = makeApp();
    const owner = await createGuest(app, "Host");
    const room = await createRoom(app, owner.token, { name: "Rotate" });
    const first = await patchJson(
      app,
      `/api/rooms/${room.id}/stream`,
      { enabled: true, provider: "ome" },
      owner.token,
    );
    const firstBody = (await first.json()) as { ome: { ingest: { streamKey: string } } };
    const second = await patchJson(
      app,
      `/api/rooms/${room.id}/stream`,
      { enabled: true, provider: "ome", rotateKey: true },
      owner.token,
    );
    const secondBody = (await second.json()) as { ome: { ingest: { streamKey: string } } };
    expect(secondBody.ome.ingest.streamKey).not.toBe(firstBody.ome.ingest.streamKey);
    expect(secondBody.ome.ingest.streamKey.startsWith(`${room.id}-`)).toBe(true);
  });
});
