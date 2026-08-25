import { describe, expect, test } from "bun:test";
import {
  isDisplayMediaCancelled,
  isRemoteAudioTrack,
  SCREEN_SHARE_CAPTURE_OPTIONS,
} from "./livekit-media.ts";
import { Track } from "livekit-client";

describe("SCREEN_SHARE_CAPTURE_OPTIONS", () => {
  test("asks getDisplayMedia for audio, including system audio on Chromium", () => {
    expect(SCREEN_SHARE_CAPTURE_OPTIONS.audio).not.toBe(false);
    expect(SCREEN_SHARE_CAPTURE_OPTIONS.systemAudio).toBe("include");
    expect(SCREEN_SHARE_CAPTURE_OPTIONS.selfBrowserSurface).toBe("include");
  });

  test("does not treat captured desktop audio as a voice mic", () => {
    const audio = SCREEN_SHARE_CAPTURE_OPTIONS.audio;
    expect(typeof audio).toBe("object");
    if (typeof audio !== "object" || audio === null) return;
    expect(audio.echoCancellation).toBe(false);
    expect(audio.noiseSuppression).toBe(false);
    expect(audio.autoGainControl).toBe(false);
    expect(audio.restrictOwnAudio).toBe(true);
  });
});

describe("isRemoteAudioTrack", () => {
  test("matches microphone and screen-share audio, not video", () => {
    expect(isRemoteAudioTrack({ kind: Track.Kind.Audio })).toBe(true);
    expect(isRemoteAudioTrack({ kind: Track.Kind.Video })).toBe(false);
  });
});

describe("isDisplayMediaCancelled", () => {
  test("treats picker dismiss as cancel, not as a capture failure", () => {
    expect(isDisplayMediaCancelled(new DOMException("Permission denied", "NotAllowedError"))).toBe(
      true,
    );
    expect(isDisplayMediaCancelled(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isDisplayMediaCancelled(new Error("failed to getUserMedia"))).toBe(false);
    const wrapped = new Error("publish failed");
    wrapped.cause = new DOMException("Permission denied", "NotAllowedError");
    expect(isDisplayMediaCancelled(wrapped)).toBe(true);
  });
});
