import { describe, expect, test } from "bun:test";
import { hasOmePlayback, omePlayerSources, webrtcAbrUrl } from "./ome-playback.ts";

const live = {
  configured: true,
  healthy: true,
  live: true,
  reachable: true,
  playbackUrl: "ws://localhost:3333/app/TfmEM85M",
  llhlsUrl: "http://localhost:3333/app/TfmEM85M/llhls.m3u8",
} as const;

describe("webrtcAbrUrl", () => {
  test("appends /webrtc for the OME WebRTC ABR playlist", () => {
    expect(webrtcAbrUrl("ws://localhost:3333/app/TfmEM85M")).toBe(
      "ws://localhost:3333/app/TfmEM85M/webrtc",
    );
  });

  test("strips a trailing /llhls left by older clients", () => {
    expect(webrtcAbrUrl("ws://localhost:3333/app/TfmEM85M/llhls")).toBe(
      "ws://localhost:3333/app/TfmEM85M/webrtc",
    );
  });

  test("does not duplicate /webrtc", () => {
    expect(webrtcAbrUrl("ws://localhost:3333/app/TfmEM85M/webrtc")).toBe(
      "ws://localhost:3333/app/TfmEM85M/webrtc",
    );
  });
});

describe("omePlayerSources", () => {
  test("puts WebRTC ABR before LL-HLS", () => {
    expect(omePlayerSources(live)).toEqual([
      {
        type: "webrtc",
        file: "ws://localhost:3333/app/TfmEM85M/webrtc",
        label: "WebRTC",
      },
      {
        type: "hls",
        file: "http://localhost:3333/app/TfmEM85M/llhls.m3u8",
        label: "LL-HLS",
      },
    ]);
  });

  test("can play WebRTC when LL-HLS is missing", () => {
    expect(
      omePlayerSources({
        ...live,
        llhlsUrl: null,
      }),
    ).toEqual([
      {
        type: "webrtc",
        file: "ws://localhost:3333/app/TfmEM85M/webrtc",
        label: "WebRTC",
      },
    ]);
  });

  test("returns no sources when the broadcast is not live", () => {
    expect(omePlayerSources({ ...live, live: false })).toEqual([]);
    expect(hasOmePlayback({ ...live, healthy: false })).toBe(false);
  });

  test("uses translated labels", () => {
    const sources = omePlayerSources(live, { webrtc: "WebRTC", hls: "LL-HLS" });
    expect(sources[0]?.label).toBe("WebRTC");
    expect(sources[1]?.label).toBe("LL-HLS");
  });
});
